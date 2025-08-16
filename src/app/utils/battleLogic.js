/**
 * Battle logic for Pokemon combat using session status for action tracking
 */

import { submitPlayerAction, getCurrentActionStatus, resetSessionStatus } from './roundActions.js';

/**
 * Battle action types
 */
export const BATTLE_ACTIONS = {
  PUNCH: 'punch',
  KICK: 'kick',
  DODGE: 'dodge',
  BLOCK: 'block'
};

/**
 * Submit a player's action for the current round
 * @param {string} sessionId - The session ID
 * @param {string} playerType - Either 'player1' or 'player2'
 * @param {string} action - One of the BATTLE_ACTIONS
 * @returns {Promise<Object>} Response with action status
 */
export async function submitBattleAction(sessionId, playerType, action) {
  try {
    console.log(`Submitting battle action: ${playerType} chose ${action}`);
    const result = await submitPlayerAction(sessionId, playerType, action);
    console.log('Battle action result:', result);
    
    if (result && result.success && result.currentStatus) {
      console.log('Valid result structure:', result);
      return result;
    } else {
      console.warn('Invalid result structure:', result);
      return {
        success: result?.success || false,
        currentStatus: result?.currentStatus || {
          player1Action: null,
          player2Action: null,
          status: 'active'
        },
        error: result?.error || 'Invalid response structure'
      };
    }
  } catch (error) {
    console.error('Error submitting battle action:', error);
    throw error;
  }
}

/**
 * Check if both players have submitted their actions
 * @param {string} sessionId - The session ID
 * @returns {Promise<boolean>} True if both players have moved
 */
export async function checkBothPlayersMoved(sessionId) {
  try {
    const actionStatus = await getCurrentActionStatus(sessionId);
    console.log('Checking if both players moved:', actionStatus);
    return actionStatus.player1Action && actionStatus.player2Action;
  } catch (error) {
    console.error('Error checking if both players moved:', error);
    return false;
  }
}

/**
 * Get the current action status for display
 * @param {string} sessionId - The session ID
 * @returns {Promise<Object>} Current action status
 */
export async function getBattleActionStatus(sessionId) {
  try {
    const actionStatus = await getCurrentActionStatus(sessionId);
    return {
      player1Action: actionStatus.player1Action || 'Waiting...',
      player2Action: actionStatus.player2Action || 'Waiting...',
      bothPlayersMoved: actionStatus.player1Action && actionStatus.player2Action,
      status: actionStatus.status,
      displayStatus: actionStatus.player1Action && actionStatus.player2Action ? 'Ready for resolution' : 'Waiting for moves'
    };
  } catch (error) {
    console.error('Error getting battle action status:', error);
    return {
      player1Action: 'Error',
      player2Action: 'Error',
      bothPlayersMoved: false,
      status: 'error',
      displayStatus: 'Error loading status'
    };
  }
}

/**
 * Reset the session status after round resolution
 * @param {string} sessionId - The session ID
 * @returns {Promise<boolean>} True if successful
 */
export async function resetBattleStatus(sessionId) {
  try {
    const result = await resetSessionStatus(sessionId);
    return result && result.success;
  } catch (error) {
    console.error('Error resetting battle status:', error);
    return false;
  }
}

/**
 * Resolve the battle round based on both players' actions
 * @param {Object} player1 - Player 1 data with attributes
 * @param {Object} player2 - Player 2 data with attributes
 * @param {string} player1Action - Player 1's action
 * @param {string} player2Action - Player 2's action
 * @returns {Object} Battle result with damage, effects, and log messages
 */
