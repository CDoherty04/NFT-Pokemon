import { NextResponse } from 'next/server';
import { 
  createSession, 
  getSessionById, 
  getSessionsByUserId, 
  updateSessionStatus, 
  deleteSession,
  getAllSessions 
} from '../../../../scripts/database.js';

// GET /api/sessions - Get all sessions
export async function GET() {
  try {
    const sessions = await getAllSessions();
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
    
    const { user1, user2, status = 'active' } = body;
    console.log('Extracted data:', { user1, user2, status });
    
    if (!user1 || !user2) {
      return NextResponse.json(
        { success: false, error: 'user1 and user2 are required' },
        { status: 400 }
      );
    }

    const session = await createSession(user1, user2, status);
    return NextResponse.json({ success: true, session }, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create session' },
      { status: 500 }
    );
  }
} 