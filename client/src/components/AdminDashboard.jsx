import React, { useEffect, useState, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import AdminTaskManager from './AdminTaskManager';
import ShipmentsPerDayChart from './ShipmentsPerDayChart';
import TotalShipmentsCard from './TotalShipmentsCard';
import TopRoutesMapWithPie from './TopRoutesMapWithPie';
import AdminProfileCard from './AdminProfileCard';
import gsap from 'gsap';

const ADMIN_EMAIL = 'nylonxd2005@gmail.com';

const AdminDashboard = () => {
  const [taskManagerOpen, setTaskManagerOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const navigate = useNavigate();

  const pageRef = useRef();
  const headerRef = useRef();
  const cardsRef = useRef();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        if (currentUser.email === ADMIN_EMAIL) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          navigate('/');
        }
      } else {
        navigate('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetch('http://localhost:5000/api/shipments/analytics')
        .then((res) => res.json())
        .then((data) => {
          setAnalytics(data);
          setAnalyticsLoading(false);
        })
        .catch((err) => {
          console.error('Error fetching analytics:', err);
          setAnalyticsLoading(false);
        });
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!loading && isAdmin) {
      gsap.from(headerRef.current, { opacity: 0, y: -20, duration: 1 });
      gsap.from(cardsRef.current, { opacity: 0, y: 30, duration: 1.2, delay: 0.5 });
    }
  }, [loading, isAdmin]);

  if (loading) return <div className="text-white text-center mt-10">Checking credentials...</div>;
  if (!isAdmin) return null;
  if (analyticsLoading) return <div className="text-white text-center p-6">Loading admin analytics...</div>;

  return (
    <div
      ref={pageRef}
      className="min-h-screen p-6 md:p-8 bg-gradient-to-br from-purple-900 to-pink-800 text-white font-sans relative overflow-x-hidden"
    >
      <AdminProfileCard />

      <div ref={headerRef} className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold">📊 Admin Analytics Dashboard</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTaskManagerOpen(true)}
            className="bg-white/10 px-4 py-2 rounded hover:bg-white/20 transition-all duration-300"
          >
            📝 Tasks
          </button>

          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Admin" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-purple-600 text-white font-bold">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>

      <div ref={cardsRef} className="mb-6">
        <div className="bg-white/10 backdrop-blur-lg border border-purple-600/20 p-6 rounded-2xl shadow-xl max-w-xs">
          <h2 className="text-xl font-bold text-purple-300 mb-2">⏱️ Total Average ETA</h2>
          <p className="text-3xl font-semibold text-white">
            {analytics.averageETA?.toFixed(2) ?? '--'} hrs
          </p>
        </div>
      </div>

      {/* Charts */}
     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
  <div className="h-[500px] w-full">
    <TopRoutesMapWithPie />
  </div>
  <div className="h-[500px] w-full">
    <ShipmentsPerDayChart />
  </div>
</div>


      <div className="mt-8 h-[500px] w-full flex flex-col items-at-end">
        <TotalShipmentsCard />
      </div>

      <AdminTaskManager isOpen={taskManagerOpen} onClose={() => setTaskManagerOpen(false)} />
    </div>
  );
};

export default AdminDashboard;
