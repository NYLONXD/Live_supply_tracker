import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import loginAvatar from '../assets/login-avatar.svg'; // or use an online link

export default function Login({ onLogin, onSwitchToSignup, onSwitchToForgot }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [typingPassword, setTypingPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (onLogin) onLogin();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-fuchsia-700 to-pink-800 px-4">
      <div className="bg-white rounded-2xl shadow-2xl flex max-w-4xl w-full overflow-hidden">
        
        {/* Left Image or Illustration */}
        <div className="w-1/2 bg-gradient-to-br from-purple-700 to-pink-700 flex items-center justify-center p-8">
          <img src={loginAvatar} alt="Login Visual" className="w-64 animate-float" />
        </div>

        {/* Right Form Section */}
        <form onSubmit={handleLogin} className="w-1/2 p-10 flex flex-col gap-5 relative">
          <h2 className="text-3xl font-extrabold text-purple-700 text-center">Welcome Back!</h2>

          {/* Email input with rotation on focus */}
          <input
            type="email"
            placeholder="Email"
            className="border p-3 rounded transition-transform duration-300 focus:rotate-1 focus:scale-105 focus:ring-2 focus:ring-purple-400"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          {/* Password input with auto-closing eye animation */}
          <div className="relative">
            <input
              type="password"
              placeholder="Password"
              className="border p-3 w-full rounded focus:ring-2 focus:ring-pink-400"
              value={password}
              onChange={e => {
                setTypingPassword(true);
                setPassword(e.target.value);
              }}
              required
              onBlur={() => setTypingPassword(false)}
            />
            {/* Eye Animation */}
            <div className={`absolute top-1/2 right-3 transform -translate-y-1/2 transition-all duration-300 ${typingPassword ? 'scale-0' : 'scale-100'}`}>
              👁️
            </div>
          </div>

          <button type="button" className="text-sm text-purple-600 hover:underline" onClick={onSwitchToForgot}>
            Forgot Password?
          </button>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <button type="submit" className="bg-purple-700 hover:bg-purple-800 text-white py-2 rounded-xl shadow-lg transition-transform hover:scale-105">
            Login
          </button>

          <div className="text-center mt-2 text-sm text-gray-700">
            Don't have an account?{' '}
            <button type="button" className="text-purple-600 underline hover:font-bold" onClick={onSwitchToSignup}>
              Sign Up
            </button>
          </div>
        </form>
      </div>

      {/* Extra CSS for Floating Animation */}
      <style>{`
       .animate-float {
          animation: floatImage 4s ease-in-out infinite;
        }

        @keyframes floatImage {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
      `}</style>
    </div>
  );
}
