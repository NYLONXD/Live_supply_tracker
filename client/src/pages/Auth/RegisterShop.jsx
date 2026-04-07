// client/src/pages/Auth/RegisterShop.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Store, Phone, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import Logo from '../../components/common/common/Logo';
import useAuthStore from '../../stores/authStore';
import { authAPI } from '../../services/api';

/* ─── Floating label input ─── */
const FloatingLabel = ({ label, icon: Icon, type = 'text', placeholder, value, onChange, required }) => {
  const [focused, setFocused] = useState(false);
  const hasValue = value && value.length > 0;
  const isActive = focused || hasValue;

  return (
    <div className="relative">
      <div
        className={`
          relative flex items-center border rounded-xl overflow-hidden transition-all duration-200
          ${isActive
            ? 'border-slate-800 bg-white shadow-[0_0_0_3px_rgba(15,23,42,0.07)]'
            : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-white'
          }
        `}
      >
        <div className={`flex items-center justify-center w-12 h-14 shrink-0 transition-colors duration-200 ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>
          <Icon size={16} strokeWidth={1.8} />
        </div>

        <div className="relative flex-1 h-14">
          <label
            className={`absolute left-0 transition-all duration-200 pointer-events-none font-medium select-none
              ${isActive
                ? 'text-[10px] text-slate-500 top-2.5 tracking-widest uppercase'
                : 'text-sm text-slate-400 top-1/2 -translate-y-1/2'
              }`}
          >
            {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
          </label>
          <input
            type={type}
            placeholder={isActive ? placeholder : ''}
            value={value}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            required={required}
            className="absolute inset-0 pt-5 pb-1 bg-transparent text-slate-900 text-sm font-medium placeholder:text-slate-300 outline-none w-full pr-4"
          />
        </div>

        {hasValue && !focused && (
          <div className="pr-4 shrink-0">
            <CheckCircle2 size={14} className="text-emerald-500" strokeWidth={2.2} />
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Password strength bar ─── */
const PasswordStrength = ({ password }) => {
  if (!password.length) return null;
  const strength = password.length >= 12 ? 4 : password.length >= 10 ? 3 : password.length >= 8 ? 2 : password.length >= 6 ? 1 : 0;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', 'bg-rose-400', 'bg-amber-400', 'bg-blue-400', 'bg-emerald-400'];
  return (
    <div className="flex items-center gap-1.5 px-0.5">
      {[1,2,3,4].map(i => (
        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? colors[strength] : 'bg-slate-200'}`} />
      ))}
      <span className="text-[10px] font-semibold text-slate-400 ml-1 w-10 shrink-0">{labels[strength]}</span>
    </div>
  );
};

