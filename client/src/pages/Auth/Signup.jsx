import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Truck, ArrowRight, ShieldCheck } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import useAuthStore from '../../stores/authStore';

export default function Signup() {
  const navigate = useNavigate();
  const { register, loading } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(formData);
      navigate('/user/dashboard');
    } catch (error) {
      // Error is handled by the interceptor/store typically
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
      
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
          <h1 className="text-2xl font-bold tracking-tight text-black mb-2">Create Account</h1>
          <p className="text-zinc-500 text-sm">Join the enterprise logistics network.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Full Name"
            type="text"
            icon={User}
            placeholder="John Doe"
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            required
            className="h-11"
          />

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

          <div className="space-y-2">
            <Input
              label="Password"
              type="password"
              icon={Lock}
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="h-11"
            />
            <div className="flex items-center gap-2 text-zinc-400">
              <ShieldCheck size={12} />
              <p className="text-[10px]">Must be at least 8 characters</p>
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" className="w-full h-11 text-sm shadow-lg shadow-black/5" loading={loading}>
              Get Started <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>
          
          <p className="text-[10px] text-zinc-400 text-center px-4 leading-relaxed">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-100 text-center">
          <p className="text-zinc-500 text-xs mb-3">Already have an account?</p>
          <Link to="/login">
            <Button variant="outline" className="w-full h-10 text-xs">Sign In</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}