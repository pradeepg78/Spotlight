import { TicketmasterEvent } from '../types/events';

/** All events happening at one physical location. */
export interface VenueGroup {
    key: string;
    venueName: string;
    latitude: number;
    longitude: number;
    events: TicketmasterEvent[];
}

/**
 * Coordinates are rounded to 4 decimals (~11m) before being used as a group
 * key. Ticketmaster returns slightly different coordinates for different events
 * at the same venue, so exact matching would scatter one arena across several
 * markers.
 */
export const VENUE_KEY_PRECISION = 4;

export function venueKey(latitude: number, longitude: number): string {
    return `${latitude.toFixed(VENUE_KEY_PRECISION)},${longitude.toFixed(VENUE_KEY_PRECISION)}`;
}

/** Events that carry usable venue coordinates and can be placed on the map. */
export function eventsWithLocation(events: TicketmasterEvent[]): TicketmasterEvent[] {
    return events.filter(
        e =>
            typeof e.venue?.latitude === 'number' &&
            typeof e.venue?.longitude === 'number' &&
            !Number.isNaN(e.venue.latitude) &&
            !Number.isNaN(e.venue.longitude)
    );
}

/**
 * Collapse a flat event list into one entry per venue.
 *
 * This is what keeps a dense city readable: ~400 events in NYC reduce to ~50
 * markers. Groups come back sorted by event count so the busiest venues are
 * predictable to work with.
 */
export function groupEventsByVenue(events: TicketmasterEvent[]): VenueGroup[] {
    const record: Record<string, VenueGroup> = {};

    eventsWithLocation(events).forEach(event => {
        const { latitude, longitude, name } = event.venue!;
        const key = venueKey(latitude, longitude);

        if (!record[key]) {
            record[key] = {
                key,
                venueName: name || event.venueName || 'Unknown venue',
                latitude,
                longitude,
                events: [],
            };
        }
        record[key].events.push(event);
    });

    return Object.values(record).sort((a, b) => b.events.length - a.events.length);
}
