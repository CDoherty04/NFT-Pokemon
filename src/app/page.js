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
  // App state
  const [currentScreen, setCurrentScreen] = useState('menu'); // 'menu', 'create', 'join', 'battle'
  const [showWalletWidget, setShowWalletWidget] = useState(false);

  // Game state
  const [sessions, setSessions] = useState([]);
  const [currentBattle, setCurrentBattle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Battle state
  const [userAction, setUserAction] = useState('');
  const [battlePhase, setBattlePhase] = useState('waiting');
  const [battleLog, setBattleLog] = useState([]);

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

  // Navigation functions
  const navigateToScreen = (screen) => {
    console.log('Navigating to screen:', screen, 'from current screen:', currentScreen);
    setCurrentScreen(screen);
    setMessage('');
  };

  // Game creation functions
  const handleCreateGame = async (avatarImage, attributes) => {
    if (!avatarImage) {
      setMessage('Please draw your Pokemon first!');
      return;
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
      const response = await fetch(`/api/sessions/${sessionId}`);
      const data = await response.json();
      
      if (data.success && data.session) {
        // Update the sessions list with the latest data
        await fetchSessions();
        
        // Check if we can now continue to battle
        if (data.session.status === 'active' && data.session.user1 && data.session.user2) {
          setCurrentBattle(data.session);
          setBattlePhase('action-selection');
          setBattleLog([
            `Battle started between ${data.session.user1?.walletAddress?.substring(0, 10)}... and ${data.session.user2?.walletAddress?.substring(0, 10)}...`,
            'Both Pokemon are ready for battle!',
            'Choose your actions simultaneously!'
          ]);
          
          // Show success message
          setMessage('🎉 Opponent joined! Starting battle...');
          
          // Automatically navigate to battle screen after a short delay
          setTimeout(() => {
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
          setBattleLog([
            `Battle started between ${data.session.user1?.walletAddress?.substring(0, 10)}... and ${data.session.user2?.walletAddress?.substring(0, 10)}...`,
            'Both Pokemon are ready for battle!',
            'Choose your actions simultaneously!'
          ]);
          
          // Check for existing actions
          if (data.session.user1Action || data.session.user2Action) {
            console.log('Actions already submitted - user1:', data.session.user1Action, 'user2:', data.session.user2Action);
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
  const handleJoinGame = async (gameCode, avatarImage, attributes) => {
    if (!avatarImage) {
      setMessage('Please draw your Pokemon first!');
      return;
    }

    setLoading(true);
    try {
      console.log('Joining game with code:', gameCode);
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
      
      if (data.success) {
        setMessage('✅ Successfully joined the battle!');
        
        // Check if we can continue to battle
        if (data.session.status === 'active') {
          console.log('Session is active, setting up battle state...');
          
          // Set battle state immediately
          setCurrentBattle(data.session);
          setBattlePhase('action-selection');
          setBattleLog([
            `Battle started between ${data.session.user2?.walletAddress?.substring(0, 10)}... and ${data.session.user1?.walletAddress?.substring(0, 10)}...`,
            'Both Pokemon are ready for battle!',
            'Choose your actions simultaneously!'
          ]);
          
          // Check if there are already actions submitted
          if (data.session.user1Action || data.session.user2Action) {
            console.log('Actions already submitted - user1:', data.session.user1Action, 'user2:', data.session.user2Action);
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
      if (data.success) {
        setUserAction(action);
        setMessage(`✅ Action submitted: ${action}`);
        
        if (data.session) {
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
          
          if (battlePhase === 'completed') {
            setMessage(`🎯 New battle started! Both players have full health.`);
            setBattleLog([
              `New battle started between ${data.session.user1?.walletAddress?.substring(0, 10)}... and ${data.session.user2?.walletAddress?.substring(0, 10)}...`,
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

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions');
      const data = await response.json();
      if (data.success) {
        setSessions(data.sessions);
        
        // Only update battle state if we don't already have an active battle
        // This prevents overriding the battle state when a user just joined
        if (!currentBattle || currentBattle.status !== 'active') {
          const activeSession = data.sessions.find(session =>
            session.status === 'active' &&
            (session.user1?.walletAddress === currentWalletAddress ||
              session.user2?.walletAddress === currentWalletAddress)
          );
          
          if (activeSession) {
            setCurrentBattle(activeSession);
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
      // Only update battle state if we don't already have an active battle
      // This prevents overriding the battle state when a user just joined
      if (!currentBattle || currentBattle.status !== 'active') {
        const activeSession = sessions.find(session =>
          session.status === 'active' &&
          (session.user1?.walletAddress === currentWalletAddress ||
            session.user2?.walletAddress === currentWalletAddress)
        );
        
        if (activeSession) {
          setCurrentBattle(activeSession);
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
      console.log('Starting auto-refresh for battle:', currentBattle.sessionId);
      
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/sessions/${currentBattle.sessionId}`);
          const data = await response.json();

          if (data.success && data.session) {
            const updatedSession = data.session;
            
            // Check if actions were reset (new round)
            if (updatedSession.user1Action === '' && updatedSession.user2Action === '') {
              setUserAction('');
              setCurrentBattle(updatedSession);
              // Only show message if we're on the battle screen
              if (currentScreen === 'battle') {
                setMessage('🎯 New round starting! Choose your action.');
              }
              return;
            }

            // Check if round number increased
            if (updatedSession.currentRound > currentBattle.currentRound) {
              setUserAction('');
              setCurrentBattle(updatedSession);
              // Only show message if we're on the battle screen
              if (currentScreen === 'battle') {
                setMessage(`🎯 Round ${updatedSession.currentRound} started! Choose your action.`);
              }
              return;
            }

            // Check for new actions from opponent
            if (updatedSession.user1Action && updatedSession.user1Action !== currentBattle.user1Action) {
              console.log('Auto-refresh: Opponent 1 submitted action:', updatedSession.user1Action);
              setCurrentBattle(updatedSession);
            }
            
            if (updatedSession.user2Action && updatedSession.user2Action !== currentBattle.user2Action) {
              console.log('Auto-refresh: Opponent 2 submitted action:', updatedSession.user2Action);
              setCurrentBattle(updatedSession);
            }

            // Update battle log
            if (updatedSession.battleLog && updatedSession.battleLog.length > 0) {
              const currentLogLength = currentBattle.battleLog ? currentBattle.battleLog.length : 0;
              if (updatedSession.battleLog.length > currentLogLength) {
                const newMessages = updatedSession.battleLog.slice(currentLogLength).map(log => log.message);
                setBattleLog(prev => [...prev, ...newMessages]);
              }
            }

            // Update current battle with latest data
            if (JSON.stringify(updatedSession) !== JSON.stringify(currentBattle)) {
              setCurrentBattle(updatedSession);
            }
          }
        } catch (error) {
          console.error('Error refreshing battle:', error);
        }
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [currentBattle, currentWalletAddress, currentScreen]);

  // Get current session for create/join screens
  const getCurrentSession = () => {
    if (!currentWalletAddress) return null;
    
    const session = sessions.find(session => {
      const user1Match = session.user1?.walletAddress === currentWalletAddress;
      const user2Match = session.user2?.walletAddress === currentWalletAddress;
      
      console.log('Session check:', {
        sessionId: session.sessionId,
        user1Wallet: session.user1?.walletAddress,
        user2Wallet: session.user2?.walletAddress,
        currentWallet: currentWalletAddress,
        user1Match,
        user2Match
      });
      
      return user1Match || user2Match;
    });
    
    console.log('getCurrentSession result:', {
      currentWalletAddress: currentWalletAddress?.substring(0, 10) + '...',
      totalSessions: sessions.length,
      foundSession: !!session,
      sessionStatus: session?.status,
      sessionId: session?.sessionId
    });
    
    return session;
  };

  const canContinueToBattle = () => {
    const session = getCurrentSession();
    const canContinue = session && session.status === 'active' && session.user1 && session.user2;
    
    console.log('canContinueToBattle check:', {
      hasSession: !!session,
      sessionStatus: session?.status,
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
          />
        );
      
      default:
        return (
          <MainMenu
            onNavigate={navigateToScreen}
            isConnected={!!currentWalletAddress}
          />
        );
    }
  };

  return (
    <div className="relative">
      {/* Header with Back Button, Wallet Widget, and Notifications */}
      <div className="fixed top-4 left-4 z-50">
        {currentScreen !== 'menu' && (
          <button
            onClick={() => navigateToScreen('menu')}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              loading
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
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-3 text-white font-medium">
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
