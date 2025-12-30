//preconfigured axios instance created in client.ts, importing the export const apiClient = axios.create({ ... });
import { apiClient } from './client'; 
import { TicketmasterEvent } from '../types/events'; 

//exporting SearchTicketMasterParams so other files can access it
export interface SearchTicketmasterParams { 
    latitude:number; 
    longitude: number; 
    radius?: number; 
    keyword?: string; 
}

//exported async funtion that takes search params and returns a promise containing an array of tm events
export async function searchTicketmasterEvents(
    //fcn takes one parameter called params, must match SearchTicketmasterParams interface
    params: SearchTicketmasterParams
    //promise is a container for a future value
):  Promise<TicketmasterEvent[]> { 
    try { 
        //api call -> TicketmasterEvent is the expected return type
        const response = await apiClient.get<TicketmasterEvent[]>(
            //endpoint
            'api/ticketmaster/search', 
            {params: params}
        ); 
        return response.data; 
    } catch(error) { 
        console.error('failed to fetch ticketmaster events:', error); 
        return[];
    }
}

// 1. Function called with:
//    { latitude: 42.2808, longitude: -83.7430, radius: 1000 }

// 2. Axios builds URL:
//    http://localhost:3001/api/ticketmaster/search?latitude=42.2808&longitude=-83.743&radius=1000

// 3. Axios adds headers (from client.ts):
//    Content-Type: application/json

// 4. Axios sends HTTP GET request

// 5. Backend receives request

// 6. Backend fetches from Ticketmaster API

// 7. Backend transforms data

// 8. Backend sends response:
//    [
//      { id: '1', name: 'Concert 1', ... },
//      { id: '2', name: 'Concert 2', ... }
//    ]

// 9. Axios receives response and parses JSON

// 10. await completes, response = { data: [...], status: 200, ... }


    