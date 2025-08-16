'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Zap, Shield, Fist, Footprints } from 'lucide-react';
import { BATTLE_ACTIONS, getBattleActionDescriptions } from '../utils/battleLogic.js';

export default function BattleScreen({ 
  onBack, 
  currentBattle, 
  currentWalletAddress,
  onSubmitAction,
  onResetBattle,
  loading,
  userAction,
  battlePhase,
  battleLog 
}) {
  const [showWalletWidget, setShowWalletWidget] = useState(false);

  // Helper functions for health calculations
  const getMaxHealth = (defense) => 100 + (defense * 20);
  const getHealthPercentage = (currentHealth, maxHealth) => Math.max(0, Math.min(100, (currentHealth / maxHealth) * 100));
  const getHealthColor = (percentage) => {
    if (percentage > 60) return 'from-green-400 to-green-600';
    if (percentage > 30) return 'from-yellow-400 to-orange-600';
    return 'from-red-400 to-red-600';
  };

  // Get current user's role and stats
  const getCurrentUserRole = () => {
    if (!currentBattle || !currentWalletAddress) return null;
    if (currentBattle.user1?.walletAddress === currentWalletAddress) return 'user1';
    if (currentBattle.user2?.walletAddress === currentWalletAddress) return 'user2';
    return null;
  };

  const getCurrentUserStats = () => {
    const role = getCurrentUserRole();
    if (!role || !currentBattle) return null;
    return currentBattle[role]?.attributes;
  };

  const getOpponentStats = () => {
    const role = getCurrentUserRole();
    if (!role || !currentBattle) return null;
    const opponentRole = role === 'user1' ? 'user2' : 'user1';
    return currentBattle[opponentRole]?.attributes;
  };

  const getCurrentUserHealth = () => {
    const role = getCurrentUserRole();
    if (!role || !currentBattle) return 100;
    return role === 'user1' ? currentBattle.user1Health : currentBattle.user2Health;
  };

  const getOpponentHealth = () => {
    const role = getCurrentUserRole();
    if (!role || !currentBattle) return 100;
    return role === 'user1' ? currentBattle.user2Health : currentBattle.user1Health;
  };

  const getCurrentUserImage = () => {
    const role = getCurrentUserRole();
    if (!role || !currentBattle) return null;
    return currentBattle[role]?.image;
  };

  const getOpponentImage = () => {
    const role = getCurrentUserRole();
    if (!role || !currentBattle) return null;
    const opponentRole = role === 'user1' ? 'user2' : 'user1';
    return currentBattle[opponentRole]?.image;
  };

  const handleAction = (action) => {
    if (!userAction && !loading) {
      onSubmitAction(action);
    }
  };

  const canSubmitAction = () => {
    return battlePhase === 'action-selection' && !userAction && !loading;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-indigo-900 p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white hover:text-blue-200 transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Menu</span>
        </button>

        {/* Battle Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-2xl">
            ⚔️ BATTLE ARENA ⚔️
          </h1>
          <p className="text-xl text-red-200 font-medium">
            Session: {currentBattle?.sessionId}
          </p>
        </div>

        {/* Battle Arena */}
        <div className="bg-gradient-to-br from-red-100/20 to-orange-100/20 backdrop-blur-sm rounded-3xl p-8 mb-8 border border-white/20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Your Pokemon */}
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-6 text-blue-300">Your Pokemon</h3>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                {getCurrentUserImage() ? (
                  <img
                    src={getCurrentUserImage()}
                    alt="Your Pokemon"
                    className="w-40 h-40 mx-auto mb-6 rounded-2xl border-4 border-white/30 shadow-2xl"
                  />
                ) : (
                  <div className="w-40 h-40 mx-auto mb-6 bg-white/20 rounded-2xl border-4 border-dashed border-white/30 flex items-center justify-center">
                    <span className="text-white/60">No Image</span>
                  </div>
                )}

                {/* Health Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-white mb-2">
                    <span>❤️ HP</span>
                    <span className="font-bold">
                      {getCurrentUserHealth()}/{getMaxHealth(getCurrentUserStats()?.defense || 0)}
                    </span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full bg-gradient-to-r ${getHealthColor(getHealthPercentage(getCurrentUserHealth(), getMaxHealth(getCurrentUserStats()?.defense || 0)))} transition-all duration-500`}
                      style={{
                        width: `${getHealthPercentage(getCurrentUserHealth(), getMaxHealth(getCurrentUserStats()?.defense || 0))}%`
                      }}
                    ></div>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-3 text-white">
                  <div className="flex justify-between">
                    <span>⚔️ Attack:</span>
                    <span className="font-bold">{getCurrentUserStats()?.attack || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>🛡️ Defense:</span>
                    <span className="font-bold">{getCurrentUserStats()?.defense || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>⚡ Speed:</span>
                    <span className="font-bold">{getCurrentUserStats()?.speed || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Opponent Pokemon */}
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-6 text-red-300">Opponent Pokemon</h3>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                {getOpponentImage() ? (
                  <img
                    src={getOpponentImage()}
                    alt="Opponent Pokemon"
                    className="w-40 h-40 mx-auto mb-6 rounded-2xl border-4 border-white/30 shadow-2xl"
                  />
                ) : (
                  <div className="w-40 h-40 mx-auto mb-6 bg-white/20 rounded-2xl border-4 border-dashed border-white/30 flex items-center justify-center">
                    <span className="text-white/60">No Image</span>
                  </div>
                )}

                {/* Health Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-white mb-2">
                    <span>❤️ HP</span>
                    <span className="font-bold">
                      {getOpponentHealth()}/{getMaxHealth(getOpponentStats()?.defense || 0)}
                    </span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full bg-gradient-to-r ${getHealthColor(getHealthPercentage(getOpponentHealth(), getMaxHealth(getOpponentStats()?.defense || 0)))} transition-all duration-500`}
                      style={{
                        width: `${getHealthPercentage(getOpponentHealth(), getMaxHealth(getOpponentStats()?.defense || 0))}%`
                      }}
                    ></div>
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-3 text-white">
                  <div className="flex justify-between">
                    <span>⚔️ Attack:</span>
                    <span className="font-bold">{getOpponentStats()?.attack || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>🛡️ Defense:</span>
                    <span className="font-bold">{getOpponentStats()?.defense || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>⚡ Speed:</span>
                    <span className="font-bold">{getOpponentStats()?.speed || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Battle Status */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
          <div className="text-center">
            {battlePhase === 'action-selection' && !userAction && (
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-green-300 mb-2">🎯 Choose Your Action!</h3>
                <p className="text-blue-200">Select an action below to attack or defend</p>
              </div>
            )}

            {battlePhase === 'action-selection' && userAction && (
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-blue-300 mb-2">✅ Action Submitted: {userAction}</h3>
                <p className="text-blue-200">Waiting for opponent to choose their action...</p>
              </div>
            )}

            {currentBattle?.user1Action && currentBattle?.user2Action && (
              <div className="mb-4">
                <div className="bg-orange-500/20 border border-orange-400/30 rounded-xl p-4">
                  <h3 className="text-xl font-semibold text-orange-300 mb-2">⚔️ Battle Resolving!</h3>
                  <p className="text-orange-200">Both actions submitted. Battle is being processed...</p>
                  <div className="flex justify-center mt-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400"></div>
                  </div>
                </div>
              </div>
            )}

            {battlePhase === 'completed' && (
              <div className="mb-4">
                <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-4">
                  <h3 className="text-xl font-semibold text-green-300 mb-2">🏆 Battle Complete!</h3>
                  <p className="text-green-200">The battle has ended. Check the battle log below for results.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Battle Actions */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Battle Actions</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => handleAction(BATTLE_ACTIONS.PUNCH)}
              disabled={!canSubmitAction()}
              className={`p-6 rounded-2xl font-bold text-lg transition-all duration-200 transform hover:scale-105 ${
                canSubmitAction()
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-red-500/50'
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
              title={getBattleActionDescriptions()[BATTLE_ACTIONS.PUNCH].description}
            >
              <div className="flex flex-col items-center gap-2">
                <Fist className="w-8 h-8" />
                <span>Punch</span>
              </div>
            </button>

            <button
              onClick={() => handleAction(BATTLE_ACTIONS.KICK)}
              disabled={!canSubmitAction()}
              className={`p-6 rounded-2xl font-bold text-lg transition-all duration-200 transform hover:scale-105 ${
                canSubmitAction()
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-orange-500/50'
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
              title={getBattleActionDescriptions()[BATTLE_ACTIONS.KICK].description}
            >
              <div className="flex flex-col items-center gap-2">
                <Footprints className="w-8 h-8" />
                <span>Kick</span>
              </div>
            </button>

            <button
              onClick={() => handleAction(BATTLE_ACTIONS.DODGE)}
              disabled={!canSubmitAction()}
              className={`p-6 rounded-2xl font-bold text-lg transition-all duration-200 transform hover:scale-105 ${
                canSubmitAction()
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-blue-500/50'
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
              title={getBattleActionDescriptions()[BATTLE_ACTIONS.DODGE].description}
            >
              <div className="flex flex-col items-center gap-2">
                <Zap className="w-8 h-8" />
                <span>Dodge</span>
              </div>
            </button>

            <button
              onClick={() => handleAction(BATTLE_ACTIONS.BLOCK)}
              disabled={!canSubmitAction()}
              className={`p-6 rounded-2xl font-bold text-lg transition-all duration-200 transform hover:scale-105 ${
                canSubmitAction()
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-purple-500/50'
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
              title={getBattleActionDescriptions()[BATTLE_ACTIONS.BLOCK].description}
            >
              <div className="flex flex-col items-center gap-2">
                <Shield className="w-8 h-8" />
                <span>Block</span>
              </div>
            </button>
          </div>

          {/* Action Descriptions */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/80">
            <div className="bg-white/5 rounded-lg p-3">
              <strong>Punch:</strong> Basic attack with moderate damage
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <strong>Kick:</strong> Strong attack with high damage but lower accuracy
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <strong>Dodge:</strong> Avoid incoming attacks with speed bonus
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <strong>Block:</strong> Reduce incoming damage with defense bonus
            </div>
          </div>
        </div>

        {/* Battle Log */}
        <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <h4 className="text-xl font-bold text-white mb-4 text-center">Battle Log</h4>
          <div className="bg-black/60 rounded-xl p-4 font-mono text-sm max-h-64 overflow-y-auto">
            {battleLog.length === 0 ? (
              <p className="text-gray-400 text-center">No battle activity yet...</p>
            ) : (
              battleLog.map((log, index) => (
                <div key={index} className="mb-2 text-green-400">
                  {log.startsWith('🎯 Round') ? (
                    <span className="text-yellow-400 font-bold">{log}</span>
                  ) : log.includes('wins') ? (
                    <span className="text-yellow-400 font-bold">{log}</span>
                  ) : log.includes('damage') ? (
                    <span className="text-red-400 font-semibold">{log}</span>
                  ) : log.includes('health') ? (
                    <span className="text-emerald-400 font-bold">{log}</span>
                  ) : (
                    <span>{log}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          {battlePhase === 'completed' && (
            <button
              onClick={onResetBattle}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
            >
              {loading ? 'Starting...' : '🎯 Start New Battle'}
            </button>
          )}
          
          <button
            onClick={() => setShowWalletWidget(!showWalletWidget)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
          >
            {showWalletWidget ? 'Hide Wallet' : 'Show Wallet'}
          </button>
        </div>

        {/* Wallet Widget */}
        {showWalletWidget && (
          <div className="fixed top-4 right-4 z-50">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <h4 className="text-white font-semibold mb-2">Wallet Connection</h4>
              <p className="text-blue-200 text-sm">
                {currentWalletAddress ? 
                  `Connected: ${currentWalletAddress.substring(0, 10)}...` : 
                  'Not connected'
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
