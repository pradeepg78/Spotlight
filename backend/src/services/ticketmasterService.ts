import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface TicketmasterEvent { 
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

interface Event { 
  id: string; 
  name: string; 
  date: string; 
  time: string;
  venueName: string; 
  city: string;
  latitude: number; 
  longitude: number; 
  imageUrl: string; 
  price: { 
    min: number; 
    max: number; 
  };
  ticketUrl: string; 
}

class TicketmasterService { 
  private apiKey: string; 
  private baseUrl: string; 

  constructor() { 
    this.apiKey = process.env.TICKETMASTER_API_KEY || ''; 
    this.baseUrl = 'https://app.ticketmaster.com/discovery/v2';

    if (!this.apiKey) { 
      console.warn('api key not found!!!!')
    }
  }

  async searchEvents(keyword: string, city: string): Promise<Event[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/events.json`, {
        params: {
          keyword: keyword,
          city: city,
          size: 10,
          apikey: this.apiKey
        }
      });

    //test code 
    //   const events = response.data._embedded?.events || []; 
    //   if (events.length > 0) {
    //     console.log('First event structure:');
    //     console.log(JSON.stringify(events[0], null, 2));
    //   }
    //   return events; 

    const events = response.data._embedded?.events || []; 
    const cleanEvents = events.map(event => this.transformEvent(event)); 
    return cleanEvents; 
      
    } catch (error) {
      console.error('Failed to fetch events:', error);
      throw error;  
    }
  }

  // searchEvents('concerts', 'New York')

  private transformEvent(tmEvent: TicketmasterEvent) : Event {
    const venue = tmEvent._embedded?.venues?.[0]; 
    const price = tmEvent.priceRanges?.[0]; 

    return { 
      id: tmEvent.id,
      name: tmEvent.name,
      date: tmEvent.dates?.start?.localDate || 'TBA',
      time: tmEvent.dates?.start?.localTime || 'TBA',  // ← Add this!
      venueName: venue?.name || 'TBA',
      city: venue?.city?.name || 'TBA',
      latitude: parseFloat(venue?.location?.latitude || '0'),
      longitude: parseFloat(venue?.location?.longitude || '0'),
      imageUrl: tmEvent.images?.[0]?.url || '', 
      price: {
        min: price?.min || 0,
        max: price?.max || 0
      },
      ticketUrl: tmEvent.url  || ''
    };
  }
}

//how will the app use it? 
//import ticketmasterService from './ticketmasterService';
//const events = await ticketmasterService.searchEvents('concerts', 'NYC');

export default new TicketmasterService(); 


