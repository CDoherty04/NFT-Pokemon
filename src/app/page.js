'use client';

import { useState, useEffect } from 'react';
import { RefreshCcw as RefreshCcwIcon } from 'lucide-react';

export default function Home() {
  const [sessions, setSessions] = useState([]);
  const [waitingSessions, setWaitingSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('create'); // 'create', 'join', 'sessions', 'battle'
  
  // Placeholder wallet address for the current user
  const [currentWalletAddress, setCurrentWalletAddress] = useState('0x1234567890abcdef1234567890abcdef12345678');
  
  // Current active battle session for the user
  const [currentBattle, setCurrentBattle] = useState(null);
  
  // Form data for creating a session
  const [createFormData, setCreateFormData] = useState({
    user1: { 
      walletAddress: currentWalletAddress, 
      image: '', 
      attributes: { attack: 1, defense: 1, speed: 1 } 
    }
  });

  // Form data for joining a session
  const [joinFormData, setJoinFormData] = useState({
    sessionId: '',
    user2: { 
      walletAddress: currentWalletAddress, 
      image: '', 
      attributes: { attack: 1, defense: 1, speed: 1 } 
    }
  });

  // Check if current user has an active battle
  const checkForActiveBattle = () => {
    const activeSession = sessions.find(session => 
      session.status === 'active' && 
      (session.user1?.walletAddress === currentWalletAddress || 
       session.user2?.walletAddress === currentWalletAddress)
    );
    
    if (activeSession) {
      setCurrentBattle(activeSession);
      setActiveTab('battle');
    } else {
      setCurrentBattle(null);
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
          user1: { 
            walletAddress: '', 
            image: '', 
            attributes: { attack: 1, defense: 1, speed: 1 } 
          }
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
          user2: { 
            walletAddress: '', 
            image: '', 
            attributes: { attack: 1, defense: 1, speed: 1 } 
          }
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
        // Check for active battle after fetching sessions
        checkForActiveBattle();
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

  // Copy session ID to clipboard
  const copySessionId = (sessionId) => {
    navigator.clipboard.writeText(sessionId);
    setMessage('📋 Session ID copied to clipboard!');
  };

  // Battle action functions (placeholder)
  const performAttack = () => {
    setMessage('⚔️ Attack action performed! (Placeholder)');
  };

  const performDefense = () => {
    setMessage('🛡️ Defense action performed! (Placeholder)');
  };

  const performSpecial = () => {
    setMessage('✨ Special action performed! (Placeholder)');
  };

  const fleeBattle = () => {
    setMessage('🏃‍♂️ Flee action performed! (Placeholder)');
  };

  useEffect(() => {
    fetchWaitingSessions();
  }, []);

  // Check for active battle whenever sessions change
  useEffect(() => {
    checkForActiveBattle();
  }, [sessions, currentWalletAddress]);

  // Update form data when wallet address changes
  useEffect(() => {
    setCreateFormData(prev => ({
      ...prev,
      user1: { ...prev.user1, walletAddress: currentWalletAddress }
    }));
    setJoinFormData(prev => ({
      ...prev,
      user2: { ...prev.user2, walletAddress: currentWalletAddress }
    }));
  }, [currentWalletAddress]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Wallet Address Display */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Current Wallet</h3>
              <p className="text-sm text-gray-600 font-mono bg-gray-100 p-2 rounded">
                {currentWalletAddress}
              </p>
            </div>
            <button
              onClick={() => setCurrentWalletAddress('0x' + Math.random().toString(16).substr(2, 40))}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Change Wallet
            </button>
          </div>
        </div>

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
              Start Battle
            </button>
            <button
              onClick={() => setActiveTab('join')}
              className={`px-4 py-2 rounded font-medium ${
                activeTab === 'join' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Join Battle
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-4 py-2 rounded font-medium ${
                activeTab === 'sessions' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              View Active Battles ({sessions.length})
            </button>
            <button
              onClick={() => setActiveTab('waiting')}
              className={`px-4 py-2 rounded font-medium ${
                activeTab === 'waiting' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              View Pending Battles ({waitingSessions.length})
            </button>
            {currentBattle && (
              <button
                onClick={() => setActiveTab('battle')}
                className={`px-4 py-2 rounded font-medium ${
                  activeTab === 'battle' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                🚨 Active Battle
              </button>
            )}
          </div>

          {/* Refresh Button */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchSessions}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              <RefreshCcwIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Battle Screen Tab */}
        {activeTab === 'battle' && currentBattle && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-red-600 mb-2">🚨 BATTLE IN PROGRESS 🚨</h2>
              <p className="text-gray-600">Session ID: {currentBattle.sessionId}</p>
            </div>

            {/* Battle Arena */}
            <div className="bg-gradient-to-br from-red-100 to-orange-100 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Player 1 Pokemon */}
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-4 text-blue-600">
                    {currentBattle.user1?.walletAddress === currentWalletAddress ? 'Your Pokemon' : 'Opponent Pokemon'}
                  </h3>
                  <div className="bg-white rounded-lg p-4 shadow-lg">
                    {currentBattle.user1?.image ? (
                      <img 
                        src={currentBattle.user1.image} 
                        alt="Pokemon" 
                        className="w-32 h-32 mx-auto mb-4 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-32 h-32 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500">No Image</span>
                      </div>
                    )}
                    <p className="font-mono text-sm text-gray-600 mb-2">
                      {currentBattle.user1?.walletAddress || 'Unknown'}
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>⚔️ Attack:</span>
                        <span className="font-bold">{currentBattle.user1?.attributes?.attack || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🛡️ Defense:</span>
                        <span className="font-bold">{currentBattle.user1?.attributes?.defense || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>⚡ Speed:</span>
                        <span className="font-bold">{currentBattle.user1?.attributes?.speed || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Player 2 Pokemon */}
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-4 text-red-600">
                    {currentBattle.user2?.walletAddress === currentWalletAddress ? 'Your Pokemon' : 'Opponent Pokemon'}
                  </h3>
                  <div className="bg-white rounded-lg p-4 shadow-lg">
                    {currentBattle.user2?.image ? (
                      <img 
                        src={currentBattle.user2.image} 
                        alt="Pokemon" 
                        className="w-32 h-32 mx-auto mb-4 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-32 h-32 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500">No Image</span>
                      </div>
                    )}
                    <p className="font-mono text-sm text-gray-600 mb-2">
                      {currentBattle.user2?.walletAddress || 'Unknown'}
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>⚔️ Attack:</span>
                        <span className="font-bold">{currentBattle.user2?.attributes?.attack || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>🛡️ Defense:</span>
                        <span className="font-bold">{currentBattle.user2?.attributes?.defense || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>⚡ Speed:</span>
                        <span className="font-bold">{currentBattle.user2?.attributes?.speed || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Battle Actions */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-center">Battle Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={performAttack}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold text-lg"
                >
                  ⚔️ Attack
                </button>
                <button
                  onClick={performDefense}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-lg"
                >
                  🛡️ Defense
                </button>
                <button
                  onClick={performSpecial}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold text-lg"
                >
                  ✨ Special
                </button>
                <button
                  onClick={fleeBattle}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-bold text-lg"
                >
                  🏃‍♂️ Flee
                </button>
              </div>
            </div>

            {/* Battle Log */}
            <div className="mt-6 bg-black text-green-400 rounded-lg p-4 font-mono text-sm">
              <h4 className="text-white mb-2">Battle Log:</h4>
              <p>Battle started between {currentBattle.user1?.walletAddress?.substring(0, 10)}... and {currentBattle.user2?.walletAddress?.substring(0, 10)}...</p>
              <p>Both Pokemon are ready for battle!</p>
              <p>Select an action to continue...</p>
            </div>
          </div>
        )}

        {/* Create Session Tab */}
        {activeTab === 'create' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Start Battle</h2>
            <p className="text-gray-600 mb-4">
              Create a new battle with your Pokemon. Share the session ID with another player to join.
            </p>
            
            <div className="mb-4">
              <h3 className="font-medium mb-2">Your Pokemon</h3>
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
              
              <div className="mb-4">
                <h4 className="font-medium mb-3">Attribute Points (3 total points to allocate)</h4>
                
                {/* Progress bar showing allocated points */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Allocated: {createFormData.user1.attributes.attack + createFormData.user1.attributes.defense + createFormData.user1.attributes.speed}/3</span>
                    <span>Remaining: {3 - createFormData.user1.attributes.attack - createFormData.user1.attributes.defense - createFormData.user1.attributes.speed}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${((createFormData.user1.attributes.attack + createFormData.user1.attributes.defense + createFormData.user1.attributes.speed) / 3) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="flex justify-between items-center">
                      <span>Attack: {createFormData.user1.attributes.attack}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      value={createFormData.user1.attributes.attack}
                      onChange={(e) => {
                        const newAttack = parseInt(e.target.value);
                        const currentTotal = createFormData.user1.attributes.defense + createFormData.user1.attributes.speed;
                        if (newAttack + currentTotal <= 3) {
                          setCreateFormData({
                            ...createFormData,
                            user1: {
                              ...createFormData.user1,
                              attributes: {
                                ...createFormData.user1.attributes,
                                attack: newAttack
                              }
                            }
                          });
                        }
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="flex justify-between items-center">
                      <span>Defense: {createFormData.user1.attributes.defense}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      value={createFormData.user1.attributes.defense}
                      onChange={(e) => {
                        const newDefense = parseInt(e.target.value);
                        const currentTotal = createFormData.user1.attributes.attack + createFormData.user1.attributes.speed;
                        if (newDefense + currentTotal <= 3) {
                          setCreateFormData({
                            ...createFormData,
                            user1: {
                              ...createFormData.user1,
                              attributes: {
                                ...createFormData.user1.attributes,
                                defense: newDefense
                              }
                            }
                          });
                        }
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="flex justify-between items-center">
                      <span>Speed: {createFormData.user1.attributes.speed}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      value={createFormData.user1.attributes.speed}
                      onChange={(e) => {
                        const newSpeed = parseInt(e.target.value);
                        const currentTotal = createFormData.user1.attributes.attack + createFormData.user1.attributes.defense;
                        if (newSpeed + currentTotal <= 3) {
                          setCreateFormData({
                            ...createFormData,
                            user1: {
                              ...createFormData.user1,
                              attributes: {
                                ...createFormData.user1.attributes,
                                speed: newSpeed
                              }
                            }
                          });
                        }
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={createSession}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Battle'}
              </button>
            </div>
          </div>
        )}

        {/* Join Session Tab */}
        {activeTab === 'join' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Join Battle</h2>
            <p className="text-gray-600 mb-4">
              Join a battle using the ID provided by another player.
            </p>
            
            <div className="mb-4">
              <h3 className="font-medium mb-2">Session Information</h3>
              <input
                type="text"
                placeholder="Battle ID"
                value={joinFormData.sessionId}
                onChange={(e) => setJoinFormData({
                  ...joinFormData,
                  sessionId: e.target.value
                })}
                className="w-full p-2 border rounded mb-4"
              />
              
              <h3 className="font-medium mb-2">Your Pokemon</h3>
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
              
              <div className="mb-4">
                <h4 className="font-medium mb-3">Attribute Points (3 total points to allocate)</h4>
                
                {/* Progress bar showing allocated points */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Allocated: {joinFormData.user2.attributes.attack + joinFormData.user2.attributes.defense + joinFormData.user2.attributes.speed}/3</span>
                    <span>Remaining: {3 - joinFormData.user2.attributes.attack - joinFormData.user2.attributes.defense - joinFormData.user2.attributes.speed}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${((joinFormData.user2.attributes.attack + joinFormData.user2.attributes.defense + joinFormData.user2.attributes.speed) / 3) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="flex justify-between items-center">
                      <span>Attack: {joinFormData.user2.attributes.attack}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      value={joinFormData.user2.attributes.attack}
                      onChange={(e) => {
                        const newAttack = parseInt(e.target.value);
                        const currentTotal = joinFormData.user2.attributes.defense + joinFormData.user2.attributes.speed;
                        if (newAttack + currentTotal <= 3) {
                          setJoinFormData({
                            ...joinFormData,
                            user2: {
                              ...joinFormData.user2,
                              attributes: {
                                ...joinFormData.user2.attributes,
                                attack: newAttack
                              }
                            }
                          });
                        }
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="flex justify-between items-center">
                      <span>Defense: {joinFormData.user2.attributes.defense}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      value={joinFormData.user2.attributes.defense}
                      onChange={(e) => {
                        const newDefense = parseInt(e.target.value);
                        const currentTotal = joinFormData.user2.attributes.attack + joinFormData.user2.attributes.speed;
                        if (newDefense + currentTotal <= 3) {
                          setJoinFormData({
                            ...joinFormData,
                            user2: {
                              ...joinFormData.user2,
                              attributes: {
                                ...joinFormData.user2.attributes,
                                defense: newDefense
                              }
                            }
                          });
                        }
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="flex justify-between items-center">
                      <span>Speed: {joinFormData.user2.attributes.speed}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      value={joinFormData.user2.attributes.speed}
                      onChange={(e) => {
                        const newSpeed = parseInt(e.target.value);
                        const currentTotal = joinFormData.user2.attributes.attack + joinFormData.user2.attributes.defense;
                        if (newSpeed + currentTotal <= 3) {
                          setJoinFormData({
                            ...joinFormData,
                            user2: {
                              ...joinFormData.user2,
                              attributes: {
                                ...joinFormData.user2.attributes,
                                speed: newSpeed
                              }
                            }
                          });
                        }
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={joinSession}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Joining...' : 'Join Battle'}
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
                      <p className="text-sm"><strong>Attributes:</strong> {session.user1?.attributes ? (
                        <span className="inline-flex gap-2">
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">⚔️ ATK: {session.user1.attributes.attack || 0}</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">🛡️ DEF: {session.user1.attributes.defense || 0}</span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">⚡ SPD: {session.user1.attributes.speed || 0}</span>
                        </span>
                      ) : 'None'}</p>
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
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded">
                        <h4 className="font-medium mb-2">User 1 (Host)</h4>
                        <p className="text-sm"><strong>Wallet:</strong> {session.user1?.walletAddress || 'None'}</p>
                        <p className="text-sm"><strong>Image:</strong> {session.user1?.image || 'None'}</p>
                        <p className="text-sm"><strong>Attributes:</strong> {session.user1?.attributes ? (
                          <span className="inline-flex gap-2">
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">⚔️ ATK: {session.user1.attributes.attack || 0}</span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">🛡️ DEF: {session.user1.attributes.defense || 0}</span>
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">⚡ SPD: {session.user1.attributes.speed || 0}</span>
                          </span>
                        ) : 'None'}</p>
                      </div>
                                              <div className="bg-gray-50 p-3 rounded">
                          <h4 className="font-medium mb-2">User 2 {session.user2 ? '(Joined)' : '(Waiting)'}</h4>
                          {session.user2 ? (
                            <>
                              <p className="text-sm"><strong>Wallet:</strong> {session.user2.walletAddress}</p>
                              <p className="text-sm"><strong>Image:</strong> {session.user2.image}</p>
                              <p className="text-sm"><strong>Attributes:</strong> {session.user2.attributes ? (
                                <span className="inline-flex gap-2">
                                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">⚔️ ATK: {session.user2.attributes.attack || 0}</span>
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">🛡️ DEF: {session.user2.attributes.defense || 0}</span>
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">⚡ SPD: {session.user2.attributes.speed || 0}</span>
                                </span>
                              ) : 'None'}</p>
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
