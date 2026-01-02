import { apiClient } from './client'; 
import { GooglePlace } from '../types/events';

//defines what can be searched for
export interface SearchGooglePlacesParams { 
    //ie 'restaurants, cafes, etc'
    query: string; 
    latitude?: number;
    longitude?: number;
}

//exported async function that takes earch paramerts and returns a promsie containing array
export async function searchGooglePlaces(
    //paramerter with type annotation -> take one param that must match the searchgoogleplaces interface
    params: SearchGooglePlacesParams
): Promise<GooglePlace[]> { 
    try {
        const response = await apiClient.get<GooglePlace[]>(
            'api/googlePlace/search',
            {params: params}
        ); 
        return response.data; 
    } catch(error) { 
        console.error('failed to fetch google places', error); 
        return []; 
    }
}
