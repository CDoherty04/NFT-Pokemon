'use client';

import { useState, useEffect } from 'react';
import { RefreshCcw as RefreshCcwIcon, Palette } from 'lucide-react';
import DrawingApp from './components/DrawingApp';
import { ethers } from 'ethers';

export default function Home() {
  const [sessions, setSessions] = useState([]);
  const [waitingSessions, setWaitingSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('create'); // 'create', 'join', 'sessions', 'battle'

  // Placeholder wallet address for the current user
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
  const [contractInstance, setContractInstance] = useState(null);
  const [mintingStatus, setMintingStatus] = useState('');
  const [hardcodedURI] = useState('https://ipfs.io/ipfs/bafkreia2vfqindeeted7zaunjtinxbwuznwe6e6sqgigmyngwoiusxahsa');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isFlowTestnet, setIsFlowTestnet] = useState(false);
  const [contractInfo, setContractInfo] = useState(null);

  // Wallet connection function
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setCurrentWalletAddress(accounts[0]);
        }
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    } else {
      console.error('MetaMask not detected!');
    }
  };

  // Smart contract functions
  const connectAndInteract = async () => {
    if (!currentWalletAddress) {
      setMintingStatus('❌ Please connect your wallet first.');
      return;
    }

    if (window.ethereum) {
      try {
        // First, try to switch to Flow testnet
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x221', // 545 in hex (Flow EVM Testnet)
              chainName: 'Flow EVM Testnet',
              nativeCurrency: {
                name: 'FLOW',
                symbol: 'FLOW',
                decimals: 18
              },
              rpcUrls: ['https://testnet.evm.nodes.onflow.org'],
              blockExplorerUrls: ['https://evm-testnet.flowscan.io']
            }]
          });
        } catch (addError) {
          // If chain already exists, try to switch to it
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x221' }]
            });
          } catch (switchError) {
            console.log('Flow EVM testnet already configured');
          }
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractAddress, contractABI, signer);

        // Get network information
        const network = await provider.getNetwork();
        const isFlow = network.chainId === 545n; // Flow EVM testnet chain ID (545)
        setIsFlowTestnet(isFlow);

        setProvider(provider);
        setSigner(signer);
        setContractInstance(contract);

        // Get contract information
        try {
          const contractName = await contract.name();
          const contractSymbol = await contract.symbol();
          setContractInfo({ name: contractName, symbol: contractSymbol });
          console.log('Contract Info:', { name: contractName, symbol: contractSymbol });
        } catch (infoError) {
          console.log('Could not get contract info:', infoError.message);
        }

        if (isFlow) {
          setMintingStatus('✅ Connected to Flow testnet! Ready to mint NFT.');
        } else {
          setMintingStatus('⚠️ Please switch to Flow testnet to continue.');
        }

        return contract;
      } catch (error) {
        console.error("Error connecting to contract:", error);
        setMintingStatus(`❌ Error: ${error.message}`);
      }
    } else {
      console.error("MetaMask not detected!");
      setMintingStatus('❌ MetaMask not detected!');
    }
  };

  const mintNFT = async () => {
    if (!currentWalletAddress) {
      setMintingStatus('❌ Please connect your wallet first.');
      return;
    }

    if (!contractInstance || !signer) {
      setMintingStatus('Please connect to contract first.');
      return;
    }

    try {
      // Get the connected wallet address
      const walletAddress = await signer.getAddress();
      setMintingStatus('Minting NFT...');
      console.log('Wallet Address:', walletAddress);
      console.log('Contract Instance:', contractInstance);
      console.log('Token URI:', hardcodedURI);

      // First, let's try to estimate gas to see if there are any obvious issues
      try {
        const gasEstimate = await contractInstance.mint.estimateGas(walletAddress, hardcodedURI);
        console.log('Gas estimate:', gasEstimate.toString());
      } catch (estimateError) {
        console.error('Gas estimation failed:', estimateError);
        setMintingStatus(`❌ Gas estimation failed: ${estimateError.message}`);
        return;
      }

      const tx = await contractInstance.mint(walletAddress, hardcodedURI);
      setMintingStatus('Transaction sent! Waiting for confirmation...');

      const receipt = await tx.wait();
      setMintingStatus(`✅ NFT minted successfully! Transaction hash: ${receipt.hash}`);
    } catch (error) {
      console.error('Minting error details:', error);

      // Try to get more specific error information
      let errorMessage = error.message;

      if (error.data) {
        // Try to decode the error data if available
        try {
          const iface = new ethers.Interface(contractABI);
          const decodedError = iface.parseError(error.data);
          errorMessage = `Contract Error: ${decodedError.name} - ${decodedError.args.join(', ')}`;
        } catch (decodeError) {
          console.log('Could not decode error data');
        }
      }

      setMintingStatus(`❌ Error minting NFT: ${errorMessage}`);
    }
  };

  // Current active battle session for the user
  const [currentBattle, setCurrentBattle] = useState(null);

  // Battle turn tracking
  const [currentTurn, setCurrentTurn] = useState('user1'); // 'user1' or 'user2'
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

    if (activeSession) {
      setCurrentBattle(activeSession);
      setActiveTab('battle');
      // Initialize battle log
      setBattleLog([
        `Battle started between ${activeSession.user1?.walletAddress?.substring(0, 10)}... and ${activeSession.user2?.walletAddress?.substring(0, 10)}...`,
        'Both Pokemon are ready for battle!',
        'User 1 goes first!'
      ]);
      setCurrentTurn('user1');
    } else {
      setCurrentBattle(null);
      setBattleLog([]);
      setCurrentTurn('user1');
    }
  };

  // Check if it's the current user's turn
  const isUserTurn = () => {
    if (!currentBattle) return false;

    if (currentTurn === 'user1' && currentBattle.user1?.walletAddress === currentWalletAddress) {
      return true;
    }
    if (currentTurn === 'user2' && currentBattle.user2?.walletAddress === currentWalletAddress) {
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

  // Switch turns
  const switchTurn = () => {
    const newTurn = currentTurn === 'user1' ? 'user2' : 'user1';
    setCurrentTurn(newTurn);

    const currentUser = newTurn === 'user1' ? currentBattle.user1 : currentBattle.user2;
    const opponent = newTurn === 'user1' ? currentBattle.user2 : currentBattle.user1;

    setBattleLog(prev => [...prev, `${currentUser?.walletAddress?.substring(0, 10)}...'s turn!`]);
  };

  // Add message to battle log
  const addToBattleLog = (message) => {
    setBattleLog(prev => [...prev, message]);
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

  // Battle action functions
  const performAttack = () => {
    if (!isUserTurn()) return;

    const userRole = getUserRole();
    const user = currentBattle[userRole];
    const opponent = userRole === 'user1' ? currentBattle.user2 : currentBattle.user1;

    // Simple attack calculation
    const damage = Math.max(1, user.attributes.attack - opponent.attributes.defense);

    addToBattleLog(`${user.walletAddress.substring(0, 10)}... attacks for ${damage} damage!`);

    // Switch turns
    switchTurn();
  };

  const performDefense = () => {
    if (!isUserTurn()) return;

    const userRole = getUserRole();
    const user = currentBattle[userRole];

    addToBattleLog(`${user.walletAddress.substring(0, 10)}... takes a defensive stance!`);

    // Switch turns
    switchTurn();
  };

  const performSpecial = () => {
    if (!isUserTurn()) return;

    const userRole = getUserRole();
    const user = currentBattle[userRole];

    // Special move based on highest attribute
    let specialEffect = '';
    if (user.attributes.speed >= user.attributes.attack && user.attributes.speed >= user.attributes.defense) {
      specialEffect = 'uses Quick Strike for bonus damage!';
    } else if (user.attributes.attack >= user.attributes.defense) {
      specialEffect = 'uses Power Strike for massive damage!';
    } else {
      specialEffect = 'uses Iron Defense to block all damage!';
    }

    addToBattleLog(`${user.walletAddress.substring(0, 10)}... ${specialEffect}`);

    // Switch turns
    switchTurn();
  };

  const fleeBattle = async () => {
    if (!isUserTurn()) return;

    const userRole = getUserRole();
    const user = currentBattle[userRole];

    addToBattleLog(`${user.walletAddress.substring(0, 10)}... flees from battle!`);

    // Set session status to completed when user flees
    try {
      setLoading(true);
      const response = await fetch(`/api/sessions/${currentBattle.sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });

      const data = await response.json();
      if (data.success) {
        addToBattleLog('Battle ended due to flee!');
        // Refresh sessions to get updated status
        await fetchSessions();
        // Clear current battle since it's now completed
        setCurrentBattle(null);
        setActiveTab('sessions');
      } else {
        addToBattleLog('Error ending battle: ' + data.error);
      }
    } catch (error) {
      addToBattleLog('Error ending battle: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitingSessions();
  }, []);

  // Listen for wallet account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          // MetaMask is locked or user has no accounts
          setCurrentWalletAddress(null);
          setContractInstance(null);
          setSigner(null);
          setProvider(null);
          setIsFlowTestnet(false);
          setMintingStatus('');
        } else if (accounts[0] !== currentWalletAddress) {
          // Account changed
          setCurrentWalletAddress(accounts[0]);
          setContractInstance(null);
          setSigner(null);
          setProvider(null);
          setIsFlowTestnet(false);
          setMintingStatus('');
        }
      };

      const handleChainChanged = () => {
        // Reset contract connection when chain changes
        setContractInstance(null);
        setSigner(null);
        setProvider(null);
        setIsFlowTestnet(false);
        setMintingStatus('');
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [currentWalletAddress]);

  // Check for active battle whenever sessions change
  useEffect(() => {
    checkForActiveBattle();
  }, [sessions, currentWalletAddress]);

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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Wallet Address Display */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Current Wallet</h3>
              <p className="text-sm text-gray-600 font-mono bg-gray-100 p-2 rounded">
                {currentWalletAddress || 'Not connected'}
              </p>
            </div>
            {!currentWalletAddress && (
              <button
                onClick={connectWallet}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Connect Wallet
              </button>
            )}
          </div>

          {/* Smart Contract Section */}
          <div className="border-t pt-4">
            <h4 className="text-md font-semibold mb-3">Smart Contract (Flow Testnet)</h4>
            <div className="space-y-3">
              {/* Connection Status */}
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${contractInstance ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm">
                  {contractInstance ? 'Contract Connected' : 'Not Connected'}
                </span>
                {isFlowTestnet && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    Flow Testnet
                  </span>
                )}
              </div>

              {/* Contract Address */}
              <div className="text-xs text-gray-600">
                Contract: {contractAddress.substring(0, 10)}...{contractAddress.substring(contractAddress.length - 8)}
              </div>

              {/* Contract Info */}
              {contractInfo && (
                <div className="text-xs text-gray-600">
                  Name: {contractInfo.name} | Symbol: {contractInfo.symbol}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {!currentWalletAddress ? (
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-400 text-gray-200 rounded cursor-not-allowed text-sm"
                  >
                    Connect Wallet First
                  </button>
                ) : !contractInstance ? (
                  <button
                    onClick={connectAndInteract}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    Connect & Switch to Flow
                  </button>
                ) : (
                  <>
                    <button
                      onClick={mintNFT}
                      disabled={!isFlowTestnet}
                      className={`px-4 py-2 rounded text-sm font-medium ${isFlowTestnet
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        }`}
                    >
                      🚀 Mint NFT
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const gasEstimate = await contractInstance.mint.estimateGas(currentWalletAddress, hardcodedURI);
                          setMintingStatus(`✅ Gas estimate: ${gasEstimate.toString()}`);
                        } catch (error) {
                          setMintingStatus(`❌ Gas estimate failed: ${error.message}`);
                        }
                      }}
                      className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                    >
                      🔍 Test Gas
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          // Try to get contract owner if the function exists
                          let owner = 'Unknown';
                          try {
                            owner = await contractInstance.owner();
                          } catch (e) {
                            console.log('No owner() function found');
                          }

                          // Try to get total supply if the function exists
                          let totalSupply = 'Unknown';
                          try {
                            totalSupply = await contractInstance.totalSupply();
                          } catch (e) {
                            console.log('No totalSupply() function found');
                          }

                          // Try to get max supply if the function exists
                          let maxSupply = 'Unknown';
                          try {
                            maxSupply = await contractInstance.maxSupply();
                          } catch (e) {
                            console.log('No maxSupply() function found');
                          }

                          setMintingStatus(`Contract State: Owner: ${owner}, Total Supply: ${totalSupply}, Max Supply: ${maxSupply}`);
                          console.log('Contract State:', { owner, totalSupply, maxSupply });

                          // Check if current user is the owner
                          if (owner !== 'Unknown' && owner.toLowerCase() === currentWalletAddress.toLowerCase()) {
                            setMintingStatus(`✅ You are the contract owner! Owner: ${owner}, Total Supply: ${totalSupply}, Max Supply: ${maxSupply}`);
                          } else if (owner !== 'Unknown') {
                            setMintingStatus(`❌ You are NOT the contract owner. Owner: ${owner}, Your address: ${currentWalletAddress}`);
                          }
                        } catch (error) {
                          setMintingStatus(`❌ Contract state check failed: ${error.message}`);
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      📊 Check State
                    </button>
                  </>
                )}
              </div>

              {/* Status Messages */}
              {mintingStatus && (
                <div className="text-sm p-2 bg-gray-50 rounded border">
                  {mintingStatus}
                </div>
              )}

              {/* Instructions */}
              <div className="text-xs text-gray-500">
                <p>• Click "Connect Wallet" to connect your MetaMask wallet.</p>
                <p>• Once connected, click "Connect & Switch to Flow" to switch to Flow testnet and interact with the contract.</p>
                <p>• Once connected to Flow testnet, click "🚀 Mint NFT" to mint using the hardcoded IPFS URI</p>
                <p>• NFT will be minted to your connected MetaMask wallet address</p>
              </div>
            </div>
          </div>
        </div>

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
              <h3 className="text-xl font-bold mb-2">
                {currentTurn === 'user1' ? '🔄 User 1\'s Turn' : '🔄 User 2\'s Turn'}
              </h3>
              <p className="text-gray-700">
                {isUserTurn()
                  ? '🎯 It\'s your turn! Choose an action below.'
                  : '⏳ Waiting for opponent to make their move...'
                }
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Current Turn: {currentTurn === 'user1' ? currentBattle.user1?.walletAddress?.substring(0, 10) + '...' : currentBattle.user2?.walletAddress?.substring(0, 10) + '...'}
              </p>
            </div>

            {/* Battle Actions */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4 text-center">Battle Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={performAttack}
                  disabled={!isUserTurn() || loading}
                  className={`px-6 py-3 rounded-lg font-bold text-lg transition-all duration-200 ${isUserTurn() && !loading
                    ? 'bg-red-600 text-white hover:bg-red-700 cursor-pointer'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-50'
                    }`}
                >
                  ⚔️ Attack
                </button>
                <button
                  onClick={performDefense}
                  disabled={!isUserTurn() || loading}
                  className={`px-6 py-3 rounded-lg font-bold text-lg transition-all duration-200 ${isUserTurn() && !loading
                    ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-50'
                    }`}
                >
                  🛡️ Defense
                </button>
                <button
                  onClick={performSpecial}
                  disabled={!isUserTurn() || loading}
                  className={`px-6 py-3 rounded-lg font-bold text-lg transition-all duration-200 ${isUserTurn() && !loading
                    ? 'bg-purple-600 text-white hover:bg-purple-700 cursor-pointer'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-50'
                    }`}
                >
                  ✨ Special
                </button>
                <button
                  onClick={fleeBattle}
                  disabled={!isUserTurn() || loading}
                  className={`px-6 py-3 rounded-lg font-bold text-lg transition-all duration-200 ${isUserTurn() && !loading
                    ? 'bg-gray-600 text-white hover:bg-gray-700 cursor-pointer'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-50'
                    }`}
                >
                  🏃‍♂️ Flee
                </button>
              </div>
            </div>

            {/* Battle Log */}
            <div className="mt-6 bg-black text-green-400 rounded-lg p-4 font-mono text-sm">
              <h4 className="text-white mb-2">Battle Log:</h4>
              {battleLog.map((log, index) => (
                <p key={index}>{log}</p>
              ))}
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
  );
}
