import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Hexagon } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Logo from '../../components/common/common/Logo';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden dark text-foreground">
      {/* Immersive Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-neon-blue/10 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-neon-purple/10 rounded-full blur-[100px] animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-md glass-dark rounded-2xl p-8 md:p-10 relative z-10 overflow-hidden shadow-2xl border border-white/10 animate-modern-fade">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink" />

        <div className="text-center mb-10 flex flex-col items-center">
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/10">
            <Hexagon size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Forgot Password</h1>
          <p className="text-muted-foreground text-sm">Enter your email and we'll send a reset link.</p>
        </div>

        {sent ? (
          <div className="text-center space-y-4 animate-modern-fade">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
              <Mail size={28} className="text-green-400" />
            </div>
            <p className="text-white font-medium text-lg">Check your inbox</p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              If <span className="font-semibold text-white">{email}</span> is registered, a reset
              link has been sent. It expires in 15 minutes.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors mt-6 pt-4 border-t border-white/10 w-full justify-center"
            >
              <ArrowLeft size={14} />
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              icon={Mail}
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-black/50 border-white/10 focus-visible:ring-neon-blue focus-visible:border-neon-blue text-white placeholder:text-zinc-600"
              containerClassName="text-white"
            />

            <Button type="submit" loading={loading} className="w-full bg-white text-black hover:bg-zinc-200" size="lg">
              Send Reset Link
            </Button>

            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors mt-4"
            >
              <ArrowLeft size={14} />
              Back to login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}