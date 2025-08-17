import { NextResponse } from 'next/server';
import { 
  createSession, 
  joinSession,
  isSessionAvailable,
  getSessionById, 
  getSessionsByUserId, 
  getWaitingSessions,
  updateSessionStatus, 
  deleteSession,
  getAllSessions 
} from '../../../../scripts/database.js';

// GET /api/sessions - Get all sessions or waiting sessions based on query parameter
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const sessionId = searchParams.get('sessionId');
    
    if (sessionId && type === 'check') {
      // Check if a specific session is available for joining
      const available = await isSessionAvailable(sessionId);
      return NextResponse.json({ success: true, available });
    }
    
    let sessions;
    if (type === 'waiting') {
      sessions = await getWaitingSessions();
    } else {
      sessions = await getAllSessions();
    }
    
    return NextResponse.json({ success: true, sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// POST /api/sessions - Create a new session
export async function POST(request) {
  try {
    const body = await request.json();
    console.log('API received request body:', body);
    
    const { user1, status = 'waiting' } = body;
    console.log('Extracted data:', { user1, status });
    
    if (!user1) {
      return NextResponse.json(
        { success: false, error: 'user1 is required' },
        { status: 400 }
      );
    }

    // Validate user1 data
    if (!user1.walletAddress || !user1.image || !user1.attributes) {
      return NextResponse.json(
        { success: false, error: 'user1 must have walletAddress, image, and attributes' },
        { status: 400 }
      );
    }

    console.log('Attempting to create session for user:', user1.walletAddress);
    const session = await createSession(user1, status);
    console.log('Successfully created session:', session.sessionId);
    
    return NextResponse.json({ success: true, session }, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to create session';
    if (error.message.includes('MongoDB connection')) {
      errorMessage = 'Database connection error. Please try again later.';
    } else if (error.message.includes('Failed to generate unique session ID')) {
      errorMessage = 'Unable to create game code. Please try again.';
    } else {
      errorMessage = error.message || 'An unexpected error occurred';
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 

// PATCH /api/sessions - Join an existing session
export async function PATCH(request) {
  try {
    const body = await request.json();
    console.log('API received join request body:', body);
    
    const { sessionId, user2 } = body;
    console.log('Extracted join data:', { sessionId, user2 });
    
    if (!sessionId || !user2) {
      return NextResponse.json(
        { success: false, error: 'sessionId and user2 are required' },
        { status: 400 }
      );
    }

    // Validate user2 data
    if (!user2.walletAddress || !user2.image || !user2.attributes) {
      return NextResponse.json(
        { success: false, error: 'user2 must have walletAddress, image, and attributes' },
        { status: 400 }
      );
    }

    console.log('Attempting to join session:', sessionId);
    const session = await joinSession(sessionId, user2);
    console.log('Successfully joined session:', session.sessionId);
    
    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error('Error joining session:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to join session';
    if (error.message.includes('Session not found')) {
      errorMessage = 'Game code not found. Please check the code and try again.';
    } else if (error.message.includes('Session is already full')) {
      errorMessage = 'This game is already full. Please try a different game code.';
    } else if (error.message.includes('Session is not available')) {
      errorMessage = 'This game is not available for joining.';
    } else if (error.message.includes('User cannot join their own session')) {
      errorMessage = 'You cannot join your own game.';
    } else if (error.message.includes('MongoDB connection')) {
      errorMessage = 'Database connection error. Please try again later.';
    } else {
      errorMessage = error.message || 'An unexpected error occurred';
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 

// PUT /api/sessions - Handle battle operations (submitAction, getStatus, resetStatus)
export async function PUT(request) {
  try {
    const body = await request.json();
    console.log('API received PUT request body:', body);
    
    const { sessionId, operation, playerType, action } = body;
    
    if (!sessionId || !operation) {
      return NextResponse.json(
        { success: false, error: 'sessionId and operation are required' },
        { status: 400 }
      );
    }

    switch (operation) {
      case 'submitAction':
        if (!playerType || !action) {
          return NextResponse.json(
            { success: false, error: 'playerType and action are required for submitAction' },
            { status: 400 }
          );
        }
        
        // Map playerType to userWalletAddress based on session
        const session = await getSessionById(sessionId);
        if (!session) {
          return NextResponse.json(
            { success: false, error: 'Session not found' },
            { status: 404 }
          );
        }
        
        let userWalletAddress;
        if (playerType === 'player1') {
          userWalletAddress = session.user1.walletAddress;
        } else if (playerType === 'player2') {
          userWalletAddress = session.user2.walletAddress;
        } else {
          return NextResponse.json(
            { success: false, error: 'Invalid playerType. Must be "player1" or "player2"' },
            { status: 400 }
          );
        }
        
        if (!userWalletAddress) {
          return NextResponse.json(
            { success: false, error: 'Player not found in session' },
            { status: 404 }
          );
        }
        
        // Submit the action using the database function
        const { submitUserAction } = await import('../../../../scripts/database.js');
        const updatedSession = await submitUserAction(sessionId, userWalletAddress, action);
        
        return NextResponse.json({ 
          success: true, 
          currentStatus: {
            player1Action: updatedSession.user1Action,
            player2Action: updatedSession.user2Action,
            status: updatedSession.status,
            battlePhase: updatedSession.battlePhase
          }
        });
        
      case 'getStatus':
        const currentSession = await getSessionById(sessionId);
        if (!currentSession) {
          return NextResponse.json(
            { success: false, error: 'Session not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({ 
          success: true, 
          currentStatus: {
            player1Action: currentSession.user1Action,
            player2Action: currentSession.user2Action,
            status: currentSession.status,
            battlePhase: currentSession.battlePhase
          }
        });
        
      case 'resetStatus':
        // Reset the battle actions for the next round
        const { resetBattleActions } = await import('../../../../scripts/database.js');
        const resetSession = await resetBattleActions(sessionId);
        
        return NextResponse.json({ 
          success: true, 
          currentStatus: {
            player1Action: resetSession.user1Action,
            player2Action: resetSession.user2Action,
            status: resetSession.status,
            battlePhase: resetSession.battlePhase
          }
        });
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid operation. Must be submitAction, getStatus, or resetStatus' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in PUT request:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
} 