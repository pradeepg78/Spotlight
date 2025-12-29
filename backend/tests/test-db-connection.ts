import connectDB from '../src/config/database';

async function testConnection() {
  console.log(' Testing MongoDB connection...\n');
  
  try {
    await connectDB();
    console.log('\nDatabase connection test PASSED');
    process.exit(0);
  } catch (error) {
    console.error('\nDatabase connection test FAILED: ', error);
    process.exit(1);
  }
}

testConnection();