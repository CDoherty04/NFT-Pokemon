'use client';

import { useState, useEffect } from 'react';
import { RefreshCcw as RefreshCcwIcon, Palette } from 'lucide-react';
import DrawingApp from './components/DrawingApp';
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { FlowWalletConnectors } from "@dynamic-labs/flow";
import { ethers } from 'ethers';
import { BATTLE_ACTIONS, getBattleActionDescriptions } from './utils/battleLogic.js';
import {
  DynamicContextProvider,
  DynamicWidget,
} from "@dynamic-labs/sdk-react-core";

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
  },
  {
    blockExplorerUrls: ['https://polygonscan.com/'],
    chainId: 137,
    chainName: 'Matic Mainnet',
    iconUrls: ["https://app.dynamic.xyz/assets/networks/polygon.svg"],
    name: 'Polygon',
    nativeCurrency: {
      decimals: 18,
      name: 'MATIC',
      symbol: 'MATIC',
      iconUrl: 'https://app.dynamic.xyz/assets/networks/polygon.svg',
    },
    networkId: 137,
    rpcUrls: ['https://polygon-rpc.com'],
    vanityName: 'Polygon',
  }
];

export default function Home() {
  const [sessions, setSessions] = useState([]);
  const [waitingSessions, setWaitingSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('create'); // 'create', 'join', 'sessions', 'battle'

  // Wallet address will be provided by Dynamic wallet management
  const [currentWalletAddress, setCurrentWalletAddress] = useState(null);

  // Smart contract state
  const [contractAddress] = useState('0x67F4Eced0ba49Af4C25Fe70493Aa4C1B075414C2');
  const [contractABI] = useState([
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "approve",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "ERC721IncorrectOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "ERC721InsufficientApproval",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "approver",
          "type": "address"
        }
      ],
      "name": "ERC721InvalidApprover",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        }
      ],
      "name": "ERC721InvalidOperator",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "ERC721InvalidOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "receiver",
          "type": "address"
        }
      ],
      "name": "ERC721InvalidReceiver",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        }
      ],
      "name": "ERC721InvalidSender",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "ERC721NonexistentToken",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "approved",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "Approval",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "approved",
          "type": "bool"
        }
      ],
      "name": "ApprovalForAll",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "_fromTokenId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "_toTokenId",
          "type": "uint256"
        }
      ],
      "name": "BatchMetadataUpdate",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "_tokenId",
          "type": "uint256"
        }
      ],
      "name": "MetadataUpdate",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "recipient",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "tokenURI",
          "type": "string"
        }
      ],
      "name": "mint",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "safeTransferFrom",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "data",
          "type": "bytes"
        }
      ],
      "name": "safeTransferFrom",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "approved",
          "type": "bool"
        }
      ],
      "name": "setApprovalForAll",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "Transfer",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "transferFrom",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "getApproved",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        }
      ],
      "name": "isApprovedForAll",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "name",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "ownerOf",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes4",
          "name": "interfaceId",
          "type": "bytes4"
        }
      ],
      "name": "supportsInterface",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "symbol",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "tokenURI",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]);






  // Current active battle session for the user
  const [currentBattle, setCurrentBattle] = useState(null);

  // Battle action tracking
  const [userAction, setUserAction] = useState('');
  const [battlePhase, setBattlePhase] = useState('waiting');
  const [battleLog, setBattleLog] = useState([]);

  // Drawing overlay state
  const [isDrawingOpen, setIsDrawingOpen] = useState(false);
  const [drawingFor, setDrawingFor] = useState(''); // 'create' or 'join'

  // Form data for creating a session
  const [createFormData, setCreateFormData] = useState({
    user1: {
      walletAddress: currentWalletAddress,
      image: '',
      attributes: { attack: 1, defense: 1, speed: 1 }
    }
  });

  // Form data for joining a session
  const [joinFormData, setJoinFormData] = useState({
    sessionId: '',
    user2: {
      walletAddress: currentWalletAddress,
      image: '',
      attributes: { attack: 1, defense: 1, speed: 1 }
    }
  });

  // Check if current user has an active battle
  const checkForActiveBattle = () => {
    const activeSession = sessions.find(session =>
      session.status === 'active' &&
      (session.user1?.walletAddress === currentWalletAddress ||
        session.user2?.walletAddress === currentWalletAddress)
    );

    console.log('Checking for active battle:', {
      activeSession,
      currentWalletAddress,
      sessions: sessions.map(s => ({ id: s.sessionId, status: s.status, battlePhase: s.battlePhase })),
      currentUserAction: userAction
    });

    if (activeSession) {
      setCurrentBattle(activeSession);
      setActiveTab('battle');

      // Set battle phase from session - if status is active, battle should be ready
      const sessionBattlePhase = activeSession.battlePhase || 'waiting';
      if (activeSession.status === 'active' && sessionBattlePhase === 'waiting') {
        setBattlePhase('action-selection');
        console.log('Setting battle phase to action-selection because session is active');
      } else {
        setBattlePhase(sessionBattlePhase);
        console.log('Setting battle phase to:', sessionBattlePhase);
      }

      // Determine which role the current user has and set their action accordingly
      const isUser1 = activeSession.user1?.walletAddress === currentWalletAddress;
      const isUser2 = activeSession.user2?.walletAddress === currentWalletAddress;

      console.log('User role detection:', { isUser1, isUser2, currentWalletAddress, user1Wallet: activeSession.user1?.walletAddress, user2Wallet: activeSession.user2?.walletAddress });

      if (!userAction) {
        if (isUser1) {
          const newUserAction = activeSession.user1Action || '';
          setUserAction(newUserAction);
          console.log('Setting user action from session (user1):', newUserAction);
        } else if (isUser2) {
          const newUserAction = activeSession.user2Action || '';
          setUserAction(newUserAction);
          console.log('Setting user action from session (user2):', newUserAction);
        }
      } else {
        console.log('Preserving existing user action:', userAction);
      }

      // Initialize battle log
      const initialLog = [
        `Battle started between ${activeSession.user1?.walletAddress?.substring(0, 10)}... and ${activeSession.user2?.walletAddress?.substring(0, 10)}...`,
        'Both Pokemon are ready for battle!',
        'Choose your actions simultaneously!'
      ];

      // Add any existing battle log messages from the session
      if (activeSession.battleLog && activeSession.battleLog.length > 0) {
        const sessionMessages = activeSession.battleLog.map(log => log.message);
        setBattleLog([...initialLog, ...sessionMessages]);
      } else {
        setBattleLog(initialLog);
      }
    } else {
      console.log('No active battle found, resetting state');
      setCurrentBattle(null);
      setBattleLog([]);
      setBattlePhase('waiting');
      setUserAction('');
    }
  };

  // Check if it's the current user's turn
  const isUserTurn = () => {
    if (!currentBattle) return false;

    if (currentBattle.user1?.walletAddress === currentWalletAddress) {
      return true;
    }
    if (currentBattle.user2?.walletAddress === currentWalletAddress) {
      return true;
    }
    return false;
  };

  // Get the current user's role (user1 or user2)
  const getUserRole = () => {
    if (!currentBattle) return null;

    if (currentBattle.user1?.walletAddress === currentWalletAddress) {
      return 'user1';
    }
    if (currentBattle.user2?.walletAddress === currentWalletAddress) {
      return 'user2';
    }
    return null;
  };

  // Create a new session with only user1
  const createSession = async () => {
    if (!createFormData.user1.walletAddress) {
      setMessage('Please fill in user1 wallet address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user1: createFormData.user1 })
      });
      const data = await response.json();

      if (data.success) {
        setMessage(`✅ Session created! ID: ${data.session.sessionId} - Share this ID with user2 to join`);
        setCreateFormData({
          user1: {
            walletAddress: '',
            image: '',
            attributes: { attack: 1, defense: 1, speed: 1 }
          }
        });
        fetchSessions();
        fetchWaitingSessions();
        setActiveTab('sessions');
      } else {
        setMessage('❌ Error: ' + data.error);
      }
    } catch (error) {
      setMessage('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Join an existing session with user2
  const joinSession = async () => {
    if (!joinFormData.sessionId || !joinFormData.user2.walletAddress) {
      setMessage('Please fill in both session ID and user2 wallet address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(joinFormData)
      });
      const data = await response.json();

      if (data.success) {
        setMessage(`✅ Successfully joined session! Session is now active`);
        setJoinFormData({
          sessionId: '',
          user2: {
            walletAddress: '',
            image: '',
            attributes: { attack: 1, defense: 1, speed: 1 }
          }
        });
        fetchSessions();
        fetchWaitingSessions();
        setActiveTab('sessions');
      } else {
        setMessage('❌ Error: ' + data.error);
      }
    } catch (error) {
      setMessage('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all sessions
  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sessions');
      const data = await response.json();
      if (data.success) {
        console.log('Fetched sessions data:', data.sessions);
        setSessions(data.sessions);
        setMessage(`📋 Found ${data.sessions.length} total sessions`);
        // Check for active battle after fetching sessions
        checkForActiveBattle();
      } else {
        setMessage('❌ Error fetching sessions: ' + data.error);
      }
    } catch (error) {
      setMessage('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch waiting sessions
  const fetchWaitingSessions = async () => {
    try {
      const response = await fetch('/api/sessions?type=waiting');
      const data = await response.json();
      if (data.success) {
        setWaitingSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error fetching waiting sessions:', error);
    }
  };

  // Copy session ID to clipboard
  const copySessionId = (sessionId) => {
    navigator.clipboard.writeText(sessionId);
    setMessage('📋 Session ID copied to clipboard!');
  };

  // Open drawing overlay
  const openDrawing = (forForm) => {
    setDrawingFor(forForm);
    setIsDrawingOpen(true);
  };

  // Save drawn image
  const saveDrawnImage = (imageDataUrl) => {
    if (drawingFor === 'create') {
      setCreateFormData(prev => ({
        ...prev,
        user1: { ...prev.user1, image: imageDataUrl }
      }));
    } else if (drawingFor === 'join') {
      setJoinFormData(prev => ({
        ...prev,
        user2: { ...prev.user2, image: imageDataUrl }
      }));
    }
    setMessage('🎨 Drawing saved! You can now create or join a battle.');
  };

  // Helper functions for health calculations
  const getMaxHealth = (defense) => 100 + (defense * 20);
  const getHealthPercentage = (currentHealth, maxHealth) => Math.max(0, Math.min(100, (currentHealth / maxHealth) * 100));
  const getHealthColor = (percentage) => {
    if (percentage > 60) return 'bg-green-500';
    if (percentage > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Helper function to get current player stats
  const getCurrentPlayerStats = () => {
    if (!currentBattle || !currentWalletAddress) return null;

    if (currentBattle.user1?.walletAddress === currentWalletAddress) {
      return currentBattle.user1?.attributes;
    } else if (currentBattle.user2?.walletAddress === currentWalletAddress) {
      return currentBattle.user2?.attributes;
    }
    return null;
  };

  // Helper function to get opponent stats
  const getOpponentStats = () => {
    if (!currentBattle || !currentWalletAddress) return null;

    if (currentBattle.user1?.walletAddress === currentWalletAddress) {
      return currentBattle.user2?.attributes;
    } else if (currentBattle.user2?.walletAddress === currentWalletAddress) {
      return currentBattle.user1?.attributes;
    }
    return null;
  };

  // Battle action functions
  const submitAction = async (action) => {
    if (!currentBattle || !isUserTurn()) return;

    console.log('Submitting action:', action, 'for battle:', currentBattle.sessionId);
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
      console.log('Action submission response:', data);

      if (data.success) {
        // Always update the current battle with the latest session data
        if (data.session) {
          setCurrentBattle(data.session);

          // Check if this was a battle processing response
          if (data.battleProcessed) {
            // Battle was processed - actions are now reset
            setUserAction(''); // Clear user action immediately
            setBattlePhase('action-selection');
            setMessage(`✅ ${data.message} - New round starting!`);

            // Show notification for battle resolution
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification('Battle Resolved!', {
                body: 'Round completed! Check the battle log for results.',
                icon: '/favicon.ico'
              });
            }

            // Add battle resolution to log with enhanced formatting
            if (data.session.battleLog && data.session.battleLog.length > 0) {
              const latestLog = data.session.battleLog[data.session.battleLog.length - 1];
              const roundNumber = data.session.currentRound - 1;

              // Add round completion message with better formatting
              setBattleLog(prev => [
                ...prev,
                `🎯 Round ${roundNumber} completed!`,
                `⚔️ ${latestLog.message}`,
                `❤️ User1 Health: ${data.session.user1Health}/${getMaxHealth(data.session.user1?.attributes?.defense || 0)}`,
                `❤️ User2 Health: ${data.session.user2Health}/${getMaxHealth(data.session.user2?.attributes?.defense || 0)}`
              ]);

              // Check if battle is complete
              if (data.session.battlePhase === 'completed') {
                const winner = data.session.user1Health <= 0 ? 'User2' : 'User1';
                setBattlePhase('completed');
                setBattleLog(prev => [...prev, `🏆 ${winner} wins the battle!`]);
                setMessage(`🏆 Battle Complete! ${winner} is victorious!`);

                // Show victory notification
                if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                  new Notification('Battle Complete!', {
                    body: `${winner} is victorious!`,
                    icon: '/favicon.ico'
                  });
                }
              } else {
                // Show countdown for next round
                setMessage(`🎯 Round ${data.session.currentRound} starting in 3 seconds...`);
                setTimeout(() => {
                  setMessage(`🎯 Round ${data.session.currentRound} started! Choose your action.`);
                }, 3000);
              }
            }
          } else {
            // Just an action submission
            setUserAction(action);
            setMessage(`✅ ${data.message}`);

            // Update battle phase if changed
            if (data.session.battlePhase && data.session.battlePhase !== battlePhase) {
              setBattlePhase(data.session.battlePhase);
            }
          }
        }
      } else {
        setMessage('❌ Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error submitting action:', error);
      setMessage('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetBattle = async () => {
    if (!currentBattle) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/sessions/${currentBattle.sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetBattle: true,
          startNewBattle: battlePhase === 'completed' // Start new battle if current is completed
        })
      });

      const data = await response.json();
      if (data.success) {
        // Always clear user action when resetting
        setUserAction('');
        console.log('User action cleared during battle reset');

        if (data.session) {
          setCurrentBattle(data.session);
          setBattlePhase(data.session.battlePhase || 'action-selection');

          if (battlePhase === 'completed') {
            // Starting a new battle
            setMessage(`🎯 New battle started! Both players have full health.`);
            setBattleLog([
              `New battle started between ${data.session.user1?.walletAddress?.substring(0, 10)}... and ${data.session.user2?.walletAddress?.substring(0, 10)}...`,
              'Both Pokemon are ready for battle!',
              'Choose your actions simultaneously!'
            ]);
          } else {
            // Resetting for next round
            setMessage(`🎯 Round ${data.session.currentRound} started! Choose your action.`);
          }
        }

        // Refresh the session to get the latest state
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

  // Force round transition if both players have actions but system is stuck
  const forceRoundTransition = async () => {
    if (!currentBattle) return;

    // Check if both players have submitted actions
    if (currentBattle.user1Action && currentBattle.user2Action) {
      setLoading(true);
      try {
        // Manually trigger battle processing by calling the API
        const response = await fetch(`/api/sessions/${currentBattle.sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: currentBattle.user1?.walletAddress === currentWalletAddress ?
              currentBattle.user1Action : currentBattle.user2Action,
            userWalletAddress: currentWalletAddress
          })
        });

        const data = await response.json();
        if (data.success) {
          setMessage('🔄 Round transition forced successfully');
          // Refresh to get updated state
          await fetchSessions();
        } else {
          setMessage('❌ Error forcing round transition: ' + data.error);
        }
      } catch (error) {
        setMessage('❌ Error: ' + error.message);
      } finally {
        setLoading(false);
      }
    } else {
      setMessage('⚠️ Both players must have submitted actions to force round transition');
    }
  };

  // Force clear user action (emergency function)
  const forceClearUserAction = () => {
    setUserAction('');
    setMessage('🔄 User action manually cleared');
    console.log('User action force cleared');
  };

  // Request notification permissions
  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Notification permission granted');
        }
      }
    }
  };

  const performPunch = () => submitAction(BATTLE_ACTIONS.PUNCH);
  const performKick = () => submitAction(BATTLE_ACTIONS.KICK);
  const performDodge = () => submitAction(BATTLE_ACTIONS.DODGE);
  const performBlock = () => submitAction(BATTLE_ACTIONS.BLOCK);

  useEffect(() => {
    fetchWaitingSessions();
    requestNotificationPermission(); // Request notification permissions
  }, []);



  // Check for active battle whenever sessions change
  useEffect(() => {
    checkForActiveBattle();
  }, [sessions, currentWalletAddress]);

  // Periodically refresh current battle to check for opponent actions and round changes
  useEffect(() => {
    if (currentBattle && battlePhase === 'action-selection') {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/sessions/${currentBattle.sessionId}`);
          const data = await response.json();

          if (data.success && data.session) {
            const updatedSession = data.session;

            console.log('Periodic refresh - checking for changes:', {
              currentBattle: {
                user1Action: currentBattle.user1Action,
                user2Action: currentBattle.user2Action,
                currentRound: currentBattle.currentRound,
                battlePhase: currentBattle.battlePhase
              },
              updatedSession: {
                user1Action: updatedSession.user1Action,
                user2Action: updatedSession.user2Action,
                currentRound: updatedSession.currentRound,
                battlePhase: updatedSession.battlePhase
              }
            });

            // Check if actions were reset (indicating a new round started)
            const actionsWereReset = updatedSession.user1Action === '' && updatedSession.user2Action === '';
            const previousActions = currentBattle.user1Action !== '' || currentBattle.user2Action !== '';

            if (actionsWereReset && previousActions) {
              console.log('🔄 Actions reset detected - new round starting!');
              setUserAction(''); // Clear user action for new round
              setCurrentBattle(updatedSession);
              setMessage('🎯 New round starting! Choose your action.');
              return;
            }

            // Check if round number increased
            if (updatedSession.currentRound > currentBattle.currentRound) {
              console.log('🔄 Round number increased - new round starting!');
              setUserAction(''); // Clear user action for new round
              setCurrentBattle(updatedSession);
              setMessage(`🎯 Round ${updatedSession.currentRound} started! Choose your action.`);
              return;
            }

            // Check if battle phase changed
            if (updatedSession.battlePhase !== battlePhase) {
              console.log('🔄 Battle phase changed:', updatedSession.battlePhase);
              setBattlePhase(updatedSession.battlePhase);
              setCurrentBattle(updatedSession);

              // If phase changed to action-selection, clear user action
              if (updatedSession.battlePhase === 'action-selection') {
                setUserAction('');
                setMessage('🎯 New round ready! Choose your action.');
              }
              return;
            }

            // Check if the current user's action was reset (for opponent's perspective)
            const currentUserRole = currentBattle.user1?.walletAddress === currentWalletAddress ? 'user1' : 'user2';
            const currentUserActionField = currentUserRole === 'user1' ? 'user1Action' : 'user2Action';
            const previousUserAction = currentBattle[currentUserActionField];
            const currentUserAction = updatedSession[currentUserActionField];

            console.log('Checking user action reset:', {
              currentUserRole,
              currentUserActionField,
              previousUserAction,
              currentUserAction,
              currentWalletAddress
            });

            if (previousUserAction && !currentUserAction) {
              console.log('🔄 Current user action was reset - new round starting!');
              setUserAction(''); // Clear user action for new round
              setCurrentBattle(updatedSession);
              setMessage('🎯 New round starting! Choose your action.');
              return;
            }

            // Check if opponent submitted an action (show it in the UI)
            const opponentActionField = currentUserRole === 'user1' ? 'user2Action' : 'user1Action';
            const previousOpponentAction = currentBattle[opponentActionField];
            const currentOpponentAction = updatedSession[opponentActionField];

            if (!previousOpponentAction && currentOpponentAction) {
              console.log('🔄 Opponent submitted action:', currentOpponentAction);
              setCurrentBattle(updatedSession);
              setMessage(`🎯 Opponent chose: ${currentOpponentAction}`);
              return;
            }

            // Check if both players now have actions (battle should resolve soon)
            if (updatedSession.user1Action && updatedSession.user2Action &&
              (!currentBattle.user1Action || !currentBattle.user2Action)) {
              console.log('🔄 Both players have submitted actions - battle will resolve soon');
              setCurrentBattle(updatedSession);
              setMessage('⚔️ Both actions submitted! Battle resolving...');

              // Show notification that both actions are submitted
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                new Notification('Battle Ready!', {
                  body: 'Both players have submitted actions. Battle resolving...',
                  icon: '/favicon.ico'
                });
              }

              // Add a small delay to show the "resolving" message, then check for resolution
              setTimeout(async () => {
                try {
                  const resolutionResponse = await fetch(`/api/sessions/${currentBattle.sessionId}`);
                  const resolutionData = await resolutionResponse.json();

                  if (resolutionData.success && resolutionData.session) {
                    const resolvedSession = resolutionData.session;

                    // Check if battle was resolved (actions reset)
                    if (resolvedSession.user1Action === '' && resolvedSession.user2Action === '') {
                      console.log('🎯 Battle resolved! Actions reset for next round');
                      setCurrentBattle(resolvedSession);
                      setUserAction('');
                      setBattlePhase(resolvedSession.battlePhase || 'action-selection');

                      // Show notification for battle resolution
                      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                        new Notification('Battle Resolved!', {
                          body: 'Round completed! Check the battle log for results.',
                          icon: '/favicon.ico'
                        });
                      }

                      // Add battle resolution to log
                      if (resolvedSession.battleLog && resolvedSession.battleLog.length > 0) {
                        const latestLog = resolvedSession.battleLog[resolvedSession.battleLog.length - 1];
                        const roundNumber = resolvedSession.currentRound - 1;

                        setBattleLog(prev => [
                          ...prev,
                          `🎯 Round ${roundNumber} completed!`,
                          `⚔️ ${latestLog.message}`,
                          `❤️ User1 Health: ${resolvedSession.user1Health}/${getMaxHealth(resolvedSession.user1?.attributes?.defense || 0)}`,
                          `❤️ User2 Health: ${resolvedSession.user2Health}/${getMaxHealth(resolvedSession.user2?.attributes?.defense || 0)}`
                        ]);

                        // Check if battle is complete
                        if (resolvedSession.battlePhase === 'completed') {
                          const winner = resolvedSession.user1Health <= 0 ? 'User2' : 'User1';
                          setBattlePhase('completed');
                          setBattleLog(prev => [...prev, `🏆 ${winner} wins the battle!`]);
                          setMessage(`🏆 Battle Complete! ${winner} is victorious!`);

                          // Show victory notification
                          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                            new Notification('Battle Complete!', {
                              body: `${winner} is victorious!`,
                              icon: '/favicon.ico'
                            });
                          }
                        } else {
                          setMessage(`🎯 Round ${resolvedSession.currentRound} started! Choose your action.`);
                        }
                      }
                    }
                  }
                } catch (error) {
                  console.error('Error checking battle resolution:', error);
                }
              }, 2000); // Wait 2 seconds for battle processing

              return;
            }

            // Update battle log with new messages
            if (updatedSession.battleLog && updatedSession.battleLog.length > 0) {
              const currentLogLength = currentBattle.battleLog ? currentBattle.battleLog.length : 0;
              if (updatedSession.battleLog.length > currentLogLength) {
                const newMessages = updatedSession.battleLog.slice(currentLogLength).map(log => log.message);
                setBattleLog(prev => [...prev, ...newMessages]);
              }
            }

            // Update current battle with latest data if there are any changes
            if (JSON.stringify(updatedSession) !== JSON.stringify(currentBattle)) {
              console.log('🔄 Updating battle state with new data');
              setCurrentBattle(updatedSession);
            }
          }
        } catch (error) {
          console.error('Error refreshing battle:', error);
        }
      }, 1500); // Check every 1.5 seconds

      return () => clearInterval(interval);
    }
  }, [currentBattle, battlePhase, currentWalletAddress]);

  // Update form data when wallet address changes
  useEffect(() => {
    setCreateFormData(prev => ({
      ...prev,
      user1: { ...prev.user1, walletAddress: currentWalletAddress }
    }));
    setJoinFormData(prev => ({
      ...prev,
      user2: { ...prev.user2, walletAddress: currentWalletAddress }
    }));
  }, [currentWalletAddress]);

  return (
    <DynamicContextProvider
      settings={{
        environmentId: 'a351eb71-be4d-4287-a6ef-d30d0c1ccf81',
        overrides: { evmNetworks },
        walletConnectors: [EthereumWalletConnectors, FlowWalletConnectors],
      }}
    >
      <DynamicWidget />

      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">


          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setActiveTab('create')}
                className={`px-4 py-2 rounded font-medium ${activeTab === 'create'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                Start Battle
              </button>
              <button
                onClick={() => setActiveTab('join')}
                className={`px-4 py-2 rounded font-medium ${activeTab === 'join'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                Join Battle
              </button>
              <button
                onClick={() => setActiveTab('sessions')}
                className={`px-4 py-2 rounded font-medium ${activeTab === 'sessions'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                View Active Battles ({sessions.length})
              </button>
              <button
                onClick={() => setActiveTab('waiting')}
                className={`px-4 py-2 rounded font-medium ${activeTab === 'waiting'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                View Pending Battles ({waitingSessions.length})
              </button>
              {currentBattle && (
                <button
                  onClick={() => setActiveTab('battle')}
                  className={`px-4 py-2 rounded font-medium ${activeTab === 'battle'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                >
                  🚨 Active Battle
                </button>
              )}
            </div>

            {/* Refresh Button */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={fetchSessions}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                <RefreshCcwIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Battle Screen Tab */}
          {activeTab === 'battle' && currentBattle && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-red-600 mb-2">🚨 BATTLE IN PROGRESS 🚨</h2>
                <p className="text-gray-600">Session ID: {currentBattle.sessionId}</p>
              </div>

              {/* Battle Arena */}
              <div className="bg-gradient-to-br from-red-100 to-orange-100 rounded-lg p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Player 1 Pokemon */}
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-4 text-blue-600">
                      {currentBattle.user1?.walletAddress === currentWalletAddress ? 'Your Pokemon' : 'Opponent Pokemon'}
                    </h3>
                    <div className="bg-white rounded-lg p-4 shadow-lg">
                      {currentBattle.user1?.image ? (
                        <img
                          src={currentBattle.user1.image}
                          alt="Pokemon"
                          className="w-32 h-32 mx-auto mb-4 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-32 h-32 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-500">No Image</span>
                        </div>
                      )}
                      <p className="font-mono text-sm text-gray-600 mb-2">
                        {currentBattle.user1?.walletAddress || 'Unknown'}
                      </p>

                      {/* Health Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>❤️ HP</span>
                          <span>{currentBattle.user1Health || 100}/{getMaxHealth(currentBattle.user1?.attributes?.defense || 0)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${getHealthColor(getHealthPercentage(currentBattle.user1Health || 100, getMaxHealth(currentBattle.user1?.attributes?.defense || 0)))}`}
                            style={{
                              width: `${getHealthPercentage(currentBattle.user1Health || 100, getMaxHealth(currentBattle.user1?.attributes?.defense || 0))}%`
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>⚔️ Attack:</span>
                          <span className="font-bold">{currentBattle.user1?.attributes?.attack || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>🛡️ Defense:</span>
                          <span className="font-bold">{currentBattle.user1?.attributes?.defense || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>⚡ Speed:</span>
                          <span className="font-bold">{currentBattle.user1?.attributes?.speed || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Player 2 Pokemon */}
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-4 text-red-600">
                      {currentBattle.user2?.walletAddress === currentWalletAddress ? 'Your Pokemon' : 'Opponent Pokemon'}
                    </h3>
                    <div className="bg-white rounded-lg p-4 shadow-lg">
                      {currentBattle.user2?.image ? (
                        <img
                          src={currentBattle.user2.image}
                          alt="Pokemon"
                          className="w-32 h-32 mx-auto mb-4 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-32 h-32 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-500">No Image</span>
                        </div>
                      )}
                      <p className="font-mono text-sm text-gray-600 mb-2">
                        {currentBattle.user2?.walletAddress || 'Unknown'}
                      </p>

                      {/* Health Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>❤️ HP</span>
                          <span>{currentBattle.user2Health || 100}/{getMaxHealth(currentBattle.user2?.attributes?.defense || 0)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${getHealthColor(getHealthPercentage(currentBattle.user2Health || 100, getMaxHealth(currentBattle.user2?.attributes?.defense || 0)))}`}
                            style={{
                              width: `${getHealthPercentage(currentBattle.user2Health || 100, getMaxHealth(currentBattle.user2?.attributes?.defense || 0))}%`
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>⚔️ Attack:</span>
                          <span className="font-bold">{currentBattle.user2?.attributes?.attack || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>🛡️ Defense:</span>
                          <span className="font-bold">{currentBattle.user2?.attributes?.defense || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>⚡ Speed:</span>
                          <span className="font-bold">{currentBattle.user2?.attributes?.speed || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Turn Indicator */}
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-6 text-center">

                {/* Battle Resolution Status */}
                {currentBattle?.user1Action && currentBattle?.user2Action && battlePhase === 'action-selection' && (
                  <div className="bg-orange-100 border-2 border-orange-300 rounded-lg p-3 mb-3">
                    <h4 className="text-lg font-bold text-orange-700 mb-2">⚔️ Battle Resolving!</h4>
                    <p className="text-orange-600 text-sm">
                      Both players have submitted actions. Battle is being processed...
                    </p>
                    <div className="flex justify-center mt-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                    </div>
                  </div>
                )}



                {/* Action Status */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded border">
                    <h4 className="font-medium text-sm mb-2">Your Action</h4>
                    <p className={`text-lg font-bold ${userAction ? 'text-green-600' : 'text-gray-500'
                      }`}>
                      {userAction || 'Not chosen'}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <h4 className="font-medium text-sm mb-2">Opponent Action</h4>
                    <p className={`text-lg font-bold ${currentBattle?.user1Action && currentBattle?.user2Action ? 'text-green-600' : 'text-gray-500'
                      }`}>
                      {currentBattle?.user1Action && currentBattle?.user2Action ?
                        (currentBattle.user1?.walletAddress === currentWalletAddress ?
                          currentBattle.user2Action : currentBattle.user1Action) :
                        (currentBattle?.user1?.walletAddress === currentWalletAddress ?
                          currentBattle?.user2Action : currentBattle?.user1Action) || 'Not chosen'}
                    </p>
                  </div>
                </div>

                {/* Both Actions Submitted Indicator */}
                {currentBattle?.user1Action && currentBattle?.user2Action && (
                  <div className="mt-3 bg-green-100 border-2 border-green-300 rounded-lg p-3 text-center">
                    <h4 className="font-medium text-green-700 mb-1">✅ Both Actions Submitted!</h4>
                    <p className="text-sm text-green-600">
                      Battle will resolve automatically in a few seconds...
                    </p>
                  </div>
                )}

                {/* Battle Phase Status */}
                <div className="mt-3 text-sm text-gray-600">
                  <p>Battle Phase: <span className="font-semibold capitalize">{(battlePhase || 'waiting').replace('-', ' ')}</span></p>
                  <p>Session Status: <span className="font-semibold">{currentBattle?.status || 'unknown'}</span></p>
                  <p>User Action: <span className="font-semibold">{userAction || 'none'}</span></p>
                  <p>User1 Action: <span className="font-semibold">{currentBattle?.user1Action || 'none'}</span></p>
                  <p>User2 Action: <span className="font-semibold">{currentBattle?.user2Action || 'none'}</span></p>
                  <p>Current User: <span className="font-semibold">{currentBattle?.user1?.walletAddress === currentWalletAddress ? 'User1' : 'User2'}</span></p>
                  {battlePhase === 'battle-resolution' && (
                    <button
                      onClick={resetBattle}
                      disabled={loading}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? 'Resetting...' : '🔄 Reset for Next Round'}
                    </button>
                  )}
                  {battlePhase === 'completed' && (
                    <div className="mt-2 space-y-2">
                      <button
                        onClick={resetBattle}
                        disabled={loading}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {loading ? 'Starting...' : '🎯 Start New Battle'}
                      </button>
                      <p className="text-sm text-gray-600">
                        Click to start a new battle with full health!
                      </p>
                    </div>
                  )}
                  {/* Manual reset button for stuck situations */}
                  {(battlePhase === 'action-selection' && userAction &&
                    currentBattle?.user1Action && currentBattle?.user2Action) && (
                      <div className="mt-2 space-y-2">
                        <button
                          onClick={resetBattle}
                          disabled={loading}
                          className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                        >
                          {loading ? 'Resetting...' : '⚠️ Manual Reset (if stuck)'}
                        </button>
                        <button
                          onClick={forceRoundTransition}
                          disabled={loading}
                          className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                        >
                          {loading ? 'Processing...' : '🚀 Force Round Transition'}
                        </button>
                      </div>
                    )}

                  {/* Manual clear action button */}
                  {battlePhase === 'action-selection' && userAction &&
                    (currentBattle?.user1Action === '' || currentBattle?.user2Action === '') && (
                      <div className="mt-2">
                        <button
                          onClick={forceClearUserAction}
                          className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                          🔄 Clear My Action (if stuck)
                        </button>
                      </div>
                    )}
                </div>
              </div>

              {/* Battle Actions */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-center">Battle Actions</h3>


                {/* Debug info */}
                <div className="text-xs text-gray-500 mb-4 p-2 bg-gray-100 rounded">
                  <p>Debug: Battle Phase: {battlePhase}</p>
                  <p>Debug: User Action: {userAction || 'empty'}</p>
                  <p>Debug: Session Status: {currentBattle?.status}</p>
                  <p>Debug: Can Submit: {((battlePhase === 'action-selection' || (currentBattle?.status === 'active' && !battlePhase)) && !userAction && !loading) ? 'Yes' : 'No'}</p>
                  <p>Debug: User1 Health: {currentBattle?.user1Health || 100}/{getMaxHealth(currentBattle?.user1?.attributes?.defense || 0)}</p>
                  <p>Debug: User2 Health: {currentBattle?.user2Health || 100}/{getMaxHealth(currentBattle?.user2?.attributes?.defense || 0)}</p>
                  <p>Debug: Actions Reset: {currentBattle?.user1Action === '' && currentBattle?.user2Action === '' ? 'Yes' : 'No'}</p>
                  <p>Debug: Round: {currentBattle?.currentRound || 1}</p>
                  <p>Debug: Both Actions Submitted: {(currentBattle?.user1Action && currentBattle?.user2Action) ? 'Yes' : 'No'}</p>
                  <p>Debug: Current User Role: {currentBattle?.user1?.walletAddress === currentWalletAddress ? 'user1' : 'user2'}</p>
                  <p>Debug: Current User Action Field: {currentBattle?.user1?.walletAddress === currentWalletAddress ? 'user1Action' : 'user2Action'}</p>
                  <p>Debug: Current Wallet: {currentWalletAddress}</p>
                  <p>Debug: User1 Wallet: {currentBattle?.user1?.walletAddress}</p>
                  <p>Debug: User2 Wallet: {currentBattle?.user2?.walletAddress}</p>
                  <p>Debug: Is User1: {currentBattle?.user1?.walletAddress === currentWalletAddress ? 'Yes' : 'No'}</p>
                  <p>Debug: Is User2: {currentBattle?.user2?.walletAddress === currentWalletAddress ? 'Yes' : 'No'}</p>
                  <p>Debug: User1 Action: {currentBattle?.user1Action || 'none'}</p>
                  <p>Debug: User2 Action: {currentBattle?.user2Action || 'none'}</p>
                  <p>Debug: Opponent Action (for current user): {currentBattle?.user1?.walletAddress === currentWalletAddress ?
                    (currentBattle?.user2Action || 'none') : (currentBattle?.user1Action || 'none')}</p>
                </div>

                {battlePhase === 'action-selection' && !userAction ? (
                  <div className="text-center mb-4">
                    <p className="text-green-600 font-medium">🎯 Choose your action below:</p>
                  </div>
                ) : battlePhase === 'action-selection' && userAction ? (
                  <div className="text-center mb-4">
                    <p className="text-blue-600 font-medium">✅ Action submitted: <span className="font-bold">{userAction}</span></p>
                    <p className="text-sm text-gray-600">Waiting for opponent to choose their action...</p>
                    <button
                      onClick={forceClearUserAction}
                      className="mt-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
                    >
                      🔄 Change My Action
                    </button>
                  </div>
                ) : battlePhase === 'battle-resolution' ? (
                  <div className="text-center mb-4">
                    <p className="text-purple-600 font-medium">⚔️ Battle resolved! Check the battle log below.</p>
                    {userAction && (
                      <p className="text-sm text-gray-600 mt-1">Your action: <span className="font-semibold">{userAction}</span></p>
                    )}
                  </div>
                ) : currentBattle?.status === 'active' && !battlePhase ? (
                  <div className="text-center mb-4">
                    <p className="text-green-600 font-medium">🎯 Battle is ready! Choose your action below:</p>
                  </div>
                ) : (
                  <div className="text-center mb-4">
                    <p className="text-gray-600">Battle not ready yet...</p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button
                    onClick={performPunch}
                    disabled={!((battlePhase === 'action-selection' || (currentBattle?.status === 'active' && !battlePhase)) && !userAction && !loading) || userAction || loading || battlePhase === 'completed'}
                    className={`px-6 py-3 rounded-lg font-bold text-lg transition-all duration-200 ${(battlePhase === 'action-selection' || (currentBattle?.status === 'active' && !battlePhase)) && !userAction && !loading && battlePhase !== 'completed'
                      ? 'bg-red-600 text-white hover:bg-red-700 cursor-pointer'
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-50'
                      }`}
                    title={getBattleActionDescriptions()[BATTLE_ACTIONS.PUNCH].description}
                  >
                    👊 Punch
                  </button>
                  <button
                    onClick={performKick}
                    disabled={!((battlePhase === 'action-selection' || (currentBattle?.status === 'active' && !battlePhase)) && !userAction && !loading) || userAction || loading || battlePhase === 'completed'}
                    className={`px-6 py-3 rounded-lg font-bold text-lg transition-all duration-200 ${(battlePhase === 'action-selection' || (currentBattle?.status === 'active' && !battlePhase)) && !userAction && !loading && battlePhase !== 'completed'
                      ? 'bg-orange-600 text-white hover:bg-orange-700 cursor-pointer'
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-50'
                      }`}
                    title={getBattleActionDescriptions()[BATTLE_ACTIONS.KICK].description}
                  >
                    🦵 Kick
                  </button>
                  <button
                    onClick={performDodge}
                    disabled={!((battlePhase === 'action-selection' || (currentBattle?.status === 'active' && !battlePhase)) && !userAction && !loading) || userAction || loading || battlePhase === 'completed'}
                    className={`px-6 py-3 rounded-lg font-bold text-lg transition-all duration-200 ${(battlePhase === 'action-selection' || (currentBattle?.status === 'active' && !battlePhase)) && !userAction && !loading && battlePhase !== 'completed'
                      ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-50'
                      }`}
                    title={getBattleActionDescriptions()[BATTLE_ACTIONS.DODGE].description}
                  >
                    💨 Dodge
                  </button>
                  <button
                    onClick={performBlock}
                    disabled={!((battlePhase === 'action-selection' || (currentBattle?.status === 'active' && !battlePhase)) && !userAction && !loading) || userAction || loading || battlePhase === 'completed'}
                    className={`px-6 py-3 rounded-lg font-bold text-lg transition-all duration-200 ${(battlePhase === 'action-selection' || (currentBattle?.status === 'active' && !battlePhase)) && !userAction && !loading && battlePhase !== 'completed'
                      ? 'bg-purple-600 text-white hover:bg-purple-700 cursor-pointer'
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-50'
                      }`}
                    title={getBattleActionDescriptions()[BATTLE_ACTIONS.BLOCK].description}
                  >
                    🛡️ Block
                  </button>
                </div>

                {/* Additional debug info for action buttons */}
                <div className="mt-4 text-xs text-gray-500 p-2 bg-gray-100 rounded">
                  <p>Action Button Debug:</p>
                  <p>Battle Phase: {battlePhase}</p>
                  <p>Session Status: {currentBattle?.status}</p>
                  <p>User Action: {userAction || 'none'}</p>
                  <p>Loading: {loading ? 'Yes' : 'No'}</p>
                  <p>Battle Completed: {battlePhase === 'completed' ? 'Yes' : 'No'}</p>
                  <p>Can Submit Actions: {((battlePhase === 'action-selection' || (currentBattle?.status === 'active' && !battlePhase)) && !userAction && !loading && battlePhase !== 'completed') ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {/* Battle Log */}
              <div className="mt-6 bg-black text-green-400 rounded-lg p-4 font-mono text-sm">
                <h4 className="text-white mb-2">Battle Log:</h4>
                {battleLog.length === 0 ? (
                  <p className="text-gray-500">No battle activity yet...</p>
                ) : (
                  battleLog.map((log, index) => (
                    <div key={index} className="mb-1">
                      {log.startsWith('🎯 Round') ? (
                        <span className="text-yellow-400 font-bold">{log}</span>
                      ) : log.includes('wins this round') ? (
                        <span className="text-yellow-400 font-bold">{log}</span>
                      ) : log.includes('Battle resolved') ? (
                        <span className="text-cyan-400">{log}</span>
                      ) : log.includes('damage') ? (
                        <span className="text-red-400 font-semibold">{log}</span>
                      ) : log.includes('Battle is complete') ? (
                        <span className="text-yellow-400 font-bold text-lg">{log}</span>
                      ) : log.includes('speed bonus') ? (
                        <span className="text-green-400 font-semibold">{log}</span>
                      ) : log.includes('gains') && log.includes('health') ? (
                        <span className="text-emerald-400 font-bold">{log}</span>
                      ) : log.includes('Extra damage') ? (
                        <span className="text-orange-400 font-semibold">{log}</span>
                      ) : (
                        <span>{log}</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Create Session Tab */}
          {activeTab === 'create' && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Start Battle</h2>
              <p className="text-gray-600 mb-4">
                Create a new battle with your Pokemon. Share the session ID with another player to join.
              </p>

              <div className="mb-4">
                <h3 className="font-medium mb-2">Your Pokemon</h3>
                <div className="flex items-center gap-4 mb-4">
                  {createFormData.user1.image ? (
                    <div className="flex items-center gap-4">
                      <img
                        src={createFormData.user1.image}
                        alt="Your Pokemon"
                        className="w-40 h-40 rounded-lg object-cover border-2 border-gray-300"
                      />
                      <button
                        onClick={() => setCreateFormData(prev => ({
                          ...prev,
                          user1: { ...prev.user1, image: '' }
                        }))}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-gray-600 mb-2">No Pokemon image yet</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => openDrawing('create')}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  <Palette size={16} />
                  Draw Your Pokemon
                </button>

                <div className="mb-4">
                  <h4 className="font-medium mb-3">Attribute Points (3 total points to allocate)</h4>

                  {/* Progress bar showing allocated points */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Allocated: {createFormData.user1.attributes.attack + createFormData.user1.attributes.defense + createFormData.user1.attributes.speed}/3</span>
                      <span>Remaining: {3 - createFormData.user1.attributes.attack - createFormData.user1.attributes.defense - createFormData.user1.attributes.speed}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{
                          width: `${((createFormData.user1.attributes.attack + createFormData.user1.attributes.defense + createFormData.user1.attributes.speed) / 3) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="flex justify-between items-center">
                        <span>Attack: {createFormData.user1.attributes.attack}</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="3"
                        value={createFormData.user1.attributes.attack}
                        onChange={(e) => {
                          const newAttack = parseInt(e.target.value);
                          const currentTotal = createFormData.user1.attributes.defense + createFormData.user1.attributes.speed;
                          if (newAttack + currentTotal <= 3) {
                            setCreateFormData({
                              ...createFormData,
                              user1: {
                                ...createFormData.user1,
                                attributes: {
                                  ...createFormData.user1.attributes,
                                  attack: newAttack
                                }
                              }
                            });
                          }
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="flex justify-between items-center">
                        <span>Defense: {createFormData.user1.attributes.defense}</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="3"
                        value={createFormData.user1.attributes.defense}
                        onChange={(e) => {
                          const newDefense = parseInt(e.target.value);
                          const currentTotal = createFormData.user1.attributes.attack + createFormData.user1.attributes.speed;
                          if (newDefense + currentTotal <= 3) {
                            setCreateFormData({
                              ...createFormData,
                              user1: {
                                ...createFormData.user1,
                                attributes: {
                                  ...createFormData.user1.attributes,
                                  defense: newDefense
                                }
                              }
                            });
                          }
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="flex justify-between items-center">
                        <span>Speed: {createFormData.user1.attributes.speed}</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="3"
                        value={createFormData.user1.attributes.speed}
                        onChange={(e) => {
                          const newSpeed = parseInt(e.target.value);
                          const currentTotal = createFormData.user1.attributes.attack + createFormData.user1.attributes.defense;
                          if (newSpeed + currentTotal <= 3) {
                            setCreateFormData({
                              ...createFormData,
                              user1: {
                                ...createFormData.user1,
                                attributes: {
                                  ...createFormData.user1.attributes,
                                  speed: newSpeed
                                }
                              }
                            });
                          }
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={createSession}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Battle'}
                </button>
              </div>
            </div>
          )}

          {/* Join Session Tab */}
          {activeTab === 'join' && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Join Battle</h2>
              <p className="text-gray-600 mb-4">
                Join a battle using the ID provided by another player.
              </p>

              <div className="mb-4">
                <h3 className="font-medium mb-2">Session Information</h3>
                <input
                  type="text"
                  placeholder="Battle ID"
                  value={joinFormData.sessionId}
                  onChange={(e) => setJoinFormData({
                    ...joinFormData,
                    sessionId: e.target.value
                  })}
                  className="w-full p-2 border rounded mb-4"
                />

                <h3 className="font-medium mb-2">Your Pokemon</h3>
                <div className="flex items-center gap-4 mb-4">
                  {joinFormData.user2.image ? (
                    <div className="flex items-center gap-4">
                      <img
                        src={joinFormData.user2.image}
                        alt="Your Pokemon"
                        className="w-40 h-40 rounded-lg object-cover border-2 border-gray-300"
                      />
                      <button
                        onClick={() => setJoinFormData(prev => ({
                          ...prev,
                          user2: { ...prev.user2, image: '' }
                        }))}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-gray-600 mb-2">No Pokemon image yet</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => openDrawing('join')}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  <Palette size={16} />
                  Draw Your Pokemon
                </button>

                <div className="mb-4">
                  <h4 className="font-medium mb-3">Attribute Points (3 total points to allocate)</h4>

                  {/* Progress bar showing allocated points */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Allocated: {joinFormData.user2.attributes.attack + joinFormData.user2.attributes.defense + joinFormData.user2.attributes.speed}/3</span>
                      <span>Remaining: {3 - joinFormData.user2.attributes.attack - joinFormData.user2.attributes.defense - joinFormData.user2.attributes.speed}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{
                          width: `${((joinFormData.user2.attributes.attack + joinFormData.user2.attributes.defense + joinFormData.user2.attributes.speed) / 3) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="flex justify-between items-center">
                        <span>Attack: {joinFormData.user2.attributes.attack}</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="3"
                        value={joinFormData.user2.attributes.attack}
                        onChange={(e) => {
                          const newAttack = parseInt(e.target.value);
                          const currentTotal = joinFormData.user2.attributes.defense + joinFormData.user2.attributes.speed;
                          if (newAttack + currentTotal <= 3) {
                            setJoinFormData({
                              ...joinFormData,
                              user2: {
                                ...joinFormData.user2,
                                attributes: {
                                  ...joinFormData.user2.attributes,
                                  attack: newAttack
                                }
                              }
                            });
                          }
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="flex justify-between items-center">
                        <span>Defense: {joinFormData.user2.attributes.defense}</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="3"
                        value={joinFormData.user2.attributes.defense}
                        onChange={(e) => {
                          const newDefense = parseInt(e.target.value);
                          const currentTotal = joinFormData.user2.attributes.attack + joinFormData.user2.attributes.speed;
                          if (newDefense + currentTotal <= 3) {
                            setJoinFormData({
                              ...joinFormData,
                              user2: {
                                ...joinFormData.user2,
                                attributes: {
                                  ...joinFormData.user2.attributes,
                                  defense: newDefense
                                }
                              }
                            });
                          }
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="flex justify-between items-center">
                        <span>Speed: {joinFormData.user2.attributes.speed}</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="3"
                        value={joinFormData.user2.attributes.speed}
                        onChange={(e) => {
                          const newSpeed = parseInt(e.target.value);
                          const currentTotal = joinFormData.user2.attributes.attack + joinFormData.user2.attributes.defense;
                          if (newSpeed + currentTotal <= 3) {
                            setJoinFormData({
                              ...joinFormData,
                              user2: {
                                ...joinFormData.user2,
                                attributes: {
                                  ...joinFormData.user2.attributes,
                                  speed: newSpeed
                                }
                              }
                            });
                          }
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={joinSession}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Joining...' : 'Join Battle'}
                </button>
              </div>
            </div>
          )}

          {/* Waiting Sessions Tab */}
          {activeTab === 'waiting' && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Sessions Waiting for Players</h2>
              <p className="text-gray-600 mb-4">
                These sessions are waiting for a second player to join. Copy the session ID to join one.
              </p>

              {waitingSessions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No sessions waiting for players</p>
              ) : (
                <div className="space-y-4">
                  {waitingSessions.map((session) => (
                    <div key={session.sessionId} className="border rounded p-4 bg-yellow-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="inline-block px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                            Waiting for Player
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            {session.sessionId}
                          </span>
                        </div>
                        <button
                          onClick={() => copySessionId(session.sessionId)}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Copy ID
                        </button>
                      </div>
                      <div className="bg-white p-3 rounded">
                        <h4 className="font-medium mb-2">Host Player</h4>
                        <p className="text-sm"><strong>Wallet:</strong> {session.user1?.walletAddress || 'None'}</p>
                        <div className="mb-2">
                          {session.user1?.image ? (
                            <img
                              src={session.user1.image}
                              alt="Host Pokemon"
                              className="w-40 h-40 rounded-lg object-cover border-2 border-gray-300 mt-1"
                            />
                          ) : (
                            <span className="text-gray-500 ml-2">None</span>
                          )}
                        </div>
                        <p className="text-sm"><strong>Attributes:</strong> {session.user1?.attributes ? (
                          <span className="inline-flex gap-2">
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">⚔️ ATK: {session.user1.attributes.attack || 0}</span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">🛡️ DEF: {session.user1.attributes.defense || 0}</span>
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">⚡ SPD: {session.user1.attributes.speed || 0}</span>
                          </span>
                        ) : 'None'}</p>
                      </div>
                      <div className="mt-3 text-xs text-gray-500">
                        <p>Created: {new Date(session.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* All Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">All Battles ({sessions.length})</h2>
              {sessions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No battles found</p>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div key={session.sessionId} className="border rounded p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${session.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : session.status === 'waiting'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                            }`}>
                            {session.status}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            {session.sessionId}
                          </span>
                          {session.status === 'waiting' && (
                            <button
                              onClick={() => copySessionId(session.sessionId)}
                              className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Copy ID
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded">
                          <h4 className="font-medium mb-2">User 1 (Host)</h4>
                          <p className="text-sm"><strong>Wallet:</strong> {session.user1?.walletAddress || 'None'}</p>
                          <div className="mb-2">
                            {session.user1?.image ? (
                              <img
                                src={session.user1.image}
                                alt="User 1 Pokemon"
                                className="w-40 h-40 rounded-lg object-cover border-2 border-gray-300 mt-1"
                              />
                            ) : (
                              <span className="text-gray-500 ml-2">None</span>
                            )}
                          </div>
                          <p className="text-sm"><strong>Attributes:</strong> {session.user1?.attributes ? (
                            <span className="inline-flex gap-2">
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">⚔️ ATK: {session.user1.attributes.attack || 0}</span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">🛡️ DEF: {session.user1.attributes.defense || 0}</span>
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">⚡ SPD: {session.user1.attributes.speed || 0}</span>
                            </span>
                          ) : 'None'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <h4 className="font-medium mb-2">User 2 {session.user2 ? '(Joined)' : '(Waiting)'}</h4>
                          {session.user2 ? (
                            <>
                              <p className="text-sm"><strong>Wallet:</strong> {session.user2.walletAddress}</p>
                              <div className="mb-2">
                                {session.user2.image ? (
                                  <img
                                    src={session.user2.image}
                                    alt="User 2 Pokemon"
                                    className="w-40 h-40 rounded-lg object-cover border-2 border-gray-300 mt-1"
                                  />
                                ) : (
                                  <span className="text-gray-500 ml-2">None</span>
                                )}
                              </div>
                              <p className="text-sm"><strong>Attributes:</strong> {session.user2.attributes ? (
                                <span className="inline-flex gap-2">
                                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">⚔️ ATK: {session.user2.attributes.attack || 0}</span>
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">🛡️ DEF: {session.user2.attributes.defense || 0}</span>
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">⚡ SPD: {session.user2.attributes.speed || 0}</span>
                                </span>
                              ) : 'None'}</p>
                            </>
                          ) : (
                            <p className="text-sm text-gray-500">No player joined yet</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-gray-500">
                        <p>Created: {new Date(session.createdAt).toLocaleString()}</p>
                        <p>Updated: {new Date(session.updatedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Drawing Overlay */}
          <DrawingApp
            isOpen={isDrawingOpen}
            onClose={() => setIsDrawingOpen(false)}
            onSave={saveDrawnImage}
            title={drawingFor === 'create' ? "Draw Your Pokemon (Create Battle)" : "Draw Your Pokemon (Join Battle)"}
          />
        </div>
      </div>
    </DynamicContextProvider>
  );
}
