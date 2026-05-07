// client/src/pages/Auth/ResetPassword.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowLeft, Hexagon, ShieldCheck, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../../services/api';
import useAuthStore from '../../stores/authStore';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Guard against missing/malformed token in URL
  useEffect(() => {
    if (!token) {
      toast.error('Invalid reset link.');
      navigate('/forgot-password');
    }
  }, [token, navigate]);

  // Password strength indicator
  const getStrength = () => {
    if (!password) return { level: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { level: 1, label: 'Weak', color: 'bg-red-500' };
    if (score <= 2) return { level: 2, label: 'Fair', color: 'bg-amber-500' };
    if (score <= 3) return { level: 3, label: 'Good', color: 'bg-amber-400' };
    if (score <= 4) return { level: 4, label: 'Strong', color: 'bg-green-400' };
    return { level: 5, label: 'Very Strong', color: 'bg-green-400' };
  };

  const strength = getStrength();

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
      await authAPI.resetPassword(token, { password });

      setSuccess(true);
      const meRes = await authAPI.getMe();
      setAuth(meRes.data);

      toast.success('Password reset successfully!');

      setTimeout(() => {
        switch (meRes.data.role) {
          case 'admin':  navigate('/admin/dashboard');  break;
          case 'driver': navigate('/driver/dashboard'); break;
          default:       navigate('/track');
        }
      }, 1500);

    } catch (err) {
      setPassword('');
      setConfirm('');
      const msg = err.response?.data?.message || 'Invalid or expired reset link.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0b] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-amber-400/[0.06] rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-neon-purple/[0.05] rounded-full blur-[100px] animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Diagonal stripe texture */}
      <div
        className="absolute inset-0 opacity-[0.03] z-0"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            #ffffff 0px,
            #ffffff 1px,
            transparent 1px,
            transparent 14px
          )`,
        }}
      />

      <div className="w-full max-w-md relative z-10 animate-modern-fade">
        {/* Card */}
        <div className="glass-dark rounded-2xl p-8 md:p-10 relative overflow-hidden shadow-[0_40px_120px_-20px_rgba(0,0,0,0.7)]">
          {/* Gradient accent line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500" />

          {/* Success State */}
          {success ? (
            <div className="text-center py-6 animate-modern-fade">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.15)]">
                <CheckCircle2 size={36} className="text-green-400" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Password Reset!</h1>
              <p className="text-zinc-400 text-sm">Your password has been changed. Redirecting…</p>
              <div className="mt-6 flex justify-center">
                <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-amber-400/10 rounded-xl flex items-center justify-center mx-auto mb-6 border border-amber-400/20 shadow-[0_0_30px_rgba(251,191,36,0.1)]">
                  <Lock size={24} className="text-amber-400" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
                  Set New Password
                </h1>
                <p className="text-zinc-400 text-sm">
                  Choose a strong password for your account.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
                    New Password
                  </label>
                  <div
                    className={`flex items-center gap-3 px-4 h-12 rounded-xl border transition-all duration-200
                      ${focusedField === 'password'
                        ? 'border-amber-400/50 bg-amber-400/[0.05] shadow-[0_0_0_3px_rgba(251,191,36,0.08)]'
                        : 'border-white/10 bg-white/[0.04] hover:border-white/20'
                      }`}
                  >
                    <Lock size={15} className={`shrink-0 transition-colors ${focusedField === 'password' ? 'text-amber-400' : 'text-zinc-500'}`} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      required
                      className="flex-1 text-sm bg-transparent outline-none text-white placeholder:text-zinc-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {/* Strength indicator */}
                  {password && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              i <= strength.level ? strength.color : 'bg-white/[0.06]'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-medium text-zinc-500">{strength.label}</span>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold tracking-widest text-zinc-500 uppercase">
                    Confirm Password
                  </label>
                  <div
                    className={`flex items-center gap-3 px-4 h-12 rounded-xl border transition-all duration-200
                      ${focusedField === 'confirm'
                        ? 'border-amber-400/50 bg-amber-400/[0.05] shadow-[0_0_0_3px_rgba(251,191,36,0.08)]'
                        : confirm && confirm === password
                        ? 'border-green-500/30 bg-green-500/[0.03]'
                        : confirm && confirm !== password
                        ? 'border-red-500/30 bg-red-500/[0.03]'
                        : 'border-white/10 bg-white/[0.04] hover:border-white/20'
                      }`}
                  >
                    <Lock size={15} className={`shrink-0 transition-colors ${focusedField === 'confirm' ? 'text-amber-400' : 'text-zinc-500'}`} />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Repeat your password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      onFocus={() => setFocusedField('confirm')}
                      onBlur={() => setFocusedField(null)}
                      required
                      className="flex-1 text-sm bg-transparent outline-none text-white placeholder:text-zinc-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {confirm && confirm !== password && (
                    <p className="text-[11px] text-red-400 mt-0.5">Passwords don't match</p>
                  )}
                  {confirm && confirm === password && (
                    <p className="text-[11px] text-green-400 mt-0.5 flex items-center gap-1">
                      <CheckCircle2 size={11} /> Passwords match
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !password || !confirm}
                  className="w-full h-12 bg-white text-zinc-900 font-semibold text-sm rounded-xl
                    hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed
                    transition-all duration-200 flex items-center justify-center gap-2
                    shadow-[0_4px_20px_rgba(255,255,255,0.1)] mt-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeDashoffset="10" />
                      </svg>
                      Resetting…
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>

              {/* Back to login */}
              <div className="mt-7 pt-6 border-t border-white/[0.06] text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors duration-200"
                >
                  <ArrowLeft size={13} />
                  Back to login
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Trust badges */}
        <div className="mt-6 flex items-center justify-center gap-5">
          {[
            { icon: ShieldCheck, label: 'SSL Secured' },
            { icon: Hexagon, label: 'End-to-end encrypted' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-zinc-600">
              <Icon size={11} />
              <span className="text-[10px] font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
