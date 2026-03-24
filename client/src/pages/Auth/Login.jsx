import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Truck, ArrowRight, AlertCircle } from "lucide-react";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import useAuthStore from "../../stores/authStore";
import loginAvatar from "../../assets/login-avatar.svg";

export default function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuthStore();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (field) => (e) => {
    setError("");
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const user = await login(formData);
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-50 via-white to-zinc-100">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] overflow-hidden border border-zinc-100">

        {/* ── Left Panel: Illustration ─────────────────────────── */}
        <div className="hidden lg:flex flex-col items-center justify-center relative bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-10 overflow-hidden">
          {/* Abstract decorative shapes */}
          <div className="absolute -top-20 -left-20 w-72 h-72 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-white/5 rounded-full blur-xl" />

          <img
            src={loginAvatar}
            alt="Login illustration"
            className="relative z-10 w-72 h-72 drop-shadow-2xl mb-8 animate-[float_6s_ease-in-out_infinite]"
          />

          <div className="relative z-10 text-center">
            <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">
              Supply Chain Intelligence
            </h2>
            <p className="text-indigo-100 text-sm leading-relaxed max-w-xs mx-auto">
              Real-time tracking, analytics, and fleet management — all in one unified platform.
            </p>
          </div>

          {/* Floating dots decoration */}
          <div className="absolute bottom-8 left-8 flex gap-2">
            <span className="w-2 h-2 rounded-full bg-white/40" />
            <span className="w-2 h-2 rounded-full bg-white/20" />
            <span className="w-2 h-2 rounded-full bg-white/20" />
          </div>
        </div>

        {/* ── Right Panel: Login Form ──────────────────────────── */}
        <div className="flex flex-col justify-center px-8 py-12 md:px-12 lg:px-14">
          {/* Brand Header */}
          <Link to="/" className="inline-flex items-center gap-2.5 mb-10 group w-fit">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center rounded-lg text-white shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow">
              <Truck size={18} />
            </div>
            <span className="font-bold tracking-tight text-lg bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              SUPPLY TRACKER
            </span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">
              Welcome back
            </h1>
            <p className="text-zinc-500 text-sm">
              Sign in to your workspace to continue.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-[shake_0.3s_ease-in-out]">
              <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="name@company.com"
              value={formData.email}
              onChange={handleChange("email")}
              required
              className="h-11 !rounded-lg"
            />

            <div className="space-y-1.5">
              <Input
                label="Password"
                type="password"
                icon={Lock}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange("password")}
                required
                className="h-11 !rounded-lg"
                containerClassName="w-full"
              />
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm !rounded-lg !bg-gradient-to-r !from-indigo-600 !to-violet-600 !border-0 hover:!shadow-lg hover:!shadow-indigo-500/25 transition-all duration-300"
              loading={loading}
            >
              Sign In <ArrowRight size={16} className="ml-2" />
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-100 text-center">
            <p className="text-zinc-500 text-xs mb-3">Don't have an account?</p>
            <Link to="/signup">
              <Button variant="outline" className="w-full h-10 text-xs !rounded-lg !border-indigo-200 !text-indigo-600 hover:!bg-indigo-50 hover:!border-indigo-300">
                Create Account
              </Button>
            </Link>
          </div>

          <p className="text-zinc-400 text-[10px] text-center mt-8">
            © 2025 Supply Tracker Systems. Secure Encrypted Connection.
          </p>
        </div>
      </div>

      {/* Global float animation keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
