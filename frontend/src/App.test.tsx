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
  // The map itself is stubbed out (see __mocks__/reactMapGl.tsx); this checks
  // the surrounding chrome mounts without crashing once geolocation resolves.
  expect(await screen.findByText(/events from/i)).toBeInTheDocument();
});

test('shows an event count once data loads', async () => {
  render(<App />);
  expect(await screen.findByText(/0 events · 0 venues/i)).toBeInTheDocument();
});
