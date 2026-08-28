import { apiClient } from './client';
import { GooglePlace } from '../types/events';

//defines what can be searched for
export interface SearchGooglePlacesParams {
    //ie 'restaurants, cafes, etc'
    query: string;
    latitude?: number;
    longitude?: number;
}

/** Fetch major venues (stadiums, arenas) near a location for the map */
export async function getNearbyVenues(
    latitude: number,
    longitude: number,
    radiusMeters: number = 25000
): Promise<GooglePlace[]> {
    try {
        const response = await apiClient.get<{ data: GooglePlace[] }>(
            'api/googlePlace/search',
            {
                params: { latitude, longitude, radius: radiusMeters, type: 'stadium' },
            }
        );
        return response.data.data || [];
    } catch (error) {
        console.error('failed to fetch nearby venues', error);
        return [];
    }
}

//exported async function that takes earch paramerts and returns a promsie containing array
export async function searchGooglePlaces(
    //paramerter with type annotation -> take one param that must match the searchgoogleplaces interface
    params: SearchGooglePlacesParams
): Promise<GooglePlace[]> {
    try {
        // backend wraps response in { success, count, data: [...] }
        const response = await apiClient.get<{ data: GooglePlace[] }>(
            'api/googlePlace/search',
            {params: params}
        );
        return response.data.data;
    } catch(error) {
        console.error('failed to fetch google places', error);
        return [];
    }
}
