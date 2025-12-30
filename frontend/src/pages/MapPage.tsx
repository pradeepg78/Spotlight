// src/pages/MapPage.tsx
import React, { useState, useEffect } from 'react';
import EventMap from '../components/EventMap';
import './MapPage.css';

export default function MapPage() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      // Default to Ann Arbor, MI
      setLocation({ latitude: 42.2808, longitude: -83.7430 });
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setError('Could not get your location. Showing Ann Arbor instead.');
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
      <EventMap
        latitude={location.latitude}
        longitude={location.longitude}
        searchRadius={10}
        showTicketmaster={true}
        showGooglePlaces={true}
      />
    </div>
  );
}