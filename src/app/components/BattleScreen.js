'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Zap, Shield, Hand, Footprints, Flame, Heart, Skull } from 'lucide-react';

// Define BATTLE_ACTIONS locally to avoid import issues
const BATTLE_ACTIONS = {
  PUNCH: 'punch',
  KICK: 'kick',
  DODGE: 'dodge',
  BLOCK: 'block'
};

// Define action descriptions locally
const getBattleActionDescriptions = () => ({
  [BATTLE_ACTIONS.PUNCH]: {
    name: 'Punch',
    description: 'Attack based on attack stat. Speed bonus vs dodges!',
    icon: '👊',
    color: 'bg-red-500 hover:bg-red-600'
  },
  [BATTLE_ACTIONS.KICK]: {
    name: 'Kick',
    description: 'Attack based on attack stat. Speed bonus vs blocks!',
    icon: '🦵',
    color: 'bg-orange-500 hover:bg-orange-600'
  },
  [BATTLE_ACTIONS.DODGE]: {
    name: 'Dodge',
    description: 'Avoid attacks. Speed 3+ gains health from dodging!',
    icon: '💨',
    color: 'bg-blue-500 hover:bg-blue-600'
  },
  [BATTLE_ACTIONS.BLOCK]: {
    name: 'Block',
    description: 'Reduce damage. Speed 3+ gains health from blocking!',
    icon: '🛡️',
    color: 'bg-purple-500 hover:bg-purple-600'
  }
});