export function resolveBattleRound(player1, player2, player1Action, player2Action) {
  console.log('Resolving battle round:', { player1Action, player2Action, player1, player2 });
  
  const result = {
    player1Damage: 0,
    player2Damage: 0,
    player1Effects: [],
    player2Effects: [],
    logMessages: [],
    roundWinner: null
  };

  // Get player stats
  const p1Stats = player1.attributes || { attack: 1, defense: 1, speed: 1 };
  const p2Stats = player2.attributes || { attack: 1, defense: 1, speed: 1 };

  // Resolve actions based on combinations
  if (player1Action === BATTLE_ACTIONS.PUNCH && player2Action === BATTLE_ACTIONS.BLOCK) {
    // Punch vs Block - reduced damage
    const damage = Math.max(1, Math.floor(p1Stats.attack * 0.5));
    result.player2Damage = damage;
    result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... punches, but ${player2.walletAddress?.substring(0, 10)}... blocks! Reduced damage: ${damage}`);
  } else if (player1Action === BATTLE_ACTIONS.KICK && player2Action === BATTLE_ACTIONS.BLOCK) {
    // Kick vs Block - moderate damage
    const damage = Math.max(1, Math.floor(p1Stats.attack * 0.7));
    result.player2Damage = damage;
    result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... kicks hard, ${player2.walletAddress?.substring(0, 10)}... blocks! Damage: ${damage}`);
  } else if (player1Action === BATTLE_ACTIONS.PUNCH && player2Action === BATTLE_ACTIONS.DODGE) {
    // Punch vs Dodge - miss
    result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... punches, but ${player2.walletAddress?.substring(0, 10)}... dodges! Miss!`);
  } else if (player1Action === BATTLE_ACTIONS.KICK && player2Action === BATTLE_ACTIONS.DODGE) {
    // Kick vs Dodge - miss
    result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... kicks, but ${player2.walletAddress?.substring(0, 10)}... dodges! Miss!`);
  } else if (player1Action === BATTLE_ACTIONS.DODGE && player2Action === BATTLE_ACTIONS.PUNCH) {
    // Dodge vs Punch - miss
    result.logMessages.push(`${player2.walletAddress?.substring(0, 10)}... punches, but ${player1.walletAddress?.substring(0, 10)}... dodges! Miss!`);
  } else if (player1Action === BATTLE_ACTIONS.DODGE && player2Action === BATTLE_ACTIONS.KICK) {
    // Dodge vs Kick - miss
    result.logMessages.push(`${player2.walletAddress?.substring(0, 10)}... kicks, but ${player1.walletAddress?.substring(0, 10)}... dodges! Miss!`);
  } else if (player1Action === BATTLE_ACTIONS.BLOCK && player2Action === BATTLE_ACTIONS.PUNCH) {
    // Block vs Punch - reduced damage
    const damage = Math.max(1, Math.floor(p2Stats.attack * 0.5));
    result.player1Damage = damage;
    result.logMessages.push(`${player2.walletAddress?.substring(0, 10)}... punches, but ${player1.walletAddress?.substring(0, 10)}... blocks! Reduced damage: ${damage}`);
  } else if (player1Action === BATTLE_ACTIONS.BLOCK && player2Action === BATTLE_ACTIONS.KICK) {
    // Block vs Kick - moderate damage
    const damage = Math.max(1, Math.floor(p2Stats.attack * 0.7));
    result.player1Damage = damage;
    result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... kicks hard, but ${player1.walletAddress?.substring(0, 10)}... blocks! Damage: ${damage}`);
  } else if (player1Action === BATTLE_ACTIONS.PUNCH && player2Action === BATTLE_ACTIONS.PUNCH) {
    // Punch vs Punch - both take damage
    const p1Damage = Math.max(1, p2Stats.attack);
    const p2Damage = Math.max(1, p1Stats.attack);
    result.player1Damage = p1Damage;
    result.player2Damage = p2Damage;
    result.logMessages.push(`Both players punch each other! ${player1.walletAddress?.substring(0, 10)}... takes ${p1Damage} damage, ${player2.walletAddress?.substring(0, 10)}... takes ${p2Damage} damage`);
  } else if (player1Action === BATTLE_ACTIONS.KICK && player2Action === BATTLE_ACTIONS.KICK) {
    // Kick vs Kick - both take heavy damage
    const p1Damage = Math.max(1, Math.floor(p2Stats.attack * 1.5));
    const p2Damage = Math.max(1, Math.floor(p1Stats.attack * 1.5));
    result.player1Damage = p1Damage;
    result.player2Damage = p2Damage;
    result.logMessages.push(`Both players kick each other hard! ${player1.walletAddress?.substring(0, 10)}... takes ${p1Damage} damage, ${player2.walletAddress?.substring(0, 10)}... takes ${p2Damage} damage`);
  } else if (player1Action === BATTLE_ACTIONS.PUNCH && player2Action === BATTLE_ACTIONS.KICK) {
    // Punch vs Kick - kick does more damage
    const p1Damage = Math.max(1, Math.floor(p2Stats.attack * 1.3));
    const p2Damage = Math.max(1, p1Stats.attack);
    result.player1Damage = p1Damage;
    result.player2Damage = p2Damage;
    result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... punches for ${p2Damage} damage, but ${player2.walletAddress?.substring(0, 10)}... kicks for ${p1Damage} damage!`);
  } else if (player1Action === BATTLE_ACTIONS.KICK && player2Action === BATTLE_ACTIONS.PUNCH) {
    // Kick vs Punch - kick does more damage
    const p1Damage = Math.max(1, p2Stats.attack);
    const p2Damage = Math.max(1, Math.floor(p1Stats.attack * 1.3));
    result.player1Damage = p1Damage;
    result.player2Damage = p2Damage;
    result.logMessages.push(`${player2.walletAddress?.substring(0, 10)}... punches for ${p1Damage} damage, but ${player1.walletAddress?.substring(0, 10)}... kicks for ${p2Damage} damage!`);
  } else if (player1Action === BATTLE_ACTIONS.DODGE && player2Action === BATTLE_ACTIONS.DODGE) {
    // Dodge vs Dodge - no damage
    result.logMessages.push(`Both players dodge! No damage dealt.`);
  } else if (player1Action === BATTLE_ACTIONS.BLOCK && player2Action === BATTLE_ACTIONS.BLOCK) {
    // Block vs Block - no damage
    result.logMessages.push(`Both players block! No damage dealt.`);
  } else if (player1Action === BATTLE_ACTIONS.DODGE && player2Action === BATTLE_ACTIONS.BLOCK) {
    // Dodge vs Block - no damage
    result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... dodges while ${player2.walletAddress?.substring(0, 10)}... blocks. No damage dealt.`);
  } else if (player1Action === BATTLE_ACTIONS.BLOCK && player2Action === BATTLE_ACTIONS.DODGE) {
    // Block vs Dodge - no damage
    result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... blocks while ${player2.walletAddress?.substring(0, 10)}... dodges. No damage dealt.`);
  }

  // Determine round winner based on damage dealt
  if (result.player1Damage > result.player2Damage) {
    result.roundWinner = 'player2';
    result.logMessages.push(`🏆 ${player2.walletAddress?.substring(0, 10)}... wins this round!`);
  } else if (result.player2Damage > result.player1Damage) {
    result.roundWinner = 'player1';
    result.logMessages.push(`🏆 ${player1.walletAddress?.substring(0, 10)}... wins this round!`);
  } else {
    result.logMessages.push(`🤝 This round is a tie!`);
  }

  console.log('Battle round result:', result);
  return result;
}

/**
 * Get action descriptions for UI display
 * @returns {Object} Action descriptions with icons and descriptions
 */
export function getBattleActionDescriptions() {
  return {
    [BATTLE_ACTIONS.PUNCH]: {
      name: 'Punch',
      description: 'Quick attack with moderate damage',
      icon: '👊',
      color: 'bg-red-500 hover:bg-red-600'
    },
    [BATTLE_ACTIONS.KICK]: {
      name: 'Kick',
      description: 'Powerful attack with high damage',
      icon: '🦵',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    [BATTLE_ACTIONS.DODGE]: {
      name: 'Dodge',
      description: 'Avoid incoming attacks',
      icon: '💨',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    [BATTLE_ACTIONS.BLOCK]: {
      name: 'Block',
      description: 'Reduce damage from attacks',
      icon: '🛡️',
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  };
}

/**
 * Check if an action is valid
 * @param {string} action - The action to validate
 * @returns {boolean} True if action is valid
 */
export function isValidBattleAction(action) {
  return Object.values(BATTLE_ACTIONS).includes(action);
}
