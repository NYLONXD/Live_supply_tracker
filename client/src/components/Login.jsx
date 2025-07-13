// Login.js
import React, { useState } from 'react';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../firebase';
import loginAvatar from '../assets/login-avatar.svg';
import emailjs from 'emailjs-com';
import { doc, setDoc } from 'firebase/firestore';

export default function Login({ onLogin, onSwitchToSignup, onSwitchToForgot }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [typingPassword, setTypingPassword] = useState(false);

  // Send login email notification using EmailJS
  const sendLoginNotification = (to_email) => {
    emailjs.send(
      'service_h03ftuk',
      'template_qn3tx2h',
      {
        to_email: to_email,
        login_time: new Date().toLocaleString(),
      },
      'UnNq0ftJ3p1l788Ui'
    ).then(
      (result) => {
        // success toast if needed
      },
      (error) => {
        // silently fail
      }
    );
  };

  // Handle Google Signup
  const handleGoogleSignup = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: new Date()
      });

      if (onLogin) onLogin();
    } catch (error) {
      setError(error.message);
    }
  };

  // Handle Email Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check Gmail verification
      if (!user.emailVerified) {
        setError("Please verify your Gmail before logging in.");
        return;
      }

      sendLoginNotification(email); // optional EmailJS
      if (onLogin) onLogin();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-fuchsia-700 to-pink-800 px-4">
      <div className="bg-white rounded-2xl shadow-2xl flex max-w-4xl w-full overflow-hidden">
        {/* Left Side Image */}
        <div className="w-1/2 bg-gradient-to-br from-purple-700 to-pink-700 flex items-center justify-center p-8">
          <img src={loginAvatar} alt="Login Visual" className="w-64 animate-float" />
        </div>

        {/* Right Side Form */}
        <form onSubmit={handleLogin} className="w-1/2 p-10 flex flex-col gap-5 relative">
          <h2 className="text-3xl font-extrabold text-purple-700 text-center">Welcome Back!</h2>

          <input
            type="email"
            placeholder="Email"
            className="border p-3 rounded transition-transform duration-300 focus:rotate-1 focus:scale-105 focus:ring-2 focus:ring-purple-400"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

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
              onBlur={() => setTypingPassword(false)}
              required
            />
            <div className={`absolute top-1/2 right-3 transform -translate-y-1/2 transition-all duration-300 ${typingPassword ? 'scale-0' : 'scale-100'}`}>
              👁️
            </div>
          </div>

          <button type="button" className="text-sm text-purple-600 hover:underline" onClick={onSwitchToForgot}>
            Forgot Password?
          </button>

          {error && <div className="text-red-500 text-sm text-center">{error}</div>}

          <button type="submit" className="bg-purple-700 hover:bg-purple-800 text-white py-2 rounded-xl shadow-lg transition-transform hover:scale-105">
            Login
          </button>

          <button
            onClick={handleGoogleSignup}
            type="button"
            className="bg-white text-black py-2 rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 border hover:bg-gray-50 transition"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Sign up with Google
          </button>

          <div className="text-center mt-2 text-sm text-gray-700">
            Don't have an account?{' '}
            <button type="button" className="text-purple-600 underline hover:font-bold" onClick={onSwitchToSignup}>
              Sign Up
            </button>
          </div>
        </form>
      </div>

      {/* Animation CSS */}
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
