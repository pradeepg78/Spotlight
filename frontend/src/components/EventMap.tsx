import React, { useState, useEffect, useRef, useMemo } from 'react';
//mapbox components -> Map is the default export, named exports marker, popup, nav, layer
    //marker: pin, popup: popup screen, navctrl: zoom, layer: custom map layers
import Map, { Marker, Popup, NavigationControl, Layer } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
//loads mapbox styles (appearance, controls, popups)
import 'mapbox-gl/dist/mapbox-gl.css';
//imports from apis
import { searchTicketmasterEvents } from '../api/ticketmaster';
import { findVenue } from '../api/googlePlaces';
import { TicketmasterEvent, GooglePlace } from '../types/events';
import { groupEventsByVenue, eventsWithLocation as withLocation, VenueGroup } from '../utils/venueGrouping';
//loads css for ts
import './EventMap.css';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';

// max events shown per venue in the popup
const MAX_EVENTS_PER_VENUE = 10;

// 3D buildings layer for light-v11
const buildingsLayer: any = {
    id: '3d-buildings',
    source: 'composite',
    'source-layer': 'building',
    filter: ['==', 'extrude', 'true'],
    type: 'fill-extrusion',
    minzoom: 14,
    paint: {
        'fill-extrusion-color': '#ddd',
        'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, ['get', 'height']],
        'fill-extrusion-base':   ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, ['get', 'min_height']],
        'fill-extrusion-opacity': 0.6,
    },
};

interface EventMapProps {
    latitude: number;
    longitude: number;
    searchRadius?: number;
    startDate?: string; // "YYYY-MM-DD"
    endDate?: string;   // "YYYY-MM-DD"
}

