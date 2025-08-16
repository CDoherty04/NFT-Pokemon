'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    user1: { walletAddress: '', image: '', attributes: '' },
    user2: { walletAddress: '', image: '', attributes: '' },
    status: 'active'
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

  // Create a new session
  const createSession = async () => {
    if (!formData.user1.walletAddress || !formData.user2.walletAddress) {
      setMessage('Please fill in both wallet addresses');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      
      if (data.success) {
        setMessage(`✅ Session created! ID: ${data.session.sessionId}`);
        setFormData({
          user1: { walletAddress: '', image: '', attributes: '' },
          user2: { walletAddress: '', image: '', attributes: '' },
          status: 'active'
        });
        fetchSessions();
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
        setMessage(`📋 Found ${data.sessions.length} sessions`);
      } else {
        setMessage('❌ Error fetching sessions: ' + data.error);
      }
    } catch (error) {
      setMessage('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
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
      } else {
        setMessage('❌ Error deleting: ' + data.error);
      }
    } catch (error) {
      setMessage('❌ Error: ' + error.message);
    }
  };

  // Load demo data
  const loadDemo = () => {
    setFormData({
      user1: { 
        walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', 
        image: 'https://example.com/user1.jpg', 
        attributes: '{"rarity": "legendary", "level": 99}' 
      },
      user2: { 
        walletAddress: '0x8ba1f109551bD432803012645Hac136c772c3c7c', 
        image: 'https://example.com/user2.jpg', 
        attributes: '{"rarity": "epic", "level": 85}' 
      },
      status: 'active'
    });
    setMessage('📝 Demo data loaded - click Create Session to test');
  };

  // Clear form
  const clearForm = () => {
    setFormData({
      user1: { walletAddress: '', image: '', attributes: '' },
      user2: { walletAddress: '', image: '', attributes: '' },
      status: 'active'
    });
    setMessage('🧹 Form cleared');
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">🗄️ Database Test</h1>
        
        {/* Status Message */}
        {message && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded text-center">
            <span className="text-blue-800">{message}</span>
          </div>
        )}

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
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
              Fetch Sessions
            </button>
            <button
              onClick={loadDemo}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Load Demo
            </button>
            <button
              onClick={clearForm}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Clear Form
            </button>
          </div>
        </div>

        {/* Create Session Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create Session</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">User 1</h3>
              <input
                type="text"
                placeholder="Wallet Address"
                value={formData.user1.walletAddress}
                onChange={(e) => setFormData({
                  ...formData,
                  user1: { ...formData.user1, walletAddress: e.target.value }
                })}
                className="w-full p-2 border rounded mb-2"
              />
              <input
                type="url"
                placeholder="Image URL"
                value={formData.user1.image}
                onChange={(e) => setFormData({
                  ...formData,
                  user1: { ...formData.user1, image: e.target.value }
                })}
                className="w-full p-2 border rounded mb-2"
              />
              <textarea
                placeholder="Attributes (JSON format)"
                value={formData.user1.attributes}
                onChange={(e) => setFormData({
                  ...formData,
                  user1: { ...formData.user1, attributes: e.target.value }
                })}
                className="w-full p-2 border rounded"
                rows="3"
              />
            </div>
            <div>
              <h3 className="font-medium mb-2">User 2</h3>
              <input
                type="text"
                placeholder="Wallet Address"
                value={formData.user2.walletAddress}
                onChange={(e) => setFormData({
                  ...formData,
                  user2: { ...formData.user2, walletAddress: e.target.value }
                })}
                className="w-full p-2 border rounded mb-2"
              />
              <input
                type="url"
                placeholder="Image URL"
                value={formData.user2.image}
                onChange={(e) => setFormData({
                  ...formData,
                  user2: { ...formData.user2, image: e.target.value }
                })}
                className="w-full p-2 border rounded mb-2"
              />
              <textarea
                placeholder="Attributes (JSON format)"
                value={formData.user2.attributes}
                onChange={(e) => setFormData({
                  ...formData,
                  user2: { ...formData.user2, attributes: e.target.value }
                })}
                className="w-full p-2 border rounded"
                rows="3"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="p-2 border rounded"
            >
              <option value="active">Active</option>
              <option value="waiting">Waiting</option>
              <option value="completed">Completed</option>
              <option value="ended">Ended</option>
            </select>
            <button
              onClick={createSession}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </div>

        {/* Sessions List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Sessions ({sessions.length})</h2>
          {sessions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No sessions found</p>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.sessionId} className="border rounded p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {session.status}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        {session.sessionId}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={session.status}
                        onChange={(e) => updateStatus(session.sessionId, e.target.value)}
                        className="text-xs p-1 border rounded"
                      >
                        <option value="active">Active</option>
                        <option value="waiting">Waiting</option>
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
                      <h4 className="font-medium mb-2">User 1</h4>
                      <p className="text-sm"><strong>Wallet:</strong> {session.user1?.walletAddress || 'None'}</p>
                      <p className="text-sm"><strong>Image:</strong> {session.user1?.image || 'None'}</p>
                      <p className="text-sm"><strong>Attributes:</strong> {session.user1?.attributes || 'None'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <h4 className="font-medium mb-2">User 2</h4>
                      <p className="text-sm"><strong>Wallet:</strong> {session.user2?.walletAddress || 'None'}</p>
                      <p className="text-sm"><strong>Image:</strong> {session.user2?.image || 'None'}</p>
                      <p className="text-sm"><strong>Attributes:</strong> {session.user2?.attributes || 'None'}</p>
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
      </div>
    </div>
  );
}
