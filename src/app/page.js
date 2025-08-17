'use client';

import { useState, useEffect } from 'react';
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { FlowWalletConnectors } from "@dynamic-labs/flow";
import {
  DynamicContextProvider,
  DynamicWidget,
  useDynamicContext,
} from "@dynamic-labs/sdk-react-core";
import MainMenu from './components/MainMenu';
import CreateGameScreen from './components/CreateGameScreen';
import JoinGameScreen from './components/JoinGameScreen';
import BattleScreen from './components/BattleScreen';
import ENSAddress from './components/ENSAddress';
import { useENS } from './utils/useENS';
import abi from './abi';
import { ArrowLeft } from 'lucide-react';

// Setting up list of evmNetworks
const evmNetworks = [
  // Flow EVM Testnet
  {
    blockExplorerUrls: ['https://evm-testnet.flowscan.io/'],
    chainId: 545,
    chainName: 'Flow EVM Testnet',
    iconUrls: ['https://app.dynamic.xyz/assets/networks/flow.svg'],
    name: 'Flow',
    nativeCurrency: {
      decimals: 18,
      name: 'Flow',
      symbol: 'FLOW',
      iconUrl: 'https://app.dynamic.xyz/assets/networks/flow.svg',
    },
    networkId: 545,
    rpcUrls: ['https://testnet.evm.nodes.onflow.org'],
    vanityName: 'Flow EVM Testnet',
  }
];

// Main App Component
function AppContent() {
  const { primaryWallet, user } = useDynamicContext();
  const [currentWalletAddress, setCurrentWalletAddress] = useState(null);

  // Update wallet address when Dynamic wallet changes
  useEffect(() => {
    if (primaryWallet?.address) {
      setCurrentWalletAddress(primaryWallet.address);
    } else {
      setCurrentWalletAddress(null);
    }
  }, [primaryWallet]);

  return (
    <AppLogic
      currentWalletAddress={currentWalletAddress}
      user={user}
    />
  );
}

