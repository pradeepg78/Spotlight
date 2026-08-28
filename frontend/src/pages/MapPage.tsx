// src/pages/MapPage.tsx
import React, { useState, useEffect } from 'react';
import EventMap from '../components/EventMap';
import './MapPage.css';

// helper to format a Date to "YYYY-MM-DD" for the date input value
function toDateString(date: Date): string {
    return date.toISOString().split('T')[0];
}

export default function MapPage() {
    //creates a storage spot for user's gpa coords -> variable will be an obj containing 2 numbers or null
    //needed bc eventMap cannot function without a center point -> starts off null, once it gets a location, uses setLocation to set it
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    //boolean flag that tracks if we are still waiting for the browser to finish the gps search -> needed for the loaded spinner: if coordinates recieved, flag set to false to reveal map
    const [loading, setLoading] = useState(true);
    //storage spot for a text message to explain why things went wrong
    const [error, setError] = useState<string | null>(null);

    // date range filter — defaults to today through 30 days from now
    const today = toDateString(new Date());
    const thirtyDaysOut = toDateString(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(thirtyDaysOut);

    //side effect hook -> as soon as this component is born, run
    useEffect(() => {
    getUserLocation();
    }, []); //[] means to go only once

    const getUserLocation = () => {
        //navigator.geolocation -> browser's gps location, returns a geolocation object that gives web content access to the location of the device
        if (!navigator.geolocation) {
            setError('geolocation is not supported');
            // Default to Ann Arbor, MI
            setLocation({ latitude: 42.2808, longitude: -83.7430 });
            setLoading(false);
            return;
        }

        //actual request for geolocation
        navigator.geolocation.getCurrentPosition(
            (position) => {
            setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            });
            setLoading(false);
            },
            (error) => {
            console.error('error getting location:', error);
            setError('could not get your location. showing a2 instead.');
            // Default to Ann Arbor, MI
            setLocation({ latitude: 42.2808, longitude: -83.7430 });
            setLoading(false);
            }
        );
    };

    if (loading) {
        return (
            <div className="map-page-loading">
            <div className="loading-spinner"></div>
            <p>Getting your location...</p>
            </div>
        );
    }

    if (!location) {
        return (
            <div className="map-page-error">
            <h2>Unable to load map</h2>
            <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="map-page">
            {/* date range filter bar */}
            <div className="date-filter-bar">
                <span className="date-filter-label">🗓 Events from</span>
                <input
                    type="date"
                    className="date-input"
                    value={startDate}
                    min={today}
                    onChange={(e) => setStartDate(e.target.value)}
                />
                <div className="date-filter-divider"></div>
                <span className="date-filter-label">to</span>
                <input
                    type="date"
                    className="date-input"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />
            </div>

            <EventMap
                latitude={location.latitude}
                longitude={location.longitude}
                searchRadius={25}
                startDate={startDate}
                endDate={endDate}
            />
        </div>
        );
    }
