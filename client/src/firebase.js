// client/src/firebase.js - FIXED VERSION
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDz_your_api_key_here",
  authDomain: "live-supply-tracker.firebaseapp.com",
  projectId: "live-supply-tracker",
  storageBucket: "live-supply-tracker.firebasestorage.app",
  messagingSenderId: "431603977208",
  appId: "1:431603977208:web:4f5edf07d3af02bb51640d",
  measurementId: "G-FTQPNJ12VN"
};

const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;