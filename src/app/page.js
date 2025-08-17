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
import abi from './utils/abi';

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
    setCurrentScreen(screen);
    setMessage('');
  };

  const handleConnectWallet = () => {
    setShowWalletWidget(true);
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
        // Stay on create screen to show the session ID
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
      if (data.success) {
        setMessage('✅ Successfully joined the battle!');
        await fetchSessions();
        // Check if we can continue to battle
        if (data.session.status === 'active') {
          setCurrentBattle(data.session);
          setBattlePhase('action-selection');
          setBattleLog([
            `Battle started between ${data.session.user1?.walletAddress?.substring(0, 10)}... and ${data.session.user2?.walletAddress?.substring(0, 10)}...`,
            'Both Pokemon are ready for battle!',
            'Choose your actions simultaneously!'
          ]);
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
        // Check for active battle
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
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  // Check for active battle whenever sessions change
  useEffect(() => {
    if (sessions.length > 0 && currentWalletAddress) {
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
  }, [sessions, currentWalletAddress]);

  // Periodically refresh current battle
  useEffect(() => {
    if (currentBattle && battlePhase === 'action-selection') {
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
              setMessage('🎯 New round starting! Choose your action.');
              return;
            }

            // Check if round number increased
            if (updatedSession.currentRound > currentBattle.currentRound) {
              setUserAction('');
              setCurrentBattle(updatedSession);
              setMessage(`🎯 Round ${updatedSession.currentRound} started! Choose your action.`);
              return;
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
  }, [currentBattle, battlePhase, currentWalletAddress]);

  // Get current session for create/join screens
  const getCurrentSession = () => {
    if (!currentWalletAddress) return null;
    
    const session = sessions.find(session =>
      session.user1?.walletAddress === currentWalletAddress ||
      session.user2?.walletAddress === currentWalletAddress
    );
    
    console.log('getCurrentSession:', {
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
    console.log('canContinueToBattle check:', {
      hasSession: !!session,
      sessionStatus: session?.status,
      hasUser1: !!session?.user1,
      hasUser2: !!session?.user2,
      sessionId: session?.sessionId
    });
    return session && session.status === 'active' && session.user1 && session.user2;
  };

  // Render current screen
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'create':
        return (
          <CreateGameScreen
            onBack={() => navigateToScreen('menu')}
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
            onBack={() => navigateToScreen('menu')}
            onJoinGame={handleJoinGame}
            onContinueToBattle={handleContinueToBattle}
            canContinue={canContinueToBattle()}
          />
        );
      
      case 'battle':
        return (
          <BattleScreen
            onBack={() => navigateToScreen('menu')}
            currentBattle={currentBattle}
            currentWalletAddress={currentWalletAddress}
            onSubmitAction={handleSubmitAction}
            onResetBattle={handleResetBattle}
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
            onConnectWallet={handleConnectWallet}
          />
        );
    }
  };

  return (
    <div className="relative">
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
