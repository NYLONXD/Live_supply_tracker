// client/src/pages/Auth/JoinOrg.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, User, Mail, Phone, AlertCircle, CheckCircle2, Hexagon } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import useAuthStore from '../../stores/authStore';
import api from '../../services/api';

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const PHONE_REGEX = /^[0-9+\-\s]{7,20}$/;

export default function JoinOrg() {
  const { token }   = useParams();
  const navigate    = useNavigate();
  const { setAuth } = useAuthStore();

  const [invite,     setInvite]     = useState(null);
  const [invalid,    setInvalid]    = useState(false);
  const [checking,   setChecking]   = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const [formData,   setFormData]   = useState({
    displayName:     '',
    email:           '',
    phone:           '',
    password:        '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!token) {
      setInvalid(true);
      setChecking(false);
      return;
    }

    const controller = new AbortController();
    let mounted = true;

    const validate = async () => {
      try {
        const { data } = await api.get(`/api/invites/${token}/validate`, {
          signal: controller.signal,
        });

        if (!mounted) return;

        setInvite(data);

        if (data?.email) {
          setFormData((prev) => ({ ...prev, email: data.email }));
        }
      } catch (err) {
        if (!mounted) return;
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          setInvalid(true);
        }
      } finally {
        if (mounted) setChecking(false);
      }
    };

    validate();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [token]);

  const handleChange = (field) => (e) => {
    setError('');
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setError('');

    const fullName = formData.displayName.trim();
    const email    = formData.email.trim();
    const phone    = formData.phone.trim();

    if (!fullName) return setError('Full name is required.');
    if (!email) return setError('Email is required.');
    if (!EMAIL_REGEX.test(email)) return setError('Invalid email address.');
    if (phone && !PHONE_REGEX.test(phone)) return setError('Invalid phone number.');
    if (formData.password.length < 6) return setError('Password must be at least 6 characters.');
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match.');

    try {
      setSubmitting(true);

      const { data } = await api.post(`/api/invites/${token}/accept`, {
        displayName: fullName,
        email,
        phone:       phone || undefined,
        password:    formData.password,
      });

      setAuth(data);

      navigate(
        data?.role === 'driver' ? '/driver/dashboard' : '/user/dashboard',
        { replace: true }
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark">
        <div className="w-12 h-12 border-4 border-white/20 border-t-neon-blue rounded-full animate-spin shadow-[0_0_15px_rgba(0,240,255,0.5)]" />
      </div>
    );
  }

  if (invalid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background dark">
        <div className="text-center max-w-sm glass-dark p-8 rounded-2xl border border-white/10 animate-modern-fade">
          <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-destructive/30 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
            <AlertCircle size={28} className="text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-white tracking-tight">Invalid Link</h1>
          <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
            This link has expired, is invalid, or has already been used.
            Ask your administrator to send a new invitation.
          </p>
          <Link to="/login" className="w-full">
            <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">Return to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden dark text-foreground">
      {/* Immersive Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[10%] left-[10%] w-[600px] h-[600px] bg-neon-purple/10 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-neon-blue/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <div className="w-full max-w-md glass-dark rounded-2xl p-8 md:p-10 relative z-10 overflow-hidden shadow-2xl border border-white/10 animate-modern-fade">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-green via-neon-blue to-neon-purple" />

        {/* Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-5 shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/10">
            <Hexagon size={24} className="text-white" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-500/30 bg-green-500/10 text-[10px] font-bold uppercase tracking-wider mb-4 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
            <CheckCircle2 size={14} className="text-green-400" />
            You've been invited
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
            Join {invite?.organization || 'Organization'}
          </h1>
          <p className="text-muted-foreground text-sm">
            You'll be added as a{' '}
            <span className="font-semibold text-white capitalize bg-white/10 px-2 py-0.5 rounded-sm">
              {invite?.role || 'member'}
            </span>
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-md px-4 py-3 mb-6 text-sm animate-modern-fade">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full name"
            icon={User}
            placeholder="Your full name"
            value={formData.displayName}
            onChange={handleChange('displayName')}
            required
            className="bg-black/50 border-white/10 focus-visible:ring-neon-blue text-white placeholder:text-zinc-600"
          />

          <Input
            label="Email"
            type="email"
            icon={Mail}
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange('email')}
            disabled={Boolean(invite?.email)}
            required
            className="bg-black/50 border-white/10 focus-visible:ring-neon-blue text-white placeholder:text-zinc-600 disabled:opacity-50"
          />

          <Input
            label="Phone (optional)"
            icon={Phone}
            placeholder="+1 234 567 8900"
            value={formData.phone}
            onChange={handleChange('phone')}
            className="bg-black/50 border-white/10 focus-visible:ring-neon-blue text-white placeholder:text-zinc-600"
          />

          <Input
            label="Password"
            type="password"
            icon={Lock}
            placeholder="At least 6 characters"
            value={formData.password}
            onChange={handleChange('password')}
            required
            className="bg-black/50 border-white/10 focus-visible:ring-neon-blue text-white placeholder:text-zinc-600"
          />

          <Input
            label="Confirm password"
            type="password"
            icon={Lock}
            placeholder="Repeat your password"
            value={formData.confirmPassword}
            onChange={handleChange('confirmPassword')}
            required
            className="bg-black/50 border-white/10 focus-visible:ring-neon-blue text-white placeholder:text-zinc-600"
          />

          <Button type="submit" loading={submitting} className="w-full mt-6 bg-white text-black hover:bg-zinc-200" size="lg">
            Join {invite?.organization || 'Organization'}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Already have an account?{' '}
          <Link to="/login" className="text-white font-medium hover:text-neon-blue transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}