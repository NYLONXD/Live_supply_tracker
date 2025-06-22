import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import Login from './Login';
import Signup from './Signup';
import Dashboard from './Dashboard';
import ForgetPassword from './forgetPassword';

export default function AuthWrapper() {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState('login'); // 'login', 'signup', or 'forgot'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-800 to-pink-800 text-white text-2xl font-bold">Loading...</div>;

  if (!user) {
    return (
      <div>
        {mode === 'login' ? (
          <Login 
            onLogin={() => setUser(auth.currentUser)} 
            onSwitchToSignup={() => setMode('signup')}
            onSwitchToForgot={() => setMode('forgot')}
          />
        ) : mode === 'signup' ? (
          <Signup onSignup={() => setUser(auth.currentUser)} onSwitchToLogin={() => setMode('login')} />
        ) : (
          <ForgetPassword onSwitchToLogin={() => setMode('login')} />
        )}
      </div>
    );
  }
  // Authenticated: show dashboard with logout
  return (
    <div className="relative">
      <button
        className="absolute top-4 right-4 bg-pink-700 text-white px-4 py-2 rounded font-semibold z-50 hover:bg-pink-800"
        onClick={() => signOut(auth)}
      >
        Logout
      </button>
      <Dashboard />
    </div>
  );
}
