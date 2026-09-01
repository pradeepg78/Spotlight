/// <reference types="node" />
import ticketmasterService from '../src/services/ticketmasterService';

async function test() {
  console.log('Testing Ticketmaster Service...\n');

  // 1. keyword + city search (backs /api/events/search)
  const byKeyword = await ticketmasterService.searchEvents('football', 'Ann Arbor');
  console.log(`searchEvents('football', 'Ann Arbor') -> ${byKeyword.length} events`);
  console.log('='.repeat(60));

  byKeyword.slice(0, 5).forEach((event, index) => {
    console.log(`\n${index + 1}. ${event.title}`);
    console.log(`   Date:   ${event.date}${event.time !== 'TBA' ? ` at ${event.time}` : ''}`);
    console.log(`   Venue:  ${event.venueName}`);
    console.log(`   Price:  ${event.price ?? 'TBA'}`);
    if (event.venue) {
      console.log(`   Coords: ${event.venue.latitude}, ${event.venue.longitude}`);
    }
    console.log(`   Link:   ${event.url || 'n/a'}`);
  });

  // 2. geo search (backs /api/ticketmaster/search)
  console.log('\n' + '='.repeat(60));
  const byLocation = await ticketmasterService.searchByLocation(42.2808, -83.743, 25);
  const withCoords = byLocation.filter(e => e.venue);
  console.log(`searchByLocation(Ann Arbor, 25mi) -> ${byLocation.length} events, ${withCoords.length} with coordinates`);

  const venues = new Set(withCoords.map(e => `${e.venue!.latitude.toFixed(4)},${e.venue!.longitude.toFixed(4)}`));
  console.log(`   grouped into ${venues.size} unique venue markers`);

  // 3. per-venue lookup (backs /api/ticketmaster/events-for-venues)
  console.log('\n' + '='.repeat(60));
  const forPlaces = await ticketmasterService.getEventsForPlaces([
    { name: 'Michigan Stadium', latitude: 42.2658, longitude: -83.7487 },
  ]);
  forPlaces.forEach(p => console.log(`getEventsForPlaces(${p.placeKey}) -> ${p.events.length} events`));

  console.log('\n' + '='.repeat(60));
  console.log('Test completed!');
}

test().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
