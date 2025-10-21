'use client';

import { useState, useEffect } from 'react';

interface GameState {
  score: number;
  isPlaying: boolean;
  level: number;
  difficulty: 'basic' | 'easy' | 'intermediate' | 'hard' | 'expert' | 'master';
}

interface TypingGameState extends GameState {
  text: string;
  userInput: string;
  startTime: number;
  wpm: number;
  accuracy: number;
  timeLeft: number;
  totalTime: number;
}

interface TypingGameProps {
  onBack: () => void;
  onScoreUpdate: (score: number) => void;
}

const AdvancedTypingGame: React.FC<TypingGameProps> = ({ onBack, onScoreUpdate }) => {
  const [gameState, setGameState] = useState<TypingGameState>({
    score: 0,
    isPlaying: false,
    level: 1,
    difficulty: 'basic',
    text: '',
    userInput: '',
    startTime: 0,
    wpm: 0,
    accuracy: 100,
    timeLeft: 60,
    totalTime: 60
  });

  // Extensive text library with 50 levels across 6 difficulty tiers
  const typingTexts = {
    basic: [
      "The cat sat on the mat.",
      "I like to read books.",
      "She has a red ball.",
      "We go to school every day.",
      "The sun is very bright.",
      "My dog runs fast.",
      "They play in the park.",
      "He eats an apple.",
      "I see a big tree.",
      "We love to learn."
    ],
    easy: [
      "The quick brown fox jumps over the lazy dog near the river bank.",
      "Programming computers is a very interesting and creative activity for students.",
      "Learning to type quickly and accurately will help you in your studies and career.",
      "The weather today is beautiful with clear skies and a gentle breeze blowing.",
      "University students should practice their skills regularly to improve performance.",
      "Reading books and articles can expand your knowledge and vocabulary significantly.",
      "The internet provides amazing opportunities for learning and communication worldwide.",
      "Healthy eating and exercise are important for maintaining good physical condition.",
      "Modern technology has transformed how we work, learn, and interact with each other.",
      "Time management is crucial for success in academic and professional environments."
    ],
    intermediate: [
      "The intricate complexities of quantum mechanics challenge our fundamental understanding of reality and the universe's underlying principles.",
      "Comprehensive knowledge of data structures and algorithms is essential for developing efficient software solutions and scalable applications.",
      "Critical thinking and analytical skills enable students to evaluate information objectively and make well-informed decisions in complex situations.",
      "The interdisciplinary nature of modern research requires collaboration between various scientific fields and technological domains for innovation.",
      "Effective communication skills are paramount in professional environments where clear articulation of ideas facilitates successful project completion.",
      "Sustainable development practices must balance economic growth with environmental conservation to ensure long-term planetary health.",
      "Cognitive psychology explores the intricate mechanisms of human perception, memory formation, and decision-making processes in detail.",
      "Global economic interdependence necessitates understanding international markets, trade policies, and cross-cultural business practices.",
      "Advanced mathematical concepts provide the foundational framework for understanding complex systems and solving sophisticated problems.",
      "The evolution of programming languages reflects the continuous advancement of computational theory and software engineering methodologies."
    ],
    hard: [
      "Pneumonoultramicroscopicsilicovolcanoconiosis, despite its extraordinary length, represents merely one example of the boundless complexities inherent in medical terminology and specialized scientific nomenclature.",
      "The phenomenological hermeneutics of existential ontology necessitates a profound examination of being qua being, transcending conventional metaphysical paradigms through rigorous deconstructive analysis.",
      "Quantum entanglement and superposition principles fundamentally challenge classical Newtonian physics, suggesting non-local connections that violate traditional causality assumptions.",
      "Epistemological relativism posits that knowledge claims are inherently contextualized within specific cultural, historical, and linguistic frameworks, thereby problematizing universal truth assertions.",
      "Multivariate statistical analysis enables researchers to identify complex correlational patterns and causal relationships across numerous interacting variables in large-scale datasets.",
      "Poststructuralist literary theory deconstructs binary oppositions and challenges authorial intentionality, emphasizing the reader's role in constructing textual meaning dynamically.",
      "Computational complexity theory categorizes problems according to their inherent difficulty, distinguishing between polynomial-time solvable issues and NP-complete conundrums.",
      "Neuroplasticity research demonstrates the brain's remarkable capacity for structural reorganization in response to learning, experience, and environmental stimulation throughout lifespan.",
      "The anthropic principle in cosmology suggests that universal physical constants appear finely-tuned to permit conscious observation, provoking profound philosophical implications.",
      "Differential geometry provides the mathematical foundation for general relativity, describing spacetime curvature through sophisticated tensor calculus and manifold theory."
    ],
    expert: [
      "The quintessential manifestation of epistemological paradoxes emerges through Gödel's incompleteness theorems, which demonstrate fundamental limitations within formal axiomatic systems and their capacity for self-referential consistency.",
      "Superstring theory postulates that fundamental constituents of reality are minuscule vibrating strings existing in ten-dimensional spacetime, potentially unifying quantum mechanics with general relativity through Calabi-Yau manifold compactifications.",
      "Deconstructive literary analysis, pioneered by Jacques Derrida, systematically subverts Western metaphysics' logocentric traditions by revealing inherent contradictions within binary oppositions and challenging phenomenology's presuppositions.",
      "The Riemann Hypothesis, concerning the distribution of non-trivial zeta function zeros, represents mathematics' most famous unsolved problem with profound implications for prime number theory and analytic number theory's foundations.",
      "Transcendental phenomenology, as developed by Edmund Husserl, employs eidetic reduction to investigate consciousness's essential structures, bracketing empirical assumptions to examine phenomena as intentionally constituted noematic correlates.",
      "Quantum chromodynamics describes strong nuclear interactions through color charge confinement and asymptotic freedom, utilizing non-Abelian gauge theories with SU(3) symmetry groups and renormalization group equations.",
      "Postmodern architectural theory rejects modernist universalism through historical reference, decorative elements, and contextual irony, embracing complexity and contradiction in built environment design principles.",
      "The philosophical implications of artificial general intelligence necessitate examining consciousness, qualia, and intentionality through computational functionalism, Chinese room arguments, and hard problem of consciousness debates.",
      "Langlands program conjectures deep connections between number theory's Galois representations and automorphic forms in harmonic analysis, suggesting profound unifications across seemingly disparate mathematical domains.",
      "Neurophilosophy investigates consciousness through integrated approaches combining neuroscience, cognitive psychology, and philosophical analysis, addressing the explanatory gap between neural correlates and subjective experience."
    ],
    master: [
      "The ontological commitment of Quine's criterion reveals the profound interdependence between existential quantification and conceptual schemes, wherein being becomes invariably relative to background theories and linguistic frameworks.",
      "Noncommutative geometry, pioneered by Alain Connes, generalizes traditional geometric concepts through operator algebras and spectral triples, enabling novel approaches to spacetime quantization and Standard Model extensions.",
      "Derridean différance encapsulates the perpetual deferral of meaning through temporalization and spacing, undermining metaphysical presence while demonstrating signification's inherently unstable and context-dependent nature.",
      "The AdS/CFT correspondence establishes a remarkable duality between gravitational theories in anti-de Sitter space and conformal field theories on its boundary, providing insights into quantum gravity and holographic principles.",
      "Transfinite set theory, developed by Georg Cantor, reveals hierarchical infinities through cardinal arithmetic and continuum hypothesis independence proofs, fundamentally transforming mathematics' foundational understanding.",
      "Phenomenological reduction brackets the natural attitude to examine pure consciousness, revealing noetic-noematic correlations through intentional analysis while suspending ontological commitments about the external world.",
      "Mirror symmetry in algebraic geometry proposes astonishing equivalences between Calabi-Yau manifolds, enabling computations of Gromov-Witten invariants through sophisticated enumerative geometry techniques and quantum cohomology.",
      "The hard problem of consciousness, formulated by David Chalmers, distinguishes between explaining cognitive functions and understanding subjective experience's qualitative character, challenging physicalist reductionism.",
      "Modal realism posits that possible worlds exist as concrete entities rather than abstract representations, with actuality being indexically determined within this pluriverse's ontological plenitude.",
      "The geometric Langlands correspondence establishes deep connections between Higgs bundles on Riemann surfaces and representations of fundamental groups, generalizing classical Fourier-Mukai transforms through derived categories."
    ]
  };

  const difficultyThresholds = {
    basic: 10,
    easy: 20,
    intermediate: 30,
    hard: 40,
    expert: 45,
    master: 50
  };

  const getDifficulty = (level: number): GameState['difficulty'] => {
    if (level <= difficultyThresholds.basic) return 'basic';
    if (level <= difficultyThresholds.easy) return 'easy';
    if (level <= difficultyThresholds.intermediate) return 'intermediate';
    if (level <= difficultyThresholds.hard) return 'hard';
    if (level <= difficultyThresholds.expert) return 'expert';
    return 'master';
  };

  const getTimeLimit = (difficulty: GameState['difficulty']): number => {
    const times = {
      basic: 90,
      easy: 75,
      intermediate: 60,
      hard: 45,
      expert: 30,
      master: 25
    };
    return times[difficulty];
  };

  const getRandomText = (difficulty: GameState['difficulty']): string => {
    const texts = typingTexts[difficulty];
    return texts[Math.floor(Math.random() * texts.length)];
  };

  const startGame = () => {
    const difficulty = getDifficulty(gameState.level);
    const timeLimit = getTimeLimit(difficulty);
    const text = getRandomText(difficulty);
    
    setGameState({
      score: 0,
      isPlaying: true,
      level: gameState.level,
      difficulty,
      text,
      userInput: '',
      startTime: Date.now(),
      wpm: 0,
      accuracy: 100,
      timeLeft: timeLimit,
      totalTime: timeLimit
    });
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!gameState.isPlaying) return;

    const userInput = e.target.value;
    const elapsedTime = (Date.now() - gameState.startTime) / 60000;
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

    // Score calculation with difficulty multiplier
    const difficultyMultipliers = {
      basic: 1,
      easy: 1.5,
      intermediate: 2,
      hard: 3,
      expert: 5,
      master: 8
    };
    
    const baseScore = Math.round(wpm * accuracy / 10);
    const newScore = gameState.score + baseScore * difficultyMultipliers[gameState.difficulty];

    setGameState(prev => ({
      ...prev,
      userInput,
      wpm,
      accuracy,
      score: newScore
    }));

    onScoreUpdate(newScore);

    // Check for level completion
    if (userInput === gameState.text) {
      setTimeout(() => {
        const nextLevel = Math.min(gameState.level + 1, 50);
        setGameState(prev => ({ 
          ...prev, 
          isPlaying: false, 
          level: nextLevel 
        }));
      }, 500);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState.isPlaying && gameState.timeLeft > 0) {
      timer = setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }));
      }, 1000);
    } else if (gameState.isPlaying && gameState.timeLeft <= 0) {
      setGameState(prev => ({ ...prev, isPlaying: false }));
    }
    return () => clearTimeout(timer);
  }, [gameState.isPlaying, gameState.timeLeft]);

  const getCharClass = (index: number) => {
    if (index >= gameState.userInput.length) return 'text-gray-400';
    if (gameState.userInput[index] === gameState.text[index]) {
      return 'text-green-400';
    }
    return 'text-red-400';
  };

  const getDifficultyColor = (difficulty: GameState['difficulty']) => {
    const colors = {
      basic: 'from-green-500 to-emerald-500',
      easy: 'from-blue-500 to-cyan-500',
      intermediate: 'from-yellow-500 to-amber-500',
      hard: 'from-orange-500 to-red-500',
      expert: 'from-purple-500 to-pink-500',
      master: 'from-red-500 to-pink-600'
    };
    return colors[difficulty];
  };

  const progressPercentage = (gameState.level / 50) * 100;

  return (
    <div className="bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-cyan-300">Advanced Typing Master</h3>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
        >
          ← Back
        </button>
      </div>

      {/* Progress and Level Info */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-300 text-sm">Level {gameState.level}/50</span>
          <span className={`text-sm font-semibold bg-gradient-to-r ${getDifficultyColor(gameState.difficulty)} bg-clip-text text-transparent`}>
            {gameState.difficulty.toUpperCase()}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full bg-gradient-to-r ${getDifficultyColor(gameState.difficulty)} transition-all duration-500`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="grid grid-cols-4 gap-4 mb-4">
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
          <div className="bg-orange-500/20 rounded-lg p-3">
            <p className="text-orange-300 text-sm">Time</p>
            <p className="text-white text-xl font-bold">{gameState.timeLeft}s</p>
          </div>
        </div>
      </div>

      {!gameState.isPlaying ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">⌨️</div>
          <h4 className="text-xl font-bold text-cyan-300 mb-2">
            Level {gameState.level} - {gameState.difficulty.toUpperCase()}
          </h4>
          <p className="text-gray-300 mb-4">
            {gameState.level === 50 ? 
              "Final Challenge! Complete this to become a typing master!" :
              `Type the ${gameState.difficulty} level text as fast as you can!`
            }
          </p>
          <div className="bg-gray-900/50 rounded-xl p-4 mb-4 border border-gray-600/30">
            <p className="text-gray-400 text-sm mb-2">Next Text Preview:</p>
            <p className="text-white text-sm font-mono leading-relaxed">
              {getRandomText(getDifficulty(gameState.level))}
            </p>
          </div>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl text-white font-semibold hover:scale-105 transition-transform"
          >
            {gameState.level === 1 ? 'Start Game' : 'Continue to Level ' + gameState.level}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-600/30">
            <p className="text-gray-300 text-sm mb-2">Type this ({gameState.difficulty}):</p>
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
              Level {gameState.level} • {gameState.difficulty.toUpperCase()} • Time: {gameState.timeLeft}s
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedTypingGame;