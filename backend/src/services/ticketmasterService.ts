import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface RawTicketmasterEvent {
  id: string;
  name: string;
  url: string;
  dates: {
    start: {
      localDate: string;
      localTime?: string;
    };
  };
  _embedded?: {
    venues?: Array<{
      name: string;
      city?: {
        name: string;
      };
      location?: {
        latitude: string;
        longitude: string;
      };
    }>;
  };
  priceRanges?: Array<{
    min: number;
    max: number;
  }>;
  images?: Array<{
    url: string;
  }>;
}

// Shape returned to the frontend
export interface FrontendEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  venueName: string;
  price?: string;
  imageUrl?: string;
  url?: string;
  venue?: {
    latitude: number;
    longitude: number;
    name: string;
  };
}

class TicketmasterService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.TICKETMASTER_API_KEY || '';
    this.baseUrl = 'https://app.ticketmaster.com/discovery/v2';

    if (!this.apiKey) {
      console.warn('api key not found!!!!');
    }
  }

  async searchByLocation(
    latitude: number,
    longitude: number,
    radius: number = 25,
    keyword?: string,
    startDateTime?: string,
    endDateTime?: string,
  ): Promise<FrontendEvent[]> {
    const commonEventParams = {
      sort: 'date,asc',
      apikey: this.apiKey,
      keyword: keyword || undefined,
      startDateTime: startDateTime || undefined,
      endDateTime: endDateTime || undefined,
    };

    // Track A: direct geo search — naturally surfaces the busiest/most popular venues
    // (MSG, Barclays, Yankee Stadium etc. show up here because they have the most events)
    const directSearch = axios
      .get(`${this.baseUrl}/events.json`, {
        params: {
          latlong: `${latitude},${longitude}`,
          radius,
          unit: 'miles',
          size: 100,
          ...commonEventParams,
        },
      })
      .catch(() => null);

    // Track B: venue-first search — finds the 50 nearest venues and grabs events for each
    // (catches smaller nearby venues that might not surface in the direct search)
    const venueSearch = axios
      .get(`${this.baseUrl}/venues.json`, {
        params: {
          latlong: `${latitude},${longitude}`,
          radius,
          unit: 'miles',
          size: 50,
          apikey: this.apiKey,
        },
      })
      .catch(() => null);

    const [directRes, venuesRes] = await Promise.all([directSearch, venueSearch]);

    const allRaw: RawTicketmasterEvent[] = [];
    const seen = new Set<string>();

    const addEvents = (events: RawTicketmasterEvent[]) => {
      events.forEach(e => {
        if (!seen.has(e.id)) { seen.add(e.id); allRaw.push(e); }
      });
    };

    // Add direct-search results first
    if (directRes) {
      addEvents(directRes.data._embedded?.events || []);
    }

    // For each venue from Track B, fetch up to 10 events and merge
    const venues: Array<{ id: string }> = venuesRes?.data._embedded?.venues || [];
    console.log(`[TM] direct=${allRaw.length} events | venue track: ${venues.length} venues`);

    if (venues.length > 0) {
      const perVenueResults = await Promise.all(
        venues.map(v =>
          axios
            .get(`${this.baseUrl}/events.json`, {
              params: { venueId: v.id, size: 10, ...commonEventParams },
            })
            .catch(() => null),
        ),
      );
      perVenueResults.forEach(res => {
        if (res) addEvents(res.data._embedded?.events || []);
      });
    }

    const transformed = allRaw.map(e => this.transformEvent(e));
    const withLocation = transformed.filter(e => e.venue);
    console.log(`[TM] total=${transformed.length} with_location=${withLocation.length}`);
    return transformed;
  }

  /** Get Ticketmaster events for specific places (by lat/lng). Returns events grouped by place key. */
  async getEventsForPlaces(
    places: Array<{ name: string; latitude: number; longitude: number }>,
    startDateTime?: string,
    endDateTime?: string,
  ): Promise<Array<{ placeKey: string; events: FrontendEvent[] }>> {
    if (places.length === 0) return [];

    const commonEventParams = {
      sort: 'date,asc',
      apikey: this.apiKey,
      startDateTime: startDateTime || undefined,
      endDateTime: endDateTime || undefined,
    };

    /** Pick the TM venue that best matches the place name (avoids wrong venue in dense areas). */
    const pickBestVenue = (venues: Array<{ id: string; name?: string }>, placeName: string): string | null => {
      if (!venues.length) return null;
      const placeLower = placeName.toLowerCase().replace(/\s+/g, ' ');
      let best = venues[0];
      let bestScore = 0;
      for (const v of venues) {
        const name = (v.name || '').toLowerCase();
        let score = 0;
        if (name.includes(placeLower) || placeLower.includes(name)) score = 10;
        const placeWords = placeLower.split(/\s+/).filter(Boolean);
        const matchCount = placeWords.filter((w) => w.length > 2 && name.includes(w)).length;
        score += matchCount;
        if (score > bestScore) {
          bestScore = score;
          best = v;
        }
      }
      return best?.id ?? null;
    };

    const results = await Promise.all(
      places.map(async (place) => {
        const placeKey = `${place.latitude.toFixed(4)},${place.longitude.toFixed(4)}`;
        try {
          // Use 2 mile radius so we reliably hit TM's venue (coordinates can differ from Google)
          const venuesRes = await axios.get(`${this.baseUrl}/venues.json`, {
            params: {
              latlong: `${place.latitude},${place.longitude}`,
              radius: 2,
              unit: 'miles',
              size: 15,
              apikey: this.apiKey,
            },
          });
          const venues = venuesRes?.data._embedded?.venues || [];
          let venueId = pickBestVenue(venues, place.name) ?? venues[0]?.id ?? null;
          let raw: RawTicketmasterEvent[] = [];

          if (venueId) {
            const eventsRes = await axios.get(`${this.baseUrl}/events.json`, {
              params: { venueId, size: 20, ...commonEventParams },
            });
            raw = eventsRes?.data._embedded?.events || [];
          }

          // Fallback: if no venue found or no events, search events by keyword (venue name) near this location
          if (raw.length === 0) {
            const keywordRes = await axios
              .get(`${this.baseUrl}/events.json`, {
                params: {
                  latlong: `${place.latitude},${place.longitude}`,
                  radius: 3,
                  unit: 'miles',
                  size: 20,
                  keyword: place.name,
                  ...commonEventParams,
                },
              })
              .catch(() => null);
            const keywordRaw = keywordRes?.data._embedded?.events || [];
            // Only keep events whose venue name matches (avoid wrong venue in dense areas)
            const placeLower = place.name.toLowerCase();
            raw = keywordRaw.filter((e: RawTicketmasterEvent) => {
              const vName = e._embedded?.venues?.[0]?.name?.toLowerCase() ?? '';
              return vName.includes(placeLower) || placeLower.includes(vName) || place.name.split(/\s+/).some((w) => w.length > 2 && vName.includes(w.toLowerCase()));
            });
          }

          const events = raw.map((e: RawTicketmasterEvent) => this.transformEvent(e));
          if (events.length > 0) {
            console.log(`[TM] getEventsForPlaces: ${place.name} -> ${events.length} events`);
          }
          return { placeKey, events };
        } catch (err) {
          console.warn(`[TM] getEventsForPlaces failed for ${place.name}:`, err);
          return { placeKey, events: [] };
        }
      }),
    );
    return results;
  }

  private transformEvent(tmEvent: RawTicketmasterEvent): FrontendEvent {
    const venue = tmEvent._embedded?.venues?.[0];
    const price = tmEvent.priceRanges?.[0];

    return {
      id: tmEvent.id,
      title: tmEvent.name,
      date: tmEvent.dates?.start?.localDate || 'TBA',
      time: tmEvent.dates?.start?.localTime || 'TBA',
      venueName: venue?.name || 'TBA',
      price: price ? `$${price.min} - $${price.max}` : undefined,
      imageUrl: tmEvent.images?.[0]?.url || '',
      url: tmEvent.url || '',
      venue: venue?.location
        ? {
            latitude: parseFloat(venue.location.latitude),
            longitude: parseFloat(venue.location.longitude),
            name: venue.name || '',
          }
        : undefined,
    };
  }
}

export default new TicketmasterService();
