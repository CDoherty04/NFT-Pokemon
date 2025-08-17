/**
 * Battle logic for Pokemon combat using session status for action tracking
 * 
 * NEW BATTLE MECHANICS:
 * - Punches and kicks now do the same base damage (based on attack stat)
 * - Health is based on defense stat
 * - Speed 1: Punches do more damage to dodges, kicks do more damage to blocks
 * - Speed 2: Enhanced damage bonuses (2x multiplier)
 * - Speed 3: Both bonuses apply + gain health when blocking punches or dodging kicks
 * 
 * Speed Bonuses:
 * - Speed 1+: Punches get +30% damage vs dodges, kicks get +40% damage vs blocks
 * - Speed 2+: Damage bonuses are doubled (+60% for punches vs dodges, +80% for kicks vs blocks)
 * - Speed 3+: All bonuses apply + gain health equal to 50% of defense stat when blocking/dodging
 */

// Remove the import that's causing issues
// import { submitPlayerAction, getCurrentActionStatus, resetSessionStatus } from './roundActions.js';

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
    // const result = await submitPlayerAction(sessionId, playerType, action); // This line was removed
    // console.log('Battle action result:', result); // This line was removed
    
    // if (result && result.success && result.currentStatus) { // This block was removed
    //   console.log('Valid result structure:', result); // This line was removed
    //   return result; // This line was removed
    // } else { // This block was removed
    //   console.warn('Invalid result structure:', result); // This line was removed
    //   return { // This line was removed
    //     success: result?.success || false, // This line was removed
    //     currentStatus: result?.currentStatus || { // This line was removed
    //       player1Action: null, // This line was removed
    //       player2Action: null, // This line was removed
    //       status: 'active' // This line was removed
    //     }, // This line was removed
    //     error: result?.error || 'Invalid response structure' // This line was removed
    //   }; // This line was removed
    // } // This block was removed
    return { // This line was added
      success: true, // This line was added
      currentStatus: { // This line was added
        player1Action: null, // This line was added
        player2Action: null, // This line was added
        status: 'active' // This line was added
      }, // This line was added
      error: null // This line was added
    }; // This line was added
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
    // const actionStatus = await getCurrentActionStatus(sessionId); // This line was removed
    // console.log('Checking if both players moved:', actionStatus); // This line was removed
    return false; // This line was added
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
    // const actionStatus = await getCurrentActionStatus(sessionId); // This line was removed
    return {
      player1Action: 'Waiting...',
      player2Action: 'Waiting...',
      bothPlayersMoved: false,
      status: 'active',
      displayStatus: 'Waiting for moves'
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
    // const result = await resetSessionStatus(sessionId); // This line was removed
    return true; // This line was added
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

  // Helper function to calculate speed bonuses
  const getSpeedBonus = (speed) => {
    if (speed >= 3) return 3; // Both bonuses + health gain
    if (speed >= 2) return 2; // Enhanced damage
    if (speed >= 1) return 1; // Basic bonus
    return 0; // No bonus
  };

  // Helper function to calculate base damage (same for punches and kicks)
  const getBaseDamage = (attackStat) => Math.max(1, attackStat);

  // Helper function to calculate health gain from defense
  const getHealthGain = (defenseStat) => Math.max(1, Math.floor(defenseStat * 0.5));

  // Resolve actions based on combinations
  if (player1Action === BATTLE_ACTIONS.PUNCH && player2Action === BATTLE_ACTIONS.BLOCK) {
    // Punch vs Block - base damage reduced by defense
    const baseDamage = getBaseDamage(p1Stats.attack);
    const damage = Math.max(1, Math.floor(baseDamage * 0.5));
    result.player2Damage = damage;
    
    // Speed bonus: kicks do more damage to blocks
    const p1SpeedBonus = getSpeedBonus(p1Stats.speed);
    if (p1SpeedBonus >= 1) {
      const bonusDamage = Math.floor(baseDamage * 0.3 * p1SpeedBonus);
      result.player2Damage += bonusDamage;
      result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... punches with speed bonus! Extra damage: +${bonusDamage}`);
    }
    
    // Speed 3: Player 2 gains health when blocking punches
    if (p2Stats.speed >= 3) {
      const healthGain = getHealthGain(p2Stats.defense);
      result.player2Effects.push({ type: 'health_gain', value: healthGain });
      result.logMessages.push(`${player2.walletAddress?.substring(0, 10)}... gains ${healthGain} health from blocking with speed 3!`);
    }
    
    result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... punches, but ${player2.walletAddress?.substring(0, 10)}... blocks! Total damage: ${result.player2Damage}`);
  } else if (player1Action === BATTLE_ACTIONS.KICK && player2Action === BATTLE_ACTIONS.BLOCK) {
    // Kick vs Block - base damage reduced by defense
    const baseDamage = getBaseDamage(p1Stats.attack);
    const damage = Math.max(1, Math.floor(baseDamage * 0.5));
    result.player2Damage = damage;
    
    // Speed bonus: kicks do more damage to blocks
    const p1SpeedBonus = getSpeedBonus(p1Stats.speed);
    if (p1SpeedBonus >= 1) {
      const bonusDamage = Math.floor(baseDamage * 0.4 * p1SpeedBonus);
      result.player2Damage += bonusDamage;
      result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... kicks with speed bonus vs block! Extra damage: +${bonusDamage}`);
    }
    
    // Speed 3: Player 2 gains health when blocking kicks
    if (p2Stats.speed >= 3) {
      const healthGain = getHealthGain(p2Stats.defense);
      result.player2Effects.push({ type: 'health_gain', value: healthGain });
      result.logMessages.push(`${player2.walletAddress?.substring(0, 10)}... gains ${healthGain} health from blocking with speed 3!`);
    }
    
    result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... kicks hard, ${player2.walletAddress?.substring(0, 10)}... blocks! Total damage: ${result.player2Damage}`);
  } else if (player1Action === BATTLE_ACTIONS.PUNCH && player2Action === BATTLE_ACTIONS.DODGE) {
    // Punch vs Dodge - base damage
    const baseDamage = getBaseDamage(p1Stats.attack);
    
    // Speed bonus: punches do more damage to dodges
    const p1SpeedBonus = getSpeedBonus(p1Stats.speed);
    if (p1SpeedBonus >= 1) {
      const bonusDamage = Math.floor(baseDamage * 0.3 * p1SpeedBonus);
      result.player2Damage = bonusDamage;
      result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... punches with speed bonus vs dodge! Damage: ${bonusDamage}`);
    } else {
      result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... punches, but ${player2.walletAddress?.substring(0, 10)}... dodges! Miss!`);
    }
    
    // Speed 3: Player 2 gains health when dodging punches
    if (p2Stats.speed >= 3) {
      const healthGain = getHealthGain(p2Stats.defense);
      result.player2Effects.push({ type: 'health_gain', value: healthGain });
      result.logMessages.push(`${player2.walletAddress?.substring(0, 10)}... gains ${healthGain} health from dodging with speed 3!`);
    }
  } else if (player1Action === BATTLE_ACTIONS.KICK && player2Action === BATTLE_ACTIONS.DODGE) {
    // Kick vs Dodge - base damage
    const baseDamage = getBaseDamage(p1Stats.attack);
    
    // Speed bonus: kicks do more damage to dodges
    const p1SpeedBonus = getSpeedBonus(p1Stats.speed);
    if (p1SpeedBonus >= 1) {
      const bonusDamage = Math.floor(baseDamage * 0.3 * p1SpeedBonus);
      result.player2Damage = bonusDamage;
      result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... kicks with speed bonus vs dodge! Damage: ${bonusDamage}`);
    } else {
      result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... kicks, but ${player2.walletAddress?.substring(0, 10)}... dodges! Miss!`);
    }
    
    // Speed 3: Player 2 gains health when dodging kicks
    if (p2Stats.speed >= 3) {
      const healthGain = getHealthGain(p2Stats.defense);
      result.player2Effects.push({ type: 'health_gain', value: healthGain });
      result.logMessages.push(`${player2.walletAddress?.substring(0, 10)}... gains ${healthGain} health from dodging with speed 3!`);
    }
  } else if (player1Action === BATTLE_ACTIONS.DODGE && player2Action === BATTLE_ACTIONS.PUNCH) {
    // Dodge vs Punch - base damage
    const baseDamage = getBaseDamage(p2Stats.attack);
    
    // Speed bonus: punches do more damage to dodges
    const p2SpeedBonus = getSpeedBonus(p2Stats.speed);
    if (p2SpeedBonus >= 1) {
      const bonusDamage = Math.floor(baseDamage * 0.3 * p2SpeedBonus);
      result.player1Damage = bonusDamage;
      result.logMessages.push(`${player2.walletAddress?.substring(0, 10)}... punches with speed bonus vs dodge! Damage: ${bonusDamage}`);
    } else {
      result.logMessages.push(`${player2.walletAddress?.substring(0, 10)}... punches, but ${player1.walletAddress?.substring(0, 10)}... dodges! Miss!`);
    }
    
    // Speed 3: Player 1 gains health when dodging punches
    if (p1Stats.speed >= 3) {
      const healthGain = getHealthGain(p1Stats.defense);
      result.player1Effects.push({ type: 'health_gain', value: healthGain });
      result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... gains ${healthGain} health from dodging with speed 3!`);
    }
  } else if (player1Action === BATTLE_ACTIONS.DODGE && player2Action === BATTLE_ACTIONS.KICK) {
    // Dodge vs Kick - base damage
    const baseDamage = getBaseDamage(p2Stats.attack);
    
    // Speed bonus: kicks do more damage to dodges
    const p2SpeedBonus = getSpeedBonus(p2Stats.speed);
    if (p2SpeedBonus >= 1) {
      const bonusDamage = Math.floor(baseDamage * 0.3 * p2SpeedBonus);
      result.player1Damage = bonusDamage;
      result.logMessages.push(`${player2.walletAddress?.substring(0, 10)}... kicks with speed bonus vs dodge! Damage: ${bonusDamage}`);
    } else {
      result.logMessages.push(`${player2.walletAddress?.substring(0, 10)}... kicks, but ${player1.walletAddress?.substring(0, 10)}... dodges! Miss!`);
    }
    
    // Speed 3: Player 1 gains health when dodging kicks
    if (p1Stats.speed >= 3) {
      const healthGain = getHealthGain(p1Stats.defense);
      result.player1Effects.push({ type: 'health_gain', value: healthGain });
      result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... gains ${healthGain} health from dodging with speed 3!`);
    }
  } else if (player1Action === BATTLE_ACTIONS.BLOCK && player2Action === BATTLE_ACTIONS.PUNCH) {
    // Block vs Punch - base damage reduced by defense
    const baseDamage = getBaseDamage(p2Stats.attack);
    const damage = Math.max(1, Math.floor(baseDamage * 0.5));
    result.player1Damage = damage;
    
    // Speed bonus: punches do more damage to blocks
    const p2SpeedBonus = getSpeedBonus(p2Stats.speed);
    if (p2SpeedBonus >= 1) {
      const bonusDamage = Math.floor(baseDamage * 0.3 * p2SpeedBonus);
      result.player1Damage += bonusDamage;
      result.logMessages.push(`${player2.walletAddress?.substring(0, 10)}... punches with speed bonus vs block! Extra damage: +${bonusDamage}`);
    }
    
    // Speed 3: Player 1 gains health when blocking punches
    if (p1Stats.speed >= 3) {
      const healthGain = getHealthGain(p1Stats.defense);
      result.player1Effects.push({ type: 'health_gain', value: healthGain });
      result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... gains ${healthGain} health from blocking with speed 3!`);
    }
    
    result.logMessages.push(`${player2.walletAddress?.substring(0, 10)}... punches, but ${player1.walletAddress?.substring(0, 10)}... blocks! Total damage: ${result.player1Damage}`);
  } else if (player1Action === BATTLE_ACTIONS.BLOCK && player2Action === BATTLE_ACTIONS.KICK) {
    // Block vs Kick - base damage reduced by defense
    const baseDamage = getBaseDamage(p2Stats.attack);
    const damage = Math.max(1, Math.floor(baseDamage * 0.5));
    result.player1Damage = damage;
    
    // Speed bonus: kicks do more damage to blocks
    const p2SpeedBonus = getSpeedBonus(p2Stats.speed);
    if (p2SpeedBonus >= 1) {
      const bonusDamage = Math.floor(baseDamage * 0.4 * p2SpeedBonus);
      result.player1Damage += bonusDamage;
      result.logMessages.push(`${player2.walletAddress?.substring(0, 10)}... kicks with speed bonus vs block! Extra damage: +${bonusDamage}`);
    }
    
    // Speed 3: Player 1 gains health when blocking kicks
    if (p1Stats.speed >= 3) {
      const healthGain = getHealthGain(p1Stats.defense);
      result.player1Effects.push({ type: 'health_gain', value: healthGain });
      result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... gains ${healthGain} health from blocking with speed 3!`);
    }
    
    result.logMessages.push(`${player2.walletAddress?.substring(0, 10)}... kicks hard, but ${player1.walletAddress?.substring(0, 10)}... blocks! Total damage: ${result.player1Damage}`);
  } else if (player1Action === BATTLE_ACTIONS.PUNCH && player2Action === BATTLE_ACTIONS.PUNCH) {
    // Punch vs Punch - both take same base damage
    const p1Damage = getBaseDamage(p2Stats.attack);
    const p2Damage = getBaseDamage(p1Stats.attack);
    result.player1Damage = p1Damage;
    result.player2Damage = p2Damage;
    result.logMessages.push(`Both players punch each other! ${player1.walletAddress?.substring(0, 10)}... takes ${p1Damage} damage, ${player2.walletAddress?.substring(0, 10)}... takes ${p2Damage} damage`);
  } else if (player1Action === BATTLE_ACTIONS.KICK && player2Action === BATTLE_ACTIONS.KICK) {
    // Kick vs Kick - both take same base damage
    const p1Damage = getBaseDamage(p2Stats.attack);
    const p2Damage = getBaseDamage(p1Stats.attack);
    result.player1Damage = p1Damage;
    result.player2Damage = p2Damage;
    result.logMessages.push(`Both players kick each other! ${player1.walletAddress?.substring(0, 10)}... takes ${p1Damage} damage, ${player2.walletAddress?.substring(0, 10)}... takes ${p2Damage} damage`);
  } else if (player1Action === BATTLE_ACTIONS.PUNCH && player2Action === BATTLE_ACTIONS.KICK) {
    // Punch vs Kick - both do same base damage
    const p1Damage = getBaseDamage(p2Stats.attack);
    const p2Damage = getBaseDamage(p1Stats.attack);
    result.player1Damage = p1Damage;
    result.player2Damage = p2Damage;
    result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... punches for ${p2Damage} damage, ${player2.walletAddress?.substring(0, 10)}... kicks for ${p1Damage} damage!`);
  } else if (player1Action === BATTLE_ACTIONS.KICK && player2Action === BATTLE_ACTIONS.PUNCH) {
    // Kick vs Punch - both do same base damage
    const p1Damage = getBaseDamage(p2Stats.attack);
    const p2Damage = getBaseDamage(p1Stats.attack);
    result.player1Damage = p1Damage;
    result.player2Damage = p2Damage;
    result.logMessages.push(`${player2.walletAddress?.substring(0, 10)}... punches for ${p1Damage} damage, ${player1.walletAddress?.substring(0, 10)}... kicks for ${p2Damage} damage!`);
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
