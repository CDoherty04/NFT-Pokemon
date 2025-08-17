'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Zap, Shield, Hand, Footprints, Flame, Heart, Skull, HelpCircle } from 'lucide-react';

// Define BATTLE_ACTIONS locally to avoid import issues
const BATTLE_ACTIONS = {
  PUNCH: 'punch',
  KICK: 'kick',
  BLOCK: 'block',
  CHARGE: 'charge'
};

// Define action descriptions locally
const getBattleActionDescriptions = () => ({
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
  battleLog,
  contractAddress,
  contractABI
}) {
  const [isCheckingActions, setIsCheckingActions] = useState(false);
  const [lastActionCheck, setLastActionCheck] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [winnerChoice, setWinnerChoice] = useState(null);
  const [mintingStatus, setMintingStatus] = useState(null);
  const [mintedTokens, setMintedTokens] = useState([]);
  const [showMechanicsPopup, setShowMechanicsPopup] = useState(false);

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
  const getMaxHealth = (defense) => 150 + (defense * 30);
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

  const getOpponentWalletAddress = () => {
    const role = getCurrentUserRole();
    if (!role || !currentBattle) return null;
    const opponentRole = role === 'user1' ? 'user2' : 'user1';
    return currentBattle[opponentRole]?.walletAddress;
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
      setSelectedAction(action);
      onSubmitAction(action);
    }
  };

  const canSubmitAction = () => {
    return battlePhase === 'action-selection' && !userAction && !loading;
  };

  // Reset selected action when turn ends
  useEffect(() => {
    if (battlePhase !== 'action-selection') {
      setSelectedAction(null);
    }
  }, [battlePhase]);

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

  // NFT Minting Functions
  const mintNFT = async (recipientAddress, imageData, attributes, tokenType) => {
    try {
      // Check if wallet is connected
      if (!window.ethereum) {
        throw new Error('No Ethereum wallet detected. Please connect your wallet.');
      }

      // Check if the recipient address is valid
      if (!recipientAddress || recipientAddress === 'Unknown') {
        throw new Error('Invalid recipient address for NFT minting.');
      }

      // Validate attributes
      if (!attributes || typeof attributes !== 'object') {
        throw new Error('Invalid attributes for NFT minting.');
      }

      // Ensure required attributes exist
      const requiredAttributes = ['attack', 'defense', 'speed'];
      for (const attr of requiredAttributes) {
        if (typeof attributes[attr] !== 'number' || attributes[attr] < 0) {
          throw new Error(`Invalid ${attr} attribute: ${attributes[attr]}`);
        }
      }

      setMintingStatus(`Minting ${tokenType} NFT for ${recipientAddress.substring(0, 10)}...`);

      // Create metadata for the NFT
      const metadata = {
        name: `Kartikmon ${tokenType}`,
        description: `A ${tokenType} Kartikmon with attributes: Attack ${attributes.attack}, Defense ${attributes.defense}, Speed ${attributes.speed}`,
        image: imageData || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNjY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkthcnRpa21vbjwvdGV4dD48L3N2Zz4=',
        attributes: [
          { trait_type: "Attack", value: attributes.attack },
          { trait_type: "Defense", value: attributes.defense },
          { trait_type: "Speed", value: attributes.speed },
          { trait_type: "Type", value: tokenType },
          { trait_type: "Battle Session", value: currentBattle.sessionId }
        ]
      };

      // Convert metadata to a JSON string and then to a data URI
      const metadataJson = JSON.stringify(metadata);
      const metadataUri = `data:application/json;base64,${btoa(metadataJson)}`;

      console.log('Minting NFT with metadata:', metadata);
      console.log('Metadata URI length:', metadataUri.length);

      // Get the mint function from the contract ABI
      const mintFunction = contractABI.find(func => func.name === 'mint');

      if (!mintFunction) {
        throw new Error('Mint function not found in contract ABI');
      }

      console.log('Found mint function:', mintFunction);
      console.log('Contract address:', contractAddress);
      console.log('Recipient address:', recipientAddress);

      // Create the contract instance
      const { ethers } = await import('ethers');

      // Get the provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Verify the signer address matches the current user wallet
      const signerAddress = await signer.getAddress();

      // Check if the signer is the current user (either winner or loser)
      const currentUserWalletAddress = getCurrentUserWalletAddress();
      if (!currentUserWalletAddress) {
        throw new Error('Could not determine your wallet address. Please reconnect your wallet.');
      }

      if (signerAddress.toLowerCase() !== currentUserWalletAddress.toLowerCase()) {
        throw new Error('Connected wallet does not match your wallet address. Please connect the correct wallet.');
      }

      // Create contract instance
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      // Call the mint function
      const tx = await contract.mint(recipientAddress, metadataUri);

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      // Get the minted token ID from the Transfer event
      const transferEvent = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed.name === 'Transfer';
        } catch {
          return false;
        }
      });

      let tokenId;
      if (transferEvent) {
        const parsed = contract.interface.parseLog(transferEvent);
        tokenId = parsed.args[2].toString();
      } else {
        // Fallback: try to get the latest token ID
        const balance = await contract.balanceOf(recipientAddress);
        tokenId = balance.toString();
      }

      const mintedToken = {
        tokenId,
        recipient: recipientAddress,
        type: tokenType,
        transactionHash: receipt.hash,
        metadata
      };

      setMintedTokens(prev => [...prev, mintedToken]);
      setMintingStatus(`✅ ${tokenType} NFT minted successfully! Token ID: ${tokenId}`);

      console.log(`🎉 NFT minted successfully:`, mintedToken);

      return mintedToken;

    } catch (error) {
      console.error(`Error minting ${tokenType} NFT:`, error);
      setMintingStatus(`❌ Failed to mint ${tokenType} NFT: ${error.message}`);
      throw error;
    }
  };

  // Handle winner's choice and record it
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
          userWalletAddress: getCurrentUserWalletAddress()
        })
      });

      const data = await response.json();
      if (data.success) {
        console.log(`🎉 Winner choice submitted successfully: ${choice}`);
        setMintingStatus(`✅ Choice submitted: ${choice === 'spare' ? 'Mercy granted!' : 'Destruction chosen!'}`);
      } else {
        console.error('Failed to submit winner choice:', data.error);
        setMintingStatus(`❌ Failed to submit choice: ${data.error}`);
      }
    } catch (error) {
      console.error('Error submitting winner choice:', error);
      setMintingStatus(`❌ Error: ${error.message}`);
    }
  };

  // Handle loser minting their own NFT when spared
  const handleLoserMintSpared = async () => {
    try {
      // Validate contract setup
      if (!contractAddress || !contractABI) {
        throw new Error('Smart contract not properly configured. Please check your setup.');
      }

      // Get the current user's wallet address (the loser)
      const loserWalletAddress = getCurrentUserWalletAddress();
      if (!loserWalletAddress) {
        throw new Error('Could not determine your wallet address. Please reconnect your wallet.');
      }

      setMintingStatus('Minting your spared Kartikmon NFT...');

      // Mint the loser's own NFT to their own wallet
      const loserNFT = await mintNFT(
        loserWalletAddress, // Use the loser's own wallet address
        getCurrentUserImage(),
        getCurrentUserStats(),
        'Spared'
      );

      setMintingStatus(`✅ Your spared Kartikmon NFT minted successfully! Token ID: ${loserNFT.tokenId}`);

      console.log(`🎉 Loser's spared NFT minted successfully:`, loserNFT);

    } catch (error) {
      console.error('Error minting spared NFT:', error);
      setMintingStatus(`❌ Error minting spared NFT: ${error.message}`);
    }
  };

  // Helper function to get current user's wallet address
  const getCurrentUserWalletAddress = () => {
    const role = getCurrentUserRole();
    if (!role || !currentBattle) return null;
    return currentBattle[role]?.walletAddress;
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
                  Show mercy and mint your NFT. Loser can mint their own NFT.
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
          <div className="space-y-6">
            {/* Choice Confirmation */}
            <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
              <h4 className="text-2xl font-bold text-white mb-4">
                {winnerChoice === 'spare' ? '💝 Mercy Granted!' : '🔥 Destruction Complete!'}
              </h4>
              <p className="text-lg text-white/90 mb-4">
                {winnerChoice === 'spare' 
                  ? 'You chose to spare your opponent. Now you can mint your NFT!'
                  : 'Your opponent\'s Kartikmon has been destroyed. Now you can mint your NFT!'
                }
              </p>
              <div className="text-sm text-white/70 font-mono">
                {winnerChoice === 'spare' ? (
                  <div>
                    <p>🏆 Winner NFT: {getCurrentUserWalletAddress() || 'Address not available'} (Winner's own Kartikmon)</p>
                    <p>💔 Loser NFT: {getOpponentWalletAddress() || 'Address not available'} (Loser can mint their own)</p>
                  </div>
                ) : (
                  <div>
                    <p>🏆 Winner NFT: {getCurrentUserWalletAddress() || 'Address not available'}</p>
                    <p>💀 Loser NFT: DESTROYED</p>
                  </div>
                )}
              </div>
            </div>

            {/* Manual Mint Button for Winner */}
            <div className="bg-blue-900/30 rounded-2xl p-6 border border-blue-500/30">
              <h5 className="text-xl font-bold text-blue-300 mb-3">🎯 Mint Your NFT</h5>
              <p className="text-blue-200 text-lg mb-4">
                Click the button below to mint your victorious Kartikmon NFT!
              </p>
              <button
                onClick={async () => {
                  try {
                    const winnerWalletAddress = getCurrentUserWalletAddress();
                    if (!winnerWalletAddress) {
                      throw new Error('Could not determine your wallet address. Please reconnect your wallet.');
                    }
                    
                    setMintingStatus('Minting your victorious NFT...');
                    const winnerNFT = await mintNFT(
                      winnerWalletAddress,
                      getCurrentUserImage(),
                      getCurrentUserStats(),
                      'Victorious'
                    );
                    setMintingStatus(`✅ Your NFT minted successfully! Token ID: ${winnerNFT.tokenId}`);
                  } catch (error) {
                    console.error('Error minting winner NFT:', error);
                    setMintingStatus(`❌ Error minting NFT: ${error.message}`);
                  }
                }}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
              >
                🎯 Mint My NFT
              </button>
            </div>

            {/* Minting Status */}
            {mintingStatus && (
              <div className="bg-blue-900/30 rounded-2xl p-6 border border-blue-500/30">
                <h5 className="text-xl font-bold text-blue-300 mb-3">🔄 NFT Minting Status</h5>
                <p className="text-blue-200 text-lg">{mintingStatus}</p>
              </div>
            )}

            {/* Minted Tokens */}
            {mintedTokens.length > 0 && (
              <div className="bg-green-900/30 rounded-2xl p-6 border border-green-500/30">
                <h5 className="text-xl font-bold text-green-300 mb-3">🎉 Successfully Minted NFTs</h5>
                <div className="space-y-3">
                  {mintedTokens.map((token, index) => (
                    <div key={index} className="bg-white/10 rounded-xl p-4 text-left">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-green-300 font-bold">{token.type} NFT</span>
                        <span className="text-green-200 text-sm">ID: {token.tokenId}</span>
                      </div>
                      <p className="text-green-200 text-sm mb-1">
                        Recipient: {token.recipient.substring(0, 10)}...{token.recipient.substring(token.recipient.length - 8)}
                      </p>
                      <p className="text-green-200 text-sm">
                        TX: {token.transactionHash.substring(0, 10)}...{token.transactionHash.substring(token.transactionHash.length - 8)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Render loser interface
  const renderLoserInterface = () => {
    const opponentChoice = getOpponentChoice();

    if (opponentChoice === 'spare') {
      // Show spared result with manual mint button
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
                The victor has made their choice. Now you can mint your spared Kartikmon NFT!
              </p>
            </div>

            {/* Manual Mint Button for Loser */}
            <div className="bg-blue-900/30 rounded-2xl p-6 border border-blue-500/30 mb-6">
              <h5 className="text-xl font-bold text-blue-300 mb-3">🎯 Mint Your Spared NFT</h5>
              <p className="text-blue-200 text-lg mb-4">
                Click the button below to mint your spared Kartikmon NFT!
              </p>
              <button
                onClick={handleLoserMintSpared}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
              >
                💝 Mint My Spared NFT
              </button>
            </div>

            {/* Minting Status for Loser */}
            {mintingStatus && (
              <div className="bg-blue-900/30 rounded-2xl p-6 border border-blue-500/30 mb-6">
                <h5 className="text-xl font-bold text-blue-300 mb-3">🔄 NFT Minting Status</h5>
                <p className="text-blue-200 text-lg">{mintingStatus}</p>
              </div>
            )}

            {/* Minted Tokens for Loser */}
            {mintedTokens.length > 0 && (
              <div className="bg-green-900/30 rounded-2xl p-6 border border-green-500/30 mb-6">
                <h5 className="text-xl font-bold text-green-300 mb-3">🎉 Your Minted NFT</h5>
                <div className="space-y-3">
                  {mintedTokens.map((token, index) => (
                    <div key={index} className="bg-white/10 rounded-xl p-4 text-left">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-green-300 font-bold">{token.type} NFT</span>
                        <span className="text-green-200 text-sm">ID: {token.tokenId}</span>
                      </div>
                      <p className="text-green-200 text-sm mb-1">
                        Recipient: {token.recipient.substring(0, 10)}...{token.recipient.substring(token.recipient.length - 8)}
                      </p>
                      <p className="text-green-200 text-sm">
                        TX: {token.transactionHash.substring(0, 10)}...{token.transactionHash.substring(token.transactionHash.length - 8)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="text-sm text-green-300/80">
              <p>Your wallet: {getCurrentUserWalletAddress() || 'Address not available'}</p>
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
              <p>Your wallet: {getCurrentUserWalletAddress() || 'Address not available'}</p>
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
              <p>Your wallet: {getCurrentUserWalletAddress() || 'Address not available'}</p>
              <p>Your Kartikmon: {getCurrentUserImage() ? 'Image Available' : 'No Image'}</p>
            </div>
          </div>
        </div>
      );
    }
  };

          return (
          <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-indigo-900 p-4">
            {/* Question Mark Icon - Top Left */}
            <button
              onClick={() => setShowMechanicsPopup(true)}
              className="fixed top-6 left-6 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
              title="Battle Mechanics Help"
            >
              <HelpCircle size={24} />
            </button>

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
                        <div className="flex justify-between group relative">
                          <span>⚔️ Attack:</span>
                          <span className="font-bold">{getCurrentUserStats()?.attack || 0}</span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            Increases base damage and critical hit damage
                          </div>
                        </div>
                        <div className="flex justify-between group relative">
                          <span>🛡️ Defense:</span>
                          <span className="font-bold">{getCurrentUserStats()?.defense || 0}</span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            Increases max health and block effectiveness
                          </div>
                        </div>
                        <div className="flex justify-between group relative">
                          <span>⚡ Speed:</span>
                          <span className="font-bold">{getCurrentUserStats()?.speed || 0}</span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            Increases critical hit chance, kick accuracy, and charge success
                          </div>
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
                        <div className="flex justify-between group relative">
                          <span>⚔️ Attack:</span>
                          <span className="font-bold">{getOpponentStats()?.attack || 0}</span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            Increases base damage and critical hit damage
                          </div>
                        </div>
                        <div className="flex justify-between group relative">
                          <span>🛡️ Defense:</span>
                          <span className="font-bold">{getOpponentStats()?.defense || 0}</span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            Increases max health and block effectiveness
                          </div>
                        </div>
                        <div className="flex justify-between group relative">
                          <span>⚡ Speed:</span>
                          <span className="font-bold">{getOpponentStats()?.speed || 0}</span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-2 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            Increases critical hit chance, kick accuracy, and charge success
                          </div>
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
                        ? `bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-red-500/50 ${selectedAction === BATTLE_ACTIONS.PUNCH ? 'border-2 border-white' : ''}`
                        : 'bg-gradient-to-r from-red-500 to-red-600 text-white opacity-50 cursor-not-allowed'
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
                        ? `bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-orange-500/50 ${selectedAction === BATTLE_ACTIONS.KICK ? 'border-2 border-white' : ''}`
                        : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white opacity-50 cursor-not-allowed'
                        }`}
                      title={getBattleActionDescriptions()[BATTLE_ACTIONS.KICK].description}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Footprints className="w-8 h-8" />
                        <span>Kick</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleAction(BATTLE_ACTIONS.BLOCK)}
                      disabled={!canSubmitAction()}
                      className={`p-6 rounded-2xl font-bold text-lg transition-all duration-200 transform hover:scale-105 ${canSubmitAction()
                        ? `bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-purple-500/50 ${selectedAction === BATTLE_ACTIONS.BLOCK ? 'border-2 border-white' : ''}`
                        : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white opacity-50 cursor-not-allowed'
                        }`}
                      title={getBattleActionDescriptions()[BATTLE_ACTIONS.BLOCK].description}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Shield className="w-8 h-8" />
                        <span>Block</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleAction(BATTLE_ACTIONS.CHARGE)}
                      disabled={!canSubmitAction()}
                      className={`p-6 rounded-2xl font-bold text-lg transition-all duration-200 transform hover:scale-105 ${canSubmitAction()
                        ? `bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700 shadow-lg hover:shadow-yellow-500/50 ${selectedAction === BATTLE_ACTIONS.CHARGE ? 'border-2 border-white' : ''}`
                        : 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white opacity-50 cursor-not-allowed'
                        }`}
                      title={getBattleActionDescriptions()[BATTLE_ACTIONS.CHARGE].description}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Zap className="w-8 h-8" />
                        <span>Charge</span>
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

            {/* Battle Mechanics Popup */}
            {showMechanicsPopup && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-gradient-to-br from-blue-900/95 to-purple-900/95 backdrop-blur-sm rounded-2xl p-8 max-w-2xl w-full border-2 border-blue-400/50 shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-blue-300">⚔️ Battle Mechanics ⚔️</h3>
                    <button
                      onClick={() => setShowMechanicsPopup(false)}
                      className="text-blue-300 hover:text-white text-2xl font-bold bg-blue-600/30 hover:bg-blue-600/50 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200"
                    >
                      ×
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-blue-200">
                    <div className="space-y-3">
                      <h4 className="text-lg font-bold text-blue-300 mb-3">🎯 Actions</h4>
                      <p><strong>👊 Punch:</strong> Regular damage, 10% critical hit chance</p>
                      <p><strong>🦵 Kick:</strong> Double damage, 50% miss chance (Speed reduces miss)</p>
                      <p><strong>🛡️ Block:</strong> Reduces damage by 50%+ (Defense increases protection)</p>
                      <p><strong>⚡ Charge:</strong> Next attack does double damage (Speed increases success)</p>
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-lg font-bold text-blue-300 mb-3">📊 Attributes</h4>
                      <p><strong>⚔️ Attack:</strong> Increases base damage and critical hit damage</p>
                      <p><strong>🛡️ Defense:</strong> Increases max health and block effectiveness</p>
                      <p><strong>⚡ Speed:</strong> Increases critical hits, kick accuracy, and charge success</p>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setShowMechanicsPopup(false)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
                    >
                      Got it!
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          );
}
