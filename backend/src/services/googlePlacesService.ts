import axios from 'axios'; 
import * as dotenv from 'dotenv'; 
import * as path from 'path'; 

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

//what the google places api gives us -> need to transform this data 
//into better format for the app to use
interface GooglePlace { 
    place_id: string; 
    name: string; 
    vicinity: string; 
    geometry: { 
        location: { 
            lat: number; 
            lng: number; 
        }; 
    }; 
    rating?: number; 
    user_ratings_total?: number;
    types?: string[]; 
    photos?: Array <{ 
        photo_reference: string; 
        height: number; 
        width: number;
    }>; 
    price_level?: number; 
    opening_hours?: { 
        open_now?: boolean; 
    }; 
}

interface GooglePlacesResponse { 
    results: GooglePlace[]; 
    status: string; 
    next_page_token?: string; 
}

//what the rest of the app uses
export interface Place { 
    id: string; 
    name: string; 
    address: string; 
    latitude: number; 
    longitude: number; 
    rating: number; 
    totalRatings: number; 
    priceLevel: number; 
    types: string[]; 
    photoUrl: string; 
    isOpen: boolean; 
}

class GooglePlacesService { 
    private apikey: string; 
    private baseurl: string; 

    constructor() {
        this.apikey = process.env.GOOGLE_PLACES_API_KEY || ''; 
        this.baseurl = 'https://maps.googleapis.com/maps/api/place';

        if (!this.apikey) {
            console.error("google places api key not dected"); 
        } else { 
            console.log("google places api loaded")
        }
    }
    //returns a promise that contains an array of place objects
    async searchNearby(
        latitude: number,
        longitude: number, 
        radius: number = 1000, 
        type?: string,
        keyword?: string
    ): Promise<Place[]> { 
        try {
            console.log(`searching places near ${latitude}, ${longitude} (radius: ${radius} m, type: ${type ?? 'any'}, keyword: ${keyword ?? 'none'})`); 
            //axios.get(url, config)
            const response = await axios.get<GooglePlacesResponse>(
                `${this.baseurl}/nearbysearch/json`, 
                { 
                    params: { 
                        location: `${latitude},${longitude}`, 
                        radius: radius, 
                        type: type, 
                        keyword: keyword, 
                        key: this.apikey
                    }
                }
            ); 
            if (response.data.status != "OK" && response.data.status !== "ZERO_RESULTS") { 
                throw new Error(`google places api error: ${response.data.status}`); 
            }
            const rawPlaces = response.data.results || []; 
            console.log(`found ${rawPlaces.length} places`); 
            const cleanPlaces = rawPlaces.map(place => this.transformPlace(place)); 
            return cleanPlaces; 
        } catch (error) { 
            console.error("failed to search places", error); 
            throw error; 
        }
    }

    /**
     * Resolve one specific venue by name near a coordinate.
     *
     * The map popup needs the Google entry for the venue it just rendered, not
     * whatever business happens to be closest. Nearby-search is keyword-filtered
     * and the results are then scored on name overlap, so a miss returns null
     * rather than an unrelated place.
     */
    async findVenue(name: string, latitude: number, longitude: number, radius: number = 800): Promise<Place | null> {
        const candidates = await this.searchNearby(latitude, longitude, radius, undefined, name);
        if (candidates.length === 0) return null;

        const target = name.toLowerCase().trim();
        const targetWords = target.split(/\s+/).filter(w => w.length > 2);

        let best: Place | null = null;
        let bestScore = 0;

        for (const place of candidates) {
            const candidate = place.name.toLowerCase();
            let score = 0;
            if (candidate === target) score = 100;
            else if (candidate.includes(target) || target.includes(candidate)) score = 50;
            score += targetWords.filter(w => candidate.includes(w)).length;

            if (score > bestScore) {
                bestScore = score;
                best = place;
            }
        }

        // Require at least one meaningful token in common, otherwise this is a
        // nearby business rather than the venue we asked for.
        return bestScore > 0 ? best : null;
    }

    private transformPlace(googlePlace: GooglePlace): Place {
        return {
            id: googlePlace.place_id,
            name: googlePlace.name,
            address: googlePlace.vicinity,
            latitude: googlePlace.geometry.location.lat,
            longitude: googlePlace.geometry.location.lng,
            rating: googlePlace.rating || 0,
            totalRatings: googlePlace.user_ratings_total || 0,
            priceLevel: googlePlace.price_level || 0,
            types: googlePlace.types || [],
            photoUrl: this.getPhotoUrl(googlePlace.photos?.[0]?.photo_reference),
            isOpen: googlePlace.opening_hours?.open_now || false
        };
    }

    private getPhotoUrl(photoReference?: string): string {
        if (!photoReference) { 
            return '';
        }
        return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoReference}&key=${this.apikey}`;
    }

    async searchRestaurants(latitude: number, longitude: number, radius: number = 1000): Promise<Place[]> {
        return this.searchNearby(latitude, longitude, radius, 'restaurant');
    }

    async searchCafes(latitude: number, longitude: number, radius: number = 1000): Promise<Place[]> {
        return this.searchNearby(latitude, longitude, radius, 'cafe');
    }

    async searchBars(latitude: number, longitude: number, radius: number = 1000): Promise<Place[]> {
        return this.searchNearby(latitude, longitude, radius, 'bar');
    }

    async searchParking(latitude: number, longitude: number, radius: number = 500): Promise<Place[]> {
        return this.searchNearby(latitude, longitude, radius, 'parking');
    }
}

export default new GooglePlacesService();
