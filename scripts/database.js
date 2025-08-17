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

// Add connection state check function
const ensureConnection = async () => {
    if (connection.readyState !== 1) {
        console.log('Waiting for MongoDB connection...');
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
};

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
        default: 'waiting'
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
    // New fields for battle system
    battlePhase: {
        type: String,
        enum: ['waiting', 'action-selection', 'battle-resolution', 'completed'],
        default: 'waiting'
    },
    currentRound: {
        type: Number,
        default: 1
    },
    user1Health: {
        type: Number,
        default: 100
    },
    user2Health: {
        type: Number,
        default: 100
    },
    user1Action: {
        type: String,
        enum: ['punch', 'kick', 'block', 'charge', 'spare', 'burn', 'spared', 'destroyed', ''],
        default: ''
    },
    user2Action: {
        type: String,
        enum: ['punch', 'kick', 'block', 'charge', 'spare', 'burn', 'spared', 'destroyed', ''],
        default: ''
    },
    battleLog: [{
        message: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
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

// Helper function to generate unique 8-digit session IDs
const generateUniqueSessionId = async () => {
    let sessionId;
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
        // Generate a random 8-digit number
        sessionId = Math.floor(10000000 + Math.random() * 90000000).toString();
        attempts++;
        
        // Check if this ID already exists
        const existingSession = await Session.findOne({ sessionId: sessionId });
        if (!existingSession) {
            return sessionId;
        }
        
        if (attempts >= maxAttempts) {
            throw new Error('Failed to generate unique session ID after maximum attempts');
        }
    } while (true);
};

// Check if model already exists before creating it
// Force delete the old model to ensure new schema is used
if (mongoose.models.Session) {
    delete mongoose.models.Session;
}
const Session = mongoose.model('Session', SessionSchema);

// Session management functions
const createSession = async (user1, status = 'waiting') => {
    try {
        // Ensure database connection is established
        await ensureConnection();
        
        console.log('Creating session with user1:', user1);
        
        // Validate and normalize attributes
        const normalizedAttributes = normalizeAttributes(user1.attributes);
        
        // Generate a unique 8-digit session ID
        const sessionId = await generateUniqueSessionId();
        
        const session = new Session({
            sessionId: sessionId,
            user1: {
                walletAddress: user1.walletAddress,
                image: user1.image,
                attributes: user1.attributes
            },
                         user1Health: 150 + (user1.attributes.defense * 30), // Base 150 + 30 per defense point
            status: 'waiting',
            battlePhase: 'waiting',
            currentRound: 1,
            createdAt: new Date(),
            updatedAt: new Date()
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
        // Ensure database connection is established
        await ensureConnection();
        
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
                        attributes: user2.attributes
                    },
                                         user2Health: 150 + (user2.attributes.defense * 30), // Base 150 + 30 per defense point
                    status: 'active',
                    battlePhase: 'action-selection',
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

// New functions for battle system
const submitUserAction = async (sessionId, userWalletAddress, action) => {
    try {
        console.log(`Submitting action ${action} for user ${userWalletAddress} in session ${sessionId}`);
        
        const session = await Session.findOne({ sessionId: sessionId });
        if (!session) {
            throw new Error('Session not found');
        }
        
        console.log('Found session before update:', {
            sessionId: session.sessionId,
            user1Action: session.user1Action,
            user2Action: session.user2Action,
            battlePhase: session.battlePhase
        });
        
        if (session.status !== 'active') {
            throw new Error('Session is not active');
        }
        
        // Determine which user is submitting the action
        let updateField = '';
        if (session.user1.walletAddress === userWalletAddress) {
            updateField = 'user1Action';
        } else if (session.user2.walletAddress === userWalletAddress) {
            updateField = 'user2Action';
        } else {
            throw new Error('User not found in session');
        }
        
        console.log(`Updating ${updateField} to ${action}`);
        
        // Try a different update approach - update the session directly
        session[updateField] = action;
        session.battlePhase = 'action-selection';
        session.updatedAt = new Date();
        
        // Validate the session before saving
        const validationError = session.validateSync();
        if (validationError) {
            console.error('Validation error before save:', validationError);
            throw new Error(`Validation failed: ${validationError.message}`);
        }
        
        const savedSession = await session.save();
        
        console.log('Session after save:', {
            sessionId: savedSession.sessionId,
            user1Action: savedSession.user1Action,
            user2Action: savedSession.user2Action,
            battlePhase: savedSession.battlePhase
        });
        
        // Verify the update was successful
        if (savedSession[updateField] !== action) {
            throw new Error(`Failed to update ${updateField} - expected ${action}, got ${savedSession[updateField]}`);
        }
        
        console.log(`Action submitted successfully: ${action} for ${updateField}`);
        
        // Check if both players have submitted actions for this round
        if (savedSession.user1Action && savedSession.user2Action) {
            console.log('Both actions received, processing battle automatically...');
            
            // Process the battle using the existing battle logic
            const battleResult = await processBattleRound(savedSession);
            
            // After processing the battle, reset actions for the next round
            // Only reset if the battle is not completed
            if (battleResult.battlePhase !== 'completed') {
                console.log('Resetting actions for next round...');
                await resetBattleActions(sessionId);
                
                // Get the updated session with reset actions
                const finalSession = await Session.findOne({ sessionId: sessionId });
                console.log('Final session after battle processing and action reset:', {
                    sessionId: finalSession.sessionId,
                    health: { user1: finalSession.user1Health, user2: finalSession.user2Health },
                    actions: { user1: finalSession.user1Action, user2: finalSession.user2Action },
                    battlePhase: finalSession.battlePhase,
                    currentRound: finalSession.currentRound
                });
                return finalSession;
            } else {
                console.log('Battle completed, not resetting actions');
                return battleResult;
            }
        }
        
        return savedSession;
    } catch (error) {
        console.error('Error submitting user action:', error);
        throw error;
    }
};

const checkAndProcessBattle = async (sessionId) => {
    try {
        console.log(`Checking if battle can be processed for session ${sessionId}`);
        
        const session = await Session.findOne({ sessionId: sessionId });
        if (!session) {
            throw new Error('Session not found');
        }
        
        // Check if both users have submitted actions
        if (session.user1Action && session.user2Action) {
            console.log('Both actions received, processing battle...');
            
            // Process the complete battle round (including health calculations)
            const updatedSession = await processBattleRound(session);
            
            console.log('Battle processed successfully');
            return updatedSession;
        } else {
            console.log('Not all actions received yet');
            return session;
        }
    } catch (error) {
        console.error('Error checking and processing battle:', error);
        throw error;
    }
};

const processBattleLogic = (user1Action, user2Action, session) => {
    console.log(`Processing battle: User1 ${user1Action} vs User2 ${user2Action}`);
    
    // Get player stats for damage calculations
    const user1Stats = session.user1.attributes || { attack: 1, defense: 1, speed: 1 };
    const user2Stats = session.user2.attributes || { attack: 1, defense: 1, speed: 1 };
    
    let message = '';
    let user1Damage = 0;
    let user2Damage = 0;
    
    // NEW BATTLE MECHANICS: Using the updated battle logic
    // Helper function to calculate speed bonuses
    const getSpeedBonus = (speed) => {
        if (speed >= 3) return 3; // Both bonuses + health gain
        if (speed >= 2) return 2; // Enhanced damage
        if (speed >= 1) return 1; // Basic bonus
        return 0; // No bonus
    };
    
         // Helper function to calculate base damage (same for punches and kicks)
     const getBaseDamage = (attackStat) => Math.max(15, attackStat * 8);
    
    // Helper function to calculate health gain from defense
    const getHealthGain = (defenseStat) => Math.max(1, Math.floor(defenseStat * 0.5));
    
    // Process all action combinations
    if (user1Action === 'punch' && user2Action === 'block') {
        // Punch vs Block - reduced damage
        const baseDamage = getBaseDamage(user1Stats.attack);
        const speedBonus = getSpeedBonus(user1Stats.speed);
        user2Damage = baseDamage + speedBonus;
        message = `User1 punches but User2 blocks! User2 takes ${user2Damage} damage${speedBonus > 0 ? ` (includes ${speedBonus} speed bonus)` : ''}.`;
    } else if (user1Action === 'kick' && user2Action === 'block') {
        // Kick vs Block - reduced damage
        const baseDamage = getBaseDamage(user1Stats.attack);
        const speedBonus = getSpeedBonus(user1Stats.speed);
        user2Damage = baseDamage + speedBonus;
        message = `User1 kicks but User2 blocks! User2 takes ${user2Damage} damage${speedBonus > 0 ? ` (includes ${speedBonus} speed bonus)` : ''}.`;
    } else if (user1Action === 'punch' && user2Action === 'charge') {
        // Punch vs Charge - normal damage while opponent charges
        const baseDamage = getBaseDamage(user1Stats.attack);
        const speedBonus = getSpeedBonus(user1Stats.attack);
        user2Damage = baseDamage + speedBonus;
        message = `User1 punches while User2 charges up! User2 takes ${user2Damage} damage${speedBonus > 0 ? ` (includes ${speedBonus} speed bonus)` : ''}.`;
         } else if (user1Action === 'kick' && user2Action === 'charge') {
         // Kick vs Charge - 1.5x damage while opponent charges
         const baseDamage = getBaseDamage(user1Stats.attack) * 1.5;
         const speedBonus = getSpeedBonus(user1Stats.attack);
         user2Damage = baseDamage + speedBonus;
         message = `User1 kicks while User2 charges up! User2 takes ${user2Damage} damage${speedBonus > 0 ? ` (includes ${speedBonus} speed bonus)` : ''}.`;
    } else if (user2Action === 'punch' && user1Action === 'block') {
        // User2 Punch vs User1 Block - reduced damage
        const baseDamage = getBaseDamage(user2Stats.attack);
        const speedBonus = getSpeedBonus(user2Stats.speed);
        user1Damage = baseDamage + speedBonus;
        message = `User2 punches but User1 blocks! User1 takes ${user1Damage} damage${speedBonus > 0 ? ` (includes ${speedBonus} speed bonus)` : ''}.`;
    } else if (user2Action === 'kick' && user1Action === 'block') {
        // User2 Kick vs User1 Block - reduced damage
        const baseDamage = getBaseDamage(user2Stats.attack);
        const speedBonus = getSpeedBonus(user2Stats.speed);
        user1Damage = baseDamage + speedBonus;
        message = `User2 kicks but User1 blocks! User1 takes ${user1Damage} damage${speedBonus > 0 ? ` (includes ${speedBonus} speed bonus)` : ''}.`;
    } else if (user2Action === 'punch' && user1Action === 'charge') {
        // User2 Punch vs User1 Charge - normal damage while opponent charges
        const baseDamage = getBaseDamage(user2Stats.attack);
        const speedBonus = getSpeedBonus(user2Stats.attack);
        user1Damage = baseDamage + speedBonus;
        message = `User2 punches while User1 charges up! User1 takes ${user1Damage} damage${speedBonus > 0 ? ` (includes ${speedBonus} speed bonus)` : ''}.`;
         } else if (user2Action === 'kick' && user1Action === 'charge') {
         // User2 Kick vs User1 Charge - 1.5x damage while opponent charges
         const baseDamage = getBaseDamage(user2Stats.attack) * 1.5;
         const speedBonus = getSpeedBonus(user2Stats.attack);
         user1Damage = baseDamage + speedBonus;
         message = `User2 kicks while User1 charges up! User1 takes ${user1Damage} damage${speedBonus > 0 ? ` (includes ${speedBonus} speed bonus)` : ''}.`;
    } else if (user1Action === 'punch' && user2Action === 'punch') {
        // Punch vs Punch - equal damage
        const baseDamage = getBaseDamage(user1Stats.attack);
        const user2BaseDamage = getBaseDamage(user2Stats.attack);
        user1Damage = user2BaseDamage;
        user2Damage = baseDamage;
        message = `Both players punch! User1 takes ${user1Damage} damage, User2 takes ${user2Damage} damage.`;
    } else if (user1Action === 'kick' && user2Action === 'kick') {
        // Kick vs Kick - equal damage
        const baseDamage = getBaseDamage(user1Stats.attack);
        const user2BaseDamage = getBaseDamage(user2Stats.attack);
        user1Damage = user2BaseDamage;
        user2Damage = baseDamage;
        message = `Both players kick! User1 takes ${user1Damage} damage, User2 takes ${user2Damage} damage.`;
    } else if (user1Action === 'punch' && user2Action === 'kick') {
        // Punch vs Kick - equal damage
        const baseDamage = getBaseDamage(user1Stats.attack);
        const user2BaseDamage = getBaseDamage(user2Stats.attack);
        user1Damage = user2BaseDamage;
        user2Damage = baseDamage;
        message = `User1 punches vs User2 kicks! User1 takes ${user1Damage} damage, User2 takes ${user2Damage} damage.`;
    } else if (user1Action === 'kick' && user2Action === 'punch') {
        // Kick vs Punch - equal damage
        const baseDamage = getBaseDamage(user1Stats.attack);
        const user2BaseDamage = getBaseDamage(user2Stats.attack);
        user1Damage = user2BaseDamage;
        user2Damage = baseDamage;
        message = `User1 kicks vs User2 punches! User1 takes ${user1Damage} damage, User2 takes ${user2Damage} damage.`;
    } else if (user1Action === 'charge' && user2Action === 'charge') {
        // Charge vs Charge - both charge up
        user1Damage = 0;
        user2Damage = 0;
        message = `Both players charge up! No damage dealt this round.`;
    } else if (user1Action === 'block' && user2Action === 'block') {
        // Block vs Block - minimal damage
        user1Damage = Math.max(1, Math.floor(user2Stats.attack * 0.3));
        user2Damage = Math.max(1, Math.floor(user1Stats.attack * 0.3));
        message = `Both players block! Minimal damage: User1 takes ${user1Damage}, User2 takes ${user2Damage}.`;
    } else {
        // Default case for any other combinations
        const baseDamage = getBaseDamage(user1Stats.attack);
        const user2BaseDamage = getBaseDamage(user2Stats.attack);
        user1Damage = user2BaseDamage;
        user2Damage = baseDamage;
        message = `Lets Battle!`;
    }
    
    return { 
        message, 
        user1Damage, 
        user2Damage 
    };
};

// New function to process a complete battle round
const processBattleRound = async (session) => {
    try {
        console.log(`Processing battle round for session ${session.sessionId}`);
        
        // Get player actions
        const user1Action = session.user1Action;
        const user2Action = session.user2Action;
        
        if (!user1Action || !user2Action) {
            throw new Error('Both actions must be present to process battle');
        }
        
        console.log(`Battle: User1 (${user1Action}) vs User2 (${user2Action})`);
        
        // Process battle logic
        const battleResult = processBattleLogic(user1Action, user2Action, session);
        
        console.log('Battle result:', {
            message: battleResult.message,
            user1Damage: battleResult.user1Damage,
            user2Damage: battleResult.user2Damage
        });
        
        // Calculate new health values
        const newUser1Health = Math.max(0, session.user1Health - battleResult.user1Damage);
        const newUser2Health = Math.max(0, session.user2Health - battleResult.user2Damage);
        
        console.log('Health calculation:', {
            oldHealth: { user1: session.user1Health, user2: session.user2Health },
            damage: { user1: battleResult.user1Damage, user2: battleResult.user2Damage },
            newHealth: { user1: newUser1Health, user2: newUser2Health }
        });
        
        // Check if battle is over (one player has 0 health)
        const battleCompleted = newUser1Health <= 0 || newUser2Health <= 0;
        const winner = battleCompleted ? 
            (newUser1Health <= 0 ? 'user2' : 'user1') : null;
        
        // Determine battle phase
        const newBattlePhase = battleCompleted ? 'completed' : 'battle-resolution';
        
        // Update session with battle results
        const updatedSession = await Session.findOneAndUpdate(
            { sessionId: session.sessionId },
            { 
                $set: { 
                    battlePhase: newBattlePhase,
                    user1Health: newUser1Health,
                    user2Health: newUser2Health,
                    updatedAt: new Date()
                },
                $inc: {
                    currentRound: 1
                },
                $push: { 
                    battleLog: {
                        message: battleResult.message,
                        timestamp: new Date()
                    }
                }
            },
            { new: true }
        );
        
        console.log('Battle log entry added:', {
            message: battleResult.message,
            timestamp: new Date(),
            battleLogLength: updatedSession.battleLog ? updatedSession.battleLog.length : 0
        });
        
        console.log('Session updated in database:', {
            sessionId: updatedSession.sessionId,
            health: { user1: updatedSession.user1Health, user2: updatedSession.user2Health },
            battlePhase: updatedSession.battlePhase,
            currentRound: updatedSession.currentRound,
            battleLogLength: updatedSession.battleLog ? updatedSession.battleLog.length : 0
        });
        
        console.log('Battle round processed successfully, updated session:', {
            sessionId: updatedSession.sessionId,
            health: {
                user1: updatedSession.user1Health,
                user2: updatedSession.user2Health
            },
            battlePhase: updatedSession.battlePhase,
            currentRound: updatedSession.currentRound
        });
        
        return updatedSession;
    } catch (error) {
        console.error('Error processing battle round:', error);
        throw error;
    }
};

const resetBattleActions = async (sessionId) => {
    try {
        console.log(`Resetting battle actions for session ${sessionId}`);
        
        const session = await Session.findOne({ sessionId: sessionId });
        if (!session) {
            throw new Error('Session not found');
        }

        const updatedSession = await Session.findOneAndUpdate(
            { sessionId: sessionId },
            { 
                $set: { 
                    user1Action: '',
                    user2Action: '',
                    battlePhase: 'action-selection',
                    updatedAt: new Date()
                }
            },
            { new: true }
        );
        
        console.log('Battle actions reset successfully');
        return updatedSession;
    } catch (error) {
        console.error('Error resetting battle actions:', error);
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

// Function to start a new battle (when current battle is completed)
const startNewBattle = async (sessionId) => {
    try {
        console.log(`Starting new battle for session ${sessionId}`);
        
        const session = await Session.findOne({ sessionId: sessionId });
        if (!session) {
            throw new Error('Session not found');
        }
        
        // Reset everything for a new battle
        const updatedSession = await Session.findOneAndUpdate(
            { sessionId: sessionId },
            { 
                $set: { 
                    user1Action: '',
                    user2Action: '',
                    battlePhase: 'action-selection',
                    currentRound: 1,
                                         user1Health: 150 + (session.user1.attributes.defense * 30), // Reset to full health
                     user2Health: 150 + (session.user2.attributes.defense * 30), // Reset to full health
                    updatedAt: new Date()
                },
                $unset: { battleLog: 1 } // Clear battle log for new battle
            },
            { new: true }
        );
        
        console.log('New battle started successfully');
        return updatedSession;
    } catch (error) {
        console.error('Error starting new battle:', error);
        throw error;
    }
};

// Function to force end the current battle
const endBattle = async (sessionId) => {
    try {
        console.log(`Force ending battle for session ${sessionId}`);
        
        const session = await Session.findOne({ sessionId: sessionId });
        if (!session) {
            throw new Error('Session not found');
        }
        
        // Force end the battle by setting both players to 0 health
        const updatedSession = await Session.findOneAndUpdate(
            { sessionId: sessionId },
            { 
                $set: { 
                    user1Action: '',
                    user2Action: '',
                    battlePhase: 'completed',
                    user1Health: 0,
                    user2Health: 0,
                    updatedAt: new Date()
                }
            },
            { new: true }
        );
        
        console.log('Battle force ended successfully');
        return updatedSession;
    } catch (error) {
        console.error('Error force ending battle:', error);
        throw error;
    }
};

// Function to handle battle completion and set isActive to false
const completeBattle = async (sessionId) => {
    try {
        console.log(`Completing battle for session ${sessionId}`);
        
        const session = await Session.findOne({ sessionId: sessionId });
        if (!session) {
            throw new Error('Session not found');
        }
        
        // Set battle as completed and inactive
        const updatedSession = await Session.findOneAndUpdate(
            { sessionId: sessionId },
            { 
                $set: { 
                    battlePhase: 'completed',
                    isActive: false,
                    updatedAt: new Date()
                }
            },
            { new: true }
        );
        
        console.log('Battle completed and session set to inactive');
        return updatedSession;
    } catch (error) {
        console.error('Error completing battle:', error);
        throw error;
    }
};

// Function to submit winner's final choice (spare or burn)
const submitWinnerChoice = async (sessionId, winnerWalletAddress, choice) => {
    try {
        console.log(`Submitting winner choice for session ${sessionId}: ${choice}`);
        
        const session = await Session.findOne({ sessionId: sessionId });
        if (!session) {
            throw new Error('Session not found');
        }
        
        // Determine which user is the winner
        let winnerField, loserField;
        if (session.user1.walletAddress === winnerWalletAddress) {
            winnerField = 'user1Action';
            loserField = 'user2Action';
        } else if (session.user2.walletAddress === winnerWalletAddress) {
            winnerField = 'user2Action';
            loserField = 'user1Action';
        } else {
            throw new Error('Winner wallet address not found in session');
        }
        
        // Update the winner's action with their choice
        const updateData = {
            [winnerField]: choice,
            updatedAt: new Date()
        };
        
        // If choice is 'burn', set loser's action to 'destroyed'
        if (choice === 'burn') {
            updateData[loserField] = 'destroyed';
        } else if (choice === 'spare') {
            updateData[loserField] = 'spared';
        }
        
        const updatedSession = await Session.findOneAndUpdate(
            { sessionId: sessionId },
            { $set: updateData },
            { new: true }
        );
        
        console.log(`Winner choice submitted successfully: ${choice}`);
        return updatedSession;
    } catch (error) {
        console.error('Error submitting winner choice:', error);
        throw error;
    }
};

// Function to get the final battle result
const getBattleResult = async (sessionId) => {
    try {
        const session = await Session.findOne({ sessionId: sessionId });
        if (!session) {
            throw new Error('Session not found');
        }
        
        // Determine winner and their choice
        let winner, winnerChoice, loser, loserStatus;
        
        if (session.user1Health <= 0) {
            winner = session.user1;
            winnerChoice = session.user1Action;
            loser = session.user2;
            loserStatus = session.user2Action;
        } else if (session.user2Health <= 0) {
            winner = session.user2;
            winnerChoice = session.user2Action;
            loser = session.user1;
            loserStatus = session.user1Action;
        } else {
            return null; // Battle not completed
        }
        
        return {
            winner,
            winnerChoice,
            loser,
            loserStatus,
            sessionId: session.sessionId,
            isActive: session.isActive
        };
    } catch (error) {
        console.error('Error getting battle result:', error);
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
    migrateAttributes,
    submitUserAction,
    checkAndProcessBattle,
    processBattleLogic,
    resetBattleActions,
    processBattleRound,
    startNewBattle,
    endBattle,
    completeBattle,
    submitWinnerChoice,
    getBattleResult
};