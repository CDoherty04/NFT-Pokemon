const mongoose = require('mongoose');
require('dotenv').config();

/**
 * -------------- DATABASE ----------------
 */

const conn = process.env.MONGODB_URI;

// Create the main mongoose connection
mongoose.connect(conn);

const connection = mongoose.connection;

// Handle initial connection errors
connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

connection.on('connected', () => {
    console.log('Connected to MongoDB Atlas');
});

const SessionSchema = new mongoose.Schema({
    user1: {
        walletAddress: String,
        image: String,
        attributes: mongoose.Schema.Types.Mixed
    },
    user2: {
        walletAddress: String,
        image: String,
        attributes: mongoose.Schema.Types.Mixed
    },
    status: {
        type: String,
        default: 'waiting' // Changed from 'active' to 'waiting' when only user1 is present
    },
    sessionId: {
        type: String,
        unique: true,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Add methods to SessionSchema
SessionSchema.methods.generateSessionId = function() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

SessionSchema.methods.updateLastActivity = function() {
    this.updatedAt = new Date();
    return this.save();
};

// Helper function to normalize attributes
const normalizeAttributes = (attributes) => {
    if (typeof attributes === 'object' && attributes !== null) {
        // Ensure attributes object has the expected structure
        return {
            attack: parseInt(attributes.attack) || 0,
            defense: parseInt(attributes.defense) || 0,
            speed: parseInt(attributes.speed) || 0
        };
    } else if (typeof attributes === 'string') {
        // Handle legacy string format - try to parse as JSON or use default
        try {
            const parsed = JSON.parse(attributes);
            if (parsed && typeof parsed === 'object') {
                return {
                    attack: parseInt(parsed.attack) || 0,
                    defense: parseInt(parsed.defense) || 0,
                    speed: parseInt(parsed.speed) || 0
                };
            }
        } catch (e) {
            // If parsing fails, use default attributes
            return { attack: 1, defense: 1, speed: 1 };
        }
    }
    // Default attributes if none provided
    return { attack: 1, defense: 1, speed: 1 };
};

// Helper function to check if attributes are empty
const areAttributesEmpty = (attributes) => {
    if (!attributes) return true;
    
    if (typeof attributes === 'string') {
        return attributes.trim() === '';
    }
    
    if (typeof attributes === 'object' && attributes !== null) {
        return (attributes.attack === 0 || attributes.attack === undefined) &&
               (attributes.defense === 0 || attributes.defense === undefined) &&
               (attributes.speed === 0 || attributes.speed === undefined);
    }
    
    return true;
};

// Check if model already exists before creating it
const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);

// Session management functions
const createSession = async (user1, status = 'waiting') => {
    try {
        console.log('Creating session with user1:', user1);
        
        // Validate and normalize attributes
        const normalizedAttributes = normalizeAttributes(user1.attributes);
        
        const session = new Session({
            user1: {
                walletAddress: user1.walletAddress,
                image: user1.image,
                attributes: normalizedAttributes
            },
            user2: {
                walletAddress: '',
                image: '',
                attributes: { attack: 0, defense: 0, speed: 0 }
            },
            status: status,
            sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            isActive: true
        });
        
        console.log('Session object to save:', session);
        
        const savedSession = await session.save();
        console.log('Session created successfully:', savedSession.sessionId);
        console.log('Full saved session:', savedSession);
        return savedSession;
    } catch (error) {
        console.error('Error creating session:', error);
        throw error;
    }
};

const isSessionAvailable = async (sessionId) => {
    try {
        const session = await Session.findOne({ 
            sessionId: sessionId,
            status: 'waiting',
            isActive: true
        });
        
        if (!session) return false;
        
        // Check if user2 is actually empty (no wallet address, image, or attributes)
        if (session.user2 && session.user2.walletAddress) {
            console.log('Session not available - has user2 wallet address:', session.user2.walletAddress);
            return false;
        }
        if (session.user2 && session.user2.image) {
            console.log('Session not available - has user2 image:', session.user2.image);
            return false;
        }
        
        // Check attributes - handle both old string format and new object format
        if (session.user2 && session.user2.attributes && !areAttributesEmpty(session.user2.attributes)) {
            console.log('Session not available - has user2 attributes:', session.user2.attributes);
            return false;
        }
        
        console.log('Session is available for joining');
        return true;
    } catch (error) {
        console.error('Error checking session availability:', error);
        throw error;
    }
};

const joinSession = async (sessionId, user2) => {
    try {
        console.log('Joining session:', sessionId, 'with user2:', user2);
        
        const session = await Session.findOne({ sessionId: sessionId });
        
        if (!session) {
            throw new Error('Session not found');
        }
        
        console.log('Session found:', {
            sessionId: session.sessionId,
            status: session.status,
            isActive: session.isActive,
            user2: session.user2
        });
        
        if (!session.isActive) {
            throw new Error('Session is not active');
        }
        
        // Check if user2 is already filled
        if (session.user2 && session.user2.walletAddress) {
            console.log('Session has user2 wallet address:', session.user2.walletAddress);
            throw new Error('Session is already full');
        }
        if (session.user2 && session.user2.image) {
            console.log('Session has user2 image:', session.user2.image);
            throw new Error('Session is already full');
        }
        if (session.user2 && session.user2.attributes && !areAttributesEmpty(session.user2.attributes)) {
            console.log('Session has user2 attributes:', session.user2.attributes);
            throw new Error('Session is already full');
        }
        
        if (session.status !== 'waiting') {
            throw new Error('Session is not available for joining');
        }
        
        if (session.user1.walletAddress === user2.walletAddress) {
            throw new Error('User cannot join their own session');
        }
        
        // Validate and normalize user2 attributes
        const normalizedAttributes = normalizeAttributes(user2.attributes);
        
        // Update the session with user2 and change status to active
        const updatedSession = await Session.findOneAndUpdate(
            { sessionId: sessionId },
            { 
                $set: { 
                    user2: {
                        walletAddress: user2.walletAddress,
                        image: user2.image,
                        attributes: normalizedAttributes
                    },
                    status: 'active',
                    updatedAt: new Date()
                }
            },
            { new: true }
        );
        
        console.log('User2 joined session successfully:', updatedSession.sessionId);
        return updatedSession;
    } catch (error) {
        console.error('Error joining session:', error);
        throw error;
    }
};

const getSessionById = async (sessionId) => {
    try {
        const session = await Session.findOne({ sessionId: sessionId });
        return session;
    } catch (error) {
        console.error('Error getting session:', error);
        throw error;
    }
};

const getSessionsByUserId = async (walletAddress) => {
    try {
        const sessions = await Session.find({
            $or: [
                { 'user1.walletAddress': walletAddress },
                { 'user2.walletAddress': walletAddress }
            ]
        });
        return sessions;
    } catch (error) {
        console.error('Error getting sessions by user:', error);
        throw error;
    }
};

const getWaitingSessions = async () => {
    try {
        const sessions = await Session.find({ 
            status: 'waiting',
            isActive: true 
        });
        
        // Filter out sessions that actually have user2 data
        return sessions.filter(session => {
            if (session.user2 && session.user2.walletAddress) return false;
            if (session.user2 && session.user2.image) return false;
            
            // Check attributes - handle both old string format and new object format
            if (session.user2 && session.user2.attributes && !areAttributesEmpty(session.user2.attributes)) {
                return false;
            }
            
            return true;
        });
    } catch (error) {
        console.error('Error getting waiting sessions:', error);
        throw error;
    }
};

const updateSessionStatus = async (sessionId, newStatus) => {
    try {
        const result = await Session.updateOne(
            { sessionId: sessionId },
            { 
                $set: { 
                    status: newStatus,
                    updatedAt: new Date()
                }
            }
        );
        
        if (result.modifiedCount > 0) {
            console.log(`Session ${sessionId} status updated to: ${newStatus}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error updating session status:', error);
        throw error;
    }
};

const deleteSession = async (sessionId) => {
    try {
        const result = await Session.deleteOne({ sessionId: sessionId });
        if (result.deletedCount > 0) {
            console.log(`Session ${sessionId} deleted successfully`);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error deleting session:', error);
        throw error;
    }
};

const getAllSessions = async () => {
    try {
        const sessions = await Session.find({});
        return sessions;
    } catch (error) {
        console.error('Error getting all sessions:', error);
        throw error;
    }
};

// Migration function to convert existing string attributes to object format
const migrateAttributes = async () => {
    try {
        console.log('Starting attributes migration...');
        
        // Find all sessions with string attributes
        const sessionsToMigrate = await Session.find({
            $or: [
                { 'user1.attributes': { $type: 'string' } },
                { 'user2.attributes': { $type: 'string' } }
            ]
        });
        
        console.log(`Found ${sessionsToMigrate.length} sessions to migrate`);
        
        let migratedCount = 0;
        for (const session of sessionsToMigrate) {
            let needsUpdate = false;
            const updateData = {};
            
            // Check user1 attributes
            if (typeof session.user1.attributes === 'string') {
                updateData['user1.attributes'] = normalizeAttributes(session.user1.attributes);
                needsUpdate = true;
            }
            
            // Check user2 attributes
            if (typeof session.user2.attributes === 'string') {
                updateData['user2.attributes'] = normalizeAttributes(session.user2.attributes);
                needsUpdate = true;
            }
            
            if (needsUpdate) {
                await Session.updateOne(
                    { _id: session._id },
                    { $set: updateData }
                );
                migratedCount++;
            }
        }
        
        console.log(`Successfully migrated ${migratedCount} sessions`);
        return migratedCount;
    } catch (error) {
        console.error('Error during attributes migration:', error);
        throw error;
    }
};

// Expose the session management functions
module.exports = {
    createSession,
    joinSession,
    isSessionAvailable,
    getSessionById,
    getSessionsByUserId,
    getWaitingSessions,
    updateSessionStatus,
    deleteSession,
    getAllSessions,
    migrateAttributes
};