'use client';

import { useState } from 'react';

interface GameState {
  score: number;
  isPlaying: boolean;
  level: number;
}

interface MemoryGameState extends GameState {
  cards: { id: number; value: string; flipped: boolean; matched: boolean }[];
  flippedCards: number[];
  moves: number;
}

interface MemoryGameProps {
  onBack: () => void;
  onScoreUpdate: (score: number) => void;
}

const MemoryGame: React.FC<MemoryGameProps> = ({ onBack, onScoreUpdate }) => {
  const [gameState, setGameState] = useState<MemoryGameState>({
    score: 0,
    isPlaying: false,
    level: 1,
    cards: [],
    flippedCards: [],
    moves: 0
  });

  const symbols = ['🎮', '🎯', '🎨', '🚀', '🌟', '⚡', '🔮', '🎪'];
  
  const initializeGame = () => {
    const gameSymbols = [...symbols.slice(0, 4 + gameState.level), ...symbols.slice(0, 4 + gameState.level)];
    const shuffledCards = gameSymbols
      .map((value, index) => ({ id: index, value, flipped: false, matched: false }))
      .sort(() => Math.random() - 0.5);

    setGameState({
      score: 0,
      isPlaying: true,
      level: gameState.level,
      cards: shuffledCards,
      flippedCards: [],
      moves: 0
    });
  };

  const handleCardClick = (index: number) => {
    if (!gameState.isPlaying || gameState.flippedCards.length >= 2) return;
    if (gameState.cards[index].flipped || gameState.cards[index].matched) return;

    const newCards = [...gameState.cards];
    newCards[index].flipped = true;
    
    const newFlippedCards = [...gameState.flippedCards, index];
    
    setGameState(prev => ({
      ...prev,
      cards: newCards,
      flippedCards: newFlippedCards,
      moves: prev.moves + 1
    }));

    if (newFlippedCards.length === 2) {
      const [firstIndex, secondIndex] = newFlippedCards;
      const firstCard = newCards[firstIndex];
      const secondCard = newCards[secondIndex];

      if (firstCard.value === secondCard.value) {
        // Match found
        newCards[firstIndex].matched = true;
        newCards[secondIndex].matched = true;
        
        setTimeout(() => {
          const allMatched = newCards.every(card => card.matched);
          const newScore = gameState.score + 10 * gameState.level;
          
          setGameState(prev => ({
            ...prev,
            cards: newCards,
            flippedCards: [],
            score: newScore
          }));

          onScoreUpdate(newScore);

          if (allMatched) {
            setTimeout(() => {
              setGameState(prev => ({ ...prev, isPlaying: false, level: prev.level + 1 }));
            }, 500);
          }
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          newCards[firstIndex].flipped = false;
          newCards[secondIndex].flipped = false;
          setGameState(prev => ({ ...prev, cards: newCards, flippedCards: [] }));
        }, 1000);
      }
    }
  };

  return (
    <div className="bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-cyan-300">Memory Cards</h3>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
        >
          ← Back
        </button>
      </div>

      <div className="text-center mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-cyan-500/20 rounded-lg p-3">
            <p className="text-cyan-300 text-sm">Score</p>
            <p className="text-white text-xl font-bold">{gameState.score}</p>
          </div>
          <div className="bg-purple-500/20 rounded-lg p-3">
            <p className="text-purple-300 text-sm">Level</p>
            <p className="text-white text-xl font-bold">{gameState.level}</p>
          </div>
        </div>
        <p className="text-gray-300">Moves: {gameState.moves}</p>
      </div>

      {!gameState.isPlaying ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🧠</div>
          <p className="text-gray-300 mb-4">Match the pairs of symbols!</p>
          <button
            onClick={initializeGame}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl text-white font-semibold hover:scale-105 transition-transform"
          >
            Start Game
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {gameState.cards.map((card, index) => (
            <div
              key={card.id}
              onClick={() => handleCardClick(index)}
              className={`aspect-square rounded-xl flex items-center justify-center text-2xl cursor-pointer transition-all duration-300 ${
                card.flipped || card.matched
                  ? 'bg-gradient-to-br from-cyan-500 to-purple-500 transform rotate-0'
                  : 'bg-gray-700 hover:bg-gray-600 transform hover:rotate-2'
              } ${card.matched ? 'border-2 border-green-400' : ''}`}
            >
              {(card.flipped || card.matched) ? card.value : '?'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemoryGame;