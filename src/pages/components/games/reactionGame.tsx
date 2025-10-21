'use client';

import { useState } from 'react';

interface GameState {
  score: number;
  isPlaying: boolean;
  level: number;
}

interface ReactionGameState extends GameState {
  targetVisible: boolean;
  targetPosition: { x: number; y: number };
  reactionTime: number;
  startTime: number;
}

interface ReactionGameProps {
  onBack: () => void;
  onScoreUpdate: (score: number) => void;
}

const ReactionGame: React.FC<ReactionGameProps> = ({ onBack, onScoreUpdate }) => {
  const [gameState, setGameState] = useState<ReactionGameState>({
    score: 0,
    isPlaying: false,
    level: 1,
    targetVisible: false,
    targetPosition: { x: 50, y: 50 },
    reactionTime: 0,
    startTime: 0
  });

  const startRound = () => {
    setGameState(prev => ({
      ...prev,
      targetVisible: false,
      isPlaying: true
    }));

    // Random delay before showing target (1-3 seconds)
    const delay = 1000 + Math.random() * 2000;
    
    setTimeout(() => {
      const x = 20 + Math.random() * 60; // 20% to 80%
      const y = 20 + Math.random() * 60; // 20% to 80%
      
      setGameState(prev => ({
        ...prev,
        targetVisible: true,
        targetPosition: { x, y },
        startTime: Date.now()
      }));
    }, delay);
  };

  const handleTargetClick = () => {
    if (!gameState.targetVisible || !gameState.isPlaying) return;

    const reactionTime = Date.now() - gameState.startTime;
    const timeScore = Math.max(0, 1000 - reactionTime);
    const levelBonus = gameState.level * 50;
    const newScore = gameState.score + timeScore + levelBonus;

    setGameState(prev => ({
      ...prev,
      targetVisible: false,
      reactionTime,
      score: newScore,
      level: prev.reactionTime < 300 ? prev.level + 1 : prev.level
    }));

    onScoreUpdate(newScore);

    // Start next round after a short delay
    setTimeout(startRound, 1000);
  };

  const startGame = () => {
    setGameState({
      score: 0,
      isPlaying: true,
      level: 1,
      targetVisible: false,
      targetPosition: { x: 50, y: 50 },
      reactionTime: 0,
      startTime: 0
    });
    startRound();
  };

  return (
    <div className="bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-cyan-300">Reaction Test</h3>
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
            <p className="text-cyan-300 text-sm">Score</p>
            <p className="text-white text-xl font-bold">{gameState.score}</p>
          </div>
          <div className="bg-purple-500/20 rounded-lg p-3">
            <p className="text-purple-300 text-sm">Level</p>
            <p className="text-white text-xl font-bold">{gameState.level}</p>
          </div>
          <div className="bg-green-500/20 rounded-lg p-3">
            <p className="text-green-300 text-sm">Reaction</p>
            <p className="text-white text-xl font-bold">{gameState.reactionTime}ms</p>
          </div>
        </div>
      </div>

      {!gameState.isPlaying ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">⚡</div>
          <p className="text-gray-300 mb-4">Click the target as soon as it appears!</p>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl text-white font-semibold hover:scale-105 transition-transform"
          >
            Start Game
          </button>
        </div>
      ) : (
        <div className="relative h-64 bg-gray-900/50 rounded-xl border border-gray-600/30 overflow-hidden">
          {!gameState.targetVisible ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">🎯</div>
                <p className="text-gray-300">Get ready...</p>
                <p className="text-gray-400 text-sm">Target will appear soon</p>
              </div>
            </div>
          ) : (
            <div
              className="absolute w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full cursor-pointer transform hover:scale-110 transition-transform shadow-lg border-2 border-white flex items-center justify-center"
              style={{
                left: `${gameState.targetPosition.x}%`,
                top: `${gameState.targetPosition.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={handleTargetClick}
            >
              <span className="text-white font-bold text-sm">CLICK</span>
            </div>
          )}
        </div>
      )}

      {gameState.isPlaying && (
        <div className="text-center mt-4">
          <p className="text-gray-400 text-sm">
            Level {gameState.level} • Click the red circle as fast as you can!
          </p>
        </div>
      )}
    </div>
  );
};

export default ReactionGame;