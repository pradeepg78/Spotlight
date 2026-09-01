import { apiClient, toApiError } from './client';
import { GooglePlace } from '../types/events';

//defines what can be searched for
export interface SearchGooglePlacesParams {
    latitude: number;
    longitude: number;
    radius?: number;
    /** Google Places category, e.g. 'restaurant' | 'cafe' | 'bar' | 'stadium' */
    type?: string;
    /** Free-text filter applied by the Places API, e.g. a venue name */
    keyword?: string;
}

/** Fetch major venues (stadiums, arenas) near a location for the map */
export async function getNearbyVenues(
    latitude: number,
    longitude: number,
    radiusMeters: number = 25000
): Promise<GooglePlace[]> {
    return searchGooglePlaces({
        latitude,
        longitude,
        radius: radiusMeters,
        type: 'stadium',
    });
}

/**
 * Resolve one named venue near a coordinate.
 *
 * This hits the dedicated /venue endpoint, which keyword-filters and then
 * name-matches. The old code sent a `query` param the backend ignored, so the
 * popup showed whichever business happened to be closest to the marker.
 * Returns null when Google has no confident match.
 */
export async function findVenue(
    name: string,
    latitude: number,
    longitude: number
): Promise<GooglePlace | null> {
    try {
        const response = await apiClient.get<{ data: GooglePlace | null }>(
            'api/googlePlace/venue',
            { params: { name, latitude, longitude } }
        );
        return response.data.data ?? null;
    } catch (error) {
        throw toApiError(error);
    }
}

//exported async function that takes search parameters and returns a promise containing array
export async function searchGooglePlaces(
    params: SearchGooglePlacesParams
): Promise<GooglePlace[]> {
    try {
        // backend wraps response in { success, count, data: [...] }
        const response = await apiClient.get<{ data: GooglePlace[] }>(
            'api/googlePlace/search',
            { params }
        );
        return response.data.data ?? [];
    } catch (error) {
        throw toApiError(error);
    }
}
