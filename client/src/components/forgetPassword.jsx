import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import forgotAvatar from '../assets/forgot-avatar.svg'; // SVG illustration

function ForgetPassword({ onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('✅ Password reset email sent! Check your inbox.');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-fuchsia-700 to-pink-700 px-4">
      <div className="bg-white rounded-2xl shadow-2xl flex max-w-4xl w-full overflow-hidden">
        
        {/* Left Side Image */}
        <div className="w-1/2 bg-gradient-to-br from-purple-800 to-pink-700 flex items-center justify-center p-8">
          <img src={forgotAvatar} alt="Reset Visual" className="w-64 animate-float" />
        </div>

        {/* Right Side Form */}
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 80 }}
          className="w-1/2 p-10 flex flex-col gap-5 bg-white/10 backdrop-blur-md"
        >
          <h2 className="text-3xl font-bold text-center text-purple-400 drop-shadow-md">🔒 Forgot Password</h2>
          <p className="text-Black drop-shadow-md text-sm text-center">Enter your email to receive a password reset link</p>
          
          <form onSubmit={handleReset} className="flex flex-col gap-4 mt-2">
            <motion.input
              type="email"
              placeholder="Enter your email"
              className="px-4 py-2 rounded-xl bg-white/90 text-black outline-none focus:ring-2 ring-purple-400"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              whileFocus={{ rotate: 3, scale: 1.03 }}
              transition={{ duration: 0.3 }}
            />

            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.03 }}
              className="bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-xl font-semibold shadow-md transition-all"
            >
              Reset Password
            </motion.button>
          </form>

          {message && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-green-400 text-sm text-center"
            >
              {message}
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-sm text-center"
            >
              {error}
            </motion.div>
          )}

          <div className="text-center text-gray-500 text-sm mt-2">
            Remembered your password?{' '}
            <button
              type="button"
              className="underline text-pink-300 hover:text-white transition-all"
              onClick={onSwitchToLogin}
            >
              Login
            </button>
          </div>
        </motion.div>
      </div>

      {/* Animation for float */}
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

export default ForgetPassword;
