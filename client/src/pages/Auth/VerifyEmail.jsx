// client/src/pages/Auth/VerifyEmail.jsx
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Truck, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { user, setAuth } = useAuthStore();

  // 6 individual digit refs for auto-advance
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);

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

  const redirectToDashboard = (role) => {
    switch (role) {
      case 'admin':  navigate('/admin/dashboard',  { replace: true }); break;
      case 'driver': navigate('/driver/dashboard', { replace: true }); break;
      default:       navigate('/track',            { replace: true }); break;
    }
  };

  // ── Handle digit input ────────────────────────────────────────────────────
  const handleDigitChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '').slice(-1); // only digits, last char
    const newDigits = [...digits];
    newDigits[index] = cleaned;
    setDigits(newDigits);

    // Auto-advance
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits filled
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
    // Allow Ctrl+V / Cmd+V
  };

  // Handle paste anywhere on the 6-box area
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
      // Update user in store — mark as verified
      setAuth({ ...user, isEmailVerified: true });
      toast.success('Email verified! Welcome aboard 🎉');
      redirectToDashboard(user?.role);
    } catch (err) {
      // Clear digits on wrong OTP
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

  // ── Resend OTP ────────────────────────────────────────────────────────────
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
      <div className="w-full max-w-md bg-white border border-zinc-200 shadow-2xl shadow-zinc-200/50 p-8 md:p-10 relative overflow-hidden">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-black" />

        {/* Header */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="w-8 h-8 bg-black flex items-center justify-center rounded-sm text-white group-hover:bg-zinc-800 transition-colors">
              <Truck size={16} />
            </div>
            <span className="font-bold tracking-tight text-lg">SUPPLY TRACKER</span>
          </Link>

          {/* Mail icon */}
          <div className="w-16 h-16 bg-zinc-50 border-2 border-zinc-200 rounded-full flex items-center justify-center mx-auto mb-5">
            <Mail size={28} className="text-zinc-700" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-black mb-2">
            Check your email
          </h1>
          <p className="text-zinc-500 text-sm leading-relaxed">
            We sent a 6-digit code to{' '}
            <span className="font-semibold text-black">{user?.email || 'your email'}</span>.
            <br />Enter it below to verify your account.
          </p>
        </div>

        {/* OTP Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 6-digit input boxes */}
          <div className="flex justify-center gap-3" onPaste={handlePaste}>
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
                  w-12 h-14 text-center text-xl font-bold
                  border-2 rounded-sm
                  transition-all duration-150 outline-none
                  ${digit
                    ? 'border-black bg-black text-white'
                    : 'border-zinc-200 bg-white text-black hover:border-zinc-400 focus:border-black'
                  }
                  disabled:opacity-60 disabled:cursor-not-allowed
                `}
              />
            ))}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || digits.join('').length !== 6}
            className="w-full h-12 bg-black text-white font-semibold text-sm rounded-sm
              hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-150 flex items-center justify-center gap-2"
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
        <div className="mt-6 pt-5 border-t border-zinc-100 text-center">
          <p className="text-zinc-500 text-sm mb-3">Didn't receive the code?</p>
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || resending}
            className="inline-flex items-center gap-2 text-sm font-semibold
              text-black underline underline-offset-2 hover:opacity-60
              disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
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
        <div className="mt-4 text-center">
          <Link
            to="/login"
            onClick={() => useAuthStore.getState().logout()}
            className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-black transition-colors"
          >
            <ArrowLeft size={13} />
            Use a different account
          </Link>
        </div>

        {/* Hint */}
        <p className="mt-6 text-[10px] text-zinc-400 text-center leading-relaxed">
          Check your spam folder if you don't see it.
          The code expires in <strong>10 minutes</strong>.
        </p>
      </div>
    </div>
  );
}