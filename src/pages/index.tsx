'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
// export { default as GameCenter } from './Components/GameCenter';
// export { default as MemoryGame } from './components/MemoryGame';
// export { default as TypingGame } from './TypingGame';
// export { default as ReactionGame } from './ReactionGame';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    matrix: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  // Animated background effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
    }> = [];

    const colors = [
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
      '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'
    ];

    // Create particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 2,
        speedY: (Math.random() - 0.5) * 2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(10, 10, 20, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, index) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x > canvas.width) particle.x = 0;
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.y > canvas.height) particle.y = 0;
        if (particle.y < 0) particle.y = canvas.height;

        // Draw particle with gradient
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 2
        );
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
        ctx.fill();

        // Connect particles with lines
        particles.slice(index + 1).forEach(otherParticle => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (1 - distance / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Use our proxy API route instead of direct call
      const data = await api.login(formData.matrix.toLowerCase(), formData.password);

      if (data.status === true) {
        // Store tokens and user data
        localStorage.setItem('access_token', data.payload.token.access_token);
        localStorage.setItem('refresh_token', data.payload.token.refresh_token);
        localStorage.setItem('user_data', JSON.stringify(data.payload.user));
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
      
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    console.log('Forgot password flow initiated');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gray-900 overflow-hidden">
<head>
  <title>Login</title>
  <link rel="icon" type="image/png" href="images.jpeg" />
</head>

      {/* Animated Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
      
      {/* Animated Grid Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/10 to-cyan-900/20" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-gray-900 to-gray-900" />

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Floating AI Orb */}
        <div className="absolute -top-20 left-1/2 transform -translate-x-1/2">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-full animate-pulse shadow-2xl shadow-cyan-500/50">
              <div className="absolute inset-2 bg-gray-900 rounded-full animate-spin-slow">
                <div className="absolute inset-0.5 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full opacity-75 blur-sm" />
              </div>
            </div>
            <div className="absolute -inset-4 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-full opacity-20 blur-xl animate-pulse" />
          </div>
        </div>

        <div className="bg-gray-800/70 backdrop-blur-xl rounded-3xl border border-gray-700/50 shadow-2xl overflow-hidden">
          {/* Gradient Border Effect */}
          <div className="h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 animate-gradient-x" />
          
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x">
                    Sign in
                  </h1>
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-lg blur opacity-20 animate-pulse" />
                </div>
              </div>
              
              <h2 className="text-xl font-semibold text-white mb-2">
                Welcome to <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">IAUOE Portal</span>
              </h2>
              <p className="text-gray-300 text-sm leading-relaxed">
                Enter your matrix credentials to access the neural network
              </p>
            </div>

            {/* Login Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Matrix Input */}
                <div className="group">
                  <label htmlFor="matrix" className="block text-sm font-medium text-cyan-300 mb-2 group-focus-within:text-cyan-200 transition-colors">
                    <span className="flex items-center">
                      Matriculation Number
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      id="matrix"
                      name="matrix"
                      type="text"
                      required
                      value={formData.matrix}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all duration-300 backdrop-blur-sm disabled:opacity-50 text-sm"
                      placeholder="e.g., u/xxxx/xxxx"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -z-10" />
                  </div>
                </div>

                {/* Password Input */}
                <div className="group">
                  <label htmlFor="password" className="block text-sm font-medium text-purple-300 mb-2 group-focus-within:text-purple-200 transition-colors">
                    <span className="flex items-center">
                      Password
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition-all duration-300 backdrop-blur-sm disabled:opacity-50 text-sm"
                      placeholder="Enter your password"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 -z-10" />
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 backdrop-blur-sm">
                  <div className="flex items-center text-red-300 text-sm">
                    <span className="mr-2">⚠️</span>
                    {error}
                  </div>
                </div>
              )}

              {/* Sign In Button */}
              <div className="relative group">
                <button
                  type="submit"
                  disabled={isLoading}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  className="w-full py-4 px-6 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-xl text-white font-semibold text-sm tracking-wider uppercase transform transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      <span className="animate-pulse">Authenticating...</span>
                    </div>
                  ) : (
                    <span className="flex items-center justify-center">
                      Login
                    </span>
                  )}
                </button>
                
                {/* Button Glow Effect */}
                <div className={`absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-xl blur opacity-30 transition-opacity duration-300 ${
                  isHovered && !isLoading ? 'opacity-50' : 'opacity-20'
                } ${isLoading ? 'animate-pulse' : ''} -z-10`} />
              </div>

              {/* Forgot Password */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                  className="text-sm bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent hover:from-cyan-300 hover:to-purple-300 transition-all duration-300 disabled:opacity-30"
                >
                  <span className="flex items-center justify-center">
                    Forgot Password
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-400 text-xs">
            Powered by <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">JudeX</span>
          </p>
        </div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>
    </div>
  );
}