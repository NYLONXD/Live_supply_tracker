// client/src/pages/Auth/RegisterShop.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Truck, Store, Phone, AlertCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import useAuthStore from '../../stores/authStore';
import { authAPI } from '../../services/api';

export default function RegisterShop() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [formData, setFormData] = useState({
    shopName:        '',
    displayName:     '',
    email:           '',
    phone:           '',
    password:        '',
    confirmPassword: '',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => {
    setError('');
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.shopName.trim())
      return setError('Shop name is required.');
    if (!formData.displayName.trim())
      return setError('Your full name is required.');
    if (formData.password.length < 6)
      return setError('Password must be at least 6 characters.');
    if (formData.password !== formData.confirmPassword)
      return setError('Passwords do not match.');

    try {
      setLoading(true);
      const { confirmPassword, ...payload } = formData;
      const { data } = await authAPI.registerOrganization(payload);

      // setAuth normalizes organizationId so it's always a flat string
      setAuth(data);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
      <div className="w-full max-w-md bg-white border border-zinc-200 shadow-2xl shadow-zinc-200/50 p-8 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-black" />

        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="w-8 h-8 bg-black flex items-center justify-center rounded-sm text-white group-hover:bg-zinc-800 transition-colors">
              <Truck size={16} />
            </div>
            <span className="font-bold tracking-tight text-lg">SUPPLY TRACKER</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-black mb-1">
            Register your shop
          </h1>
          <p className="text-zinc-500 text-sm">
            Create your workspace and start tracking shipments.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-sm px-4 py-3 mb-6 text-sm">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ✅ Pass component reference, NOT a JSX element */}
          <Input
            label="Shop / Business name"
            icon={Store}
            placeholder="e.g. Raja Logistics"
            value={formData.shopName}
            onChange={handleChange('shopName')}
            required
          />
          <Input
            label="Your full name"
            icon={User}
            placeholder="Your name"
            value={formData.displayName}
            onChange={handleChange('displayName')}
            required
          />
          <Input
            label="Email"
            type="email"
            icon={Mail}
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange('email')}
            required
          />
          <Input
            label="Phone (optional)"
            icon={Phone}
            placeholder="+91 98765 43210"
            value={formData.phone}
            onChange={handleChange('phone')}
          />
          <Input
            label="Password"
            type="password"
            icon={Lock}
            placeholder="At least 6 characters"
            value={formData.password}
            onChange={handleChange('password')}
            required
          />
          <Input
            label="Confirm password"
            type="password"
            icon={Lock}
            placeholder="Repeat your password"
            value={formData.confirmPassword}
            onChange={handleChange('confirmPassword')}
            required
          />

          <Button type="submit" loading={loading} className="w-full mt-2">
            Create shop
          </Button>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-black font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}