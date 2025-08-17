const mongoose = require('mongoose');
require('dotenv').config();

async function testDatabaseConnection() {
    console.log('Testing database connection...');
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set (hidden)' : 'NOT SET');
    
    if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI environment variable is not set!');
        console.log('Please create a .env file with your MongoDB connection string:');
        console.log('MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority');
        return;
    }
    
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Successfully connected to MongoDB!');
        
        // Test a simple operation
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📚 Available collections:', collections.map(c => c.name));
        
        // Disconnect
        await mongoose.disconnect();
        console.log('✅ Successfully disconnected from MongoDB!');
        
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        
        if (error.message.includes('ENOTFOUND')) {
            console.log('💡 This usually means the MongoDB URI is incorrect or the network is unreachable.');
        } else if (error.message.includes('Authentication failed')) {
            console.log('💡 This usually means the username/password in the MongoDB URI is incorrect.');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.log('💡 This usually means the MongoDB server is not running or the URI is incorrect.');
        }
    }
}

// Run the test
testDatabaseConnection();
