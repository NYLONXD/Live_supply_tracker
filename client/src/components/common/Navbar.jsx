import { Link } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';

export default function Navbar() {
  const { user, logout } = useAuthStore();

  return (
    <nav className="flex justify-between px-6 py-3 bg-slate-800 text-white">
      <span>Live Supply Tracker</span>
      <div className="flex gap-4">
        {!user && <Link to="/track">Track</Link>}
        {user?.role === 'admin' && <Link to="/admin/dashboard">Admin</Link>}
        {user?.role === 'driver' && <Link to="/driver/dashboard">Driver</Link>}
        {user && <button onClick={logout}>Logout</button>}
      </div>
    </nav>
  );
}
