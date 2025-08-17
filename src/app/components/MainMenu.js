'use client';

import React from 'react';
import { Play, Users, Sword, Wallet } from 'lucide-react';

export default function MainMenu({ onNavigate, onConnectWallet, isConnected }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center">
        {/* Game Title */}
        <div className="mb-16">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-4 drop-shadow-2xl">
            NFT Pokemon
          </h1>
          <p className="text-xl md:text-2xl text-blue-200 font-medium">
            Battle with your hand-drawn creatures!
          </p>
        </div>

        {/* Wallet Connection Status */}
        {!isConnected && (
          <div className="mb-8 max-w-md mx-auto">
            <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Wallet className="w-8 h-8 text-yellow-300" />
                <h3 className="text-xl font-semibold text-yellow-300">Wallet Not Connected</h3>
              </div>
              <p className="text-yellow-200 text-center">
                Please connect your wallet using the Dynamic widget in the top-right corner to start playing!
              </p>
            </div>
          </div>
        )}

        {/* Main Menu Buttons */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-16">
          {/* Create Game Button */}
          <button
            onClick={() => onNavigate('create')}
            disabled={!isConnected}
            className={`group relative px-8 py-4 font-bold text-xl rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 ${
              isConnected
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-blue-500/50'
                : 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Play className="w-6 h-6" />
              <span>Create Game</span>
            </div>
            {isConnected && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            )}
          </button>

          {/* Join Game Button */}
          <button
            onClick={() => onNavigate('join')}
            disabled={!isConnected}
            className={`group relative px-8 py-4 font-bold text-xl rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 ${
              isConnected
                ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white hover:shadow-red-500/50'
                : 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Sword className="w-6 h-6" />
              <span>Join Game</span>
            </div>
            {isConnected && (
              <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            )}
          </button>
        </div>

        {/* Side Avatars */}
        <div className="flex justify-between items-center w-full max-w-6xl">
          {/* Left Avatar */}
          <div className="hidden lg:block transform -translate-x-8">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-2xl border-4 border-white"></div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>
          </div>

          {/* Right Avatar */}
          <div className="hidden lg:block transform translate-x-8">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full shadow-2xl border-4 border-white"></div>
              <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-60 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          ></div>
        ))}
      </div>
    </div>
  );
}
