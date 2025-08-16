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
        attributes: String
    },
    user2: {
        walletAddress: String,
        image: String,
        attributes: String
    },
    status: {
        type: String,
        default: 'active'
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

// Check if model already exists before creating it
const Session = mongoose.models.Session || mongoose.model('Session', SessionSchema);

// Session management functions
const createSession = async (user1, user2, status = 'active') => {
    try {
        console.log('Creating session with data:', { user1, user2, status });
        
        const session = new Session({
            user1: {
                walletAddress: user1.walletAddress,
                image: user1.image,
                attributes: user1.attributes
            },
            user2: {
                walletAddress: user2.walletAddress,
                image: user2.image,
                attributes: user2.attributes
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

// Expose the session management functions
module.exports = {
    createSession,
    getSessionById,
    getSessionsByUserId,
    updateSessionStatus,
    deleteSession,
    getAllSessions
};