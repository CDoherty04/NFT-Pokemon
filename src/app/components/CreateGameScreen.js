'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Check, Palette, RefreshCw } from 'lucide-react';
import DrawingApp from './DrawingApp';

export default function CreateGameScreen({
  onCreateGame,
  sessionId,
  isWaitingForPlayer,
  onContinueToBattle,
  canContinue,
  onCheckSessionStatus,
  loading
}) {
  const [showDrawing, setShowDrawing] = useState(false);
  const [avatarImage, setAvatarImage] = useState('');
  const [copied, setCopied] = useState(false);
  const [attributes, setAttributes] = useState({ attack: 0, defense: 0, speed: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  // Debug logging for props
  useEffect(() => {
    console.log('CreateGameScreen props:', {
      sessionId,
      isWaitingForPlayer,
      canContinue
    });
  }, [sessionId, isWaitingForPlayer, canContinue]);

  // Auto-refresh session status every 5 seconds when waiting for player
  useEffect(() => {
    let interval;
    if (isWaitingForPlayer && sessionId) {
      // Check immediately when component mounts
      checkSessionStatus();

      // Then set up the interval
      interval = setInterval(() => {
        checkSessionStatus();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWaitingForPlayer, sessionId]);

  const checkSessionStatus = async () => {
    if (!sessionId || isRefreshing) return;

    console.log('Checking session status for:', sessionId);
    setIsRefreshing(true);
    try {
      if (onCheckSessionStatus) {
        await onCheckSessionStatus(sessionId);
        console.log('Session status check completed');
      }
      setLastChecked(new Date());
    } catch (error) {
      console.error('Error checking session status:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveDrawing = (imageDataUrl) => {
    setAvatarImage(imageDataUrl);
    setShowDrawing(false);
  };

  const handleSaveProcessedImage = (imageDataUrl) => {
    setAvatarImage(imageDataUrl);
  };

  const handleContinue = () => {
    if (avatarImage && canContinue) {
      onContinueToBattle();
    }
  };

  const handleCreateGame = () => {
    console.log('CreateGameScreen handleCreateGame called with:', {
      avatarImage: !!avatarImage,
      attributes
    });

    if (avatarImage) {
      console.log('Calling onCreateGame...');
      onCreateGame(avatarImage, attributes);
    } else {
      console.log('No avatar image, cannot create game');
    }
  };

  const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const hasValidAttributes = () => {
    return (attributes.attack + attributes.defense + attributes.speed) === 3;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4 relative">
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center">
            <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-2xl font-bold text-white mb-2">Creating Battle Session</h3>
            <p className="text-blue-200">Please wait while we set up your game...</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Create New Battle
          </h1>
          <p className="text-xl text-blue-200">
            Draw your Kartikmon and share the code with a friend!
          </p>
        </div>

        {/* Avatar Creation Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Your Kartikmon</h2>

          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Avatar Display */}
            <div className="flex-1 text-center">
              {/* Avatar Creation Buttons */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setShowDrawing(true)}
                  disabled={loading}
                  className={`flex-1 px-4 py-4 font-bold text-lg rounded-xl transition-all duration-200 ${loading
                      ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 transform hover:scale-105'
                    }`}
                >
                  <div className="flex items-center justify-center gap-3">
                    <Palette className="w-6 h-6" />
                    <span>{avatarImage ? 'Redraw' : 'Draw'}</span>
                  </div>
                </button>
              </div>

              <div className="relative w-full">
                {avatarImage ? (
                  <img
                    src={avatarImage}
                    alt="Your Kartikmon"
                    className="w-full aspect-square rounded-2xl border-4 border-white/30 shadow-2xl"
                  />
                ) : (
                  <div className="w-full aspect-square bg-white/20 rounded-2xl border-4 border-dashed border-white/30 flex items-center justify-center">
                    <div className="text-center text-white/60">
                      <Palette className="w-20 h-20 mx-auto mb-2" />
                      <p className="text-lg">No Kartikmon yet</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Avatar Creation Controls */}
            <div className="flex-1 space-y-6">

              {/* Attributes Section */}
              <div className="bg-white/10 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">Attributes</h3>
                  <button
                    onClick={() => setAttributes({ attack: 0, defense: 0, speed: 0 })}
                    disabled={loading}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors border ${loading
                        ? 'bg-gray-500/20 text-gray-300 border-gray-400/30 cursor-not-allowed'
                        : 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border-red-400/30'
                      }`}
                  >
                    Clear All
                  </button>
                </div>
                <div className="text-center text-blue-200 mb-6">
                  <span className="text-2xl font-bold">{3 - attributes.attack - attributes.defense - attributes.speed}</span> points remaining
                </div>

                <div className="space-y-6">
                  {/* Attack Stat */}
                  <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-xl p-4 border border-red-400/30">
                    <div className="flex justify-between text-white mb-3">
                      <span className="text-lg font-semibold">⚔️ Attack: {attributes.attack}</span>
                    </div>
                    <div className="flex justify-center gap-3">
                      {[1, 2, 3].map((level) => (
                        <button
                          key={level}
                          onClick={() => {
                            const currentTotal = attributes.defense + attributes.speed;
                            if (level + currentTotal <= 3) {
                              setAttributes(prev => ({ ...prev, attack: level }));
                            }
                          }}
                          disabled={loading}
                          className={`w-8 h-8 rounded-full transition-all duration-200 border-2 ${level <= attributes.attack
                            ? level === 1 ? 'bg-red-400 border-red-500' : level === 2 ? 'bg-red-500 border-red-600' : 'bg-red-600 border-red-700'
                            : 'bg-white/20 border-white/40 hover:bg-white/30'
                            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Defense Stat */}
                  <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-xl p-4 border border-blue-400/30">
                    <div className="flex justify-between text-white mb-3">
                      <span className="text-lg font-semibold">🛡️ Defense: {attributes.defense}</span>
                    </div>
                    <div className="flex justify-center gap-3">
                      {[1, 2, 3].map((level) => (
                        <button
                          key={level}
                          onClick={() => {
                            const currentTotal = attributes.attack + attributes.speed;
                            if (level + currentTotal <= 3) {
                              setAttributes(prev => ({ ...prev, defense: level }));
                            }
                          }}
                          disabled={loading}
                          className={`w-8 h-8 rounded-full transition-all duration-200 border-2 ${level <= attributes.defense
                            ? level === 1 ? 'bg-blue-400 border-blue-500' : level === 2 ? 'bg-blue-500 border-blue-600' : 'bg-blue-600 border-blue-700'
                            : 'bg-white/20 border-white/40 hover:bg-white/30'
                            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Speed Stat */}
                  <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-xl p-4 border border-green-400/30">
                    <div className="flex justify-between text-white mb-3">
                      <span className="text-lg font-semibold">⚡ Speed: {attributes.speed}</span>
                    </div>
                    <div className="flex justify-center gap-3">
                      {[1, 2, 3].map((level) => (
                        <button
                          key={level}
                          onClick={() => {
                            const currentTotal = attributes.attack + attributes.defense;
                            if (level + currentTotal <= 3) {
                              setAttributes(prev => ({ ...prev, speed: level }));
                            }
                          }}
                          disabled={loading}
                          className={`w-8 h-8 rounded-full transition-all duration-200 border-2 ${level <= attributes.speed
                            ? level === 1 ? 'bg-green-400 border-green-500' : level === 2 ? 'bg-green-500 border-green-600' : 'bg-green-600 border-green-700'
                            : 'bg-white/20 border-white/40 hover:bg-white/30'
                            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                  <div className="w-full bg-white/20 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${((attributes.attack + attributes.defense + attributes.speed) / 3) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status and Continue Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          {isWaitingForPlayer ? (
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
                <h3 className="text-xl font-semibold text-yellow-300">Waiting for opponent to join...</h3>
              </div>

              <div className="mb-6">
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-2xl p-6 mb-4">
                  <p className="text-blue-200 text-sm mb-2">Share this code with your friend</p>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <p className="text-4xl font-mono font-bold text-white tracking-wider">{sessionId}</p>
                  </div>
                </div>
              </div>

              {canContinue && (
                <button
                  onClick={handleContinue}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-xl rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
                >
                  Continue to Battle!
                </button>
              )}
            </div>
          ) : (
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-4">Ready to create battle?</h3>
              <p className="text-blue-200 mb-6">
                Draw your Kartikmon and set your attributes, then create the battle session!
              </p>
              <button
                onClick={handleCreateGame}
                disabled={!avatarImage || !hasValidAttributes() || loading}
                className={`px-8 py-4 font-bold text-xl rounded-xl transition-all duration-200 ${!avatarImage || !hasValidAttributes()
                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  : loading
                    ? 'bg-blue-500 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transform hover:scale-105'
                  }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Creating Session...</span>
                  </div>
                ) : !avatarImage ? (
                  'Draw Your Kartikmon'
                ) : !hasValidAttributes() ? (
                  'Set Attributes'
                ) : (
                  'Create Battle Session'
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Drawing App Overlay */}
      <DrawingApp
        isOpen={showDrawing}
        onClose={() => setShowDrawing(false)}
        onSave={handleSaveDrawing}
        title="Draw Your Kartikmon"
      />
    </div>
  );
}
