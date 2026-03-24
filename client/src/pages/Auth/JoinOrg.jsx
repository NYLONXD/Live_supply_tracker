// client/src/pages/Auth/JoinOrg.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, User, Mail, Phone, Truck, AlertCircle, CheckCircle2 } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import useAuthStore from '../../stores/authStore';
import api from '../../services/api';

export default function JoinOrg() {
  const { token }   = useParams();
  const navigate    = useNavigate();
  const { setAuth } = useAuthStore();

  // invite info fetched from the server
  const [invite,     setInvite]     = useState(null);
  const [invalid,    setInvalid]    = useState(false);
  const [checking,   setChecking]   = useState(true);

  // form state
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const [formData,   setFormData]   = useState({
    displayName:     '',
    email:           '',
    phone:           '',
    password:        '',
    confirmPassword: '',
  });

  // ── Validate the token on mount ────────────────────────────────────────────
  useEffect(() => {
    api.get(`/api/invites/${token}/validate`)
      .then(({ data }) => {
        setInvite(data);
        // Pre-fill email if admin typed it when creating the invite
        if (data.email) {
          setFormData((prev) => ({ ...prev, email: data.email }));
        }
      })
      .catch(() => setInvalid(true))
      .finally(() => setChecking(false));
  }, [token]);

  const handleChange = (field) => (e) => {
    setError('');
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.displayName.trim())
      return setError('Full name is required.');
    if (formData.password.length < 6)
      return setError('Password must be at least 6 characters.');
    if (formData.password !== formData.confirmPassword)
      return setError('Passwords do not match.');

    try {
      setSubmitting(true);
      const { data } = await api.post(`/api/invites/${token}/accept`, {
        displayName: formData.displayName.trim(),
        email:       formData.email.trim(),
        phone:       formData.phone.trim() || undefined,
        password:    formData.password,
      });

      // setAuth normalizes organizationId shape
      setAuth(data);

      // Redirect based on role
      if (data.role === 'driver') {
        navigate('/driver/dashboard');
      } else {
        navigate('/track');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading spinner while validating token ─────────────────────────────────
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Invalid / expired token screen ────────────────────────────────────────
  if (invalid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-red-600" />
          </div>
          <h1 className="text-xl font-bold mb-2 text-black">Invalid invite link</h1>
          <p className="text-zinc-500 text-sm mb-6">
            This link has expired or has already been used.
            Ask your admin to send a new invite.
          </p>
          <Link to="/login">
            <Button variant="outline">Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Main registration form ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
      <div className="w-full max-w-md bg-white border border-zinc-200 shadow-2xl shadow-zinc-200/50 p-8 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-black" />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-10 h-10 bg-black flex items-center justify-center rounded-sm text-white mx-auto mb-4">
            <Truck size={18} />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 bg-zinc-50 text-xs font-bold uppercase tracking-wider mb-3 text-zinc-500">
            <CheckCircle2 size={12} className="text-green-500" />
            You've been invited
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-black mb-1">
            Join {invite.organization}
          </h1>
          <p className="text-zinc-500 text-sm">
            You'll be added as a{' '}
            <span className="font-semibold text-black capitalize">{invite.role}</span>.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-sm px-4 py-3 mb-6 text-sm">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full name"
            icon={User}
            placeholder="Your full name"
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
            // Lock the field if admin pre-filled the email
            disabled={Boolean(invite.email)}
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

          <Button type="submit" loading={submitting} className="w-full mt-2">
            Join {invite.organization}
          </Button>
        </form>

        <p className="text-center text-xs text-zinc-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-black font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}