export default function EventMap({
    latitude,
    longitude,
    searchRadius = 10,
    startDate,
    endDate,
} : EventMapProps) {

    //stores ref to map instance, so the map can be controlled
        //example usage: mapRef.current.fitBounds() -> zoom to fit markers
    //state 1
    const mapRef = useRef<MapRef>(null);
    //state2 = viewState

    //stores current mapview, where the map is looking, map is controlled (react controls it)
    //pitch: 45 tilts the camera for a 3D perspective
    const [viewState, setViewState] = useState({
        longitude,
        latitude,
        zoom: 12,
        pitch: 45,
        bearing: 0,
    });

    //state3
    //stores an array of ticketmaster events
    //ticketmasterEvent -> curr val, setTicketmasterEvents -> update function
    const [ticketmasterEvents, setTicketmasterEvents] = useState<TicketmasterEvent[]>([]); //[] initial empty array


    //derived: events that have venue coordinates and can be shown as markers
    const eventsWithLocation = useMemo(() => withLocation(ticketmasterEvents), [ticketmasterEvents]);

    //derived: one marker per venue (see utils/venueGrouping for the keying rules)
    const venueGroups = useMemo<VenueGroup[]>(
        () => groupEventsByVenue(ticketmasterEvents),
        [ticketmasterEvents]
    );


    //state5
    //stores a bool, whether data is currently loading
    const [loading, setLoading] = useState(false);

    //stores a load failure so the map can say why it is empty instead of just
    //rendering zero markers, which looks identical to "nothing on near you"
    const [loadError, setLoadError] = useState<string | null>(null);

    //state6
    //stores the currently selected venue group for the popup
    const [selectedVenue, setSelectedVenue] = useState<VenueGroup | null>(null);

    //state7
    //stores Google Places venue details for the selected venue
    //null = not yet fetched
    const [venueDetails, setVenueDetails] = useState<GooglePlace | null>(null);
    const [venueLoading, setVenueLoading] = useState(false);

    //loads events when component mounts or when lat/long/dates change
    useEffect(() => {
        loadMapData();
        //dependency array -> loadMapData() when any of these change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [latitude, longitude, searchRadius, startDate, endDate]);

    const loadMapData = async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const events = await searchTicketmasterEvents({
                latitude,
                longitude,
                radius: searchRadius,
                startDate,
                endDate,
            });
            setTicketmasterEvents(events);
        } catch(error) {
            console.error('error loading map data:', error);
            setTicketmasterEvents([]);
            setLoadError(error instanceof Error ? error.message : 'Could not load events.');
        } finally {
            setLoading(false);
        }
    };

    //when the user clicks a venue marker, show all events there and fetch Google Places venue info
    const handleVenueClick = async (group: VenueGroup) => {
        setSelectedVenue(group);
        setVenueDetails(null); // clear previous venue details

        setVenueLoading(true);
        try {
            //resolve this specific venue in Google Places by name + location.
            //returns null when Google has no confident match, in which case the
            //popup simply omits the ratings block rather than showing a
            //neighbouring business's details.
            const place = await findVenue(group.venueName, group.latitude, group.longitude);
            setVenueDetails(place);
        } catch (error) {
            console.error('error fetching venue details:', error);
            setVenueDetails(null);
        } finally {
            setVenueLoading(false);
        }
    };

    //fit to markers function
    const fitToMarkers = () => {
        const allCoords: [number, number][] = ticketmasterEvents
            .filter(e => e.venue?.latitude && e.venue?.longitude)
            .map(e => [e.venue!.longitude, e.venue!.latitude] as [number, number]);

        if (allCoords.length > 0 && mapRef.current) {
            const lngs = allCoords.map(c => c[0]);
            const lats = allCoords.map(c => c[1]);
            mapRef.current.fitBounds(
                [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
                { padding: 80, duration: 1000 }
            );
        }
    };

    useEffect(() => {
        if (eventsWithLocation.length > 0) {
            setTimeout(fitToMarkers, 500);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ticketmasterEvents]);

    // Without a token Mapbox renders nothing at all, which is a confusing first
    // run for anyone who just cloned the repo.
    if (!MAPBOX_TOKEN) {
        return (
            <div className="map-token-missing">
                <h2>Mapbox token missing</h2>
                <p>
                    Set <code>REACT_APP_MAPBOX_TOKEN</code> in <code>frontend/.env</code>,
                    then restart the dev server.
                </p>
                <p>See <code>frontend/.env.example</code> for the expected format.</p>
            </div>
        );
    }

    return (
        //wrapper container -> holds everything
        <div className="map-container">

            <Map
                /* renders the mapbox map
                allows the map to be controlled later, gives access to methods, grabs the mapbox instance to allow mapbox specific funtions to be called
                mapRef is declared in EventMap
                */
                ref={mapRef}
                /* control map pos, spreads object into individual props */
                {...viewState}
                /* onMove is an event listener, without this, map would be frozen */
                onMove={(evt: any) => setViewState(evt.viewState)}
                mapboxAccessToken={MAPBOX_TOKEN}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/light-v11"
            >
                {/* zoom, compass, and pitch toggle */}
                <NavigationControl position="top-right" visualizePitch={true} />

                {/* 3D buildings */}
                <Layer {...buildingsLayer} />

                {/* One marker per unique event venue */}
                {venueGroups.map((group) => (
                    <Marker
                        key={group.key}
                        longitude={group.longitude}
                        latitude={group.latitude}
                        anchor="center"
                        onClick={(e: any) => {
                            e.originalEvent.stopPropagation();
                            handleVenueClick(group);
                        }}
                    >
                        <div className="marker-venue">
                            <div className={`marker-dot${selectedVenue?.key === group.key ? ' marker-dot--active' : ''}`} />
                        </div>
                    </Marker>
                ))}

                {/* Popup for Selected Venue — shows venue info + scrollable list of all events */}
                {/* if selectedVenue is null, stop; popup only exists if there is data to show */}
                {selectedVenue && (
                    <Popup
                        longitude={selectedVenue.longitude}
                        latitude={selectedVenue.latitude}
                        anchor="top"
                        //when the user presses the x, sets the selectedVenue to null
                        onClose={() => { setSelectedVenue(null); setVenueDetails(null); }}
                        closeOnClick={false}
                    >
                        <div className="popup-content">
                            {/* venue header */}
                            <p className="popup-venue-name">{selectedVenue.venueName}</p>

                            {/* Google Places venue info */}
                            {venueLoading && <p className="venue-loading">Loading venue info…</p>}
                            {venueDetails && (
                                <div className="popup-venue-meta">
                                    {venueDetails.rating > 0 && (
                                        <span className="event-rating">⭐ {venueDetails.rating} · {venueDetails.totalRatings} reviews</span>
                                    )}
                                    {venueDetails.isOpen !== undefined && (
                                        <span className={venueDetails.isOpen ? 'venue-open' : 'venue-closed'}>
                                            {venueDetails.isOpen ? 'Open' : 'Closed'}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* divider */}
                            <div className="popup-divider"></div>

                            {/* scrollable event list — capped at MAX_EVENTS_PER_VENUE */}
                            <div className="event-list">
                                {selectedVenue.events.slice(0, MAX_EVENTS_PER_VENUE).map((event, i) => (
                                    <div key={event.id} className="event-list-item">
                                        {/* event image */}
                                        {event.imageUrl && i === 0 && (
                                            <img src={event.imageUrl} alt={event.title} className="popup-image" />
                                        )}
                                        <p className="event-list-title">{event.title}</p>
                                        <div className="popup-meta">
                                            {event.date && event.date !== 'TBA' && (
                                                <p className="event-date">
                                                    {event.date}
                                                    {event.time && event.time !== 'TBA' && ` · ${event.time}`}
                                                </p>
                                            )}
                                            {event.price && (
                                                <p className="event-price">{event.price}</p>
                                            )}
                                        </div>
                                        {event.url && (
                                            <a
                                                href={event.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="event-link"
                                            >
                                                Buy Tickets
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Popup>
                )}
            </Map>

            {/* Loading Overlay */}
            {loading && (
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                    <p>Loading events…</p>
                </div>
            )}

            {/* Refresh Button */}
            <button className="refresh-button" onClick={loadMapData} disabled={loading}>
                Refresh
            </button>

            {/* Load failure banner - replaces the old silent empty map */}
            {loadError && !loading && (
                <div className="map-error-banner" role="alert">
                    <strong>Could not load events.</strong>
                    <span>{loadError}</span>
                    <button onClick={loadMapData}>Retry</button>
                </div>
            )}

            {/* Genuine empty result, as distinct from a failure */}
            {!loadError && !loading && venueGroups.length === 0 && (
                <div className="map-empty-banner">
                    No events found in this area for the selected dates.
                </div>
            )}

            {/* Event Count */}
            <div className="event-count">
                {eventsWithLocation.length} events · {venueGroups.length} venues
            </div>
        </div>
    );
}
