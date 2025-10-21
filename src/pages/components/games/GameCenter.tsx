"use client";

import { useState } from "react";
import MemoryGame from "./MemoryGame";
import TypingGame from "./TypingGame";
import ReactionGame from "./reactionGame";
import AdvancedTypingGame from "./AdvanceTypingGame";
import ProgrammingSandbox from "./ProgrammingSandbox";

interface GameCenterProps {
  // You can add props here if needed
}

const GameCenter: React.FC<GameCenterProps> = () => {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [gameScore, setGameScore] = useState(0);

  const handleGameScoreUpdate = (score: number) => {
    setGameScore(score);
  };

  return (
    <div className="bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Game Center
        </h2>
        {activeGame && (
          <div className="bg-gradient-to-r from-green-500 to-cyan-500 rounded-lg px-4 py-2">
            <p className="text-white font-semibold">Score: {gameScore}</p>
          </div>
        )}
      </div>

      {!activeGame ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Game 1 Card */}
          <div
            className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-2xl p-6 border border-cyan-500/20 hover:border-cyan-400/40 cursor-pointer transition-all duration-300 hover:scale-105 group"
            onClick={() => setActiveGame("memory")}
          >
            <div className="text-center">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                🧠
              </div>
              <h3 className="text-xl font-bold text-cyan-300 mb-2">
                Memory Cards
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                Test your memory by matching pairs of symbols. Improve your
                concentration!
              </p>
              <div className="bg-cyan-500/20 rounded-lg px-3 py-1 inline-block">
                <span className="text-cyan-300 text-sm">Brain Training</span>
              </div>
            </div>
          </div>

          {/* Game 2 Card */}
          <div
            className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-500/20 hover:border-purple-400/40 cursor-pointer transition-all duration-300 hover:scale-105 group"
            onClick={() => setActiveGame("typing")}
          >
            <div className="text-center">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                ⌨️
              </div>
              <h3 className="text-xl font-bold text-purple-300 mb-2">
                Speed Typing
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                Improve your typing speed and accuracy. Essential for coding and
                writing!
              </p>
              <div className="bg-purple-500/20 rounded-lg px-3 py-1 inline-block">
                <span className="text-purple-300 text-sm">Skill Building</span>
              </div>
            </div>
          </div>

          {/* Game 3 Card */}
          <div
            className="bg-gradient-to-br from-pink-500/10 to-red-500/10 rounded-2xl p-6 border border-pink-500/20 hover:border-pink-400/40 cursor-pointer transition-all duration-300 hover:scale-105 group"
            onClick={() => setActiveGame("reaction")}
          >
            <div className="text-center">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">
                ⚡
              </div>
              <h3 className="text-xl font-bold text-pink-300 mb-2">
                Reaction Test
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                Test your reflexes and reaction time. How fast can you click?
              </p>
              <div className="bg-pink-500/20 rounded-lg px-3 py-1 inline-block">
                <span className="text-pink-300 text-sm">Reflex Training</span>
              </div>
            </div>
          </div>
          <div 
  className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl p-6 border border-blue-500/20 hover:border-blue-400/40 cursor-pointer transition-all duration-300 hover:scale-105 group"
  onClick={() => setActiveGame('advanced-typing')}
>
  <div className="text-center">
    <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">⚡</div>
    <h3 className="text-xl font-bold text-blue-300 mb-2">Advanced Typing</h3>
    <p className="text-gray-300 text-sm mb-4">
      50 levels across 6 difficulty tiers. Master typing with challenging texts!
    </p>
    <div className="bg-blue-500/20 rounded-lg px-3 py-1 inline-block">
      <span className="text-blue-300 text-sm">Pro Challenge</span>
    </div>
  </div>
</div>

<div 
  className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-500/20 hover:border-green-400/40 cursor-pointer transition-all duration-300 hover:scale-105 group"
  onClick={() => setActiveGame('programming')}
>
  <div className="text-center">
    <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">💻</div>
    <h3 className="text-xl font-bold text-green-300 mb-2">Code Sandbox</h3>
    <p className="text-gray-300 text-sm mb-4">
      Live HTML, CSS, JavaScript editor with programming challenges. Learn by doing!
    </p>
    <div className="bg-green-500/20 rounded-lg px-3 py-1 inline-block">
      <span className="text-green-300 text-sm">Developer</span>
    </div>
  </div>
</div>
        </div>
        
      ) : (
        <div>
          {activeGame === "memory" && (
            <MemoryGame
              onBack={() => setActiveGame(null)}
              onScoreUpdate={handleGameScoreUpdate}
            />
          )}
          {activeGame === "typing" && (
            <TypingGame
              onBack={() => setActiveGame(null)}
              onScoreUpdate={handleGameScoreUpdate}
            />
          )}
          {activeGame === "reaction" && (
            <ReactionGame
              onBack={() => setActiveGame(null)}
              onScoreUpdate={handleGameScoreUpdate}
            />
          )}
          {activeGame === "advanced-typing" && (
            <AdvancedTypingGame
              onBack={() => setActiveGame(null)}
              onScoreUpdate={handleGameScoreUpdate}
            />
          )}
          {activeGame === "programming" && (
            <ProgrammingSandbox
              onBack={() => setActiveGame(null)}
              onScoreUpdate={handleGameScoreUpdate}
            />
          )}
        </div>
      )}

      {!activeGame && (
        <div className="mt-8 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl p-6 border border-cyan-500/20">
          <h3 className="text-lg font-semibold text-cyan-300 mb-3">
            🎮 Game Benefits
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center">
              <span className="text-green-400 mr-2">✓</span>
              <span className="text-gray-300">Improves cognitive skills</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-400 mr-2">✓</span>
              <span className="text-gray-300">Enhances typing speed</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-400 mr-2">✓</span>
              <span className="text-gray-300">Trains reaction time</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameCenter;
