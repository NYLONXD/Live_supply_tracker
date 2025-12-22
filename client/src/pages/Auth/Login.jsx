// client/src/pages/Auth/Login.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Truck } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import useAuthStore from '../../stores/authStore';

export default function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(formData);
      
      // Redirect based on role
      switch (user.role) {
        case 'admin':
          navigate('/admin/dashboard');
          break;
        case 'driver':
          navigate('/driver/dashboard');
          break;
        default:
          navigate('/user/dashboard');
      }
    } catch (error) {
      // Error handled by interceptor
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4  from-slate-950 via-purple-950 to-slate-950">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
      </div>

      <Card className="w-full max-w-md relative z-10 animate-slideUp">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-2xl mb-4">
            <Truck size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-slate-400">Sign in to your Supply Tracker account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            name="email"
            icon={Mail}
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label="Password"
            type="password"
            name="password"
            icon={Lock}
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-purple-500"
              />
              Remember me
            </label>
            <Link
              to="/forgot-password"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full"
            loading={loading}
          >
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 pt-6 border-t border-slate-700">
          <p className="text-xs text-slate-500 text-center mb-2">Demo Credentials:</p>
          <div className="text-xs text-slate-400 space-y-1">
            <p>👤 User: user@demo.com / password</p>
            <p>🚚 Driver: driver@demo.com / password</p>
            <p>⚙️ Admin: admin@demo.com / password</p>
          </div>
        </div>
      </Card>
    </div>
  );
}