import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Truck } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { authAPI } from '../../services/api';
import useAuthStore from '../../stores/authStore';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setAuth, updateUser } = useAuthStore();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ Fixed: guard against missing/malformed token in URL
  useEffect(() => {
    if (!token) {
      toast.error('Invalid reset link.');
      navigate('/forgot-password');
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { data } = await authAPI.resetPassword(token, { password });

      // ✅ Fixed: fetch full user profile before setting auth
      // (backend only returns token + role, not the full user object)
      localStorage.setItem('token', data.token);
      const meRes = await authAPI.getMe();
      setAuth(data.token, meRes.data);

      toast.success('Password reset! Redirecting...');

      setTimeout(() => {
        switch (data.role) {
          case 'admin':  navigate('/admin/dashboard');  break;
          case 'driver': navigate('/driver/dashboard'); break;
          default:       navigate('/user/dashboard');
        }
      }, 500);

    } catch (err) {
      // ✅ Fixed: clear fields on error so expired-link state is obvious
      setPassword('');
      setConfirm('');
      const msg = err.response?.data?.message || 'Invalid or expired reset link.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
      <div className="w-full max-w-md bg-white border border-zinc-200 shadow-2xl shadow-zinc-200/50 p-8 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-black" />

        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="w-8 h-8 bg-black flex items-center justify-center rounded-sm text-white group-hover:bg-zinc-800 transition-colors">
              <Truck size={16} />
            </div>
            <span className="font-bold tracking-tight text-lg">SUPPLY TRACKER</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-black mb-2">Set New Password</h1>
          <p className="text-zinc-500 text-sm">Choose a strong password for your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="New Password"
            type="password"
            icon={Lock}
            placeholder="Min. 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            label="Confirm Password"
            type="password"
            icon={Lock}
            placeholder="Repeat your password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          <Button type="submit" loading={loading} className="w-full">
            Reset Password
          </Button>
        </form>
      </div>
    </div>
  );
}