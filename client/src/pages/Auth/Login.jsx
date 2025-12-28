import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Truck, ArrowRight, AlertCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import useAuthStore from '../../stores/authStore';

export default function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuthStore();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(formData);
      // Redirect based on role
      switch (user.role) {
        case 'admin': navigate('/admin/dashboard'); break;
        case 'driver': navigate('/driver/dashboard'); break;
        default: navigate('/user/dashboard');
      }
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
      
      {/* Premium Card Container */}
      <div className="w-full max-w-md bg-white border border-zinc-200 shadow-2xl shadow-zinc-200/50 p-8 md:p-10 relative overflow-hidden">
        
        {/* Decorative Top Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-black" />

        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="w-8 h-8 bg-black flex items-center justify-center rounded-sm text-white group-hover:bg-zinc-800 transition-colors">
              <Truck size={16} />
            </div>
            <span className="font-bold tracking-tight text-lg">SUPPLY TRACKER</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-black mb-2">Welcome Back</h1>
          <p className="text-zinc-500 text-sm">Enter your credentials to access the workspace.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 flex items-start gap-3">
            <AlertCircle size={18} className="text-red-600 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Work Email"
            type="email"
            icon={Mail}
            placeholder="name@company.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="h-11"
          />

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Input
                label="Password"
                type="password"
                icon={Lock}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="h-11"
                containerClassName="w-full"
              />
            </div>
            <div className="flex justify-end mt-1">
              <Link to="/forgot-password" className="text-xs font-medium text-zinc-500 hover:text-black transition-colors">
                Forgot password?
              </Link>
            </div>
          </div>

          <Button type="submit" className="w-full h-11 text-sm shadow-lg shadow-black/5" loading={loading}>
            Sign In <ArrowRight size={16} className="ml-2" />
          </Button>
        </form>

        {/* Demo Credentials Section (Styled for Dev/Demo) */}
        <div className="mt-8 pt-6 border-t border-zinc-100">
          <div className="text-center">
            <p className="text-zinc-500 text-xs mb-3">Don't have an account?</p>
            <Link to="/signup">
              <Button variant="outline" className="w-full h-10 text-xs">Create Account</Button>
            </Link>
          </div>
          
         
        </div>

      </div>
      
      {/* Footer Text */}
      <div className="absolute bottom-6 text-center">
        <p className="text-zinc-400 text-xs">
          © 2025 Supply Tracker Systems. <br className="hidden sm:block" /> Secure Encrypted Connection.
        </p>
      </div>
    </div>
  );
}