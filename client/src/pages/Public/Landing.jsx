import { Link } from 'react-router-dom';
import { 
  Truck, ArrowRight, Shield, Zap, Globe, Package, 
  CheckCircle2, Clock, MapPin, BarChart3, Smartphone,
  Navigation, Calendar, CloudRain, AlertTriangle
} from 'lucide-react';
import Button from '../../components/common/Button';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
      
      {/* --- Navigation --- */}
      <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-xl border-b border-zinc-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tighter">
            <div className="w-8 h-8 bg-black flex items-center justify-center rounded-sm shadow-sm">
              <Truck size={16} className="text-white" />
            </div>
            <span className="font-extrabold tracking-tight">SUPPLY TRACKER</span>
          </div>
          
          <div className="hidden md:flex gap-8 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            <a href="#process" className="hover:text-black transition-colors">How it Works</a>
            <a href="#intelligence" className="hover:text-black transition-colors">Intelligence</a>
            <a href="#solutions" className="hover:text-black transition-colors">Solutions</a>
          </div>

          <div className="flex gap-4 items-center">
            <Link to="/login" className="text-sm font-medium text-zinc-600 hover:text-black transition-colors">
              Log In
            </Link>
            <Link to="/signup">
              <Button variant="primary" size="sm" className="hidden sm:inline-flex shadow-xl shadow-black/5">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section className="pt-32 pb-16 px-6 border-b border-zinc-100 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl animate-modern-fade pt-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 bg-white/50 backdrop-blur text-xs font-bold uppercase tracking-wider mb-6 text-zinc-600 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Live Operations Dashboard
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[0.95] mb-6 text-black">
              LOGISTICS <br />
              WITHOUT BLINDSPOTS.
            </h1>
            
            <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mb-10 leading-relaxed font-normal">
              Orchestrate your entire fleet with military-grade precision. 
              Predict delays before they happen with our traffic-aware AI engine and automate your dispatch workflow.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/signup">
                <Button size="lg" className="px-8 w-full sm:w-auto h-12 text-base shadow-lg shadow-black/10 hover:shadow-xl transition-all">
                  Start Tracking <ArrowRight size={18} className="ml-2" />
                </Button>
              </Link>
              <a href="#process">
                <Button variant="secondary" size="lg" className="px-8 w-full sm:w-auto h-12 text-base bg-white">
                  See How It Works
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* --- Business Stats Banner --- */}
      <section className="py-8 border-b border-zinc-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <Stat label="Prediction Accuracy" value="±2 Min" sub="Traffic-Adjusted ETAs" />
          <Stat label="Fleet Visibility" value="100%" sub="Real-Time Telemetry" />
          <Stat label="Uptime Guarantee" value="99.99%" sub="Enterprise SLA" />
          <Stat label="Global Coverage" value="24/7" sub="Automated Monitoring" />
        </div>
      </section>

      {/* --- Workflow / Process Section --- */}
      <section id="process" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 flex items-end justify-between border-b border-zinc-100 pb-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tighter mb-2">OPERATIONAL WORKFLOW</h2>
              <p className="text-zinc-500 text-sm max-w-md">Streamlined from order to delivery.</p>
            </div>
            <div className="hidden md:block text-xs font-mono text-zinc-400">SYS_FLOW_V2</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
             {/* Connector Line */}
            <div className="hidden md:block absolute top-10 left-0 w-full h-px bg-zinc-100 -z-10"></div>

            <ProcessStep 
              number="01" 
              title="Digital Manifesting"
              desc="Admins create shipments instantly. The system validates addresses, calculates optimal routes, and prepares the digital waybill."
              icon={Package}
            />
            <ProcessStep 
              number="02" 
              title="Smart Dispatch"
              desc="Drivers receive instant notifications via their dashboard. Routes are pre-calculated based on vehicle type and current traffic."
              icon={Navigation}
            />
            <ProcessStep 
              number="03" 
              title="Live Execution"
              desc="Stakeholders track progress in real-time. The system automatically flags potential delays and confirms delivery with geofencing."
              icon={MapPin}
            />
          </div>
        </div>
      </section>

      {/* --- Intelligence / AI Section (Business Benefits) --- */}
      <section id="intelligence" className="py-20 px-6 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-3xl font-bold tracking-tighter text-white">PREDICTIVE INTELLIGENCE</h2>
            <div className="h-0.5 w-12 bg-white mt-4"></div>
            <p className="mt-4 text-zinc-400 max-w-2xl">
              Our proprietary AI engine doesn't just guess—it analyzes thousands of data points to provide accurate ETAs that adapt to the real world.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 grid-rows-2 gap-4 h-auto md:h-[500px]">
            {/* Main Feature - Traffic & Routing */}
            <div className="md:col-span-2 md:row-span-2 p-8 border border-white/10 bg-zinc-900/50 hover:bg-zinc-900 transition-colors group flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <AlertTriangle size={120} />
              </div>
              <div className="w-10 h-10 bg-white text-black flex items-center justify-center rounded-sm mb-4">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">Rush Hour Awareness</h3>
                <p className="text-zinc-400 text-sm leading-relaxed max-w-md mb-6">
                  Standard GPS estimates fail during peak times. Our model detects historical traffic patterns, day-of-week congestion, and specific "Rush Hour" windows to adjust delivery expectations automatically.
                </p>
                <div className="flex gap-2">
                  <Badge text="Dynamic Re-routing" />
                  <Badge text="Congestion Avoidance" />
                </div>
              </div>
            </div>

            {/* Sub Feature 1 - Weather */}
            <div className="p-6 border border-white/10 bg-zinc-900/50 hover:bg-zinc-900 transition-colors">
              <CloudRain size={24} className="mb-4 text-white" />
              <h3 className="text-lg font-bold mb-1">Weather Adaptation</h3>
              <p className="text-zinc-400 text-xs">
                Rain, snow, or clear skies? The system adjusts travel speeds based on live weather conditions.
              </p>
            </div>

            {/* Sub Feature 2 - Vehicle Specifics */}
            <div className="p-6 border border-white/10 bg-zinc-900/50 hover:bg-zinc-900 transition-colors">
              <Truck size={24} className="mb-4 text-white" />
              <h3 className="text-lg font-bold mb-1">Fleet Optimization</h3>
              <p className="text-zinc-400 text-xs">
                Custom routing logic for Heavy Trucks vs. Delivery Vans to ensure safe and legal pathing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- Solutions / Capability Grid --- */}
      <section id="solutions" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Framed Container */}
          <div className="border border-zinc-200 bg-white p-8 md:p-12 relative overflow-hidden">
            {/* Decorative Corner Marks */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-black"></div>
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-black"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-black"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-black"></div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="md:w-1/2">
                <div className="flex items-center gap-2 mb-4 text-zinc-500">
                  <Globe size={20} />
                  <span className="text-xs font-mono uppercase tracking-widest">ENTERPRISE_READY</span>
                </div>
                <h2 className="text-4xl font-bold tracking-tighter mb-6 leading-none">
                  COMPLETE CONTROL<br />
                  FOR MODERN TEAMS.
                </h2>
                <p className="text-zinc-500 mb-8 leading-relaxed">
                  From single-driver operations to global fleets, our platform scales with you. 
                  Manage users, analyze performance, and secure your data in one unified dashboard.
                </p>
                <div className="flex gap-3">
                  <Link to="/signup">
                    <Button variant="primary" className="h-10 text-sm">Start Free Trial</Button>
                  </Link>
                  <Link to="/contact">
                    <Button variant="outline" className="h-10 text-sm">Schedule Demo</Button>
                  </Link>
                </div>
              </div>

              {/* Feature Capabilities Grid */}
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
      <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 font-bold text-lg mb-4 text-slate-800">
                <Truck size={20} />
                <span>SUPPLY TRACKER</span>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
                The standard for modern logistics management.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider">Product</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a href="#" className="hover:text-slate-900 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-slate-900 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-slate-900 transition-colors">Case Studies</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider">Support</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a href="#" className="hover:text-slate-900 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-slate-900 transition-colors">API Documentation</a></li>
                <li><a href="#" className="hover:text-slate-900 transition-colors">System Status</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wider">Legal</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400 font-medium">
            <p>© 2024 Supply Tracker Systems Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <span>Made for Logistics Professionals</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- Sub-components ---

function Stat({ label, value, sub }) {
  return (
    <div className="p-4 border border-zinc-100 bg-zinc-50/50 hover:border-zinc-300 transition-all text-center md:text-left cursor-default">
      <div className="text-2xl md:text-3xl font-bold tracking-tighter text-black mb-1">{value}</div>
      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label}</div>
      {sub && <div className="text-[10px] text-zinc-400 mt-1">{sub}</div>}
    </div>
  );
}

function ProcessStep({ number, title, desc, icon: Icon }) {
  return (
    <div className="relative pt-10 group">
      <div className="absolute top-0 left-0 md:left-auto w-8 h-8 bg-white border border-zinc-200 text-black flex items-center justify-center text-xs font-bold z-10 group-hover:border-black transition-colors duration-300">
        {number}
      </div>
      
      <div className="mt-2">
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
          {title}
        </h3>
        <p className="text-zinc-500 text-sm leading-relaxed pr-4">{desc}</p>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, label, sub }) {
  return (
    <div className="p-4 border border-zinc-100 bg-zinc-50 hover:bg-white hover:border-black transition-all duration-300 flex flex-col justify-center gap-2 group cursor-default">
      <Icon size={20} strokeWidth={1.5} className="text-zinc-400 group-hover:text-black transition-colors" />
      <div>
        <div className="text-sm font-bold text-black">{label}</div>
        <div className="text-xs text-zinc-400">{sub}</div>
      </div>
    </div>
  );
}

function Badge({ text }) {
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-sm bg-white/10 text-[10px] font-medium text-zinc-300 border border-white/10">
      {text}
    </span>
  );
}