export default function BattleScreen({
  currentBattle,
  currentWalletAddress,
  onSubmitAction,
  onResetBattle,
  onCheckForActions,
  loading,
  userAction,
  battlePhase,
  battleLog
}) {
  const [isCheckingActions, setIsCheckingActions] = useState(false);
  const [lastActionCheck, setLastActionCheck] = useState(null);
  const [winnerChoice, setWinnerChoice] = useState(null);

  // Handle action checking with loading state
  const handleCheckActions = async () => {
    if (onCheckForActions) {
      setIsCheckingActions(true);
      try {
        await onCheckForActions();
        setLastActionCheck(new Date());
      } finally {
        // Reset loading state after a short delay to show feedback
        setTimeout(() => setIsCheckingActions(false), 1000);
      }
    }
  };

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
    const opponentRole = role === 'user1' ? 'user2' : 'user1';
    return role === 'user1' ? currentBattle.user2Health : currentBattle.user1Health;
  };

  const getCurrentUserImage = () => {
    const role = getCurrentUserRole();
    if (!role || !currentBattle) return null;
    return currentBattle[role]?.image;
  };

  // Format time ago for last action check
  const formatTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
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

  // Check if battle is completed and determine winner/loser
  const isBattleCompleted = () => {
    return battlePhase === 'completed' || 
           (currentBattle && (currentBattle.user1Health <= 0 || currentBattle.user2Health <= 0));
  };

  const getWinner = () => {
    if (!isBattleCompleted()) return null;
    if (currentBattle.user1Health <= 0) return 'user2';
    if (currentBattle.user2Health <= 0) return 'user1';
    return null;
  };

  const isCurrentUserWinner = () => {
    const winner = getWinner();
    if (!winner) return false;
    return getCurrentUserRole() === winner;
  };

  // Handle winner's choice
  const handleWinnerChoice = async (choice) => {
    setWinnerChoice(choice);
    
    try {
      // Submit the winner's choice to the API
      const response = await fetch(`/api/sessions/${currentBattle.sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winnerChoice: true,
          choice: choice,
          userWalletAddress: currentWalletAddress
        })
      });

      const data = await response.json();
      if (data.success) {
        console.log(`🎉 Winner choice submitted successfully: ${choice}`);
        
        if (choice === 'spare') {
          // Log that both NFTs will be minted
          console.log(`🎉 Winner chose to SPARE! Both NFTs will be minted:`);
          console.log(`🏆 Winner NFT (${currentWalletAddress}): ${getCurrentUserImage()}`);
          console.log(`💔 Loser NFT (${getOpponentStats()?.walletAddress || 'Unknown'}): ${getOpponentImage()}`);
        } else if (choice === 'burn') {
          // Log that only winner's NFT will be minted
          console.log(`🔥 Winner chose to BURN! Only winner's NFT will be minted:`);
          console.log(`🏆 Winner NFT (${currentWalletAddress}): ${getCurrentUserImage()}`);
          console.log(`💀 Loser's Kartikmon was destroyed!`);
        }
      } else {
        console.error('Failed to submit winner choice:', data.error);
      }
    } catch (error) {
      console.error('Error submitting winner choice:', error);
    }
  };

  // Check if opponent has made their choice
  const getOpponentChoice = () => {
    const role = getCurrentUserRole();
    if (!role || !currentBattle) return null;
    
    const opponentRole = role === 'user1' ? 'user2' : 'user1';
    const opponentAction = currentBattle[`${opponentRole}Action`];
    
    if (opponentAction === 'spare' || opponentAction === 'burn') {
      return opponentAction;
    }
    return null;
  };

  // Check if current user is waiting for opponent's choice
  const isWaitingForOpponentChoice = () => {
    return isBattleCompleted() && !isCurrentUserWinner() && !getOpponentChoice();
  };

  // Check if opponent has made their choice and show result
  const hasOpponentMadeChoice = () => {
    return isBattleCompleted() && !isCurrentUserWinner() && getOpponentChoice();
  };

  // Render winner interface
  const renderWinnerInterface = () => (
    <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-8 mb-8 border-2 border-yellow-400/50">
      <div className="text-center">
        <h3 className="text-4xl font-bold text-yellow-300 mb-4">🏆 VICTORY! 🏆</h3>
        <p className="text-xl text-yellow-200 mb-8">
          Congratulations! You've defeated your opponent! Now you must decide the fate of their Kartikmon...
        </p>
        
        {!winnerChoice ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <button
              onClick={() => handleWinnerChoice('spare')}
              className="p-8 rounded-2xl font-bold text-2xl transition-all duration-200 transform hover:scale-105 bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-green-500/50 border-2 border-green-400/50"
            >
              <div className="flex flex-col items-center gap-4">
                <Heart className="w-12 h-12" />
                <span>SPARE</span>
                <p className="text-sm font-normal opacity-90">
                  Show mercy and mint both NFTs
                </p>
              </div>
            </button>
            
            <button
              onClick={() => handleWinnerChoice('burn')}
              className="p-8 rounded-2xl font-bold text-2xl transition-all duration-200 transform hover:scale-105 bg-gradient-to-r from-red-500 to-red-700 text-white hover:from-red-600 hover:to-red-800 shadow-lg hover:shadow-red-500/50 border-2 border-red-400/50"
            >
              <div className="flex flex-col items-center gap-4">
                <Flame className="w-12 h-12" />
                <span>BURN!</span>
                <p className="text-sm font-normal opacity-90">
                  Destroy their Kartikmon forever
                </p>
              </div>
            </button>
          </div>
        ) : (
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
            <h4 className="text-2xl font-bold text-white mb-4">
              {winnerChoice === 'spare' ? '💝 Mercy Granted!' : '🔥 Destruction Complete!'}
            </h4>
            <p className="text-lg text-white/90 mb-4">
              {winnerChoice === 'spare' 
                ? 'Both Kartikmon will be minted as NFTs. Your opponent lives to fight another day!'
                : 'Your opponent\'s Kartikmon has been destroyed. Only your NFT will be minted!'
              }
            </p>
            <div className="text-sm text-white/70 font-mono">
              {winnerChoice === 'spare' ? (
                <div>
                  <p>🏆 Winner NFT: {currentWalletAddress}</p>
                  <p>💔 Loser NFT: {getOpponentStats()?.walletAddress || 'Unknown'}</p>
                </div>
              ) : (
                <div>
                  <p>🏆 Winner NFT: {currentWalletAddress}</p>
                  <p>💀 Loser NFT: DESTROYED</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render loser interface
  const renderLoserInterface = () => {
    const opponentChoice = getOpponentChoice();
    
    if (opponentChoice === 'spare') {
      // Show spared result
      return (
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-2xl p-8 mb-8 border-2 border-green-400/50">
          <div className="text-center">
            <h3 className="text-4xl font-bold text-green-300 mb-4">💝 MERCY GRANTED! 💝</h3>
            <p className="text-xl text-green-200 mb-6">
              The victor has shown you mercy! Your Kartikmon lives to fight another day.
            </p>
            
            <div className="bg-green-900/30 rounded-2xl p-6 border border-green-500/30 mb-6">
              <div className="flex items-center justify-center gap-4 mb-4">
                <Heart className="w-12 h-12 text-green-400" />
                <span className="text-2xl font-bold text-green-300">BOTH NFT'S WILL BE MINTED</span>
                <Heart className="w-12 h-12 text-green-400" />
              </div>
              <p className="text-lg text-green-200">
                Both Kartikmon will be minted as NFTs. You can start a new battle when ready!
              </p>
            </div>
            
            <div className="text-sm text-green-300/80">
              <p>Your wallet: {currentWalletAddress}</p>
              <p>Your Kartikmon: {getCurrentUserImage() ? 'Image Available' : 'No Image'}</p>
              <p>Opponent's choice: SPARE</p>
            </div>
          </div>
        </div>
      );
    } else if (opponentChoice === 'burn') {
      // Show destroyed result
      return (
        <div className="bg-gradient-to-br from-red-500/20 to-black/20 backdrop-blur-sm rounded-2xl p-8 mb-8 border-2 border-red-400/50">
          <div className="text-center">
            <h3 className="text-4xl font-bold text-red-300 mb-4">💀 DESTROYED 💀</h3>
            <p className="text-xl text-red-200 mb-6">
              The victor has chosen to destroy your Kartikmon. It's gone forever.
            </p>
            
            <div className="bg-red-900/30 rounded-2xl p-6 border border-red-500/30 mb-6">
              <div className="flex items-center justify-center gap-4 mb-4">
                <Flame className="w-12 h-12 text-red-400" />
                <span className="text-2xl font-bold text-red-300">KARTIKMON DESTROYED</span>
                <Flame className="w-12 h-12 text-red-400" />
              </div>
              <p className="text-lg text-red-200">
                Only the victor's NFT will be minted. Your Kartikmon has been burned to ashes.
              </p>
            </div>
            
            <div className="text-sm text-red-300/80">
              <p>Your wallet: {currentWalletAddress}</p>
              <p>Your Kartikmon: DESTROYED</p>
              <p>Opponent's choice: BURN</p>
            </div>
          </div>
        </div>
      );
    } else {
      // Show waiting for choice
      return (
        <div className="bg-gradient-to-br from-red-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl p-8 mb-8 border-2 border-red-400/50">
          <div className="text-center">
            <h3 className="text-4xl font-bold text-red-300 mb-4">💀 DEFEAT 💀</h3>
            <p className="text-xl text-red-200 mb-6">
              Your Kartikmon has fallen in battle...
            </p>
            
            <div className="bg-red-900/30 rounded-2xl p-6 border border-red-500/30 mb-6">
              <div className="flex items-center justify-center gap-4 mb-4">
                <Skull className="w-12 h-12 text-red-400" />
                <span className="text-2xl font-bold text-red-300">WAITING FOR MERCY</span>
                <Skull className="w-12 h-12 text-red-400" />
              </div>
              <p className="text-lg text-red-200">
                Your fate now rests in the hands of the victor. 
                They must choose whether to spare your Kartikmon or burn it to ashes...
              </p>
            </div>
            
            <div className="text-sm text-red-300/80">
              <p>Your wallet: {currentWalletAddress}</p>
              <p>Your Kartikmon: {getCurrentUserImage() ? 'Image Available' : 'No Image'}</p>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-indigo-900 p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
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
            {/* Your Kartikmon */}
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-6 text-blue-300">Your Kartikmon</h3>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                {getCurrentUserImage() ? (
                  <img
                    src={getCurrentUserImage()}
                    alt="Your Kartikmon"
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

            {/* Opponent Kartikmon */}
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-6 text-red-300">Opponent Kartikmon</h3>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                {getOpponentImage() ? (
                  <img
                    src={getOpponentImage()}
                    alt="Opponent Kartikmon"
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

        {/* Winner/Loser Interface or Battle Actions */}
        {isBattleCompleted() ? (
          isCurrentUserWinner() ? renderWinnerInterface() : renderLoserInterface()
        ) : (
          /* Battle Actions */
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Battle Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => handleAction(BATTLE_ACTIONS.PUNCH)}
                disabled={!canSubmitAction()}
                className={`p-6 rounded-2xl font-bold text-lg transition-all duration-200 transform hover:scale-105 ${canSubmitAction()
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-red-500/50'
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  }`}
                title={getBattleActionDescriptions()[BATTLE_ACTIONS.PUNCH].description}
              >
                <div className="flex flex-col items-center gap-2">
                  <Hand className="w-8 h-8" />
                  <span>Punch</span>
                </div>
              </button>

              <button
                onClick={() => handleAction(BATTLE_ACTIONS.KICK)}
                disabled={!canSubmitAction()}
                className={`p-6 rounded-2xl font-bold text-lg transition-all duration-200 transform hover:scale-105 ${canSubmitAction()
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
                className={`p-6 rounded-2xl font-bold text-lg transition-all duration-200 transform hover:scale-105 ${canSubmitAction()
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
                className={`p-6 rounded-2xl font-bold text-lg transition-all duration-200 transform hover:scale-105 ${canSubmitAction()
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
          </div>
        )}

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
        </div>

      </div>
    </div>
  );
}
