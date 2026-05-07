// client/src/pages/Auth/VerifyEmail.jsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, RefreshCw, CheckCircle2, Hexagon, ShieldCheck } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { user, setAuth } = useAuthStore();

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef([]);
  const autoSentRef = useRef(false);

  // If user is already verified, go to correct dashboard
  useEffect(() => {
    if (user?.isEmailVerified) {
      redirectToDashboard(user.role);
    }
  }, [user]);

  // Tick down the resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Auto-send OTP on mount when user is unverified (e.g. after login with expired/missing OTP)
  useEffect(() => {
    if (user && !user.isEmailVerified && !autoSentRef.current) {
      autoSentRef.current = true;
      handleResendSilent();
    }
  }, [user]);

  const redirectToDashboard = (role) => {
    switch (role) {
      case 'admin':  navigate('/admin/dashboard',  { replace: true }); break;
      case 'driver': navigate('/driver/dashboard', { replace: true }); break;
      default:       navigate('/track',            { replace: true }); break;
    }
  };

  // ── Handle digit input ────────────────────────────────────────────────────
  const handleDigitChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleaned;
    setDigits(newDigits);

    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (cleaned && index === 5) {
      const otp = [...newDigits.slice(0, 5), cleaned].join('');
      if (otp.length === 6) {
        submitOTP(otp);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    const newDigits = text.split('').concat(Array(6).fill('')).slice(0, 6);
    setDigits(newDigits);
    inputRefs.current[Math.min(text.length, 5)]?.focus();
    if (text.length === 6) submitOTP(text);
  };

  // ── Submit OTP ────────────────────────────────────────────────────────────
  const submitOTP = async (otp) => {
    if (loading) return;
    setLoading(true);
    try {
      await authAPI.verifyEmail({ otp });
      setVerified(true);
      setAuth({ ...user, isEmailVerified: true });
      toast.success('Email verified! Welcome aboard 🎉');
      setTimeout(() => redirectToDashboard(user?.role), 1500);
    } catch (err) {
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }
    submitOTP(otp);
  };

  // ── Resend OTP (with toast) ───────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    try {
      await authAPI.resendOTP();
      setResendCooldown(60);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      toast.success('New OTP sent to your email');
    } catch {
      // error handled by interceptor
    } finally {
      setResending(false);
    }
  };

  // ── Silent resend (auto-trigger on mount, no toast on success) ────────────
  const handleResendSilent = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    try {
      await authAPI.resendOTP();
      setResendCooldown(60);
    } catch {
      // silently fail — user can manually resend
    } finally {
      setResending(false);
    }
  };

  // Mask email for display
  const maskedEmail = (() => {
    const email = user?.email || '';
    if (!email.includes('@')) return email;
    const [local, domain] = email.split('@');
    if (local.length <= 2) return email;
    return `${local[0]}${'•'.repeat(Math.min(local.length - 2, 6))}${local[local.length - 1]}@${domain}`;
  })();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0b] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[15%] left-[15%] w-[500px] h-[500px] bg-amber-400/[0.06] rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-[20%] right-[15%] w-[400px] h-[400px] bg-neon-purple/[0.05] rounded-full blur-[100px] animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute top-[60%] left-[50%] w-[300px] h-[300px] bg-neon-blue/[0.04] rounded-full blur-[80px] animate-float" style={{ animationDelay: '1.5s' }} />
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
          {verified ? (
            <div className="text-center py-6 animate-modern-fade">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.15)]">
                <CheckCircle2 size={36} className="text-green-400" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Email Verified!</h1>
              <p className="text-zinc-400 text-sm">Redirecting you to your dashboard…</p>
              <div className="mt-6 flex justify-center">
                <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-amber-400/10 rounded-xl flex items-center justify-center mx-auto mb-6 border border-amber-400/20 shadow-[0_0_30px_rgba(251,191,36,0.1)]">
                  <Mail size={26} className="text-amber-400" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
                  Check your email
                </h1>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  We sent a 6-digit code to{' '}
                  <span className="font-semibold text-white">{maskedEmail || 'your email'}</span>
                  <br />Enter it below to verify your account.
                </p>
              </div>

              {/* OTP Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 6-digit input boxes */}
                <div className="flex justify-center gap-2.5" onPaste={handlePaste}>
                  {digits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (inputRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      disabled={loading}
                      className={`
                        w-12 h-14 text-center text-xl font-bold rounded-lg
                        transition-all duration-200 outline-none
                        ${digit
                          ? 'bg-amber-400/10 border-2 border-amber-400/50 text-white shadow-[0_0_15px_rgba(251,191,36,0.15)]'
                          : 'bg-white/[0.04] border-2 border-white/10 text-white hover:border-white/20 focus:border-amber-400/50 focus:bg-amber-400/[0.05] focus:shadow-[0_0_15px_rgba(251,191,36,0.1)]'
                        }
                        disabled:opacity-40 disabled:cursor-not-allowed
                        placeholder:text-zinc-600
                      `}
                    />
                  ))}
                </div>

                {/* Timer hint */}
                <div className="flex items-center justify-center gap-2 text-zinc-500 text-xs">
                  <ShieldCheck size={12} />
                  <span>Code expires in <strong className="text-zinc-300">10 minutes</strong></span>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading || digits.join('').length !== 6}
                  className="w-full h-12 bg-white text-zinc-900 font-semibold text-sm rounded-xl
                    hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed
                    transition-all duration-200 flex items-center justify-center gap-2
                    shadow-[0_4px_20px_rgba(255,255,255,0.1)]"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeDashoffset="10" />
                      </svg>
                      Verifying…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Verify Email
                    </>
                  )}
                </button>
              </form>

              {/* Resend */}
              <div className="mt-7 pt-6 border-t border-white/[0.06] text-center">
                <p className="text-zinc-500 text-xs mb-3">Didn't receive the code?</p>
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || resending}
                  className="inline-flex items-center gap-2 text-sm font-semibold
                    text-amber-400 hover:text-amber-300
                    disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : resending
                    ? 'Sending…'
                    : 'Resend Code'}
                </button>
              </div>

              {/* Back to login */}
              <div className="mt-5 text-center">
                <Link
                  to="/login"
                  onClick={() => useAuthStore.getState().logout()}
                  className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors duration-200"
                >
                  <ArrowLeft size={13} />
                  Use a different account
                </Link>
              </div>

              {/* Hint */}
              <p className="mt-6 text-[10px] text-zinc-600 text-center leading-relaxed">
                Check your spam or promotions folder if you don't see the email.
              </p>
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