'use client';

import React, { useState } from 'react';
import { Palette, Search } from 'lucide-react';
import DrawingApp from './DrawingApp';

export default function JoinGameScreen({ 
  onJoinGame, 
  onContinueToBattle,
  canContinue 
}) {
  const [gameCode, setGameCode] = useState('');
  const [showDrawing, setShowDrawing] = useState(false);
  const [avatarImage, setAvatarImage] = useState('');
  const [attributes, setAttributes] = useState({ attack: 0, defense: 0, speed: 0 });

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
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Join Battle
          </h1>
          <p className="text-xl text-blue-200">
            Enter a game code and draw your Kartikmon to join the fight!
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
              Ask your friend for the 8-digit battle code
            </p>
          </div>
        </div>

        {/* Avatar Creation Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Your Kartikmon</h2>
          
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
                  <span>{avatarImage ? 'Redraw Kartikmon' : 'Draw Your Kartikmon'}</span>
                </div>
              </button>
              
              <div className="relative w-full">
                {avatarImage ? (
                  <img
                    src={avatarImage}
                    alt="Your Kartikmon"
                    className="w-full aspect-square rounded-2xl border-4 border-white/30 shadow-2xl"
                  />
                ) : (
                  <div className="w-full aspect-square bg-white/20 rounded-2xl border-4 border-dashed border-white/30 flex items-center justify-center">
                    <div className="text-center text-white/60">
                      <Palette className="w-20 h-20 mx-auto mb-2" />
                      <p className="text-lg">No Kartikmon yet</p>
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

        {/* Join Game Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-4">Ready to join the battle?</h3>
            <p className="text-blue-200 mb-6">
              Enter the game code and draw your Kartikmon, then join the battle session!
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
        title="Draw Your Kartikmon"
      />
    </div>
  );
}
