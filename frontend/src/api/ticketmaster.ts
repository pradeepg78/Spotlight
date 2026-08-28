//preconfigured axios instance created in client.ts, importing the export const apiClient = axios.create({ ... });
import { apiClient } from './client';
import { TicketmasterEvent } from '../types/events';

//exporting SearchTicketMasterParams so other files can access it
export interface SearchTicketmasterParams {
    latitude: number;
    longitude: number;
    radius?: number;
    keyword?: string;
    startDate?: string; // "YYYY-MM-DD"
    endDate?: string;   // "YYYY-MM-DD"
}

//exported async funtion that takes search params and returns a promise containing an array of tm events
export async function searchTicketmasterEvents(
    //fcn takes one parameter called params, must match SearchTicketmasterParams interface
    params: SearchTicketmasterParams
    //promise is a container for a future value
): Promise<TicketmasterEvent[]> {
    try {
        // backend wraps response in { success, count, data: [...] }
        const response = await apiClient.get<{ data: TicketmasterEvent[] }>(
            //endpoint
            'api/ticketmaster/search',
            {params: params}
        );
        return response.data.data;
    } catch(error) {
        console.error('failed to fetch ticketmaster events:', error);
        return [];
    }
}

/** Get Ticketmaster events for specific venues (by lat/lng). Used for main venue popups. */
export async function getEventsForVenues(
    places: Array<{ name: string; latitude: number; longitude: number }>,
    startDate?: string,
    endDate?: string
): Promise<Array<{ placeKey: string; events: TicketmasterEvent[] }>> {
    if (places.length === 0) return [];
    try {
        const response = await apiClient.post<{ data: Array<{ placeKey: string; events: TicketmasterEvent[] }> }>(
            'api/ticketmaster/events-for-venues',
            { places, startDate, endDate }
        );
        return response.data.data ?? [];
    } catch (error) {
        console.error('failed to fetch events for venues', error);
        return [];
    }
}

// 1. Function called with:
//    { latitude: 42.2808, longitude: -83.7430, radius: 10, startDate: "2026-03-05", endDate: "2026-04-05" }

// 2. Axios builds URL:
//    http://localhost:3001/api/ticketmaster/search?latitude=42.2808&longitude=-83.743&radius=10&startDate=...&endDate=...

// 3. Axios adds headers (from client.ts):
//    Content-Type: application/json

// 4. Axios sends HTTP GET request

// 5. Backend receives request

// 6. Backend fetches from Ticketmaster API (with startDateTime/endDateTime)

// 7. Backend transforms data

// 8. Backend sends response:
//    { success: true, count: 2, data: [{ id: '1', title: 'Concert 1', ... }, ...] }

// 9. Axios receives response and parses JSON

// 10. await completes, response.data.data = [...]
