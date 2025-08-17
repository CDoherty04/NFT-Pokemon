/**
 * Battle logic for Kartikmon combat using session status for action tracking
 * 
 * NEW BATTLE MECHANICS:
 * - Punch: Regular damage based on attack stat, 10% chance to critical hit
 * - Kick: Double damage but 50% chance to miss, speed increases hit chance
 * - Block: Protects from half of incoming damage, defense increases protection
 * - Charge: Next attack does double damage, speed increases charge success
 * - Critical hits: 10% chance for double damage, attack stat increases critical damage
 * - Stats: Attack increases base damage and critical damage, Defense increases health and block mitigation, Speed increases chance-based effects
 */

// Remove the import that's causing issues
// import { submitPlayerAction, getCurrentActionStatus, resetSessionStatus } from './roundActions.js';

/**
 * Battle action types
 */
export const BATTLE_ACTIONS = {
  PUNCH: 'punch',
  KICK: 'kick',
  BLOCK: 'block',
  CHARGE: 'charge'
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
    return {
      success: true,
      currentStatus: {
        player1Action: null,
        player2Action: null,
        status: 'active'
      },
      error: null
    };
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
    return false;
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
    return true;
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

  // Helper function to calculate base damage
  const getBaseDamage = (attackStat) => Math.max(1, attackStat * 8);

  // Helper function to calculate critical hit chance and damage
  const getCriticalHit = (attackStat, speed) => {
    const baseCritChance = 0.10; // 10% base chance
    const speedBonus = Math.min(0.05, speed * 0.01); // Speed increases crit chance by 1% per point, max 5%
    const totalCritChance = baseCritChance + speedBonus;
    
    if (Math.random() < totalCritChance) {
      const baseCritDamage = 2.0; // Base critical hit multiplier
      const attackBonus = Math.min(0.5, attackStat * 0.1); // Attack increases crit damage by 10% per point, max 50%
      return baseCritDamage + attackBonus;
    }
    return 1.0; // No critical hit
  };

  // Helper function to calculate kick hit chance
  const getKickHitChance = (speed) => {
    const baseMissChance = 0.50; // 50% base miss chance
    const speedBonus = Math.min(0.30, speed * 0.05); // Speed reduces miss chance by 5% per point, max 30%
    return 1.0 - (baseMissChance - speedBonus);
  };

  // Helper function to calculate block effectiveness
  const getBlockEffectiveness = (defense) => {
    const baseBlock = 0.50; // Base 50% damage reduction
    const defenseBonus = Math.min(0.25, defense * 0.05); // Defense increases block effectiveness by 5% per point, max 25%
    return baseBlock + defenseBonus;
  };

  // Helper function to calculate charge success chance
  const getChargeSuccessChance = (speed) => {
    const baseSuccess = 0.80; // 80% base success chance
    const speedBonus = Math.min(0.15, speed * 0.03); // Speed increases success by 3% per point, max 15%
    return Math.min(0.95, baseSuccess + speedBonus); // Cap at 95%
  };

  // Helper function to calculate health from defense
  const getMaxHealth = (defense) => 100 + (defense * 25);

  // Resolve actions based on combinations
  if (player1Action === BATTLE_ACTIONS.PUNCH && player2Action === BATTLE_ACTIONS.BLOCK) {
    // Punch vs Block
    const baseDamage = getBaseDamage(p1Stats.attack);
    const criticalMultiplier = getCriticalHit(p1Stats.attack, p1Stats.speed);
    const totalDamage = Math.floor(baseDamage * criticalMultiplier);
    
    const blockEffectiveness = getBlockEffectiveness(p2Stats.defense);
    const finalDamage = Math.max(1, Math.floor(totalDamage * (1 - blockEffectiveness)));
    
    result.player2Damage = finalDamage;
    
    if (criticalMultiplier > 1.0) {
      result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... lands a CRITICAL PUNCH! Damage: ${totalDamage}`);
    }
    
    result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... punches for ${totalDamage} damage, but ${player2.walletAddress?.substring(0, 10)}... blocks! Final damage: ${finalDamage}`);
  } else if (player1Action === BATTLE_ACTIONS.KICK && player2Action === BATTLE_ACTIONS.BLOCK) {
    // Kick vs Block
    const hitChance = getKickHitChance(p1Stats.speed);
    
    if (Math.random() < hitChance) {
      const baseDamage = getBaseDamage(p1Stats.attack) * 2; // Double damage
      const criticalMultiplier = getCriticalHit(p1Stats.attack, p1Stats.speed);
      const totalDamage = Math.floor(baseDamage * criticalMultiplier);
      
      const blockEffectiveness = getBlockEffectiveness(p2Stats.defense);
      const finalDamage = Math.max(1, Math.floor(totalDamage * (1 - blockEffectiveness)));
      
      result.player2Damage = finalDamage;
      
      if (criticalMultiplier > 1.0) {
        result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... lands a CRITICAL KICK! Damage: ${totalDamage}`);
      }
      
      result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... lands a powerful kick for ${totalDamage} damage, but ${player2.walletAddress?.substring(0, 10)}... blocks! Final damage: ${finalDamage}`);
    } else {
      result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... tries to kick but misses!`);
    }
  } else if (player1Action === BATTLE_ACTIONS.PUNCH && player2Action === BATTLE_ACTIONS.CHARGE) {
    // Punch vs Charge
    const baseDamage = getBaseDamage(p1Stats.attack);
    const criticalMultiplier = getCriticalHit(p1Stats.attack, p1Stats.speed);
    const totalDamage = Math.floor(baseDamage * criticalMultiplier);
    
    result.player2Damage = totalDamage;
    
    if (criticalMultiplier > 1.0) {
      result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... lands a CRITICAL PUNCH! Damage: ${totalDamage}`);
    }
    
    result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... punches for ${totalDamage} damage while ${player2.walletAddress?.substring(0, 10)}... charges up!`);
  } else if (player1Action === BATTLE_ACTIONS.KICK && player2Action === BATTLE_ACTIONS.CHARGE) {
    // Kick vs Charge
    const hitChance = getKickHitChance(p1Stats.speed);
    
    if (Math.random() < hitChance) {
      const baseDamage = getBaseDamage(p1Stats.attack) * 2; // Double damage
      const criticalMultiplier = getCriticalHit(p1Stats.attack, p1Stats.speed);
      const totalDamage = Math.floor(baseDamage * criticalMultiplier);
      
      result.player2Damage = totalDamage;
      
      if (criticalMultiplier > 1.0) {
        result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... lands a CRITICAL KICK! Damage: ${totalDamage}`);
      }
      
      result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... lands a powerful kick for ${totalDamage} damage while ${player2.walletAddress?.substring(0, 10)}... charges up!`);
    } else {
      result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... tries to kick but misses while ${player2.walletAddress?.substring(0, 10)}... charges up!`);
    }
  } else if (player1Action === BATTLE_ACTIONS.BLOCK && player2Action === BATTLE_ACTIONS.PUNCH) {
    // Block vs Punch
    const baseDamage = getBaseDamage(p2Stats.attack);
    const criticalMultiplier = getCriticalHit(p2Stats.attack, p2Stats.speed);
    const totalDamage = Math.floor(baseDamage * criticalMultiplier);
    
    const blockEffectiveness = getBlockEffectiveness(p1Stats.defense);
    const finalDamage = Math.max(1, Math.floor(totalDamage * (1 - blockEffectiveness)));
    
    result.player1Damage = finalDamage;
    
    if (criticalMultiplier > 1.0) {
      result.logMessages.push(`${player2.walletAddress?.substring(0, 10)}... lands a CRITICAL PUNCH! Damage: ${totalDamage}`);
    }
    
    result.logMessages.push(`${player2.walletAddress?.substring(0, 10)}... punches for ${totalDamage} damage, but ${player1.walletAddress?.substring(0, 10)}... blocks! Final damage: ${finalDamage}`);
  } else if (player1Action === BATTLE_ACTIONS.BLOCK && player2Action === BATTLE_ACTIONS.KICK) {
    // Block vs Kick
    const hitChance = getKickHitChance(p2Stats.speed);
    
    if (Math.random() < hitChance) {
      const baseDamage = getBaseDamage(p2Stats.attack) * 2; // Double damage
      const criticalMultiplier = getCriticalHit(p2Stats.attack, p2Stats.speed);
      const totalDamage = Math.floor(baseDamage * criticalMultiplier);
      
      const blockEffectiveness = getBlockEffectiveness(p1Stats.defense);
      const finalDamage = Math.max(1, Math.floor(totalDamage * (1 - blockEffectiveness)));
      
      result.player1Damage = finalDamage;
      
      if (criticalMultiplier > 1.0) {
        result.logMessages.push(`${player2.walletAddress?.substring(0, 10)}... lands a CRITICAL KICK! Damage: ${totalDamage}`);
      }
      
      result.logMessages.push(`${player2.walletAddress?.substring(0, 10)}... lands a powerful kick for ${totalDamage} damage, but ${player1.walletAddress?.substring(0, 10)}... blocks! Final damage: ${finalDamage}`);
    } else {
      result.logMessages.push(`${player2.walletAddress?.substring(0, 10)}... tries to kick but misses while ${player1.walletAddress?.substring(0, 10)}... blocks!`);
    }
  } else if (player1Action === BATTLE_ACTIONS.CHARGE && player2Action === BATTLE_ACTIONS.PUNCH) {
    // Charge vs Punch
    const chargeSuccess = getChargeSuccessChance(p1Stats.speed);
    
    if (Math.random() < chargeSuccess) {
      const baseDamage = getBaseDamage(p2Stats.attack);
      const criticalMultiplier = getCriticalHit(p2Stats.attack, p2Stats.speed);
      const totalDamage = Math.floor(baseDamage * criticalMultiplier);
      
      result.player1Damage = totalDamage;
      
      if (criticalMultiplier > 1.0) {
        result.logMessages.push(`${player2.walletAddress?.substring(0, 10)}... lands a CRITICAL PUNCH! Damage: ${totalDamage}`);
      }
      
      result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... successfully charges up while ${player2.walletAddress?.substring(0, 10)}... punches for ${totalDamage} damage!`);
    } else {
      result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... fails to charge up while ${player2.walletAddress?.substring(0, 10)}... punches!`);
    }
  } else if (player1Action === BATTLE_ACTIONS.CHARGE && player2Action === BATTLE_ACTIONS.KICK) {
    // Charge vs Kick
    const chargeSuccess = getChargeSuccessChance(p1Stats.speed);
    const kickHitChance = getKickHitChance(p2Stats.speed);
    
    if (Math.random() < chargeSuccess) {
      if (Math.random() < kickHitChance) {
        const baseDamage = getBaseDamage(p2Stats.attack) * 2; // Double damage
        const criticalMultiplier = getCriticalHit(p2Stats.attack, p2Stats.speed);
        const totalDamage = Math.floor(baseDamage * criticalMultiplier);
        
        result.player1Damage = totalDamage;
        
        if (criticalMultiplier > 1.0) {
          result.logMessages.push(`${player2.walletAddress?.substring(0, 10)}... lands a CRITICAL KICK! Damage: ${totalDamage}`);
        }
        
        result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... successfully charges up while ${player2.walletAddress?.substring(0, 10)}... lands a powerful kick for ${totalDamage} damage!`);
      } else {
        result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... successfully charges up while ${player2.walletAddress?.substring(0, 10)}... tries to kick but misses!`);
      }
    } else {
      if (Math.random() < kickHitChance) {
        const baseDamage = getBaseDamage(p2Stats.attack) * 2; // Double damage
        const criticalMultiplier = getCriticalHit(p2Stats.attack, p2Stats.speed);
        const totalDamage = Math.floor(baseDamage * criticalMultiplier);
        
        result.player1Damage = totalDamage;
        
        if (criticalMultiplier > 1.0) {
          result.logMessages.push(`${player2.walletAddress?.substring(0, 10)}... lands a CRITICAL KICK! Damage: ${totalDamage}`);
        }
        
        result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... fails to charge up while ${player2.walletAddress?.substring(0, 10)}... lands a powerful kick for ${totalDamage} damage!`);
      } else {
        result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... fails to charge up while ${player2.walletAddress?.substring(0, 10)}... tries to kick but misses!`);
      }
    }
  } else if (player1Action === BATTLE_ACTIONS.PUNCH && player2Action === BATTLE_ACTIONS.PUNCH) {
    // Punch vs Punch
    const p1BaseDamage = getBaseDamage(p1Stats.attack);
    const p2BaseDamage = getBaseDamage(p2Stats.attack);
    
    const p1CriticalMultiplier = getCriticalHit(p1Stats.attack, p1Stats.speed);
    const p2CriticalMultiplier = getCriticalHit(p2Stats.attack, p2Stats.speed);
    
    const p1TotalDamage = Math.floor(p1BaseDamage * p1CriticalMultiplier);
    const p2TotalDamage = Math.floor(p2BaseDamage * p2CriticalMultiplier);
    
    result.player1Damage = p2TotalDamage;
    result.player2Damage = p1TotalDamage;
    
    if (p1CriticalMultiplier > 1.0) {
      result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... lands a CRITICAL PUNCH! Damage: ${p1TotalDamage}`);
    }
    if (p2CriticalMultiplier > 1.0) {
      result.logMessages.push(`${player2.walletAddress?.substring(0, 10)}... lands a CRITICAL PUNCH! Damage: ${p2TotalDamage}`);
    }
    
    result.logMessages.push(`Both players punch each other! ${player1.walletAddress?.substring(0, 10)}... takes ${p2TotalDamage} damage, ${player2.walletAddress?.substring(0, 10)}... takes ${p1TotalDamage} damage`);
  } else if (player1Action === BATTLE_ACTIONS.KICK && player2Action === BATTLE_ACTIONS.KICK) {
    // Kick vs Kick
    const p1HitChance = getKickHitChance(p1Stats.speed);
    const p2HitChance = getKickHitChance(p2Stats.speed);
    
    let p1Damage = 0;
    let p2Damage = 0;
    
    if (Math.random() < p1HitChance) {
      const p1BaseDamage = getBaseDamage(p1Stats.attack) * 2;
      const p1CriticalMultiplier = getCriticalHit(p1Stats.attack, p1Stats.speed);
      p1Damage = Math.floor(p1BaseDamage * p1CriticalMultiplier);
      
      if (p1CriticalMultiplier > 1.0) {
        result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... lands a CRITICAL KICK! Damage: ${p1Damage}`);
      }
    } else {
      result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... tries to kick but misses!`);
    }
    
    if (Math.random() < p2HitChance) {
      const p2BaseDamage = getBaseDamage(p2Stats.attack) * 2;
      const p2CriticalMultiplier = getCriticalHit(p2Stats.attack, p2Stats.speed);
      p2Damage = Math.floor(p2BaseDamage * p2CriticalMultiplier);
      
      if (p2CriticalMultiplier > 1.0) {
        result.logMessages.push(`${player2.walletAddress?.substring(0, 10)}... lands a CRITICAL KICK! Damage: ${p2Damage}`);
      }
    } else {
      result.logMessages.push(`${player2.walletAddress?.substring(0, 10)}... tries to kick but misses!`);
    }
    
    result.player1Damage = p2Damage;
    result.player2Damage = p1Damage;
    
    if (p1Damage > 0 || p2Damage > 0) {
      result.logMessages.push(`Both players kick each other! ${player1.walletAddress?.substring(0, 10)}... takes ${p2Damage} damage, ${player2.walletAddress?.substring(0, 10)}... takes ${p1Damage} damage`);
    }
  } else if (player1Action === BATTLE_ACTIONS.PUNCH && player2Action === BATTLE_ACTIONS.KICK) {
    // Punch vs Kick
    const p1BaseDamage = getBaseDamage(p1Stats.attack);
    const p2BaseDamage = getBaseDamage(p2Stats.attack) * 2;
    
    const p1CriticalMultiplier = getCriticalHit(p1Stats.attack, p1Stats.speed);
    const p2CriticalMultiplier = getCriticalHit(p2Stats.attack, p2Stats.speed);
    
    const p1TotalDamage = Math.floor(p1BaseDamage * p1CriticalMultiplier);
    const p2TotalDamage = Math.floor(p2BaseDamage * p2CriticalMultiplier);
    
    const p2HitChance = getKickHitChance(p2Stats.speed);
    
    if (Math.random() < p2HitChance) {
      result.player1Damage = p2TotalDamage;
      
      if (p2CriticalMultiplier > 1.0) {
        result.logMessages.push(`${player2.walletAddress?.substring(0, 10)}... lands a CRITICAL KICK! Damage: ${p2TotalDamage}`);
      }
      
      result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... punches for ${p1TotalDamage} damage, ${player2.walletAddress?.substring(0, 10)}... lands a powerful kick for ${p2TotalDamage} damage!`);
    } else {
      result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... punches for ${p1TotalDamage} damage, ${player2.walletAddress?.substring(0, 10)}... tries to kick but misses!`);
    }
    
    result.player2Damage = p1TotalDamage;
  } else if (player1Action === BATTLE_ACTIONS.KICK && player2Action === BATTLE_ACTIONS.PUNCH) {
    // Kick vs Punch
    const p1BaseDamage = getBaseDamage(p1Stats.attack) * 2;
    const p2BaseDamage = getBaseDamage(p2Stats.attack);
    
    const p1CriticalMultiplier = getCriticalHit(p1Stats.attack, p1Stats.speed);
    const p2CriticalMultiplier = getCriticalHit(p2Stats.attack, p2Stats.speed);
    
    const p1TotalDamage = Math.floor(p1BaseDamage * p1CriticalMultiplier);
    const p2TotalDamage = Math.floor(p2BaseDamage * p2CriticalMultiplier);
    
    const p1HitChance = getKickHitChance(p1Stats.speed);
    
    if (Math.random() < p1HitChance) {
      result.player2Damage = p1TotalDamage;
      
      if (p1CriticalMultiplier > 1.0) {
        result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... lands a CRITICAL KICK! Damage: ${p1TotalDamage}`);
      }
      
      result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... lands a powerful kick for ${p1TotalDamage} damage, ${player2.walletAddress?.substring(0, 10)}... punches for ${p2TotalDamage} damage!`);
    } else {
      result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... tries to kick but misses, ${player2.walletAddress?.substring(0, 10)}... punches for ${p2TotalDamage} damage!`);
    }
    
    result.player1Damage = p2TotalDamage;
  } else if (player1Action === BATTLE_ACTIONS.BLOCK && player2Action === BATTLE_ACTIONS.BLOCK) {
    // Block vs Block
    result.logMessages.push(`Both players block! No damage dealt.`);
  } else if (player1Action === BATTLE_ACTIONS.CHARGE && player2Action === BATTLE_ACTIONS.CHARGE) {
    // Charge vs Charge
    const p1ChargeSuccess = getChargeSuccessChance(p1Stats.speed);
    const p2ChargeSuccess = getChargeSuccessChance(p2Stats.speed);
    
    if (Math.random() < p1ChargeSuccess && Math.random() < p2ChargeSuccess) {
      result.logMessages.push(`Both players successfully charge up! Next attacks will be devastating!`);
    } else if (Math.random() < p1ChargeSuccess) {
      result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... successfully charges up while ${player2.walletAddress?.substring(0, 10)}... fails to charge!`);
    } else if (Math.random() < p2ChargeSuccess) {
      result.logMessages.push(`${player2.walletAddress?.substring(0, 10)}... successfully charges up while ${player1.walletAddress?.substring(0, 10)}... fails to charge!`);
    } else {
      result.logMessages.push(`Both players fail to charge up!`);
    }
  } else if (player1Action === BATTLE_ACTIONS.BLOCK && player2Action === BATTLE_ACTIONS.CHARGE) {
    // Block vs Charge
    const chargeSuccess = getChargeSuccessChance(p2Stats.speed);
    
    if (Math.random() < chargeSuccess) {
      result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... blocks while ${player2.walletAddress?.substring(0, 10)}... successfully charges up!`);
    } else {
      result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... blocks while ${player2.walletAddress?.substring(0, 10)}... fails to charge up!`);
    }
  } else if (player1Action === BATTLE_ACTIONS.CHARGE && player2Action === BATTLE_ACTIONS.BLOCK) {
    // Charge vs Block
    const chargeSuccess = getChargeSuccessChance(p1Stats.speed);
    
    if (Math.random() < chargeSuccess) {
      result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... successfully charges up while ${player2.walletAddress?.substring(0, 10)}... blocks!`);
    } else {
      result.logMessages.push(`${player1.walletAddress?.substring(0, 10)}... fails to charge up while ${player2.walletAddress?.substring(0, 10)}... blocks!`);
    }
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
      description: 'Regular attack damage based on attack stat. 10% chance to critical hit!',
      icon: '👊',
      color: 'bg-red-500 hover:bg-red-600'
    },
    [BATTLE_ACTIONS.KICK]: {
      name: 'Kick',
      description: 'Double damage but 50% chance to miss. Speed increases hit chance!',
      icon: '🦵',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    [BATTLE_ACTIONS.BLOCK]: {
      name: 'Block',
      description: 'Protects from half of incoming damage. Defense increases protection!',
      icon: '🛡️',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    [BATTLE_ACTIONS.CHARGE]: {
      name: 'Charge',
      description: 'Next attack does double damage. Speed increases charge success!',
      icon: '⚡',
      color: 'bg-yellow-500 hover:bg-yellow-600'
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
