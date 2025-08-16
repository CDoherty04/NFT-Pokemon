const mongoose = require('mongoose');
require('dotenv').config();

const { migrateAttributes } = require('./database.js');

async function runMigration() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        
        console.log('Running attributes migration...');
        const migratedCount = await migrateAttributes();
        
        console.log(`Migration completed successfully! Migrated ${migratedCount} sessions.`);
        
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

// Run the migration if this script is executed directly
if (require.main === module) {
    runMigration();
}

module.exports = { runMigration }; 