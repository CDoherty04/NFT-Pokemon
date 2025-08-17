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
  const [attributes, setAttributes] = useState({ attack: 0, defense: 0, speed: 0 });

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
              {/* Draw Button Above Preview */}
              <button
                onClick={() => setShowDrawing(true)}
                className="w-full px-6 py-4 mb-6 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold text-lg rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-200 transform hover:scale-105"
              >
                <div className="flex items-center justify-center gap-3">
                  <Palette className="w-6 h-6" />
                  <span>{avatarImage ? 'Redraw Pokemon' : 'Draw Your Pokemon'}</span>
                </div>
              </button>
              
              <div className="relative w-full">
                {avatarImage ? (
                  <img
                    src={avatarImage}
                    alt="Your Pokemon"
                    className="w-full aspect-square rounded-2xl border-4 border-white/30 shadow-2xl"
                  />
                ) : (
                  <div className="w-full aspect-square bg-white/20 rounded-2xl border-4 border-dashed border-white/30 flex items-center justify-center">
                    <div className="text-center text-white/60">
                      <Palette className="w-20 h-20 mx-auto mb-2" />
                      <p className="text-lg">No Pokemon yet</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Avatar Creation Controls */}
            <div className="flex-1 space-y-6">

              {/* Attributes Section */}
              <div className="bg-white/10 rounded-xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">Attributes</h3>
                  <button
                    onClick={() => setAttributes({ attack: 0, defense: 0, speed: 0 })}
                    className="px-3 py-1 bg-red-500/20 text-red-300 text-sm rounded-lg hover:bg-red-500/30 transition-colors border border-red-400/30"
                  >
                    Clear All
                  </button>
                </div>
                <div className="text-center text-blue-200 mb-6">
                  <span className="text-2xl font-bold">{3 - attributes.attack - attributes.defense - attributes.speed}</span> points remaining
                </div>
                
                <div className="space-y-6">
                  {/* Attack Stat */}
                  <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-xl p-4 border border-red-400/30">
                    <div className="flex justify-between text-white mb-3">
                      <span className="text-lg font-semibold">⚔️ Attack: {attributes.attack}</span>
                    </div>
                    <div className="flex justify-center gap-3">
                      {[1, 2, 3].map((level) => (
                        <button
                          key={level}
                          onClick={() => {
                            const currentTotal = attributes.defense + attributes.speed;
                            if (level + currentTotal <= 3) {
                              setAttributes(prev => ({ ...prev, attack: level }));
                            }
                          }}
                          className={`w-8 h-8 rounded-full transition-all duration-200 border-2 ${
                            level <= attributes.attack
                              ? level === 1 ? 'bg-red-400 border-red-500' : level === 2 ? 'bg-red-500 border-red-600' : 'bg-red-600 border-red-700'
                              : 'bg-white/20 border-white/40 hover:bg-white/30'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Defense Stat */}
                  <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-xl p-4 border border-blue-400/30">
                    <div className="flex justify-between text-white mb-3">
                      <span className="text-lg font-semibold">🛡️ Defense: {attributes.defense}</span>
                    </div>
                    <div className="flex justify-center gap-3">
                      {[1, 2, 3].map((level) => (
                        <button
                          key={level}
                          onClick={() => {
                            const currentTotal = attributes.attack + attributes.speed;
                            if (level + currentTotal <= 3) {
                              setAttributes(prev => ({ ...prev, defense: level }));
                            }
                          }}
                          className={`w-8 h-8 rounded-full transition-all duration-200 border-2 ${
                            level <= attributes.defense
                              ? level === 1 ? 'bg-blue-400 border-blue-500' : level === 2 ? 'bg-blue-500 border-blue-600' : 'bg-blue-600 border-blue-700'
                              : 'bg-white/20 border-white/40 hover:bg-white/30'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Speed Stat */}
                  <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-xl p-4 border border-green-400/30">
                    <div className="flex justify-between text-white mb-3">
                      <span className="text-lg font-semibold">⚡ Speed: {attributes.speed}</span>
                    </div>
                    <div className="flex justify-center gap-3">
                      {[1, 2, 3].map((level) => (
                        <button
                          key={level}
                          onClick={() => {
                            const currentTotal = attributes.attack + attributes.defense;
                            if (level + currentTotal <= 3) {
                              setAttributes(prev => ({ ...prev, speed: level }));
                            }
                          }}
                          className={`w-8 h-8 rounded-full transition-all duration-200 border-2 ${
                            level <= attributes.speed
                              ? level === 1 ? 'bg-green-400 border-green-500' : level === 2 ? 'bg-green-500 border-green-600' : 'bg-green-600 border-green-700'
                              : 'bg-white/20 border-white/40 hover:bg-white/30'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
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
