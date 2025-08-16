import { NextResponse } from 'next/server';
import { 
  getSessionById, 
  updateSessionStatus, 
  deleteSession,
  submitUserAction,
  checkAndProcessBattle,
  resetBattleActions
} from '../../../../../scripts/database.js';

// GET /api/sessions/[id] - Get a specific session
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const session = await getSessionById(id);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

// PUT /api/sessions/[id] - Update session status
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { status } = await request.json();
    
    if (!status) {
      return NextResponse.json(
        { success: false, error: 'status is required' },
        { status: 400 }
      );
    }

    const updated = await updateSessionStatus(id, status);
    
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Session not found or update failed' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Session updated successfully' });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

// DELETE /api/sessions/[id] - Delete a session
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const deleted = await deleteSession(id);
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Session not found or deletion failed' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete session' },
      { status: 500 }
    );
  }
} 

// PATCH /api/sessions/[id] - Submit user action or reset battle
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    
    if (body.action) {
      // Submit user action
      const { action, userWalletAddress } = body;
      
      if (!action || !userWalletAddress) {
        return NextResponse.json(
          { success: false, error: 'action and userWalletAddress are required' },
          { status: 400 }
        );
      }
      
      const session = await submitUserAction(id, userWalletAddress, action);
      
      // Check if this was a battle processing response
      const battleProcessed = session.user1Action === '' && session.user2Action === '';
      const message = battleProcessed 
        ? 'Battle processed! New round starting.' 
        : 'Action submitted successfully';
      
      return NextResponse.json({ 
        success: true, 
        session: session,
        battleProcessed: battleProcessed,
        message: message
      });
    } else if (body.resetBattle) {
      // Reset battle actions for next round
      const session = await resetBattleActions(id);
      
      return NextResponse.json({ 
        success: true, 
        session: session,
        message: 'Battle actions reset successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in PATCH request:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
} 