'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [sessions, setSessions] = useState([]);
  const [waitingSessions, setWaitingSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('create'); // 'create', 'join', 'sessions'
  
  // Form data for creating a session
  const [createFormData, setCreateFormData] = useState({
    user1: { walletAddress: '', image: '', attributes: '' }
  });

  // Form data for joining a session
  const [joinFormData, setJoinFormData] = useState({
    sessionId: '',
    user2: { walletAddress: '', image: '', attributes: '' }
  });

  // Test database connection
  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sessions');
      if (response.ok) {
        setMessage('✅ Database connection successful!');
      } else {
        setMessage('❌ Database connection failed');
      }
    } catch (error) {
      setMessage('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Create a new session with only user1
  const createSession = async () => {
    if (!createFormData.user1.walletAddress) {
      setMessage('Please fill in user1 wallet address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user1: createFormData.user1 })
      });
      const data = await response.json();
      
      if (data.success) {
        setMessage(`✅ Session created! ID: ${data.session.sessionId} - Share this ID with user2 to join`);
        setCreateFormData({
          user1: { walletAddress: '', image: '', attributes: '' }
        });
        fetchSessions();
        fetchWaitingSessions();
        setActiveTab('sessions');
      } else {
        setMessage('❌ Error: ' + data.error);
      }
    } catch (error) {
      setMessage('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Join an existing session with user2
  const joinSession = async () => {
    if (!joinFormData.sessionId || !joinFormData.user2.walletAddress) {
      setMessage('Please fill in both session ID and user2 wallet address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(joinFormData)
      });
      const data = await response.json();
      
      if (data.success) {
        setMessage(`✅ Successfully joined session! Session is now active`);
        setJoinFormData({
          sessionId: '',
          user2: { walletAddress: '', image: '', attributes: '' }
        });
        fetchSessions();
        fetchWaitingSessions();
        setActiveTab('sessions');
      } else {
        setMessage('❌ Error: ' + data.error);
      }
    } catch (error) {
      setMessage('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all sessions
  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sessions');
      const data = await response.json();
      if (data.success) {
        console.log('Fetched sessions data:', data.sessions);
        setSessions(data.sessions);
        setMessage(`📋 Found ${data.sessions.length} total sessions`);
      } else {
        setMessage('❌ Error fetching sessions: ' + data.error);
      }
    } catch (error) {
      setMessage('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch waiting sessions
  const fetchWaitingSessions = async () => {
    try {
      const response = await fetch('/api/sessions?type=waiting');
      const data = await response.json();
      if (data.success) {
        setWaitingSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error fetching waiting sessions:', error);
    }
  };

  // Update session status
  const updateStatus = async (sessionId, newStatus) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      
      if (data.success) {
        setMessage(`✅ Status updated to: ${newStatus}`);
        fetchSessions();
        fetchWaitingSessions();
      } else {
        setMessage('❌ Error updating status: ' + data.error);
      }
    } catch (error) {
      setMessage('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete session
  const deleteSession = async (sessionId) => {
    if (!confirm('Delete this session?')) return;
    
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        setMessage('✅ Session deleted');
        fetchSessions();
        fetchWaitingSessions();
      } else {
        setMessage('❌ Error deleting: ' + data.error);
      }
    } catch (error) {
      setMessage('❌ Error: ' + error.message);
    }
  };

  // Load demo data for creating session
  const loadCreateDemo = () => {
    setCreateFormData({
      user1: { 
        walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', 
        image: 'https://example.com/user1.jpg', 
        attributes: '{"rarity": "legendary", "level": 99}' 
      }
    });
    setMessage('📝 Demo data loaded for creating session - click Create Session to test');
  };

  // Load demo data for joining session
  const loadJoinDemo = () => {
    setJoinFormData({
      sessionId: 'session_1234567890_abc123def',
      user2: { 
        walletAddress: '0x8ba1f109551bD432803012645Hac136c772c3c7c', 
        image: 'https://example.com/user2.jpg', 
        attributes: '{"rarity": "epic", "level": 85}' 
      }
    });
    setMessage('📝 Demo data loaded for joining session - click Join Session to test');
  };

  // Clear create form
  const clearCreateForm = () => {
    setCreateFormData({
      user1: { walletAddress: '', image: '', attributes: '' }
    });
    setMessage('🧹 Create form cleared');
  };

  // Clear join form
  const clearJoinForm = () => {
    setJoinFormData({
      sessionId: '',
      user2: { walletAddress: '', image: '', attributes: '' }
    });
    setMessage('🧹 Join form cleared');
  };

  // Copy session ID to clipboard
  const copySessionId = (sessionId) => {
    navigator.clipboard.writeText(sessionId);
    setMessage('📋 Session ID copied to clipboard!');
  };

  useEffect(() => {
    testConnection();
    fetchWaitingSessions();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">🎮 NFT Pokemon Session Manager</h1>
        
        {/* Status Message */}
        {message && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded text-center">
            <span className="text-blue-800">{message}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 rounded font-medium ${
                activeTab === 'create' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Create Session
            </button>
            <button
              onClick={() => setActiveTab('join')}
              className={`px-4 py-2 rounded font-medium ${
                activeTab === 'join' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Join Session
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-4 py-2 rounded font-medium ${
                activeTab === 'sessions' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              View Sessions ({sessions.length})
            </button>
            <button
              onClick={() => setActiveTab('waiting')}
              className={`px-4 py-2 rounded font-medium ${
                activeTab === 'waiting' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Waiting Sessions ({waitingSessions.length})
            </button>
          </div>

          {/* Test Controls */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={testConnection}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Test Connection
            </button>
            <button
              onClick={fetchSessions}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Refresh Sessions
            </button>
          </div>
        </div>

        {/* Create Session Tab */}
        {activeTab === 'create' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Create New Session</h2>
            <p className="text-gray-600 mb-4">
              Create a new session with your Pokemon. Share the session ID with another player to join.
            </p>
            
            <div className="mb-4">
              <h3 className="font-medium mb-2">Your Pokemon (User 1)</h3>
              <input
                type="text"
                placeholder="Wallet Address"
                value={createFormData.user1.walletAddress}
                onChange={(e) => setCreateFormData({
                  ...createFormData,
                  user1: { ...createFormData.user1, walletAddress: e.target.value }
                })}
                className="w-full p-2 border rounded mb-2"
              />
              <input
                type="url"
                placeholder="Image URL"
                value={createFormData.user1.image}
                onChange={(e) => setCreateFormData({
                  ...createFormData,
                  user1: { ...createFormData.user1, image: e.target.value }
                })}
                className="w-full p-2 border rounded mb-2"
              />
              <textarea
                placeholder="Attributes (JSON format)"
                value={createFormData.user1.attributes}
                onChange={(e) => setCreateFormData({
                  ...createFormData,
                  user1: { ...createFormData.user1, attributes: e.target.value }
                })}
                className="w-full p-2 border rounded"
                rows="3"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={loadCreateDemo}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Load Demo
              </button>
              <button
                onClick={clearCreateForm}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Clear Form
              </button>
              <button
                onClick={createSession}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Session'}
              </button>
            </div>
          </div>
        )}

        {/* Join Session Tab */}
        {activeTab === 'join' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Join Existing Session</h2>
            <p className="text-gray-600 mb-4">
              Join a session using the session ID provided by another player.
            </p>
            
            <div className="mb-4">
              <h3 className="font-medium mb-2">Session Information</h3>
              <input
                type="text"
                placeholder="Session ID"
                value={joinFormData.sessionId}
                onChange={(e) => setJoinFormData({
                  ...joinFormData,
                  sessionId: e.target.value
                })}
                className="w-full p-2 border rounded mb-4"
              />
              
              <h3 className="font-medium mb-2">Your Pokemon (User 2)</h3>
              <input
                type="text"
                placeholder="Wallet Address"
                value={joinFormData.user2.walletAddress}
                onChange={(e) => setJoinFormData({
                  ...joinFormData,
                  user2: { ...joinFormData.user2, walletAddress: e.target.value }
                })}
                className="w-full p-2 border rounded mb-2"
              />
              <input
                type="url"
                placeholder="Image URL"
                value={joinFormData.user2.image}
                onChange={(e) => setJoinFormData({
                  ...joinFormData,
                  user2: { ...joinFormData.user2, image: e.target.value }
                })}
                className="w-full p-2 border rounded mb-2"
              />
              <textarea
                placeholder="Attributes (JSON format)"
                value={joinFormData.user2.attributes}
                onChange={(e) => setJoinFormData({
                  ...joinFormData,
                  user2: { ...joinFormData.user2, attributes: e.target.value }
                })}
                className="w-full p-2 border rounded"
                rows="3"
              />
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={loadJoinDemo}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Load Demo
              </button>
              <button
                onClick={clearJoinForm}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Clear Form
              </button>
              <button
                onClick={joinSession}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Joining...' : 'Join Session'}
              </button>
            </div>
          </div>
        )}

        {/* Waiting Sessions Tab */}
        {activeTab === 'waiting' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Sessions Waiting for Players</h2>
            <p className="text-gray-600 mb-4">
              These sessions are waiting for a second player to join. Copy the session ID to join one.
            </p>
            
            {waitingSessions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No sessions waiting for players</p>
            ) : (
              <div className="space-y-4">
                {waitingSessions.map((session) => (
                  <div key={session.sessionId} className="border rounded p-4 bg-yellow-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                          Waiting for Player
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          {session.sessionId}
                        </span>
                      </div>
                      <button
                        onClick={() => copySessionId(session.sessionId)}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Copy ID
                      </button>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <h4 className="font-medium mb-2">Host Player</h4>
                      <p className="text-sm"><strong>Wallet:</strong> {session.user1?.walletAddress || 'None'}</p>
                      <p className="text-sm"><strong>Image:</strong> {session.user1?.image || 'None'}</p>
                      <p className="text-sm"><strong>Attributes:</strong> {session.user1?.attributes || 'None'}</p>
                    </div>
                    <div className="mt-3 text-xs text-gray-500">
                      <p>Created: {new Date(session.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* All Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">All Sessions ({sessions.length})</h2>
            {sessions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No sessions found</p>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.sessionId} className="border rounded p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                          session.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : session.status === 'waiting'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {session.status}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          {session.sessionId}
                        </span>
                        {session.status === 'waiting' && (
                          <button
                            onClick={() => copySessionId(session.sessionId)}
                            className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Copy ID
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <select
                          value={session.status}
                          onChange={(e) => updateStatus(session.sessionId, e.target.value)}
                          className="text-xs p-1 border rounded"
                        >
                          <option value="waiting">Waiting</option>
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                          <option value="ended">Ended</option>
                        </select>
                        <button
                          onClick={() => deleteSession(session.sessionId)}
                          className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded">
                        <h4 className="font-medium mb-2">User 1 (Host)</h4>
                        <p className="text-sm"><strong>Wallet:</strong> {session.user1?.walletAddress || 'None'}</p>
                        <p className="text-sm"><strong>Image:</strong> {session.user1?.image || 'None'}</p>
                        <p className="text-sm"><strong>Attributes:</strong> {session.user1?.attributes || 'None'}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <h4 className="font-medium mb-2">User 2 {session.user2 ? '(Joined)' : '(Waiting)'}</h4>
                        {session.user2 ? (
                          <>
                            <p className="text-sm"><strong>Wallet:</strong> {session.user2.walletAddress}</p>
                            <p className="text-sm"><strong>Image:</strong> {session.user2.image}</p>
                            <p className="text-sm"><strong>Attributes:</strong> {session.user2.attributes}</p>
                          </>
                        ) : (
                          <p className="text-sm text-gray-500">No player joined yet</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-gray-500">
                      <p>Created: {new Date(session.createdAt).toLocaleString()}</p>
                      <p>Updated: {new Date(session.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
