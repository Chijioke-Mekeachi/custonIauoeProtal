'use client';

import { useState } from 'react';
import * as React from "react";

interface GameState {
  score: number;
  isPlaying: boolean;
  level: number;
}

interface TypingGameState extends GameState {
  text: string;
  userInput: string;
  startTime: number;
  wpm: number;
  accuracy: number;
}

interface TypingGameProps {
  onBack: () => void;
  onScoreUpdate: (score: number) => void;
}

const TypingGame: React.FC<TypingGameProps> = ({ onBack, onScoreUpdate }) => {
  const [gameState, setGameState] = useState<TypingGameState>({
    score: 0,
    isPlaying: false,
    level: 1,
    text: '',
    userInput: '',
    startTime: 0,
    wpm: 0,
    accuracy: 100
  });

  const sampleTexts = [
    "The quick brown fox jumps over the lazy dog while programming amazing applications",
    "Type this text as fast as you can with perfect accuracy to score high points",
    "React and Next.js are amazing frameworks for building modern web applications",
    "Student portal games can be both fun and educational for university students",
    "Practice typing regularly to improve your speed and accuracy in coding"
  ];

  const startGame = () => {
    const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
    setGameState({
      score: 0,
      isPlaying: true,
      level: 1,
      text: randomText,
      userInput: '',
      startTime: Date.now(),
      wpm: 0,
      accuracy: 100
    });
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!gameState.isPlaying) return;

    const userInput = e.target.value;
    const elapsedTime = (Date.now() - gameState.startTime) / 60000; // minutes
    const wordsTyped = userInput.trim().split(/\s+/).length;
    const wpm = Math.round(wordsTyped / elapsedTime);
    
    // Calculate accuracy
    let correctChars = 0;
    for (let i = 0; i < userInput.length; i++) {
      if (userInput[i] === gameState.text[i]) {
        correctChars++;
      }
    }
    const accuracy = userInput.length > 0 ? Math.round((correctChars / userInput.length) * 100) : 100;

    const newScore = Math.round(wpm * accuracy / 10);

    setGameState(prev => ({
      ...prev,
      userInput,
      wpm,
      accuracy,
      score: newScore
    }));

    onScoreUpdate(newScore);

    if (userInput === gameState.text) {
      setTimeout(() => {
        setGameState(prev => ({ ...prev, isPlaying: false, level: prev.level + 1 }));
      }, 500);
    }
  };

  const getCharClass = (index: number) => {
    if (index >= gameState.userInput.length) return 'text-gray-400';
    if (gameState.userInput[index] === gameState.text[index]) {
      return 'text-green-400';
    }
    return 'text-red-400';
  };

  return (
    <div className="bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-cyan-300">Speed Typing</h3>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
        >
          ← Back
        </button>
      </div>

      <div className="text-center mb-6">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-cyan-500/20 rounded-lg p-3">
            <p className="text-cyan-300 text-sm">WPM</p>
            <p className="text-white text-xl font-bold">{gameState.wpm}</p>
          </div>
          <div className="bg-purple-500/20 rounded-lg p-3">
            <p className="text-purple-300 text-sm">Accuracy</p>
            <p className="text-white text-xl font-bold">{gameState.accuracy}%</p>
          </div>
          <div className="bg-green-500/20 rounded-lg p-3">
            <p className="text-green-300 text-sm">Score</p>
            <p className="text-white text-xl font-bold">{gameState.score}</p>
          </div>
        </div>
      </div>

      {!gameState.isPlaying ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">⌨️</div>
          <p className="text-gray-300 mb-4">Type the text as fast as you can!</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl text-white font-semibold hover:scale-105 transition-transform"
          >
            Start Game
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-600/30">
            <p className="text-gray-300 text-sm mb-2">Type this:</p>
            <div className="text-white text-lg font-mono leading-relaxed">
              {gameState.text.split('').map((char, index) => (
                <span key={index} className={getCharClass(index)}>
                  {char}
                </span>
              ))}
            </div>
          </div>
          
          <textarea
            value={gameState.userInput}
            onChange={handleInput}
            placeholder="Start typing here..."
            className="w-full h-32 bg-gray-900/50 border border-gray-600/30 rounded-xl p-4 text-white font-mono resize-none focus:outline-none focus:border-cyan-500 transition-colors"
            autoFocus
          />
          
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              Level {gameState.level} • Complete the text to advance
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TypingGame;