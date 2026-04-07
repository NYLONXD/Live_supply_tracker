import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight, AlertCircle, Mail, Lock,
  ShieldCheck, Globe, Sparkles,
} from "lucide-react";
import useAuthStore from "../../stores/authStore";
import Logo from "../../components/common/common/Logo";

/* ─── Input Field ─────────────────────────────────────────────────── */
function Field({ label, icon: Icon, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
          {label}
        </label>
      )}
      <div
        className={`flex items-center gap-3 px-4 h-12 rounded-xl border transition-all duration-200
          ${focused
            ? "border-amber-400 bg-white shadow-[0_0_0_3px_rgba(251,191,36,0.15)]"
            : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-white"
          }`}
      >
        {Icon && (
          <Icon
            size={15}
            className={`shrink-0 transition-colors ${focused ? "text-amber-500" : "text-zinc-400"}`}
          />
        )}
        <input
          {...props}
          onFocus={() => setFocused(true)}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          className="flex-1 text-sm bg-transparent outline-none text-zinc-900 placeholder:text-zinc-400"
        />
      </div>
    </div>
  );
}

/* ─── Stat Card ───────────────────────────────────────────────────── */
function StatCard({ value, label }) {
  return (
    <div className="bg-white/[0.06] border border-white/10 rounded-2xl px-5 py-4 backdrop-blur-sm">
      <p className="text-white font-bold text-xl tracking-tight">{value}</p>
      <p className="text-zinc-400 text-xs mt-0.5">{label}</p>
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────────────── */
export default function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuthStore();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const set = (key) => (e) => {
    setError("");
    setForm((p) => ({ ...p, [key]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const user = await login(form);
      switch (user.role) {
        case "admin":  navigate("/admin/dashboard");  break;
        case "driver": navigate("/driver/dashboard"); break;
        default:       navigate("/track");
      }
    } catch {
      setError("Invalid email or password. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0a0a0b]">

      {/* Card */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] rounded-3xl overflow-hidden shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)] border border-white/[0.06]">

        {/* ── LEFT PANEL ──────────────────────────────────────────── */}
        <div className="hidden lg:flex flex-col justify-between p-10 relative overflow-hidden bg-[#0f0f10]">

          {/* Diagonal stripe texture — inline style only for repeating-linear-gradient, no Tailwind equivalent */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                -45deg,
                #ffffff 0px,
                #ffffff 1px,
                transparent 1px,
                transparent 12px
              )`,
            }}
          />

          {/* Glow blobs */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-amber-400/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-56 h-56 bg-amber-400/5 rounded-full blur-[60px] pointer-events-none" />

          {/* Brand */}
          <div className="relative z-10">
                <Logo linkTo="/" size="lg" showText dark/>
          </div>

          {/* Headline */}
          <div className="relative z-10 mt-10 flex-1 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 bg-amber-400/10 border border-amber-400/20 rounded-full w-fit">
              <Sparkles size={12} className="text-amber-400" />
              <span className="text-amber-400 text-[11px] font-semibold tracking-widest uppercase">
                Trusted by 12K+ shops
              </span>
            </div>

            <h2 className="text-4xl font-bold text-white leading-[1.15] tracking-tight mb-4">
              Everything your<br />
              <span className="text-zinc-500">logistics</span> needs.
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-xs">
              Real-time visibility, automated tracking, and smart analytics — in one clean workspace.
            </p>

            {/* Feature bullets */}
            <div className="mt-8 space-y-3">
              {[
                "Live shipment tracking dashboard",
                "Automated delivery notifications",
                "Multi-carrier support & analytics",
              ].map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-zinc-300 text-sm">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="relative z-10 mt-10 grid grid-cols-2 gap-3">
            <StatCard value="12K+" label="Active shops" />
            <StatCard value="4.9★" label="Avg. rating" />
            <StatCard value="2M+" label="Shipments tracked" />
            <StatCard value="99.9%" label="Uptime SLA" />
          </div>

          {/* Testimonial */}
          <div className="relative z-10 mt-6 flex items-center gap-3 border-t border-white/[0.06] pt-6">
            <div className="w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center text-zinc-900 font-bold text-sm shrink-0">
              R
            </div>
            <div>
              <p className="text-zinc-200 text-xs font-medium leading-snug">
                "Reduced our tracking overhead by 60%."
              </p>
              <p className="text-zinc-500 text-[11px] mt-0.5">Rajesh Sharma · FastFreight India</p>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ─────────────────────────────────────────── */}
        <div className="flex flex-col justify-center px-8 py-12 md:px-12 bg-[#fafafa]">

          {/* Top — Don't have an account? Sign up */}
          <div className="flex items-center justify-between mb-10">
            <Link to="/" className="lg:hidden">
              <Logo size="sm" showText />
            </Link>
            <p className="text-zinc-500 text-xs ml-auto">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-zinc-900 font-semibold underline underline-offset-2 hover:text-amber-600 transition-colors"
              >
                Sign up →
              </Link>
            </p>
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 leading-snug mb-1">
            Welcome back
          </h1>
          <p className="text-zinc-500 text-sm mb-8">
            Sign in to your workspace to continue.
          </p>

          {/* Error */}
          {error && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Form — only Email + Password */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field
              label="Email Address *"
              icon={Mail}
              type="email"
              placeholder="name@company.com"
              value={form.email}
              onChange={set("email")}
              required
            />

            <div className="flex flex-col gap-1.5">
              <Field
                label="Password *"
                icon={Lock}
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={set("password")}
                required
              />
              <div className="flex justify-end mt-0.5">
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-zinc-500 hover:text-amber-600 underline underline-offset-2 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full h-12 bg-zinc-900 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-60 transition-all duration-200 shadow-lg shadow-zinc-900/20"
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40" strokeDashoffset="10" />
                </svg>
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Trust badges */}
          <div className="mt-10 pt-6 border-t border-zinc-200 flex flex-wrap items-center justify-center gap-5">
            {[
              { icon: ShieldCheck, label: "SSL Secured" },
              { icon: Globe, label: "India hosted" },
              { icon: Sparkles, label: "GDPR ready" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-zinc-400">
                <Icon size={13} />
                <span className="text-[11px] font-medium">{label}</span>
              </div>
            ))}
          </div>

          <p className="text-zinc-400 text-[10px] text-center mt-6">
            © 2025 Supply Tracker Systems. Secure Encrypted Connection.
          </p>
        </div>
      </div>
    </div>
  );
}