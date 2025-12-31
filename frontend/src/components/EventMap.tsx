import React, { useState, useEffect, useRef } from 'react';
//mapbox components -> Map is the default export, named exports marker, popup, nav
    //marker: pin, popup: popup screen, navctrl: zoom
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
//loads mapbox styles (appearance, controls, popups)
import 'mapbox-gl/dist/mapbox-gl.css';
//imports from apis
import { searchTicketmasterEvents } from '../api/ticketmaster';
import { searchGooglePlaces } from '../api/googlePlaces';
import { TicketmasterEvent, GooglePlace } from '../types/events';
//loads css for ts
import './EventMap.css';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';

interface EventMapProps { 
    latitude: number; 
    longitude: number; 
    searchRadius?: number;
    showTicketmaster?: boolean; 
    showGooglePlaces?: boolean; 
}

export default function EventMap({
    latitude, 
    longitude, 
    searchRadius = 10, 
    showTicketmaster = true, 
    showGooglePlaces = true,
} : EventMapProps) { 

    //stores ref to map instance, so the map can be controlled
        //example usage: mapRef.current.fitBounds() -> zoom to fit markers
    //state 1
    const mapRef = useRef<MapRef>(null);
    //state2 = viewState

    //stores current mapview, where the map is looking, map is controlled (react controls it)
    const [viewState, setViewState] = useState({
        longitude,
        latitude,
        zoom: 12,
    });

    //state3 
    //stores an array of ticketmaster events
    //ticketmasterEvent -> curr val, setTicketmasterEvents -> update function
    const [ticketmasterEvents, setTicketmasterEvents] = useState<TicketmasterEvent[]>([]); //[] initial empty array

    //state4
    //stores an array of google places
    const [googlePlaces, setGooglePlaces] = useState<GooglePlace[]>([]);

    //state5
    //stores a bool, whether data is currently loading
    const [loading, setLoading] = useState(false);
    
    //state6
    //stores currently selected event for popup
    const [selectedEvent, setSelectedEvent] = useState<any>(null);

    //loads events when component mounts or when lat long changes
    useEffect(() => { 
        loadMapData(); 
        //dependency array -> loadMapData() when any of the three change
    }, [latitude, longitude, searchRadius]); 

    const loadMapData = async () => { 
        //shows loading spinner to user
        setLoading(true); 
        try { 
            //creates promises array, it is a promise array to hold multiple promises, so we can run them in parallel with promises.all()
            const promises: Promise<any>[] = []; 
            //add api calls to array -> only call apis that are enabled
            if (showTicketmaster) { 
                promises.push(searchTicketmasterEvents({
                    latitude,
                    longitude, 
                    radius: searchRadius,
                })); 
            } 
            if (showGooglePlaces) { 
                promises.push(
                    searchGooglePlaces({
                        query: `events near ${latitude}, ${longitude}`, 
                        latitude, 
                        longitude,
                    })
                ); 
            }
            //promise.all() -> runs multiple promises at the same time and waits for all to complete
            const results = await Promise.all(promises); 
            //storing results
            let resultIndex = 0; 
            if (showTicketmaster) { 
                setTicketmasterEvents(results[resultIndex++] || []); 
            }
            if (showGooglePlaces) { 
                setGooglePlaces(results[resultIndex++] || []); 
            }
        } catch(error) { 
            console.error('error loading map data:', error); 
        } finally { 
            setLoading(false); 
        }
    }; 
    
    //fit to markers function
    const fitToMarkers = () => {
        //collect all coordinates -> [number, number][] : array of tuples
        const allCoords: [number, number][] = [
            // ... is the spread operator -> spreads array elements ( [1, 2] and [3, 4] -> combined = [...arr1, ...arr2])
            //combines all ticketmaster events
            ...ticketmasterEvents
            //filters -> keeps only the events that have valid coordinates
            .filter(e => e.venue?.latitude && e.venue?.longitude)
            //map -> transforms each item
            //{ venue: { latitude: 42, longitude: -83 } } -> [-83, 42]
            // ! is the non-null assertion -> says that it exists
            // as[number, number] -> tells ts that this is a tuple not an array
            .map(e => [e.venue!.longitude, e.venue!.latitude] as [number, number]), 
            ...googlePlaces.map(
                p => [p.geometry.location.lng, p.geometry.location.lat] as [number, number]
            ),
        ];

        //calc bounds
        if (allCoords.length > 0 && mapRef.current) {
            //extract long lat
            //allCorrds is an array of tuples- > first elemt is long, second is lat
                //// If allCoords = [[-83.7, 42.3], [-83.8, 42.4], [-83.6, 42.2]]
                // lngs = [-83.7, -83.8, -83.6]  // All longitudes
                // lats = [42.3, 42.4, 42.2]      // All latitudes
            const lngs = allCoords.map(c => c[0]);
            const lats = allCoords.map(c => c[1]);
            
            //finding mins and maxes
            const minLng = Math.min(...lngs); //most west
            const maxLng = Math.max(...lngs); //most east
            const minLat = Math.min(...lats); //most south
            const maxLat = Math.max(...lats); //most north

            //creates bouding box -> a box that contains all markers
            //map needs a frame, needs to know where to center the view, how to far to zoom out
            mapRef.current.fitBounds(
                [
                    [minLng, minLat], //southwest corner
                    [maxLng, maxLat], //northeast corner
                ],
                { padding: 50, duration: 1000 }
            );
        }
    };

    //when events / places load, fit map to show them all
    useEffect(() => { 
        if (ticketmasterEvents.length > 0 || googlePlaces.length > 0) { 
            //waits 500 ms before fitting
            setTimeout(fitToMarkers, 500); 
        }
    }, [ticketmasterEvents, googlePlaces]); 

    return (
        //wrapper container -> holds everything
        <div className="map-container">
            
            <Map
                /* renders the mapbox map
                allows the map to be controlled later, gives access to methods, grabs the mapbox instance to allow mapbox specific funtions to be called
                mapRef is declared in EventMap 
                */
                ref={mapRef}
                /* control map pos, spreads object into individual props
                defined viewState previously; instead of writing every single map property like: 
                <Map 
                    longitude={viewState.longitude} 
                    latitude={viewState.latitude} 
                    zoom={viewState.zoom} 
                    > 
                use spread operator to take evert key inside viewState obj and unpack them as individual props for this component
                if this did not exist here, the map would not know where to look
                */
                {...viewState}
                /* onMove is an event listener, without this, map would be frozen
                 evt is the object that mapbox lib sends everytime thr map moves, contains lat/long
                 evt.viewState -> inside evt, there is a att called viewState
                 setViewState -> update function
                 
                 1. You click and drag the map 50 miles to the North.
                 2. Mapbox calculates the new coordinates (e.g., Latitude goes from 42.1 to 42.8).
                 3. The Map component triggers the onMove function.
                 4. Your code runs setViewState({ latitude: 42.8, ... }).
                 5. The Re-render: React notices the state changed. It re-runs your return block.
                 6. The Sync: {...viewState} now passes the new 42.8 latitude back into the map.
                */
                onMove={(evt: any) => setViewState(evt.viewState)}
                mapboxAccessToken={MAPBOX_TOKEN}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/standard"
            >
                {/* zoom and compass */}
                <NavigationControl position="top-right" />

                {/* Ticketmaster Event Markers (Red) */}
                {/* go inside events data, for every event, run the code inside the bracket */}
                {ticketmasterEvents.map((event) => {
                    //if this event doesnt have a specific location, dont try and draw it
                    if (!event.venue?.latitude || !event.venue?.longitude) return null;
                    
                    return (
                        //marker is a component that links a coordinate to a place on the map
                        <Marker
                            //allows place to be uniquely identified, since this is in a .map loop, needs to distinguish between a bunch of differnt markers
                            key={`tm-${event.id}`}
                            longitude={event.venue.longitude}
                            latitude={event.venue.latitude}
                            //alignment point
                            anchor="bottom"
                            //listener for click
                            //e.originalEvent.stopPropagation() prevents a double click; clicking a place might trigger another click on the map
                            onClick={(e: any) => {
                                e.originalEvent.stopPropagation();
                                //take data for this event and save it to popup, take every pience of event data and combine it, and also add the source -> copy it into new object
                                setSelectedEvent({ ...event, source: 'ticketmaster' });
                            }}
                        >
                            {/* the emoji representing events, keep it for now change it later to something better */}
                            <div className="marker marker-red">🎫</div>
                        </Marker>
                    );
                })}

                {/* Google Places Markers (Blue) */}
                {/* similar to above */}
                {googlePlaces.map((place) => (
                    <Marker
                        key={`gp-${place.place_id}`}
                        longitude={place.geometry.location.lng}
                        latitude={place.geometry.location.lat}
                        anchor="bottom"
                        onClick={(e: any) => {
                            e.originalEvent.stopPropagation();
                            setSelectedEvent({ ...place, source: 'googlePlaces' });
                        }}
                    >
                        {/* not really blue */}
                        <div className="marker marker-blue">📍</div>
                    </Marker>
                ))}

                {/* Popup for Selected Event */}
                {/* if selectedEvent is null, stop; popup only exists if there is data to show */}
                {selectedEvent && (
                    <Popup
                        //needs to know where to anchor itself, but long is stored in two differnt locations
                        longitude={
                            selectedEvent.source === 'ticketmaster'
                                ? selectedEvent.venue?.longitude //path a 
                                : selectedEvent.geometry.location.lng // path b
                        }
                        latitude={
                            selectedEvent.source === 'ticketmaster'
                                ? selectedEvent.venue?.latitude //path a
                                : selectedEvent.geometry.location.lat //path b
                        }
                        anchor="top"
                        //when the user presses the x, sets the selectEvent memory to null
                        onClose={() => setSelectedEvent(null)}
                        closeOnClick={false}
                    >
                        <div className="popup-content">
                            <h3>
                                {selectedEvent.source === 'ticketmaster'
                                    ? selectedEvent.title
                                    : selectedEvent.name}
                            </h3>
                            <p>
                                {selectedEvent.source === 'ticketmaster'
                                    ? selectedEvent.venue?.name
                                    : selectedEvent.vicinity}
                            </p>
                            {selectedEvent.source === 'ticketmaster' && selectedEvent.dates?.start?.localDate && (
                                <p className="event-date">📅 {selectedEvent.dates.start.localDate}</p>
                            )}
                            {selectedEvent.source === 'ticketmaster' && selectedEvent.priceRanges?.[0] && (
                                <p className="event-price">
                                    💵 ${selectedEvent.priceRanges[0].min} - ${selectedEvent.priceRanges[0].max}
                                </p>
                            )}
                            {selectedEvent.source === 'googlePlaces' && selectedEvent.rating && (
                                <p className="event-rating">⭐ {selectedEvent.rating}</p>
                            )}
                            {selectedEvent.source === 'ticketmaster' && selectedEvent.url && (
                                <a 
                                    href={selectedEvent.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="event-link"
                                >
                                    🎫 Buy Tickets
                                </a>
                            )}
                        </div>
                    </Popup>
                )}
            </Map>

            {/* Loading Overlay */}
            {loading && (
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                    <p>Loading events...</p>
                </div>
            )}

            {/* Legend */}
            <div className="legend">
                <div className="legend-item">
                    <span className="legend-icon">🎫</span>
                    <span>Ticketmaster Events</span>
                </div>
                <div className="legend-item">
                    <span className="legend-icon">📍</span>
                    <span>Google Places</span>
                </div>
            </div>

            {/* Refresh Button */}
            <button className="refresh-button" onClick={loadMapData} disabled={loading}>
                Refresh
            </button>

            {/* Event Count */}
            <div className="event-count">
                {ticketmasterEvents.length + googlePlaces.length} events found
            </div>
        </div>
    );
}