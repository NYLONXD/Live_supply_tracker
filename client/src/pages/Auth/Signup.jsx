import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Truck, ArrowRight, ShieldCheck, Phone, AlertCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import useAuthStore from '../../stores/authStore';

export default function Signup() {
  const navigate = useNavigate();
  const { register, loading } = useAuthStore();

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  // ✅ Clears error as user types
  const handleChange = (field) => (e) => {
    setError('');
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // ─── Client-side validation ───────────────────────────────────────────────
    if (!formData.displayName.trim())
      return setError('Full name is required.');

    if (formData.password.length < 6)
      return setError('Password must be at least 6 characters.');

    if (formData.password !== formData.confirmPassword)
      return setError('Passwords do not match.');

    try {
      // Strip confirmPassword before sending to API
      const { confirmPassword, ...payload } = formData;

      // ✅ Fixed: use returned user for role-based redirect (same pattern as Login)
      const user = await register(payload);

      switch (user.role) {
        case 'admin':  navigate('/admin/dashboard');  break;
        case 'driver': navigate('/driver/dashboard'); break;
        default:       navigate('/user/dashboard');
      }
    } catch (err) {
      // ✅ Fixed: show server error in UI instead of swallowing it
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(msg);
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

        {/* ✅ Fixed: error banner visible to user */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 flex items-start gap-3">
            <AlertCircle size={18} className="text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Full Name */}
          <Input
            label="Full Name"
            type="text"
            icon={User}
            placeholder="John Doe"
            value={formData.displayName}
            onChange={handleChange('displayName')}
            required
            className="h-11"
          />

          {/* Email */}
          <Input
            label="Work Email"
            type="email"
            icon={Mail}
            placeholder="name@company.com"
            value={formData.email}
            onChange={handleChange('email')}
            required
            className="h-11"
          />

          {/* Phone (optional) */}
          <Input
            label="Phone Number (optional)"
            type="tel"
            icon={Phone}
            placeholder="+1 555 000 0000"
            value={formData.phone}
            onChange={handleChange('phone')}
            className="h-11"
          />

          {/* Password */}
          <div className="space-y-2">
            <Input
              label="Password"
              type="password"
              icon={Lock}
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange('password')}
              required
              className="h-11"
            />
            {/* ✅ Fixed: hint now matches backend minimum (6, not 8) */}
            <div className="flex items-center gap-2 text-zinc-400">
              <ShieldCheck size={12} />
              <p className="text-[10px]">Must be at least 6 characters</p>
            </div>
          </div>

          {/* ✅ Fixed: confirm password field added */}
          <Input
            label="Confirm Password"
            type="password"
            icon={Lock}
            placeholder="Repeat your password"
            value={formData.confirmPassword}
            onChange={handleChange('confirmPassword')}
            required
            className="h-11"
          />

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full h-11 text-sm shadow-lg shadow-black/5"
              loading={loading}
            >
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