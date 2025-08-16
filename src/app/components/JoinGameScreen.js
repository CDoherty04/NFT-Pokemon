'use client';

import React, { useState } from 'react';
import { ArrowLeft, Palette, Search, Users } from 'lucide-react';
import DrawingApp from './DrawingApp';

export default function JoinGameScreen({ 
  onBack, 
  onJoinGame, 
  onContinueToBattle,
  canContinue 
}) {
  const [gameCode, setGameCode] = useState('');
  const [showDrawing, setShowDrawing] = useState(false);
  const [avatarImage, setAvatarImage] = useState('');
  const [attributes, setAttributes] = useState({ attack: 1, defense: 1, speed: 1 });

  const handleSaveDrawing = (imageDataUrl) => {
    setAvatarImage(imageDataUrl);
    setShowDrawing(false);
  };

  const handleJoinGame = () => {
    if (gameCode && avatarImage) {
      onJoinGame(gameCode, avatarImage, attributes);
    }
  };

  const handleContinue = () => {
    if (avatarImage && canContinue) {
      onContinueToBattle();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white hover:text-blue-200 transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Menu</span>
        </button>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Join Battle
          </h1>
          <p className="text-xl text-blue-200">
            Enter a game code and draw your Pokemon to join the fight!
          </p>
        </div>

        {/* Game Code Input Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Enter Game Code</h2>
          
          <div className="max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Enter battle code..."
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                className="w-full px-6 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white text-center text-2xl font-mono font-bold tracking-wider placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                maxLength={8}
              />
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 w-6 h-6" />
            </div>
            <p className="text-center text-blue-200 mt-4 text-sm">
              Ask your friend for the 8-character battle code
            </p>
          </div>
        </div>

        {/* Avatar Creation Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Your Pokemon</h2>
          
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Avatar Display */}
            <div className="flex-1 text-center">
              {avatarImage ? (
                <div className="relative">
                  <img
                    src={avatarImage}
                    alt="Your Pokemon"
                    className="w-48 h-48 rounded-2xl border-4 border-white/30 shadow-2xl"
                  />
                  <button
                    onClick={() => setAvatarImage('')}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="w-48 h-48 bg-white/20 rounded-2xl border-4 border-dashed border-white/30 flex items-center justify-center">
                  <div className="text-center text-white/60">
                    <Palette className="w-16 h-16 mx-auto mb-2" />
                    <p>No Pokemon yet</p>
                  </div>
                </div>
              )}
            </div>

            {/* Avatar Creation Controls */}
            <div className="flex-1 space-y-6">
              <button
                onClick={() => setShowDrawing(true)}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold text-lg rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-200 transform hover:scale-105"
              >
                <div className="flex items-center justify-center gap-3">
                  <Palette className="w-6 h-6" />
                  <span>{avatarImage ? 'Redraw Pokemon' : 'Draw Your Pokemon'}</span>
                </div>
              </button>

              {/* Attributes Section */}
              <div className="bg-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 text-center">Attributes (3 points total)</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-white mb-2">
                      <span>⚔️ Attack: {attributes.attack}</span>
                      <span className="text-blue-200">{3 - attributes.defense - attributes.speed} remaining</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      value={attributes.attack}
                      onChange={(e) => {
                        const newAttack = parseInt(e.target.value);
                        const currentTotal = attributes.defense + attributes.speed;
                        if (newAttack + currentTotal <= 3) {
                          setAttributes(prev => ({ ...prev, attack: newAttack }));
                        }
                      }}
                      className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-white mb-2">
                      <span>🛡️ Defense: {attributes.defense}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      value={attributes.defense}
                      onChange={(e) => {
                        const newDefense = parseInt(e.target.value);
                        const currentTotal = attributes.attack + attributes.speed;
                        if (newDefense + currentTotal <= 3) {
                          setAttributes(prev => ({ ...prev, defense: newDefense }));
                        }
                      }}
                      className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-white mb-2">
                      <span>⚡ Speed: {attributes.speed}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      value={attributes.speed}
                      onChange={(e) => {
                        const newSpeed = parseInt(e.target.value);
                        const currentTotal = attributes.attack + attributes.defense;
                        if (newSpeed + currentTotal <= 3) {
                          setAttributes(prev => ({ ...prev, speed: newSpeed }));
                        }
                      }}
                      className="w-full h-3 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-white/80 mb-2">
                    <span>Points allocated: {attributes.attack + attributes.defense + attributes.speed}/3</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${((attributes.attack + attributes.defense + attributes.speed) / 3) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Join Game Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-4">Ready to join the battle?</h3>
            <p className="text-blue-200 mb-6">
              Enter the game code and draw your Pokemon, then join the battle session!
            </p>
            
            {canContinue ? (
              <div className="space-y-4">
                <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-4">
                  <p className="text-green-300 font-medium">✅ Successfully joined! Both players are ready.</p>
                </div>
                <button
                  onClick={handleContinue}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-xl rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
                >
                  Continue to Battle!
                </button>
              </div>
            ) : (
              <button
                onClick={handleJoinGame}
                disabled={!gameCode || !avatarImage}
                className={`px-8 py-4 font-bold text-xl rounded-xl transition-all duration-200 ${
                  gameCode && avatarImage
                    ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 transform hover:scale-105'
                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                }`}
              >
                Join Battle Session
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Drawing App Overlay */}
      <DrawingApp
        isOpen={showDrawing}
        onClose={() => setShowDrawing(false)}
        onSave={handleSaveDrawing}
        title="Draw Your Pokemon"
      />
    </div>
  );
}
