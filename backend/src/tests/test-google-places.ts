import googlePlacesService from '../services/googlePlacesService';

async function test() {
  console.log('testing google places \n');

  //using ann arbor coordinates
  const latitude = 42.2808;
  const longitude = -83.7430;

  try {
    //test 1: search all nearby places
    console.log('='.repeat(60));
    console.log('TEST 1: Nearby Places (1km radius)');
    console.log('='.repeat(60));
    const places = await googlePlacesService.searchNearby(latitude, longitude, 1000);
    console.log(`\nFound ${places.length} places\n`);

    places.slice(0, 3).forEach((place, i) => {
      console.log(`${i + 1}. ${place.name}`);
      console.log(`   📍 ${place.address}`);
      console.log(`   ⭐ Rating: ${place.rating} (${place.totalRatings} reviews)`);
      console.log(`   💵 Price Level: ${'$'.repeat(place.priceLevel || 1)}`);
      console.log(`   ${place.isOpen ? '🟢 Open Now' : '🔴 Closed'}`);
      console.log('');
    });

    // Test 2: Search restaurants
    console.log('\n' + '='.repeat(60));
    console.log('TEST 2: Nearby Restaurants');
    console.log('='.repeat(60));
    const restaurants = await googlePlacesService.searchRestaurants(latitude, longitude);
    console.log(`\nFound ${restaurants.length} restaurants\n`);

    restaurants.slice(0, 3).forEach((place, i) => {
      console.log(`${i + 1}. ${place.name}`);
      console.log(`   📍 ${place.address}`);
      console.log(`   ⭐ ${place.rating}/5 (${place.totalRatings} reviews)`);
      console.log('');
    });

    // Test 3: Search cafes
    console.log('\n' + '='.repeat(60));
    console.log('TEST 3: Nearby Cafes');
    console.log('='.repeat(60));
    const cafes = await googlePlacesService.searchCafes(latitude, longitude);
    console.log(`\nFound ${cafes.length} cafes\n`);

    cafes.slice(0, 3).forEach((place, i) => {
      console.log(`${i + 1}. ${place.name} - ${place.rating}⭐`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

test();