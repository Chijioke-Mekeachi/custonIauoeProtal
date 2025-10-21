'use client';

import { useState, useEffect } from 'react';

interface ProgrammingGameProps {
  onBack: () => void;
  onScoreUpdate: (score: number) => void;
}

const ProgrammingSandbox: React.FC<ProgrammingGameProps> = ({ onBack, onScoreUpdate }) => {
  const [htmlCode, setHtmlCode] = useState<string>('<!-- Write your HTML here -->\n<div id="app">\n  <h1>Hello, Programmer!</h1>\n  <p>Start coding...</p>\n</div>');
  const [cssCode, setCssCode] = useState<string>('/* Write your CSS here */\n#app {\n  padding: 20px;\n  font-family: Arial, sans-serif;\n}\n\nh1 {\n  color: #4f46e5;\n}');
  const [jsCode, setJsCode] = useState<string>('// Write your JavaScript here\nconsole.log("Hello from JavaScript!");\n\ndocument.addEventListener("DOMContentLoaded", function() {\n  // Your code here\n});');
  const [output, setOutput] = useState<string>('');
  const [challenge, setChallenge] = useState<number>(1);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const programmingChallenges = [
    {
      id: 1,
      title: "Create a Counter App",
      description: "Build a simple counter that increments when a button is clicked",
      html: `<!-- Create a counter display and button -->\n<div id="counter-app">\n  <h2>Counter: <span id="count">0</span></h2>\n  <button id="increment-btn">Increment</button>\n</div>`,
      css: `/* Style your counter */\n#counter-app {\n  text-align: center;\n  padding: 20px;\n}\n\nbutton {\n  padding: 10px 20px;\n  background: #4f46e5;\n  color: white;\n  border: none;\n  border-radius: 5px;\n  cursor: pointer;\n}`,
      js: `// Make the counter work\nlet count = 0;\nconst countElement = document.getElementById('count');\nconst button = document.getElementById('increment-btn');\n\nbutton.addEventListener('click', function() {\n  count++;\n  countElement.textContent = count;\n});`,
      test: (code: string) => code.includes('addEventListener') && code.includes('count++')
    },
    {
      id: 2,
      title: "Todo List",
      description: "Create a simple todo list that can add and remove items",
      html: `<!-- Build a todo list -->\n<div id="todo-app">\n  <h2>Todo List</h2>\n  <input type="text" id="todo-input" placeholder="Add a new task">\n  <button id="add-btn">Add</button>\n  <ul id="todo-list"></ul>\n</div>`,
      css: `/* Style your todo list */\n#todo-app {\n  max-width: 400px;\n  margin: 0 auto;\n}\n\n.todo-item {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 10px;\n  border-bottom: 1px solid #ddd;\n}`,
      js: `// Implement todo functionality\nconst input = document.getElementById('todo-input');\nconst addBtn = document.getElementById('add-btn');\nconst todoList = document.getElementById('todo-list');\n\naddBtn.addEventListener('click', function() {\n  const task = input.value.trim();\n  if (task) {\n    const li = document.createElement('li');\n    li.className = 'todo-item';\n    li.innerHTML = '<span>' + task + '</span><button class="delete-btn">Delete</button>';\n    todoList.appendChild(li);\n    input.value = '';\n  }\n});`,
      test: (code: string) => code.includes('createElement') && code.includes('appendChild')
    },
    {
      id: 3,
      title: "Color Picker",
      description: "Create a color picker that changes background color",
      html: `<!-- Build a color picker interface -->\n<div id="color-picker">\n  <h2>Color Picker</h2>\n  <input type="color" id="color-input" value="#4f46e5">\n  <div id="color-display">Selected Color</div>\n</div>`,
      css: `/* Style your color picker */\n#color-picker {\n  text-align: center;\n  padding: 20px;\n}\n\n#color-display {\n  margin-top: 20px;\n  padding: 40px;\n  border-radius: 10px;\n  color: white;\n  font-weight: bold;\n}`,
      js: `// Make the color picker work\nconst colorInput = document.getElementById('color-input');\nconst colorDisplay = document.getElementById('color-display');\n\ncolorInput.addEventListener('input', function() {\n  const selectedColor = colorInput.value;\n  colorDisplay.style.backgroundColor = selectedColor;\n  colorDisplay.textContent = 'Selected: ' + selectedColor;\n});`,
      test: (code: string) => code.includes('addEventListener') && code.includes('style.backgroundColor')
    }
  ];

  const currentChallenge = programmingChallenges[challenge - 1];

  useEffect(() => {
    updateOutput();
  }, [htmlCode, cssCode, jsCode]);

  const updateOutput = () => {
    const iframeDocument = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>${cssCode}</style>
      </head>
      <body>${htmlCode}
        <script>${jsCode}</script>
      </body>
      </html>
    `;
    setOutput(iframeDocument);
  };

  const runCode = () => {
    updateOutput();
    
    // Test if challenge is completed
    if (currentChallenge && currentChallenge.test(jsCode)) {
      setIsCompleted(true);
      onScoreUpdate(challenge * 100);
    }
  };

  const nextChallenge = () => {
    if (challenge < programmingChallenges.length) {
      const nextChallengeIndex = challenge; // Current challenge becomes next
      setChallenge(challenge + 1);
      setHtmlCode(programmingChallenges[nextChallengeIndex].html);
      setCssCode(programmingChallenges[nextChallengeIndex].css);
      setJsCode(programmingChallenges[nextChallengeIndex].js);
      setIsCompleted(false);
    }
  };

  const resetChallenge = () => {
    if (currentChallenge) {
      setHtmlCode(currentChallenge.html);
      setCssCode(currentChallenge.css);
      setJsCode(currentChallenge.js);
      setIsCompleted(false);
    }
  };

  // Initialize with first challenge
  useEffect(() => {
    if (currentChallenge) {
      setHtmlCode(currentChallenge.html);
      setCssCode(currentChallenge.css);
      setJsCode(currentChallenge.js);
    }
  }, []);

  if (!currentChallenge) {
    return (
      <div className="bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
        <div className="text-center py-8">
          <p className="text-gray-300">No challenges available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/70 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-cyan-300">Programming Sandbox</h3>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
        >
          ← Back
        </button>
      </div>

      {/* Challenge Info */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 mb-6 border border-purple-500/20">
        <h4 className="text-lg font-semibold text-purple-300 mb-2">
          Challenge {challenge}: {currentChallenge.title}
        </h4>
        <p className="text-gray-300 text-sm">{currentChallenge.description}</p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={runCode}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white text-sm transition-colors"
          >
            Run Code
          </button>
          <button
            onClick={resetChallenge}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg text-white text-sm transition-colors"
          >
            Reset
          </button>
          {isCompleted && challenge < programmingChallenges.length && (
            <button
              onClick={nextChallenge}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white text-sm transition-colors"
            >
              Next Challenge
            </button>
          )}
        </div>
        {isCompleted && (
          <div className="mt-3 p-2 bg-green-500/20 border border-green-500/30 rounded-lg">
            <p className="text-green-300 text-sm">🎉 Challenge Completed! +{challenge * 100} points</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Code Editor */}
        <div className="space-y-4">
          <div>
            <label className="text-cyan-300 text-sm font-semibold mb-2 block">HTML</label>
            <textarea
              value={htmlCode}
              onChange={(e) => setHtmlCode(e.target.value)}
              className="w-full h-40 bg-gray-900/50 border border-gray-600/30 rounded-xl p-4 text-white font-mono text-sm resize-none focus:outline-none focus:border-cyan-500 transition-colors"
              spellCheck={false}
            />
          </div>
          
          <div>
            <label className="text-purple-300 text-sm font-semibold mb-2 block">CSS</label>
            <textarea
              value={cssCode}
              onChange={(e) => setCssCode(e.target.value)}
              className="w-full h-40 bg-gray-900/50 border border-gray-600/30 rounded-xl p-4 text-white font-mono text-sm resize-none focus:outline-none focus:border-purple-500 transition-colors"
              spellCheck={false}
            />
          </div>
          
          <div>
            <label className="text-yellow-300 text-sm font-semibold mb-2 block">JavaScript</label>
            <textarea
              value={jsCode}
              onChange={(e) => setJsCode(e.target.value)}
              className="w-full h-40 bg-gray-900/50 border border-gray-600/30 rounded-xl p-4 text-white font-mono text-sm resize-none focus:outline-none focus:border-yellow-500 transition-colors"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Output Preview */}
        <div>
          <label className="text-green-300 text-sm font-semibold mb-2 block">Live Preview</label>
          <div className="bg-white rounded-xl h-[500px] border-2 border-gray-600/30 overflow-hidden">
            <iframe
              srcDoc={output}
              title="output"
              sandbox="allow-scripts"
              className="w-full h-full"
            />
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-300 text-sm">Progress: {challenge}/{programmingChallenges.length}</span>
          <span className="text-cyan-300 text-sm font-semibold">
            {isCompleted ? '✅ Challenge Completed' : '🚧 Working...'}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
            style={{ width: `${(challenge / programmingChallenges.length) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ProgrammingSandbox;