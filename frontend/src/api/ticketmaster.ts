//preconfigured axios instance created in client.ts, importing the export const apiClient = axios.create({ ... });
import { apiClient, toApiError } from './client';
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

/**
 * Search events near a coordinate.
 *
 * Throws ApiError on failure rather than returning [] - the caller needs to be
 * able to tell "no events nearby" apart from "the backend is down".
 */
export async function searchTicketmasterEvents(
    params: SearchTicketmasterParams
): Promise<TicketmasterEvent[]> {
    try {
        // backend wraps response in { success, count, data: [...] }
        const response = await apiClient.get<{ data: TicketmasterEvent[] }>(
            //endpoint
            'api/ticketmaster/search',
            { params }
        );
        return response.data.data ?? [];
    } catch (error) {
        throw toApiError(error);
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
        throw toApiError(error);
    }
}
