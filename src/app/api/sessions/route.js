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

    const session = await createSession(user1, status);
    return NextResponse.json({ success: true, session }, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create session' },
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

    const session = await joinSession(sessionId, user2);
    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error('Error joining session:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to join session' },
      { status: 500 }
    );
  }
} 