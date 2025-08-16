/**
 * Utility functions for handling player actions using session status
 */

const API_BASE = '/api/sessions';

/**
 * Submit a player's action for the current round
 * @param {string} sessionId - The session ID
 * @param {string} playerType - Either 'player1' or 'player2'
 * @param {string} action - One of: 'punch', 'kick', 'dodge', 'block'
 * @returns {Promise<Object>} Response with action status
 */
export async function submitPlayerAction(sessionId, playerType, action) {
    try {
        const response = await fetch(API_BASE, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sessionId,
                operation: 'submitAction',
                playerType,
                action
            }),
        });

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to submit action');
        }

        return data;
    } catch (error) {
        console.error('Error submitting player action:', error);
        throw error;
    }
}

/**
 * Get the current action status
 * @param {string} sessionId - The session ID
 * @returns {Promise<Object>} Current action status
 */
export async function getCurrentActionStatus(sessionId) {
    try {
        const response = await fetch(API_BASE, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sessionId,
                operation: 'getStatus'
            }),
        });

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to get action status');
        }

        return data.currentStatus;
    } catch (error) {
        console.error('Error getting action status:', error);
        throw error;
    }
}

/**
 * Reset the session status after round resolution
 * @param {string} sessionId - The session ID
 * @returns {Promise<Object>} Response indicating success
 */
export async function resetSessionStatus(sessionId) {
    try {
        const response = await fetch(API_BASE, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sessionId,
                operation: 'resetStatus'
            }),
        });

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to reset session status');
        }

        return data;
    } catch (error) {
        console.error('Error resetting session status:', error);
        throw error;
    }
}

/**
 * Check if both players have made their moves in the current round
 * @param {string} sessionId - The session ID
 * @returns {Promise<boolean>} True if both players have moved
 */
export async function checkBothPlayersMoved(sessionId) {
    try {
        const actionStatus = await getCurrentActionStatus(sessionId);
        return actionStatus.player1Action && actionStatus.player2Action;
    } catch (error) {
        console.error('Error checking if both players moved:', error);
        return false;
    }
}

/**
 * Get the current round status for display
 * @param {Object} actionStatus - The current action status object
 * @returns {Object} Formatted round status
 */
export function getRoundStatus(actionStatus) {
    const { player1Action, player2Action, status } = actionStatus;
    
    return {
        player1Action: player1Action || 'Waiting...',
        player2Action: player2Action || 'Waiting...',
        bothPlayersMoved: player1Action && player2Action,
        status: status,
        displayStatus: player1Action && player2Action ? 'Ready for resolution' : 'Waiting for moves'
    };
}

/**
 * Get action descriptions for UI display
 * @returns {Object} Action descriptions
 */
export function getActionDescriptions() {
    return {
        punch: {
            name: 'Punch',
            description: 'Quick attack with moderate damage',
            icon: '👊'
        },
        kick: {
            name: 'Kick',
            description: 'Powerful attack with high damage',
            icon: '🦵'
        },
        dodge: {
            name: 'Dodge',
            description: 'Avoid incoming attacks',
            icon: '💨'
        },
        block: {
            name: 'Block',
            description: 'Reduce damage from attacks',
            icon: '🛡️'
        }
    };
}

/**
 * Validate if an action is valid
 * @param {string} action - The action to validate
 * @returns {boolean} True if action is valid
 */
export function isValidAction(action) {
    const validActions = ['punch', 'kick', 'dodge', 'block'];
    return validActions.includes(action);
}
