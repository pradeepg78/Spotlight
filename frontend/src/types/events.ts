export interface TicketmasterEvent { 
    id: string; 
    title: string; 
    date: string; 
    time: string; 
    venueName: string;
    price?: string; 
    imageUrl?: string; 
    url?: string; 
    venue?: { 
        latitude: number; 
        longitude: number; 
        name: string;
    }; 
}

export interface GooglePlace { 
    place_id: string;
    name: string; 
    vicinity: string;
    rating?: number; 
    geometry: { 
        location: { 
            lat: number;
            lng: number;
        }; 
    }; 
    photos?: Array<{
        photo_reference: string; 
    }>; 
}