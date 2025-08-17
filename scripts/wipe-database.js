const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();

/**
 * Script to wipe only the sessions collection from Atlas database
 * This will drop only the sessions collection and its data
 * USE WITH CAUTION - THIS IS IRREVERSIBLE FOR SESSIONS DATA
 */

const conn = process.env.MONGODB_URI;

if (!conn) {
    console.error('❌ MONGODB_URI not found in environment variables');
    console.error('Please make sure you have a .env file with MONGODB_URI');
    process.exit(1);
}

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to prompt user for confirmation
const promptConfirmation = (question) => {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.toLowerCase().trim());
        });
    });
};

// Create the mongoose connection
mongoose.connect(conn);

const connection = mongoose.connection;

// Handle connection events
connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

connection.on('connected', () => {
    console.log('✅ Connected to MongoDB Atlas');
});

connection.on('disconnected', () => {
    console.log('🔌 Disconnected from MongoDB Atlas');
});

// Function to wipe only the sessions collection
const wipeSessionsCollection = async () => {
    try {
        console.log('🚨 WARNING: This will delete ALL sessions data from the database!');
        console.log('Database URI:', conn.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials
        
        // Check if sessions collection exists
        const collections = await connection.db.listCollections().toArray();
        const sessionsCollection = collections.find(col => col.name === 'sessions');
        
        if (!sessionsCollection) {
            console.log('ℹ️  No sessions collection found in database');
            return;
        }
        
        // Get document count before deletion
        const documentCount = await connection.db.collection('sessions').countDocuments();
        console.log(`📋 Found sessions collection with ${documentCount} documents`);
        
        if (documentCount === 0) {
            console.log('ℹ️  Sessions collection is already empty');
            return;
        }
        
        // Drop the sessions collection
        console.log('\n🗑️  Dropping sessions collection...');
        await connection.db.dropCollection('sessions');
        console.log('   ✅ Sessions collection dropped successfully');
        
        console.log('\n🎉 Sessions collection wipe completed successfully!');
        
    } catch (error) {
        console.error('❌ Error wiping sessions collection:', error);
        throw error;
    }
};

// Function to show database stats
const showDatabaseStats = async () => {
    try {
        const collections = await connection.db.listCollections().toArray();
        console.log(`\n📊 Database Statistics:`);
        console.log(`   Total Collections: ${collections.length}`);
        
        if (collections.length > 0) {
            console.log('\n   Collection Details:');
            for (const collection of collections) {
                try {
                    const count = await connection.db.collection(collection.name).countDocuments();
                    const status = collection.name === 'sessions' ? '🎯 TARGET' : '💾 PRESERVED';
                    console.log(`     - ${collection.name}: ${count} documents ${status}`);
                } catch (error) {
                    console.log(`     - ${collection.name}: Error getting count`);
                }
            }
        }
    } catch (error) {
        console.error('❌ Error getting database stats:', error);
    }
};

// Main execution
const main = async () => {
    try {
        // Wait for connection to be established
        if (connection.readyState !== 1) {
            console.log('⏳ Waiting for MongoDB connection...');
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('MongoDB connection timeout'));
                }, 10000); // 10 second timeout
                
                connection.once('connected', () => {
                    clearTimeout(timeout);
                    resolve();
                });
                
                connection.once('error', (err) => {
                    clearTimeout(timeout);
                    reject(err);
                });
            });
        }
        
        // Show current database state
        await showDatabaseStats();
        
        // Check if user wants to proceed
        console.log('\n⚠️  WARNING: This will delete ALL sessions data from the database!');
        console.log('   Other collections will be preserved.');
        console.log('   This action is IRREVERSIBLE for sessions data!');
        
        const confirm = await promptConfirmation('\nType "YES" to confirm you want to proceed: ');
        
        if (confirm !== 'yes') {
            console.log('❌ Operation cancelled by user');
            return;
        }
        
        console.log('\n🔄 Proceeding with sessions collection wipe...');
        
        // Wipe only the sessions collection
        await wipeSessionsCollection();
        
        // Show final state
        await showDatabaseStats();
        
    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    } finally {
        // Close readline interface
        rl.close();
        
        // Close the connection
        await mongoose.connection.close();
        console.log('\n👋 Database connection closed');
        process.exit(0);
    }
};

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n\n🛑 Received SIGINT, shutting down gracefully...');
    rl.close();
    await mongoose.connection.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n\n🛑 Received SIGTERM, shutting down gracefully...');
    rl.close();
    await mongoose.connection.close();
    process.exit(0);
});

// Run the script
if (require.main === module) {
    main();
}

module.exports = { wipeSessionsCollection, showDatabaseStats };
