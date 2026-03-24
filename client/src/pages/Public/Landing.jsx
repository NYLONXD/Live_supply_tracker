import { Link } from "react-router-dom";
import {
  Truck,
  ArrowRight,
  Shield,
  Zap,
  Globe,
  Package,
  MapPin,
  BarChart3,
  Smartphone,
  Navigation,
  Calendar,
  CloudRain,
  AlertTriangle,
} from "lucide-react";
import Button from "../../components/common/Button";

// Importing repo assets
import craneImg from "../../assets/crane.png";
import shipmentIcon from "../../assets/shipment-icon.png";
import bgHistory from "../../assets/bg-history.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-zinc-100 selection:text-black">
      {/* Keyframe animation injected via a style tag */}
      <style>{`
        @keyframes modernFade {
          0%   { opacity: 0; transform: translateY(28px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-modern-fade {
          animation: modernFade 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>

      {/* --- Navigation --- */}
      <nav className="fixed w-full z-50 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-zinc-100 flex items-center justify-center rounded-sm">
              <Truck size={18} className="text-black" />
            </div>
            <span className="font-bold tracking-tighter text-xl text-white">
              SUPPLY TRACKER
            </span>
          </div>

          <div className="hidden md:flex gap-10 text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em]">
            <a href="#process" className="hover:text-white transition-colors">How it Works</a>
            <a href="#intelligence" className="hover:text-white transition-colors">Intelligence</a>
            <a href="#solutions" className="hover:text-white transition-colors">Solutions</a>
          </div>

          <div className="flex gap-6 items-center">
            <Link
              to="/login"
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Log In
            </Link>
            <Link to="/track">
              {/* FIX: Explicit bg/text/border so button is always visible on dark bg */}
              <button className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-white text-black rounded hover:bg-zinc-200 transition-colors">
                Track Shipment
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section className="relative pt-40 pb-24 px-6 overflow-hidden">
        {/* FIX: Increased crane opacity from opacity-10 → opacity-25 for better visibility */}
        <div className="absolute right-0 top-20 w-1/2 opacity-50 pointer-events-none select-none">
          <img src={craneImg} alt="Logistics Crane" className="w-full h-auto object-contain" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* FIX: animate-modern-fade is now defined above via <style> */}
          <div className="max-w-3xl animate-modern-fade">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur text-[10px] font-bold uppercase tracking-[0.15em] mb-8 text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"></span>
              Real-time Global Telemetry
            </div>

            <h1 className="text-6xl md:text-8xl font-bold tracking-[-0.04em] leading-[0.9] mb-8 text-white">
              LOGISTICS <br />
              <span className="text-zinc-500">WITHOUT</span>
              <br />
              <span className="text-emerald-400">LIMITS.</span>
            </h1>

            <p className="text-lg md:text-xl text-zinc-400 max-w-xl mb-12 leading-relaxed font-light">
              Orchestrate your entire fleet with surgical precision.
              Our AI engine identifies congestion windows before they occur,
              automating your dispatch workflow.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/track">
                {/* FIX: Fully explicit styling — white bg, black text, always readable */}
                <button className="flex items-center justify-center gap-2 px-10 h-14 bg-white text-black font-semibold text-base rounded hover:bg-zinc-200 transition-colors w-full sm:w-auto">
                  Start Tracking <ArrowRight size={20} />
                </button>
              </Link>
              <Link to="/register-shop">
                {/* FIX: Solid border + text colour so this button is visible on dark bg */}
                <button className="flex items-center justify-center gap-2 px-10 h-14 border border-zinc-600 text-zinc-200 font-semibold text-base rounded hover:border-white hover:text-white hover:bg-white/5 transition-all w-full sm:w-auto">
                  Register Shop
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- Stats Banner --- */}
      <section className="py-12 border-y border-white bg-zinc-900/30">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
          <Stat label="ETA Accuracy" value="±2m" sub="Traffic-Aware" />
          <Stat label="Visibility" value="100%" sub="Active Fleet" />
          <Stat label="System Uptime" value="99.9%" sub="Enterprise SLA" />
          <Stat label="Monitoring" value="24/7" sub="Autonomous AI" />
        </div>
      </section>

      {/* --- Process Section --- */}
      <section id="process" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-16">
            {/* FIX: shipment icon is now visible — removed grayscale+invert combo that hid it on dark */}
            <img src={shipmentIcon} alt="Shipment Icon" className="w-12 h-12 opacity-90" />
            <div>
              <h2 className="text-xs font-bold tracking-[0.3em] text-zinc-500 uppercase">Operational Flow</h2>
              <div className="text-3xl font-bold text-white mt-1">Smart Manifesting</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <ProcessStep
              number="01"
              title="Digital Ingestion"
              desc="Admins create shipments instantly. Our engine validates addresses and prepares pathing in milliseconds."
              icon={Package}
            />
            <ProcessStep
              number="02"
              title="Automated Dispatch"
              desc="Drivers receive optimized navigation routes directly to their mobile dashboard, synced with live traffic data."
              icon={Navigation}
            />
            <ProcessStep
              number="03"
              title="Live Telemetry"
              desc="Full geofencing support triggers automated delivery confirmations and proactive stakeholder alerts."
              icon={MapPin}
            />
          </div>
        </div>
      </section>

      {/* --- Intelligence / Glass Cards --- */}
      <section id="intelligence" className="py-32 px-6 bg-zinc-900/50 border-y border-white/5 relative">
        {/* FIX: bgHistory opacity bumped from opacity-5 → opacity-10 so texture is actually visible */}
        <div className="absolute inset-0 opacity-29 pointer-events-none">
          <img src={bgHistory} alt="" className="w-full h-full object-cover" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 p-12 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Zap className="text-white mb-6" size={32} />
              <h3 className="text-4xl font-bold mb-4 text-white">Predictive Routing</h3>
              <p className="text-zinc-400 text-lg leading-relaxed max-w-xl mb-8">
                Unlike standard navigation, our model factors in historical rush-hour patterns and
                seasonal weather variations to ensure your ETAs are always achievable.
              </p>
              <div className="flex gap-3 flex-wrap">
                <Badge text="LGBM Regressor" />
                <Badge text="Weather-Aware" />
                <Badge text="Geo-Spatial" />
              </div>
            </div>

            <div className="lg:col-span-4 grid grid-rows-2 gap-6">
              <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <CloudRain className="text-zinc-400 mb-4" size={24} />
                <h4 className="text-xl font-bold text-white mb-2">Weather Adaptation</h4>
                <p className="text-zinc-400 text-sm">Dynamic speed adjustments based on live environmental telemetry.</p>
              </div>
              <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <BarChart3 className="text-zinc-400 mb-4" size={24} />
                <h4 className="text-xl font-bold text-white mb-2">Fleet Analytics</h4>
                <p className="text-zinc-400 text-sm">Automated performance reporting for every driver and route.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Solutions Section --- */}
      <section id="solutions" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="border border-white/10 bg-zinc-900/40 p-8 md:p-12 relative overflow-hidden rounded-2xl">
            {/* Decorative corner marks */}
            <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-white/30 rounded-tl-2xl"></div>
            <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-white/30 rounded-tr-2xl"></div>
            <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-white/30 rounded-bl-2xl"></div>
            <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-white/30 rounded-br-2xl"></div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="md:w-1/2">
                <div className="flex items-center gap-2 mb-4 text-zinc-500">
                  <Globe size={20} />
                  <span className="text-xs font-mono uppercase tracking-widest">ENTERPRISE_READY</span>
                </div>
                <h2 className="text-4xl font-bold tracking-tighter mb-6 leading-none text-white">
                  COMPLETE CONTROL<br />FOR MODERN TEAMS.
                </h2>
                <p className="text-zinc-400 mb-8 leading-relaxed">
                  From single-driver operations to global fleets, our platform scales with you.
                  Manage users, analyse performance, and secure your data in one unified dashboard.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link to="/login">
                    <button className="px-5 h-10 text-sm font-semibold bg-white text-black rounded hover:bg-zinc-200 transition-colors">
                      Admin Login
                    </button>
                  </Link>
                  <Link to="/track">
                    <button className="px-5 h-10 text-sm font-semibold border border-zinc-600 text-zinc-200 rounded hover:border-white hover:text-white transition-colors">
                      Track Shipment
                    </button>
                  </Link>
                  <Link to="/register-shop">
                    <button className="px-5 h-10 text-sm font-semibold border border-zinc-600 text-zinc-200 rounded hover:border-white hover:text-white transition-colors">
                      Register Shop
                    </button>
                  </Link>
                </div>
              </div>

              <div className="md:w-1/2 w-full grid grid-cols-2 gap-4">
                <FeatureCard icon={Shield} label="Secure Access" sub="Role-Based Controls" />
                <FeatureCard icon={BarChart3} label="Analytics" sub="Performance Reports" />
                <FeatureCard icon={Smartphone} label="Driver App" sub="Mobile Optimized" />
                <FeatureCard icon={Calendar} label="Scheduling" sub="Automated Planning" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="pt-32 pb-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12 mb-20">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 font-bold text-white mb-6">
              <Truck size={20} />
              <span>SUPPLY TRACKER</span>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Standardising the modern logistics stack for elite operations globally.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
            <FooterLinks title="Platform" links={["Intelligence", "Security", "Analytics"]} />
            <FooterLinks title="Support" links={["Docs", "Status", "API"]} />
            <FooterLinks title="Legal" links={["Privacy", "Terms"]} />
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between gap-2 text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
          <p>© 2024 Supply Tracker Systems Inc.</p>
          <p>Built for Speed</p>
        </div>
      </footer>
    </div>
  );
}

// --- Sub-components ---

function Stat({ label, value, sub }) {
  return (
    <div>
      <div className="text-4xl font-bold text-white tracking-tighter mb-1">{value}</div>
      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</div>
      <div className="text-[10px] text-zinc-600 mt-1">{sub}</div>
    </div>
  );
}

function ProcessStep({ number, title, desc, icon: Icon }) {
  return (
    <div className="p-8 rounded-xl bg-zinc-900/30 border border-white/5 hover:border-white/20 transition-all group">
      <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center text-zinc-400 font-mono text-xs mb-6 group-hover:bg-white group-hover:text-black transition-colors">
        {number}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function FeatureCard({ icon: Icon, label, sub }) {
  return (
    <div className="p-4 border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300 flex flex-col justify-center gap-2 group cursor-default rounded-lg">
      <Icon size={20} strokeWidth={1.5} className="text-zinc-400 group-hover:text-white transition-colors" />
      <div>
        <div className="text-sm font-bold text-white">{label}</div>
        <div className="text-xs text-zinc-500">{sub}</div>
      </div>
    </div>
  );
}

function Badge({ text }) {
  return (
    <span className="px-3 py-1 rounded-sm bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
      {text}
    </span>
  );
}

function FooterLinks({ title, links }) {
  return (
    <div>
      <h4 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-6">{title}</h4>
      <ul className="space-y-4 text-xs text-zinc-500">
        {links.map(link => (
          <li key={link}><a href="#" className="hover:text-white transition-colors">{link}</a></li>
        ))}
      </ul>
    </div>
  );
}