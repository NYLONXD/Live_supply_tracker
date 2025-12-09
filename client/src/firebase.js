// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "VITE_FIREBASE_API_KEY",
  authDomain: "live-supply-tracker.firebaseapp.com",
  projectId: "live-supply-tracker",
  storageBucket: "live-supply-tracker.appspot.com", // ✅ FIXED
  messagingSenderId: "431603977208",
  appId: "1:431603977208:web:4f5edf07d3af02bb51640d",
  measurementId: "G-FTQPNJ12VN"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
