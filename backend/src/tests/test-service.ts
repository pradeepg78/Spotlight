import ticketmasterService from '../services/ticketmasterService';

async function test() {
  console.log('testing Ticketmaster Service...\n');
  
  const events = await ticketmasterService.searchEvents('football', 'Ann Arbor');
  
  console.log(`Found ${events.length} events\n`);
  console.log('='.repeat(60));

  console.log(events);
  
  events.slice(0, 100).forEach((event, index) => {
    console.log(`\n${index + 1}. ${event.name}`);
    console.log(`Date: ${event.date}`);
    console.log(`Venue: ${event.venueName}`);
    console.log(`City: ${event.city}`);
    
    // Only show price if it exists
    if (event.price.min > 0 || event.price.max > 0) {
      console.log(`Price: $${event.price.min} - $${event.price.max}`);
    } else {
      console.log(`Price: TBA`);
    }
    
    // Show if we have an image
    if (event.imageUrl) {
      console.log(`Image: ${event.imageUrl.substring(0, 50)}...`);
    }
    
    console.log(`Lat/Lng: ${event.latitude}, ${event.longitude}`);
    console.log(`Tickets: ${event.ticketUrl}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('Test completed!');
}

test();