// App Logic Component
function AppLogic({ currentWalletAddress, user }) {
  // ENS resolution hook
  const { resolveAddress } = useENS();

  // App state
  const [currentScreen, setCurrentScreen] = useState('menu'); // 'menu', 'create', 'join', 'battle'
  const [showWalletWidget, setShowWalletWidget] = useState(false);

  // Wrapper function to safely set currentBattle with validation
  const setCurrentBattleSafely = (session) => {
    if (!session) {
      console.log('setCurrentBattleSafely: No session provided, setting to null');
      setCurrentBattle(null);
      return;
    }

    // Validate that the session is active before setting it
    if (session.isActive !== true) {
      console.error('ERROR: Attempting to set inactive session as currentBattle:', {
        sessionId: session.sessionId,
        status: session.status,
        isActive: session.isActive
      });
      console.log('setCurrentBattleSafely: Rejecting inactive session, keeping current battle');
      return;
    }

    console.log('setCurrentBattleSafely: Setting active session as currentBattle:', {
      sessionId: session.sessionId,
      status: session.status,
      isActive: session.isActive
    });
    setCurrentBattle(session);
  };

  // Game state
  const [sessions, setSessions] = useState([]);
  const [currentBattle, setCurrentBattle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isMessageVisible, setIsMessageVisible] = useState(false);

  // Battle state
  const [userAction, setUserAction] = useState('');
  const [battlePhase, setBattlePhase] = useState('waiting');
  const [battleLog, setBattleLog] = useState([]);
  const [lastRoundMessageTime, setLastRoundMessageTime] = useState(null);

  // Form data
  const [createFormData, setCreateFormData] = useState({
    avatarImage: '',
    attributes: { attack: 1, defense: 1, speed: 1 }
  });

  const [joinFormData, setJoinFormData] = useState({
    gameCode: '',
    avatarImage: '',
    attributes: { attack: 1, defense: 1, speed: 1 }
  });

  // Smart contract state
  const [contractAddress] = useState('0x67F4Eced0ba49Af4C25Fe70493Aa4C1B075414C2');
  const [contractABI] = useState(abi);

  // Function to format address with ENS name for battle log
  const formatAddressForBattleLog = async (address) => {
    if (!address) return 'Unknown';

    // Debug: show all stored ENS names
    debugENSStorage();

    // Check if this address has a saved custom ENS name (for both current user and opponent)
    const savedENSName = localStorage.getItem(`ens_name_${address}`);
    console.log(`ENS lookup for ${address}:`, { savedENSName, address });

    if (savedENSName) {
      return `${savedENSName}.eth`;
    }

    // If no custom name, try to resolve from blockchain ENS
    try {
      const ensName = await resolveAddress(address);
      if (ensName && !ensName.includes('...')) {
        return ensName;
      }
    } catch (error) {
      // Continue to fallback
    }

    // Fallback to truncated address
    return `${address.substring(0, 10)}...`;
  };

  // Function to format address for battle logic (used in battleLogic.js)
  const formatAddressForBattleLogic = (address) => {
    if (!address) return 'Unknown';

    // Check if this address has a saved custom ENS name (for both current user and opponent)
    const savedENSName = localStorage.getItem(`ens_name_${address}`);
    if (savedENSName) {
      return `${savedENSName}.eth`;
    }

    // For battle logic, we'll use a shorter format
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };



  // Navigation functions
  const navigateToScreen = (screen) => {
    console.log('Navigating to screen:', screen, 'from current screen:', currentScreen);
    setCurrentScreen(screen);
    setMessage('');
  };

  // Game creation functions
  const handleCreateGame = async (avatarImage, attributes, ensName) => {
    if (!avatarImage) {
      setMessage('Please draw your Pokemon first!');
      return;
    }

    // Save ENS name to localStorage if provided
    if (ensName && currentWalletAddress) {
      console.log(`Saving ENS name for ${currentWalletAddress}:`, ensName);
      localStorage.setItem(`ens_name_${currentWalletAddress}`, ensName);
    }

    setLoading(true);
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user1: {
            walletAddress: currentWalletAddress,
            image: avatarImage,
            attributes: attributes
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessage(`✅ Battle session created! Share the code: ${data.session.sessionId}`);

        // Immediately add the new session to local state
        const newSession = {
          ...data.session,
          status: 'waiting'
        };
        setSessions(prev => [newSession, ...prev]);

        // Also update the current battle state if needed
        if (data.session.status === 'waiting') {
          setCurrentBattle(newSession);
        }

        // Fetch sessions to ensure we have the latest data
        await fetchSessions();
      } else {
        setMessage('❌ Error: ' + data.error);
      }
    } catch (error) {
      setMessage('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToBattle = () => {
    navigateToScreen('battle');
  };

  // Function to manually check for actions
  const handleCheckForActions = async () => {
    if (!currentBattle) return;

    try {
      console.log('Manually checking for actions...');
      console.log('Page.js - Checking actions for session:', currentBattle.sessionId);
      const response = await fetch(`/api/sessions/${currentBattle.sessionId}`);
      const data = await response.json();

      if (data.success && data.session) {
        const updatedSession = data.session;

        // Check for new actions
        if (updatedSession.user1Action && updatedSession.user1Action !== currentBattle.user1Action) {
          console.log('New action from Player 1:', updatedSession.user1Action);
          setBattleLog(prev => [...prev, `Player 1 chose: ${updatedSession.user1Action}`]);
        }

        if (updatedSession.user2Action && updatedSession.user2Action !== currentBattle.user2Action) {
          console.log('New action from Player 2:', updatedSession.user2Action);
          setBattleLog(prev => [...prev, `Player 2 chose: ${updatedSession.user2Action}`]);
        }

        // Update current battle
        console.log('Page.js - Updating current battle with action check response:', {
          sessionId: updatedSession.sessionId,
          status: updatedSession.status,
          isActive: updatedSession.isActive
        });
        setCurrentBattle(updatedSession);
        setMessage('✅ Action status updated!');
      }
    } catch (error) {
      console.error('Error checking for actions:', error);
      setMessage('❌ Error checking for actions');
    }
  };

  // Session status checking function
  const handleCheckSessionStatus = async (sessionId) => {
    try {
      console.log('Page.js - Checking session status for:', sessionId);
      const response = await fetch(`/api/sessions/${sessionId}`);
      const data = await response.json();

      if (data.success && data.session) {
        console.log('Page.js - Session status response:', {
          sessionId: data.session.sessionId,
          status: data.session.status,
          isActive: data.session.isActive
        });
        // Update the sessions list with the latest data
        await fetchSessions();

        // Check if we can now continue to battle
        if (data.session.status === 'active' && data.session.user1 && data.session.user2) {
          console.log('Page.js - Setting current battle from status check:', {
            sessionId: data.session.sessionId,
            status: data.session.status,
            isActive: data.session.isActive
          });
          setCurrentBattleSafely(data.session);
          setBattlePhase('action-selection');

          // Format addresses with ENS names for battle log
          const user1Display = await formatAddressForBattleLog(data.session.user1?.walletAddress);
          const user2Display = await formatAddressForBattleLog(data.session.user2?.walletAddress);

          setBattleLog([
            `Battle started between ${user1Display} and ${user2Display}`,
            'Both Pokemon are ready for battle!',
            'Choose your actions simultaneously!'
          ]);

          // Show success message
          setMessage('🎉 Opponent joined! Starting battle...');

          // Automatically navigate to battle screen after a short delay
          setTimeout(() => {
            console.log('Page.js - Navigating to battle from status check. Current battle:', {
              sessionId: currentBattle?.sessionId,
              status: currentBattle?.status,
              isActive: currentBattle?.isActive
            });
            navigateToScreen('battle');
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Error checking session status:', error);
    }
  };

  // Enhanced session status checking that also updates the current session
  const handleCheckSessionStatusEnhanced = async (sessionId) => {
    try {
      console.log('Enhanced session status check for:', sessionId);
      const response = await fetch(`/api/sessions/${sessionId}`);
      const data = await response.json();

      console.log('Session status check response:', data);

      if (data.success && data.session) {
        console.log('Current session status:', data.session.status);
        console.log('Session has user1:', !!data.session.user1);
        console.log('Session has user2:', !!data.session.user2);

        // Update the sessions list with the latest data
        await fetchSessions();

        // Also update the current session if it matches
        const currentSession = getCurrentSession();
        if (currentSession && currentSession.sessionId === sessionId) {
          console.log('Updating current session data');
          // Update the current session data
          const updatedSessions = sessions.map(session =>
            session.sessionId === sessionId ? data.session : session
          );
          setSessions(updatedSessions);
        }
        // Check if we can now continue to battle
        if (data.session.status === 'active' && data.session.user1 && data.session.user2) {
          console.log('Session is active and ready for battle!');
          setCurrentBattle(data.session);
          setBattlePhase('action-selection');
          setLastRoundMessageTime(null); // Reset round message timer for new battle

          // Format addresses with ENS names for battle log
          const user1Display = await formatAddressForBattleLog(data.session.user1?.walletAddress);
          const user2Display = await formatAddressForBattleLog(data.session.user2?.walletAddress);

          setBattleLog([
            `Battle started between ${user1Display} and ${user2Display}`,
            'Both Pokemon are ready for battle!',
            'Choose your actions simultaneously!'
          ]);

          // Check for existing actions
          if (data.session.user1Action || data.session.user2Action) {
            console.log('Actions already submitted - user1:', data.session.user1Action, 'user2:', data.session.user2Action);
            console.log('Page.js - Setting battle log for existing actions in session:', data.session.sessionId);
            if (data.session.user1Action) {
              setBattleLog(prev => [...prev, `Player 1 chose: ${data.session.user1Action}`]);
            }
            if (data.session.user2Action) {
              setBattleLog(prev => [...prev, `Player 2 chose: ${data.session.user2Action}`]);
            }
          }

          // Show success message
          setMessage('🎉 Opponent joined! Starting battle...');

          // Automatically navigate to battle screen after a short delay
          setTimeout(() => {
            console.log('Page.js - Navigating to battle from enhanced status check. Current battle:', {
              sessionId: currentBattle?.sessionId,
              status: currentBattle?.status,
              isActive: currentBattle?.isActive
            });
            navigateToScreen('battle');
          }, 1500);
        } else {
          console.log('Session not ready for battle:', {
            status: data.session.status,
            hasUser1: !!data.session.user1,
            hasUser2: !!data.session.user2
          });
        }
      }
    } catch (error) {
      console.error('Error checking session status:', error);
    }
  };

  // Game joining functions
  const handleJoinGame = async (gameCode, avatarImage, attributes, ensName) => {
    if (!avatarImage) {
      setMessage('Please draw your Pokemon first!');
      return;
    }

    // Save ENS name to localStorage if provided
    if (ensName && currentWalletAddress) {
      console.log(`Saving ENS name for ${currentWalletAddress}:`, ensName);
      localStorage.setItem(`ens_name_${currentWalletAddress}`, ensName);
    }

    setLoading(true);
    try {
      console.log('Page.js - Received gameCode:', `"${gameCode}"`, 'Type:', typeof gameCode, 'Length:', gameCode.length);
      console.log('Page.js - Joining game with code:', gameCode);

      // Log the current sessions to see what's already in state
      console.log('Page.js - Current sessions before joining:', sessions.map(s => ({
        sessionId: s.sessionId,
        status: s.status,
        isActive: s.isActive
      })));

      const response = await fetch('/api/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: gameCode,
          user2: {
            walletAddress: currentWalletAddress,
            image: avatarImage,
            attributes: attributes
          }
        })
      });

      const data = await response.json();
      console.log('Join game response:', data);
      console.log('Page.js - Response session:', {
        sessionId: data.session?.sessionId,
        status: data.session?.status,
        isActive: data.session?.isActive
      });

      if (data.success) {
        setMessage('✅ Successfully joined the battle!');

        // Verify that we joined the correct session
        if (data.session.sessionId !== gameCode) {
          console.error('ERROR: Joined wrong session! Expected:', gameCode, 'Got:', data.session.sessionId);
          setMessage('❌ Error: Joined wrong session. Please try again.');
          return;
        }

        console.log('✅ Successfully joined correct session:', gameCode);

        // Check if we can continue to battle
        if (data.session.status === 'active' && data.session.isActive === true) {
          console.log('Session is active and isActive is true, setting up battle state...');

          // Additional validation to ensure we're only setting active sessions
          if (!data.session.isActive) {
            console.error('ERROR: Attempting to set inactive session as currentBattle:', {
              sessionId: data.session.sessionId,
              status: data.session.status,
              isActive: data.session.isActive
            });
            setMessage('❌ Error: Session is not active. Please try joining again.');
            return;
          }

          // Set battle state immediately
          console.log('Page.js - Setting current battle:', {
            sessionId: data.session.sessionId,
            status: data.session.status,
            isActive: data.session.isActive
          });
          setCurrentBattleSafely(data.session);
          setBattlePhase('action-selection');
          setLastRoundMessageTime(null); // Reset round message timer for new battle
          // Format addresses with ENS names for battle log
          const user1Display = await formatAddressForBattleLog(data.session.user1?.walletAddress);
          const user2Display = await formatAddressForBattleLog(data.session.user2?.walletAddress);

          setBattleLog([
            `Battle started between ${user2Display} and ${user1Display}`,
            'Both Pokemon are ready for battle!',
            'Choose your actions simultaneously!'
          ]);

          // Check if there are already actions submitted
          if (data.session.user1Action || data.session.user2Action) {
            console.log('Actions already submitted - user1:', data.session.user1Action, 'user2:', data.session.user2Action);
            console.log('Page.js - Setting battle log for existing actions in join response session:', data.session.sessionId);
            // Add action info to battle log
            if (data.session.user1Action) {
              setBattleLog(prev => [...prev, `Player 1 chose: ${data.session.user1Action}`]);
            }
            if (data.session.user2Action) {
              setBattleLog(prev => [...prev, `Player 2 chose: ${data.session.user2Action}`]);
            }
          }

          // Show success message and automatically navigate to battle screen
          setMessage('🎉 Successfully joined! Starting battle...');

          console.log('Scheduling navigation to battle screen in 1.5 seconds...');

          // Automatically navigate to battle screen after a short delay
          setTimeout(() => {
            console.log('Navigating to battle screen now...');
            console.log('Page.js - Current battle before navigation:', {
              sessionId: currentBattle?.sessionId,
              status: currentBattle?.status,
              isActive: currentBattle?.isActive
            });
            navigateToScreen('battle');
          }, 1500);
        } else {
          console.log('Session not active yet, status:', data.session.status);
        }

        // Update sessions after setting battle state
        await fetchSessions();
      } else {
        setMessage('❌ Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error joining game:', error);
      setMessage('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Battle functions
  const handleSubmitAction = async (action) => {
    if (!currentBattle || !currentWalletAddress) return;

    console.log('Page.js - Submitting action:', action, 'for session:', currentBattle.sessionId);
    console.log('Page.js - Current battle in handleSubmitAction:', {
      sessionId: currentBattle.sessionId,
      status: currentBattle.status,
      isActive: currentBattle.isActive
    });

    setLoading(true);
    try {
      const response = await fetch(`/api/sessions/${currentBattle.sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action,
          userWalletAddress: currentWalletAddress
        })
      });

      const data = await response.json();
      console.log('Page.js - Action submission response:', data);
      console.log('Page.js - Response session:', {
        sessionId: data.session?.sessionId,
        status: data.session?.status,
        isActive: data.session?.isActive
      });

      if (data.success) {
        setUserAction(action);
        setMessage(`✅ Action submitted: ${action}`);

        console.log('Action submission response:', {
          session: data.session,
          battleProcessed: data.battleProcessed,
          health: {
            user1: data.session?.user1Health,
            user2: data.session?.user2Health
          }
        });

        if (data.session) {
          console.log('Page.js - Updating current battle with response session:', {
            sessionId: data.session.sessionId,
            status: data.session.status,
            isActive: data.session.isActive
          });
          setCurrentBattle(data.session);

          if (data.battleProcessed) {
            setUserAction('');
            setBattlePhase('action-selection');

            if (data.session.battleLog && data.session.battleLog.length > 0) {
              const latestLog = data.session.battleLog[data.session.battleLog.length - 1];
              const roundNumber = data.session.currentRound - 1;

              setBattleLog(prev => [
                ...prev,
                `🎯 Round ${roundNumber} completed!`,
                `⚔️ ${latestLog.message}`,
                `❤️ User1 Health: ${data.session.user1Health}/${getMaxHealth(data.session.user1?.attributes?.defense || 0)}`,
                `❤️ User2 Health: ${data.session.user2Health}/${getMaxHealth(data.session.user2?.attributes?.defense || 0)}`
              ]);

              if (data.session.battlePhase === 'completed') {
                const winner = data.session.user1Health <= 0 ? 'User2' : 'User1';
                setBattlePhase('completed');
                setBattleLog(prev => [...prev, `🏆 ${winner} wins the battle!`]);
                setMessage(`🏆 Battle Complete! ${winner} is victorious!`);

                // Mark the battle as completed in the database (set isActive to false)
                try {
                  const completeResponse = await fetch(`/api/sessions/${data.session.sessionId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      completeBattle: true
                    })
                  });

                  const completeData = await completeResponse.json();
                  if (completeData.success) {
                    console.log('Battle marked as completed in database');
                    console.log('Page.js - Completed battle session:', {
                      sessionId: completeData.session?.sessionId,
                      status: completeData.session?.status,
                      isActive: completeData.session?.isActive
                    });
                    // Update the current battle with the completed status
                    setCurrentBattle(completeData.session);
                  } else {
                    console.error('Failed to mark battle as completed:', completeData.error);
                  }
                } catch (error) {
                  console.error('Error marking battle as completed:', error);
                }
              }
            }
          }
        }
      } else {
        setMessage('❌ Error: ' + data.error);
      }
    } catch (error) {
      setMessage('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetBattle = async () => {
    if (!currentBattle) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/sessions/${currentBattle.sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetBattle: true,
          startNewBattle: battlePhase === 'completed'
        })
      });

      const data = await response.json();
      if (data.success) {
        setUserAction('');
        if (data.session) {
          setCurrentBattle(data.session);
          setBattlePhase(data.session.battlePhase || 'action-selection');
          setLastRoundMessageTime(null); // Reset round message timer for new battle

          if (battlePhase === 'completed') {
            setMessage(`🎯 New battle started! Both players have full health.`);
            // Format addresses with ENS names for battle log
            const user1Display = await formatAddressForBattleLog(data.session.user1?.walletAddress);
            const user2Display = await formatAddressForBattleLog(data.session.user2?.walletAddress);

            setBattleLog([
              `New battle started between ${user1Display} and ${user2Display}`,
              'Both Pokemon are ready for battle!',
              'Choose your actions simultaneously!'
            ]);
          }
        }
        await fetchSessions();
      } else {
        setMessage('❌ Error: ' + data.error);
      }
    } catch (error) {
      setMessage('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getMaxHealth = (defense) => 100 + (defense * 20);

  // Debug function to show all stored ENS names
  const debugENSStorage = () => {
    const keys = Object.keys(localStorage);
    const ensKeys = keys.filter(key => key.startsWith('ens_name_'));
    console.log('All ENS names in localStorage:', ensKeys.map(key => ({
      address: key.replace('ens_name_', ''),
      name: localStorage.getItem(key)
    })));
  };

  const fetchSessions = async () => {
    try {
      console.log('Page.js - Fetching sessions...');
      const response = await fetch('/api/sessions');
      const data = await response.json();
      if (data.success) {
        console.log('Page.js - Fetched sessions:', data.sessions.map(s => ({
          sessionId: s.sessionId,
          status: s.status,
          isActive: s.isActive
        })));

        // Filter out inactive sessions to prevent them from being used
        const activeSessions = data.sessions.filter(session => session.isActive === true);
        console.log('Page.js - Filtered to active sessions only:', activeSessions.map(s => ({
          sessionId: s.sessionId,
          status: s.status,
          isActive: s.isActive
        })));

        // Additional validation to ensure no inactive sessions slip through
        const inactiveSessions = data.sessions.filter(session => session.isActive !== true);
        if (inactiveSessions.length > 0) {
          console.error('ERROR: Found inactive sessions in API response:', inactiveSessions.map(s => ({
            sessionId: s.sessionId,
            status: s.status,
            isActive: s.isActive
          })));
        }

        setSessions(activeSessions);

        // Only update battle state if we don't already have an active battle
        // This prevents overriding the battle state when a user just joined
        if (!currentBattle || currentBattle.status !== 'active') {
          const activeSession = activeSessions.find(session =>
            session.status === 'active' &&
            (session.user1?.walletAddress === currentWalletAddress ||
              session.user2?.walletAddress === currentWalletAddress)
          );

          if (activeSession) {
            console.log('Page.js - Found active session in fetchSessions:', {
              sessionId: activeSession.sessionId,
              status: activeSession.status,
              isActive: activeSession.isActive
            });
            setCurrentBattleSafely(activeSession);
            setBattlePhase(activeSession.battlePhase || 'action-selection');
            if (activeSession.battleLog && activeSession.battleLog.length > 0) {
              setBattleLog(activeSession.battleLog.map(log => log.message));
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  // Check for active battle whenever sessions change
  useEffect(() => {
    if (sessions.length > 0 && currentWalletAddress) {
      console.log('Page.js - Sessions changed, checking for active battle...');
      // Only update battle state if we don't already have an active battle
      // This prevents overriding the battle state when a user just joined
      if (!currentBattle || currentBattle.status !== 'active') {
        const activeSession = sessions.find(session =>
          session.status === 'active' &&
          (session.user1?.walletAddress === currentWalletAddress ||
            session.user2?.walletAddress === currentWalletAddress)
        );

        if (activeSession) {
          console.log('Page.js - Found active session in sessions effect:', {
            sessionId: activeSession.sessionId,
            status: activeSession.status,
            isActive: activeSession.isActive
          });
          setCurrentBattleSafely(activeSession);
          setBattlePhase(activeSession.battlePhase || 'action-selection');
          if (activeSession.battleLog && activeSession.battleLog.length > 0) {
            setBattleLog(activeSession.battleLog.map(log => log.message));
          }
        }
      }
    }
  }, [sessions, currentWalletAddress, currentBattle]);

  // Periodically refresh current battle and check for actions
  useEffect(() => {
    if (currentBattle) {
      console.log('Page.js - Starting auto-refresh for battle:', currentBattle.sessionId, 'with initial health:', {
        user1Health: currentBattle.user1Health,
        user2Health: currentBattle.user2Health
      });

      const interval = setInterval(async () => {
        try {
          console.log('Page.js - Auto-refresh checking session:', currentBattle.sessionId);
          const response = await fetch(`/api/sessions/${currentBattle.sessionId}`);
          const data = await response.json();

          if (data.success && data.session) {
            const updatedSession = data.session;
            console.log('Page.js - Auto-refresh got updated session:', {
              sessionId: updatedSession.sessionId,
              status: updatedSession.status,
              isActive: updatedSession.isActive
            });

            // Check if actions were reset (new round)
            if (updatedSession.user1Action === '' && updatedSession.user2Action === '') {
              console.log('Page.js - Actions reset detected for session:', updatedSession.sessionId, 'checking battle phase transition:', {
                currentPhase: currentBattle?.battlePhase,
                newPhase: updatedSession.battlePhase,
                shouldShowMessage: currentScreen === 'battle' && currentBattle?.battlePhase === 'battle-resolution'
              });

              setUserAction('');
              setCurrentBattle(updatedSession);

              // Only show message if we're transitioning from battle-resolution to action-selection
              if (currentScreen === 'battle' && currentBattle?.battlePhase === 'battle-resolution') {
                const now = Date.now();
                const timeSinceLastMessage = lastRoundMessageTime ? now - lastRoundMessageTime : Infinity;

                // Only show message if it's been at least 3 seconds since the last one
                if (timeSinceLastMessage > 3000) {
                  console.log('Page.js - Showing new round message for session:', updatedSession.sessionId);
                  setMessage('🎯 New round starting! Choose your action.');
                  setBattlePhase('action-selection');
                  setLastRoundMessageTime(now);
                } else {
                  console.log('Page.js - Skipping round message - too soon since last one:', timeSinceLastMessage);
                  setBattlePhase('action-selection');
                }
              }
              return;
            }

            // Check if round number increased
            if (updatedSession.currentRound > currentBattle.currentRound) {
              console.log('Round number increased:', {
                oldRound: currentBattle.currentRound,
                newRound: updatedSession.currentRound,
                currentPhase: currentBattle?.battlePhase,
                shouldShowMessage: currentScreen === 'battle' && currentBattle?.battlePhase === 'battle-resolution'
              });

              console.log('Page.js - Auto-refresh updating current battle for actions reset in session:', updatedSession.sessionId);
              setUserAction('');
              setCurrentBattle(updatedSession);

              // Only show message if we're transitioning from battle-resolution to action-selection
              if (currentScreen === 'battle' && currentBattle?.battlePhase === 'battle-resolution') {
                const now = Date.now();
                const timeSinceLastMessage = lastRoundMessageTime ? now - lastRoundMessageTime : Infinity;

                // Only show message if it's been at least 3 seconds since the last one
                if (timeSinceLastMessage > 3000) {
                  console.log('Page.js - Showing round start message for session:', updatedSession.sessionId);
                  setMessage(`🎯 Round ${updatedSession.currentRound} started! Choose your action.`);
                  setBattlePhase('action-selection');
                  setLastRoundMessageTime(now);
                } else {
                  console.log('Page.js - Skipping round start message - too soon since last one:', timeSinceLastMessage);
                  setBattlePhase('action-selection');
                }
              }
              return;
            }

            // Check for new actions from opponent
            if (updatedSession.user1Action && updatedSession.user1Action !== currentBattle.user1Action) {
              console.log('Page.js - Auto-refresh: Opponent 1 submitted action for session:', updatedSession.sessionId, 'Action:', updatedSession.user1Action);
              console.log('Page.js - Auto-refresh updating current battle for session:', updatedSession.sessionId);
              setCurrentBattle(updatedSession);

              // Check if this is a winner choice (spare/burn)
              if (['spare', 'burn'].includes(updatedSession.user1Action)) {
                console.log('Page.js - Winner choice detected for session:', updatedSession.sessionId, 'Action:', updatedSession.user1Action);
                if (currentScreen === 'battle') {
                  setMessage(`🏆 Winner chose to ${updatedSession.user1Action.toUpperCase()} the opponent's Kartikmon!`);
                }
              }
            }

            if (updatedSession.user2Action && updatedSession.user2Action !== currentBattle.user2Action) {
              console.log('Page.js - Auto-refresh: Opponent 2 submitted action for session:', updatedSession.sessionId, 'Action:', updatedSession.user2Action);
              console.log('Page.js - Auto-refresh updating current battle for session:', updatedSession.sessionId);
              setCurrentBattle(updatedSession);

              // Check if this is a winner choice (spare/burn)
              if (['spare', 'burn'].includes(updatedSession.user2Action)) {
                console.log('Page.js - Winner choice detected for session:', updatedSession.sessionId, 'Action:', updatedSession.user2Action);
                if (currentScreen === 'battle') {
                  setBattleLog(prev => [...prev, `🏆 Winner chose to ${updatedSession.user2Action.toUpperCase()} the opponent's Kartikmon!`]);
                }
              }
            }

            // Check for health changes
            if (updatedSession.user1Health !== currentBattle.user1Health || updatedSession.user2Health !== currentBattle.user2Health) {
              console.log('Page.js - Auto-refresh: Health changed for session:', updatedSession.sessionId, {
                user1Health: { old: currentBattle.user1Health, new: updatedSession.user1Health },
                user2Health: { old: currentBattle.user2Health, new: updatedSession.user2Health }
              });
              console.log('Page.js - Auto-refresh updating current battle for health change in session:', updatedSession.sessionId);
              setCurrentBattle(updatedSession);

              // Also update the battle log to show health changes
              if (currentScreen === 'battle') {
                setMessage(`❤️ Health updated! User1: ${updatedSession.user1Health}, User2: ${updatedSession.user2Health}`);
              }
            } else {
              // Log when health is checked but unchanged
              console.log('Page.js - Auto-refresh: Health unchanged for session:', updatedSession.sessionId, {
                user1Health: updatedSession.user1Health,
                user2Health: updatedSession.user2Health
              });
            }

            // Update battle log
            if (updatedSession.battleLog && updatedSession.battleLog.length > 0) {
              const currentLogLength = currentBattle.battleLog ? currentBattle.battleLog.length : 0;
              if (updatedSession.battleLog.length > currentLogLength) {
                console.log('Page.js - Auto-refresh updating battle log for session:', updatedSession.sessionId, 'New messages:', updatedSession.battleLog.length - currentLogLength);
                const newMessages = updatedSession.battleLog.slice(currentLogLength).map(log => log.message);
                setBattleLog(prev => [...prev, ...newMessages]);
              }
            }

            // Update current battle with latest data
            if (JSON.stringify(updatedSession) !== JSON.stringify(currentBattle)) {
              console.log('Page.js - Updating currentBattle with new data for session:', updatedSession.sessionId, {
                oldHealth: { user1: currentBattle.user1Health, user2: currentBattle.user2Health },
                newHealth: { user1: updatedSession.user1Health, user2: updatedSession.user2Health },
                oldPhase: currentBattle.battlePhase,
                newPhase: updatedSession.battlePhase
              });
              console.log('Page.js - Auto-refresh updating current battle with new data for session:', updatedSession.sessionId);
              setCurrentBattle(updatedSession);

              // Synchronize battle phase with database
              if (updatedSession.battlePhase && updatedSession.battlePhase !== battlePhase) {
                console.log('Page.js - Syncing battle phase for session:', updatedSession.sessionId, { old: battlePhase, new: updatedSession.battlePhase });
                setBattlePhase(updatedSession.battlePhase);
              }
            }
          }
        } catch (error) {
          console.error('Error refreshing battle:', error);
        }
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [currentBattle, currentWalletAddress, currentScreen]);

  // Monitor changes to currentBattle for debugging
  useEffect(() => {
    if (currentBattle) {
      console.log('Page.js - currentBattle state updated:', {
        sessionId: currentBattle.sessionId,
        status: currentBattle.status,
        isActive: currentBattle.isActive,
        health: {
          user1: currentBattle.user1Health,
          user2: currentBattle.user2Health
        },
        actions: {
          user1: currentBattle.user1Action,
          user2: currentBattle.user2Action
        }
      });
    }
  }, [currentBattle]);

  // Auto-dismiss messages after 4 seconds
  useEffect(() => {
    if (message) {
      // Show message with animation
      setIsMessageVisible(true);

      // Start exit animation after 3.5 seconds (before the 4 second timer)
      const exitTimer = setTimeout(() => {
        setIsMessageVisible(false);
      }, 3500);

      // Clear message after exit animation completes
      const clearTimer = setTimeout(() => {
        setMessage('');
        setIsMessageVisible(false);
      }, 4000);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(clearTimer);
      };
    } else {
      setIsMessageVisible(false);
    }
  }, [message]);

  // Get current session for create/join screens
  const getCurrentSession = () => {
    if (!currentWalletAddress) return null;

    console.log('Page.js - getCurrentSession called with sessions:', sessions.map(s => ({
      sessionId: s.sessionId,
      status: s.status,
      isActive: s.isActive,
      user1: s.user1?.walletAddress?.substring(0, 10) + '...',
      user2: s.user2?.walletAddress?.substring(0, 10) + '...'
    })));

    const session = sessions.find(session => {
      const user1Match = session.user1?.walletAddress === currentWalletAddress;
      const user2Match = session.user2?.walletAddress === currentWalletAddress;

      console.log('Page.js - Session check:', {
        sessionId: session.sessionId,
        status: session.status,
        isActive: session.isActive,
        user1Wallet: session.user1?.walletAddress,
        user2Wallet: session.user2?.walletAddress,
        currentWallet: currentWalletAddress,
        user1Match,
        user2Match
      });

      // Only return active sessions
      return (user1Match || user2Match) && session.isActive === true;
    });

    console.log('Page.js - getCurrentSession result:', {
      currentWalletAddress: currentWalletAddress?.substring(0, 10) + '...',
      totalSessions: sessions.length,
      foundSession: !!session,
      sessionStatus: session?.status,
      sessionId: session?.sessionId,
      isActive: session?.isActive
    });

    return session;
  };

  const canContinueToBattle = () => {
    const session = getCurrentSession();
    const canContinue = session && session.status === 'active' && session.user1 && session.user2;

    console.log('Page.js - canContinueToBattle check:', {
      hasSession: !!session,
      sessionStatus: session?.status,
      isActive: session?.isActive,
      hasUser1: !!session?.user1,
      hasUser2: !!session?.user2,
      sessionId: session?.sessionId,
      canContinue
    });

    return canContinue;
  };

  // Render current screen
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'create':
        return (
          <CreateGameScreen
            onCreateGame={handleCreateGame}
            sessionId={getCurrentSession()?.sessionId}
            isWaitingForPlayer={getCurrentSession()?.status === 'waiting'}
            onContinueToBattle={handleContinueToBattle}
            canContinue={canContinueToBattle()}
            onCheckSessionStatus={handleCheckSessionStatusEnhanced}
            loading={loading}
          />
        );

      case 'join':
        return (
          <JoinGameScreen
            onJoinGame={handleJoinGame}
            onContinueToBattle={handleContinueToBattle}
            canContinue={canContinueToBattle()}
          />
        );

      case 'battle':
        return (
          <BattleScreen
            currentBattle={currentBattle}
            currentWalletAddress={currentWalletAddress}
            onSubmitAction={handleSubmitAction}
            onResetBattle={handleResetBattle}
            onCheckForActions={handleCheckForActions}
            loading={loading}
            userAction={userAction}
            battlePhase={battlePhase}
            battleLog={battleLog}
            contractAddress={contractAddress}
            contractABI={contractABI}
          />
        );

      default:
        return (
          <div>
            <MainMenu
              onNavigate={navigateToScreen}
              isConnected={!!currentWalletAddress}
            />


          </div>
        );
    }
  };

  return (
    <div className="relative">
      {/* Header with Back Button, Wallet Widget, and Notifications */}
      <div className="fixed top-4 left-4 z-50">
        {currentScreen !== 'menu' && currentScreen !== 'battle' && (
          <button
            onClick={() => navigateToScreen('menu')}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${loading
              ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
              : 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border border-white/20'
              }`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Menu</span>
          </button>
        )}
      </div>

      {/* Dynamic Wallet Widget - Always visible */}
      <div className="fixed top-4 right-4 z-50">
        <DynamicWidget />
      </div>

      {/* Main App */}
      {renderCurrentScreen()}

      {/* Global Message Display */}
      {message && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-out ${isMessageVisible
          ? 'translate-y-0 opacity-100'
          : '-translate-y-full opacity-0'
          }`}>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-3 text-white font-medium shadow-lg">
            {message}
          </div>
        </div>
      )}
    </div>
  );
}

// Main Export
export default function Home() {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: 'a351eb71-be4d-4287-a6ef-d30d0c1ccf81',
        overrides: { evmNetworks },
        walletConnectors: [EthereumWalletConnectors, FlowWalletConnectors],
      }}
    >
      <AppContent />
    </DynamicContextProvider>
  );
}
