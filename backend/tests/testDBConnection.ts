import 'dotenv/config';
import connectDB from '../src/config/database';

async function testConnection() {
  console.log('🧪 Testing MongoDB connection...\n');
  
  try {
    await connectDB();
    console.log('\n✅ Database connection test PASSED');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database connection test FAILED: ', error);
    process.exit(1);
  }
}

testConnection();