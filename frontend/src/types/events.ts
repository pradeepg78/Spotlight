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

// matches the transformed Place shape returned by the backend's googlePlacesService
export interface GooglePlace {
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
