import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = 'https://app.ticketmaster.com/discovery/v2';
const API_KEY = process.env.TICKETMASTER_API_KEY; 

async function searchEvents(keyword: string, city: string) {
  try {
    const response = await axios.get(`${BASE_URL}/events.json`, {
      params: {
        keyword: keyword,
        city: city,
        size: 1,
        apikey: API_KEY
      }
    });

    const events = response.data._embedded?.events || []; 
    if (events.length > 0) {
      console.log('First event structure:');
      console.log(JSON.stringify(events[0], null, 2));
    }
    return events; 
    
  } catch (error) {
    console.error('Failed to fetch events:', error);
    throw error;  
  }
}

searchEvents('concerts', 'New York')