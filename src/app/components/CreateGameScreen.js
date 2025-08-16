'use client';

import React, { useState } from 'react';
import { ArrowLeft, Copy, Check, Palette, Users } from 'lucide-react';
import DrawingApp from './DrawingApp';

export default function CreateGameScreen({ 
  onBack, 
  onCreateGame, 
  sessionId, 
  isWaitingForPlayer,
  onContinueToBattle,
  canContinue 
}) {
  const [showDrawing, setShowDrawing] = useState(false);
  const [avatarImage, setAvatarImage] = useState('');
  const [copied, setCopied] = useState(false);
  const [attributes, setAttributes] = useState({ attack: 1, defense: 1, speed: 1 });

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveDrawing = (imageDataUrl) => {
    setAvatarImage(imageDataUrl);
    setShowDrawing(false);
  };

  const handleContinue = () => {
    if (avatarImage && canContinue) {
      onContinueToBattle();
    }
  };

  const handleCreateGame = () => {
    if (avatarImage) {
      onCreateGame(avatarImage, attributes);
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
            Create New Battle
          </h1>
          <p className="text-xl text-blue-200">
            Draw your Pokemon and share the code with a friend!
          </p>
        </div>

        {/* Game Code Section */}
        {sessionId && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">Game Code</h2>
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-4 border border-white/30">
                <code className="text-3xl md:text-4xl font-mono font-bold text-white tracking-wider">
                  {sessionId}
                </code>
              </div>
              <button
                onClick={copySessionId}
                className={`p-3 rounded-xl transition-all duration-200 ${
                  copied 
                    ? 'bg-green-500 text-white' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
              </button>
            </div>
            <p className="text-center text-blue-200 text-lg">
              Share this code with your opponent to join the battle!
            </p>
          </div>
        )}

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
                <h3 className="text-lg font-semibold text-white mb-4 text-center">Attributes (3 total points to allocate)</h3>
                
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

        {/* Status and Continue Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          {isWaitingForPlayer ? (
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
                <h3 className="text-xl font-semibold text-yellow-300">Waiting for opponent to join...</h3>
              </div>
              <p className="text-blue-200 mb-6">
                Share the game code above with your friend. Once they join and draw their Pokemon, 
                you can both continue to battle!
              </p>
              {canContinue && (
                <button
                  onClick={handleContinue}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-xl rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
                >
                  Continue to Battle!
                </button>
              )}
            </div>
          ) : (
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-4">Ready to create battle?</h3>
              <p className="text-blue-200 mb-6">
                Draw your Pokemon and set your attributes, then create the battle session!
              </p>
              <button
                onClick={handleCreateGame}
                disabled={!avatarImage}
                className={`px-8 py-4 font-bold text-xl rounded-xl transition-all duration-200 ${
                  avatarImage
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transform hover:scale-105'
                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                }`}
              >
                Create Battle Session
              </button>
            </div>
          )}
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