export default function RegisterShop() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [formData, setFormData] = useState({
    shopName: '', displayName: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => {
    setError('');
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.shopName.trim())    return setError('Shop name is required.');
    if (!formData.displayName.trim()) return setError('Your full name is required.');
    if (formData.password.length < 6) return setError('Password must be at least 6 characters.');
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match.');
    try {
      setLoading(true);
      const { confirmPassword, ...payload } = formData;
      const { data } = await authAPI.registerOrganization(payload);
      setAuth(data);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const requiredFilled = [formData.shopName, formData.displayName, formData.email, formData.password, formData.confirmPassword].filter(v => v.trim() !== '').length;
  const progress = Math.round((requiredFilled / 5) * 100);

  return (
    <div className="min-h-screen flex bg-[#F6F6F4]">

      {/* ── Left decorative panel ── */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[40%] bg-slate-950 relative overflow-hidden flex-col justify-between p-10 xl:p-14 shrink-0">
        {/* Texture */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")` }}
        />
        {/* Glows */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-violet-600/10 blur-3xl" />

        {/* Logo */}
        <div className="relative z-10">
          <Logo linkTo="/" size="lg" showText dark />
        </div>

        {/* Main content */}
        <div className="relative z-10 space-y-8">
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {[['12K+', 'Active shops'], ['4.9★', 'Avg. rating'], ['2M+', 'Shipments tracked'], ['99.9%', 'Uptime SLA']].map(([num, label]) => (
              <div key={label} className="bg-white/5 border border-white/8 rounded-2xl p-4">
                <div className="text-2xl font-bold text-white tracking-tight">{num}</div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-medium">{label}</div>
              </div>
            ))}
          </div>

          {/* Headline */}
          <div>
            <h2 className="text-[2rem] font-bold text-white leading-tight tracking-tight">
              Everything your<br />
              <span className="text-slate-500">logistics needs.</span>
            </h2>
            <p className="text-slate-400 text-[13px] mt-3 leading-relaxed max-w-[260px]">
              Real-time visibility, automated tracking, and smart analytics — in one clean workspace.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3">
            {['Live shipment tracking dashboard', 'Automated delivery notifications', 'Multi-carrier support & analytics'].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <span className="text-[13px] text-slate-300 font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 border-t border-white/8 pt-6">
          <p className="text-slate-400 text-[13px] italic leading-relaxed">
            "Reduced our tracking overhead by 60% in the first month."
          </p>
          <div className="flex items-center gap-2.5 mt-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">R</div>
            <div>
              <div className="text-white text-[11px] font-semibold">Rajesh Sharma</div>
              <div className="text-slate-500 text-[10px]">Ops Manager · FastFreight India</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">

        {/* Top nav */}
        <div className="flex items-center justify-between px-8 py-5 lg:px-12">
          <Link to="/" className="lg:hidden">
            <Logo size="md" showText />
          </Link>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            <span className="text-[13px] text-slate-500 hidden sm:block">Have an account?</span>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-900 border border-slate-200 bg-white rounded-xl px-4 py-2 hover:border-slate-300 hover:shadow-sm transition-all duration-150 shadow-sm"
            >
              Sign in <ArrowRight size={12} strokeWidth={2.5} />
            </Link>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-8 lg:px-14 xl:px-20 py-8">
          <div className="w-full max-w-[460px]">

            {/* Badge + heading */}
            <div className="mb-7">
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/60 rounded-full px-3.5 py-1.5 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-semibold text-emerald-700 tracking-wide uppercase">Free to start · No credit card</span>
              </div>
              <h1 className="text-[1.85rem] font-bold text-slate-950 tracking-tight leading-tight">
                Create your<br />shop workspace
              </h1>
              <p className="text-slate-500 text-[13px] mt-2 leading-relaxed">
                Set up in under 2 minutes and start tracking.
              </p>
            </div>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Profile completion</span>
                <span className="text-[11px] font-bold text-slate-700">{progress}%</span>
              </div>
              <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-slate-700 to-slate-950 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3.5 mb-5 text-[13px] font-medium">
                <AlertCircle size={14} className="shrink-0" strokeWidth={2} />
                {error}
              </div>
            )}

            {/* Fields */}
            <form onSubmit={handleSubmit} className="space-y-2.5">
              <FloatingLabel label="Shop / Business name" icon={Store} placeholder="e.g. Raja Logistics" value={formData.shopName} onChange={handleChange('shopName')} required />
              <FloatingLabel label="Your full name" icon={User} placeholder="Rajesh Kumar" value={formData.displayName} onChange={handleChange('displayName')} required />

              <div className="grid grid-cols-2 gap-2.5">
                <FloatingLabel label="Email address" icon={Mail} type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange('email')} required />
                <FloatingLabel label="Phone (optional)" icon={Phone} placeholder="+91 98765 43210" value={formData.phone} onChange={handleChange('phone')} />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <FloatingLabel label="Password" icon={Lock} type="password" placeholder="Min. 6 characters" value={formData.password} onChange={handleChange('password')} required />
                <FloatingLabel label="Confirm password" icon={Lock} type="password" placeholder="Repeat password" value={formData.confirmPassword} onChange={handleChange('confirmPassword')} required />
              </div>

              <PasswordStrength password={formData.password} />

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="relative w-full mt-1 h-[52px] rounded-xl bg-slate-950 text-white font-semibold text-[13px] flex items-center justify-center gap-2.5 hover:bg-slate-800 active:scale-[0.992] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 shadow-lg shadow-slate-950/15 overflow-hidden group"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white/50" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Creating workspace…</span>
                  </>
                ) : (
                  <>
                    <span>Create shop workspace</span>
                    <ArrowRight size={14} strokeWidth={2.5} />
                  </>
                )}
              </button>
            </form>

            {/* Trust signals */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <div className="flex items-center justify-center gap-5">
                {[['🔒', 'SSL Secured'], ['🇮🇳', 'India hosted'], ['✦', 'GDPR ready']].map(([icon, label]) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className="text-sm">{icon}</span>
                    <span className="text-[11px] font-medium text-slate-400">{label}</span>
                  </div>
                ))}
              </div>
              <p className="text-center text-[11px] text-slate-400 mt-3.5 leading-relaxed">
                By registering you agree to our{' '}
                <Link to="/terms" className="text-slate-600 underline underline-offset-2 hover:text-slate-900 transition-colors">Terms</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-slate-600 underline underline-offset-2 hover:text-slate-900 transition-colors">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}