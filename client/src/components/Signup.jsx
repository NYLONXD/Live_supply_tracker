// Signup.js
import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup, sendEmailVerification } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import signupAvatar from '../assets/signup-avatar.svg';

export default function Signup({ onSignup, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    contactCode: '+91',
    contactNumber: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [typingPassword, setTypingPassword] = useState(false);

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
      if (onSignup) onSignup();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    const { firstName, lastName, contactCode, contactNumber, email, password } = formData;
    const fullContact = `${contactCode} ${contactNumber}`;

    // Only Gmail check
    if (!email.endsWith("@gmail.com")) {
      setError("Only Gmail addresses are allowed.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`
      });

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        firstName,
        lastName,
        contact: fullContact,
        email,
        createdAt: new Date()
      });

      await sendEmailVerification(user);
      alert("Verification email sent. Please check your Gmail and verify before logging in.");

      if (onSignup) onSignup();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-fuchsia-700 to-pink-800 px-4">
      <div className="bg-white rounded-2xl shadow-2xl flex max-w-5xl w-full overflow-hidden">
        {/* Left: Form */}
        <motion.form
          onSubmit={handleSignup}
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 80 }}
          className="w-1/2 p-10 flex flex-col gap-5 bg-white/10 backdrop-blur-md border-r border-white/20"
        >
          <h2 className="text-3xl font-extrabold text-center drop-shadow-md text-purple-400">
            ✨ Let's Get Started
          </h2>

          <button
            onClick={handleGoogleSignup}
            type="button"
            className="bg-white text-black py-2 rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 border hover:bg-gray-50 transition"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Sign up with Google
          </button>

          <div className="text-center text-white text-sm">or use your email</div>

          <div className="flex gap-3">
            <motion.input
              type="text"
              name="firstName"
              placeholder="First Name"
              className="flex-1 px-4 py-2 rounded-xl bg-white/90 text-black outline-none focus:ring-2 ring-purple-400"
              value={formData.firstName}
              onChange={handleChange}
              required
              whileFocus={{ rotate: 5, scale: 1.05 }}
              transition={{ duration: 0.3 }}
            />
            <motion.input
              type="text"
              name="lastName"
              placeholder="Last Name"
              className="flex-1 px-4 py-2 rounded-xl bg-white/90 text-black outline-none focus:ring-2 ring-pink-400 w-full"
              value={formData.lastName}
              onChange={handleChange}
              required
              whileFocus={{ rotate: -5, scale: 1.05 }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="flex gap-3">
            <select
              name="contactCode"
              value={formData.contactCode}
              onChange={handleChange}
              className="w-[30%] px-3 py-2 rounded-xl bg-white/90 text-black outline-none focus:ring-2 ring-purple-400"
            >
              <option value="+91">🇮🇳 +91 (IN)</option>
              <option value="+1">🇺🇸 +1 (US)</option>
              <option value="+44">🇬🇧 +44 (UK)</option>
              <option value="+61">🇦🇺 +61 (AUS)</option>
              <option value="+81">🇯🇵 +81 (JP)</option>
              <option value="+92">🇵🇰 +92 (PK)</option>
              <option value="+977">🇳🇵 +977 (NP)</option>
              <option value="+82">🇰🇷 +82 (KR)</option>
            </select>
            <input
              type="tel"
              name="contactNumber"
              placeholder="Phone Number"
              className="flex-1 px-4 py-2 rounded-xl bg-white/90 text-black outline-none focus:ring-2 ring-purple-400"
              value={formData.contactNumber}
              onChange={handleChange}
              pattern="[0-9]{7,15}"
              required
            />
          </div>

          <motion.input
            type="email"
            name="email"
            placeholder="Email"
            className="px-4 py-2 rounded-xl bg-white/90 text-black outline-none focus:ring-2 ring-purple-400"
            value={formData.email}
            onChange={handleChange}
            required
            whileFocus={{ rotate: 5, scale: 1.05 }}
            transition={{ duration: 0.3 }}
          />

          <div className="relative">
            <input
              type="password"
              name="password"
              placeholder="Password"
              className="px-4 py-2 w-full rounded-xl bg-white/90 text-black outline-none focus:ring-2 ring-pink-400"
              value={formData.password}
              onChange={(e) => {
                setTypingPassword(true);
                handleChange(e);
              }}
              onBlur={() => setTypingPassword(false)}
              required
            />
            <div className={`absolute top-1/2 right-3 transform -translate-y-1/2 text-xl transition-all duration-300 ${typingPassword ? 'scale-0' : 'scale-100'}`}>
              👁️
            </div>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm text-center">
              {error}
            </motion.div>
          )}

          <motion.button whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.03 }} type="submit" className="bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-xl font-semibold shadow-md transition-all">
            Sign Up
          </motion.button>

          <div className="text-center  text-sm mt-2 text-gray-900">
            Already have an account?{' '}
            <button type="button" onClick={onSwitchToLogin} className="underline text-pink-900 hover:text-white transition-all">
              Login
            </button>
          </div>
        </motion.form>

        {/* Right Image */}
        <div className="w-1/2 bg-gradient-to-br from-purple-800 to-pink-700 flex items-center justify-center p-8">
          <img src={signupAvatar} alt="Signup Visual" className="w-64 animate-float" />
        </div>
      </div>
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
