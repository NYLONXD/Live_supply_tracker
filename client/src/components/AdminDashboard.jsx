import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

const ADMIN_EMAIL = 'nylonxd@gmail.com'; // Replace with your admin email

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        if (currentUser.email === ADMIN_EMAIL) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          navigate('/'); // Redirect non-admins to home
        }
      } else {
        navigate('/'); // Redirect if not logged in
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetch('http://localhost:5000/api/shipments/analytics')
        .then(res => res.json())
        .then(data => {
          setAnalytics(data);
          setAnalyticsLoading(false);
        })
        .catch(err => {
          console.error('Error fetching analytics:', err);
          setAnalyticsLoading(false);
        });
    }
  }, [isAdmin]);

  if (loading) return <div className="text-white text-center mt-10">Checking credentials...</div>;
  if (!isAdmin) return null;
  if (analyticsLoading) return <div className="text-white text-center p-6">Loading admin analytics...</div>;

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-purple-900 to-pink-800 text-white font-sans">
      <h1 className="text-3xl font-bold mb-6">📊 Admin Analytics Dashboard</h1>
      <p className="text-lg mb-4">Welcome, {user.email}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/10 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-2">📦 Total Shipments</h2>
          <p className="text-2xl">{analytics.totalShipments}</p>
        </div>
        <div className="bg-white/10 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-2">⏱️ Average ETA</h2>
          <p className="text-2xl">{analytics.averageETA?.toFixed(2) ?? '--'} hrs</p>
        </div>
        <div className="bg-white/10 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-2">🚛 Top Route</h2>
          <p className="text-lg">{analytics.topRoute || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;