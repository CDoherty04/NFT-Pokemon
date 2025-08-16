const { 
    createSession, 
    joinSession, 
    getSessionById, 
    getWaitingSessions,
    isSessionAvailable 
} = require('./database.js');

async function testSessionFlow() {
    try {
        console.log('=== Testing Session Flow ===\n');

        // 1. Create a session with only user1
        console.log('1. Creating session with user1...');
        const user1 = {
            walletAddress: '0x1234567890abcdef',
            image: 'user1-pokemon.png',
            attributes: '{"type": "fire", "level": 25}'
        };

        const session = await createSession(user1);
        console.log('Session created:', {
            sessionId: session.sessionId,
            user1: session.user1.walletAddress,
            user2: session.user2,
            status: session.status
        });

        // 2. Check if session is available for joining
        console.log('\n2. Checking if session is available for joining...');
        const available = await isSessionAvailable(session.sessionId);
        console.log('Session available:', available);

        // 3. Get waiting sessions
        console.log('\n3. Getting all waiting sessions...');
        const waitingSessions = await getWaitingSessions();
        console.log('Waiting sessions count:', waitingSessions.length);
        console.log('Waiting sessions:', waitingSessions.map(s => ({
            sessionId: s.sessionId,
            user1: s.user1.walletAddress,
            status: s.status
        })));

        // 4. Join session with user2
        console.log('\n4. Joining session with user2...');
        const user2 = {
            walletAddress: '0xfedcba0987654321',
            image: 'user2-pokemon.png',
            attributes: '{"type": "water", "level": 30}'
        };

        const joinedSession = await joinSession(session.sessionId, user2);
        console.log('Session joined:', {
            sessionId: joinedSession.sessionId,
            user1: joinedSession.user1.walletAddress,
            user2: joinedSession.user2.walletAddress,
            status: joinedSession.status
        });

        // 5. Check if session is still available (should be false)
        console.log('\n5. Checking if session is still available...');
        const stillAvailable = await isSessionAvailable(session.sessionId);
        console.log('Session still available:', stillAvailable);

        // 6. Get updated waiting sessions (should be empty)
        console.log('\n6. Getting updated waiting sessions...');
        const updatedWaitingSessions = await getWaitingSessions();
        console.log('Updated waiting sessions count:', updatedWaitingSessions.length);

        console.log('\n=== Session Flow Test Completed Successfully ===');

    } catch (error) {
        console.error('Error in session flow test:', error);
    }
}

// Run the test
testSessionFlow(); 