import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Keep the render test off the network - it is asserting on layout, not data.
// These are plain functions rather than jest.fn(): CRA enables `resetMocks`,
// which would strip a mockResolvedValue() implementation before each test and
// leave the component receiving undefined.
jest.mock('./api/ticketmaster', () => ({
  searchTicketmasterEvents: () => Promise.resolve([]),
  getEventsForVenues: () => Promise.resolve([]),
}));
jest.mock('./api/googlePlaces', () => ({
  findVenue: () => Promise.resolve(null),
  searchGooglePlaces: () => Promise.resolve([]),
  getNearbyVenues: () => Promise.resolve([]),
}));

beforeEach(() => {
  // jsdom has no geolocation implementation, so MapPage would hang on its
  // permission request without this stub.
  Object.defineProperty(global.navigator, 'geolocation', {
    value: {
      getCurrentPosition: (success: PositionCallback) =>
        success({
          coords: { latitude: 42.2808, longitude: -83.743 },
        } as GeolocationPosition),
    },
    configurable: true,
  });
});

test('renders the map page once a location resolves', async () => {
  render(<App />);
  // No Mapbox token is set in the test environment, so the component renders
  // its setup guidance instead of a live map.
  expect(await screen.findByText(/mapbox token missing/i)).toBeInTheDocument();
});

test('shows the date range filter', async () => {
  render(<App />);
  expect(await screen.findByText(/events from/i)).toBeInTheDocument();
});
