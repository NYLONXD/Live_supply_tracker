import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Clock, MapPin, Package, Search, Truck, ArrowRight,
  Shield, Zap, Globe, Radio, ChevronRight
} from 'lucide-react';
import { formatETA } from '../../utils/formatTime';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import GoogleShipmentMap from '../../components/common/GoogleShipmentMap';
import { shipmentAPI } from '../../services/api';
import socketService from '../../services/socket.service';
import craneImg from '../../assets/crane.png';
import shipmentIcon from '../../assets/shipment-icon.png';

export default function PublicTrack() {
  const navigate = useNavigate();
  const { trackingNumber } = useParams();
  const [searchValue, setSearchValue] = useState(trackingNumber || '');
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(Boolean(trackingNumber));
  const [error, setError] = useState('');

  const currentLocation = useMemo(() => shipment?.currentLocation || null, [shipment]);

  useEffect(() => {
    setSearchValue(trackingNumber || '');
    if (trackingNumber) {
      fetchShipment(trackingNumber);
    } else {
      setShipment(null);
      setLoading(false);
      setError('');
    }

    return () => {
      if (trackingNumber) {
        socketService.leaveShipment(trackingNumber);
      }
      socketService.removeAllListeners();
    };
  }, [trackingNumber]);

  useEffect(() => {
    if (!shipment?.trackingNumber) return;

    socketService.joinShipment(shipment.trackingNumber);

    socketService.onLocationUpdate((data) => {
      if (data.trackingNumber === shipment.trackingNumber) {
        setShipment((prev) => ({ ...prev, currentLocation: data.location }));
      }
    });

    socketService.onStatusUpdate((data) => {
      if (data.trackingNumber === shipment.trackingNumber) {
        setShipment((prev) => ({ ...prev, status: data.status }));
      }
    });

    socketService.onETAUpdate((data) => {
      if (data.trackingNumber === shipment.trackingNumber) {
        setShipment((prev) => ({ ...prev, currentETA: data.newETA }));
      }
    });

    return () => {
      socketService.leaveShipment(shipment.trackingNumber);
      socketService.removeAllListeners();
    };
  }, [shipment?.trackingNumber]);

  const fetchShipment = async (trackingId) => {
    try {
      setLoading(true);
      const { data } = await shipmentAPI.track(trackingId);
      setShipment(data);
      setError('');
    } catch (err) {
      setShipment(null);
      setError(err.response?.data?.message || 'Shipment not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const value = searchValue.trim();
    if (!value) {
      setError('Please enter a tracking number');
      return;
    }
    navigate(`/track/${value}`);
  };

  // ─── No tracking result yet → show the full branded experience ───
  const showLanding = !loading && !shipment && !error;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-zinc-100 selection:text-black overflow-x-hidden">
      <style>{`
        @keyframes trackFade {
          0%   { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-track-fade {
          animation: trackFade 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .animate-track-fade-delay-1 { animation-delay: 0.1s; }
        .animate-track-fade-delay-2 { animation-delay: 0.2s; }
        .animate-track-fade-delay-3 { animation-delay: 0.3s; }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(16,185,129,0.15); }
          50%      { box-shadow: 0 0 40px rgba(16,185,129,0.3); }
        }
        .pulse-glow { animation: pulseGlow 3s ease-in-out infinite; }
        @keyframes scanLine {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* ── Hero Search Section ──────────────────────────────── */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 overflow-hidden">
        {/* Background crane image */}
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-[0.07] pointer-events-none select-none">
          <img src={craneImg} alt="" className="w-full h-full object-contain object-right-top" />
        </div>

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 animate-track-fade">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-8">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight size={12} />
            <span className="text-zinc-300">Track Shipment</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur text-[10px] font-bold uppercase tracking-[0.15em] mb-6 text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                Live Tracking
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-[-0.03em] leading-[1.1] text-white mb-3">
                Track your<br />
                <span className="text-emerald-400">shipment</span>
              </h1>
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                Enter your tracking number to see real-time delivery progress, driver location, and estimated arrival.
              </p>
            </div>

            {/* Search Form */}
            <form
              onSubmit={handleSearch}
              className="w-full lg:max-w-md"
            >
              <div className="p-1 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      name="tracking"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      placeholder="Enter tracking number"
                      className="w-full h-12 pl-11 pr-4 bg-transparent text-white placeholder-zinc-500 text-sm focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-12 px-6 bg-white text-black font-semibold text-sm rounded-lg hover:bg-zinc-200 transition-colors flex items-center gap-2 whitespace-nowrap"
                  >
                    Track <ArrowRight size={16} />
                  </button>
                </div>
              </div>
              {error && !shipment && (
                <p className="mt-3 text-sm text-red-400 flex items-center gap-2">
                  <Package size={14} /> {error}
                </p>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* ── Loading State ──────────────────────────────── */}
      {loading && (
        <section className="px-4 sm:px-6 pb-16">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="relative">
                <div className="h-14 w-14 animate-spin rounded-full border-[3px] border-zinc-700 border-t-emerald-500" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Package size={18} className="text-zinc-500" />
                </div>
              </div>
              <p className="mt-6 text-sm text-zinc-500 font-medium">Locating your shipment…</p>
            </div>
          </div>
        </section>
      )}

      {/* ── Error State ──────────────────────────────── */}
      {!loading && error && !shipment && (
        <section className="px-4 sm:px-6 pb-16">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                <Package size={28} className="text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{error}</h2>
              <p className="text-sm text-zinc-500 max-w-sm text-center">
                Double-check the tracking ID shared by the business admin and try again.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── Shipment Results ──────────────────────────── */}
      {!loading && shipment && (
        <section className="px-4 sm:px-6 pb-16">
          <div className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
            <div className="space-y-4">
              <Card>
                <div className="flex items-center gap-3">
                  <div className="rounded-sm bg-black p-3 text-white">
                    <Package size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-zinc-500">Tracking Number</p>
                    <p className="font-mono text-sm font-semibold text-black">{shipment.trackingNumber}</p>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-zinc-500">Status</p>
                    <p className="mt-1 text-base font-semibold text-black">{shipment.status.replaceAll('_', ' ')}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-zinc-500">Distance</p>
                      <p className="mt-1 text-lg font-bold text-black">{shipment.distance ? `${shipment.distance.toFixed(1)} km` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-zinc-500">ETA</p>
                      <p className="mt-1 text-lg font-bold text-black">{formatETA(shipment.currentETA)}</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-1 text-black" size={16} />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-zinc-500">Pickup</p>
                      <p className="mt-1 text-black">{shipment.from}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-1 text-black" size={16} />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-zinc-500">Delivery</p>
                      <p className="mt-1 text-black">{shipment.to}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {shipment.driver && (
                <Card>
                  <div className="flex items-center gap-3">
                    <div className="rounded-sm bg-zinc-100 p-3">
                      <Truck size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-zinc-500">Driver</p>
                      <p className="font-semibold text-black">{shipment.driver.name}</p>
                      {shipment.driver.phone && <p className="text-sm text-brand-zinc-500">{shipment.driver.phone}</p>}
                    </div>
                  </div>
                </Card>
              )}

              <Card>
                <div className="flex items-center gap-3 text-sm text-brand-zinc-600">
                  <Clock size={16} />
                  <span>Live updates appear automatically while this page is open.</span>
                </div>
              </Card>
            </div>

            <Card noPadding className="overflow-hidden">
              <GoogleShipmentMap shipment={shipment} currentLocation={currentLocation} />
            </Card>
          </div>
        </section>
      )}

      {/* ── Landing Content (when no search result) ──────────── */}
      {showLanding && (
        <>
          {/* How It Works */}
          <section className="px-4 sm:px-6 pb-20">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-4 mb-10 animate-track-fade animate-track-fade-delay-1">
                <img src={shipmentIcon} alt="Shipment" className="w-10 h-10 opacity-80" />
                <div>
                  <p className="text-[10px] font-bold tracking-[0.3em] text-zinc-500 uppercase">How It Works</p>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Track in 3 simple steps</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-track-fade animate-track-fade-delay-2">
                <StepCard
                  number="01"
                  title="Get Your Tracking ID"
                  description="Receive your unique tracking number from the business that shipped your order."
                  icon={Package}
                />
                <StepCard
                  number="02"
                  title="Enter & Search"
                  description="Paste the tracking number above and hit search. Results appear instantly."
                  icon={Search}
                />
                <StepCard
                  number="03"
                  title="Watch Live Updates"
                  description="See your shipment's real-time location on the map with live ETA updates."
                  icon={Radio}
                />
              </div>
            </div>
          </section>

          {/* Feature Highlights */}
          <section className="px-4 sm:px-6 pb-20">
            <div className="max-w-6xl mx-auto animate-track-fade animate-track-fade-delay-3">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Large feature card */}
                <div className="lg:col-span-7 p-8 sm:p-10 rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/10 transition-all duration-700" />
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 pulse-glow">
                      <Zap size={22} className="text-emerald-400" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">Real-Time GPS Tracking</h3>
                    <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-lg mb-6">
                      Watch your delivery move on the map in real time. Our system updates every few seconds
                      using live driver GPS data with traffic-aware ETA calculations.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <BadgePill text="Live GPS" />
                      <BadgePill text="Traffic-Aware ETA" />
                      <BadgePill text="Auto-Refresh" />
                    </div>
                  </div>
                </div>

                {/* Right stacked cards */}
                <div className="lg:col-span-5 grid grid-rows-2 gap-5">
                  <div className="p-7 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all duration-300 group">
                    <Shield size={22} className="text-zinc-400 mb-4 group-hover:text-white transition-colors" />
                    <h4 className="text-lg font-bold text-white mb-2">No Account Needed</h4>
                    <p className="text-zinc-500 text-sm leading-relaxed">
                      Customers can track shipments without creating an account. Just enter the tracking ID — it's that simple.
                    </p>
                  </div>
                  <div className="p-7 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all duration-300 group">
                    <Globe size={22} className="text-zinc-400 mb-4 group-hover:text-white transition-colors" />
                    <h4 className="text-lg font-bold text-white mb-2">Works Everywhere</h4>
                    <p className="text-zinc-500 text-sm leading-relaxed">
                      Optimized for mobile, tablet, and desktop. Share the tracking link with anyone, anywhere.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Banner */}
          <section className="px-4 sm:px-6 pb-16">
            <div className="max-w-6xl mx-auto">
              <div className="relative rounded-2xl border border-white/10 bg-gradient-to-r from-zinc-900 to-zinc-900/60 p-8 sm:p-12 overflow-hidden">
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-emerald-500/40 rounded-tl-2xl" />
                <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-emerald-500/40 rounded-tr-2xl" />
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-emerald-500/40 rounded-bl-2xl" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-emerald-500/40 rounded-br-2xl" />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Are you a business?</h3>
                    <p className="text-zinc-400 text-sm max-w-md">
                      Register your shop and start sending tracked shipments to your customers today.
                    </p>
                  </div>
                  <div className="flex gap-3 shrink-0">
                    <Link to="/register-shop">
                      <button className="px-6 h-11 bg-white text-black font-semibold text-sm rounded-lg hover:bg-zinc-200 transition-colors flex items-center gap-2">
                        Register Shop <ArrowRight size={16} />
                      </button>
                    </Link>
                    <Link to="/login">
                      <button className="px-6 h-11 border border-zinc-600 text-zinc-300 font-semibold text-sm rounded-lg hover:border-white hover:text-white transition-all">
                        Sign In
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="px-4 sm:px-6 pb-8">
            <div className="max-w-6xl mx-auto pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between gap-2 text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
              <p>© 2025 Supply Tracker Systems Inc.</p>
              <p>Real-Time Logistics Intelligence</p>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}

/* ── Sub-Components ────────────────────────────────────────── */

function StepCard({ number, title, description, icon: Icon }) {
  return (
    <div className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-white/20 transition-all duration-300 group relative overflow-hidden">
      {/* Scan line effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" style={{ animation: 'scanLine 2s linear infinite' }} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-zinc-500 font-mono text-xs font-bold group-hover:bg-white group-hover:text-black transition-colors">
            {number}
          </div>
          <Icon size={18} className="text-zinc-600 group-hover:text-emerald-400 transition-colors" />
        </div>
        <h3 className="text-base font-bold text-white mb-2">{title}</h3>
        <p className="text-zinc-500 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function BadgePill({ text }) {
  return (
    <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
      {text}
    </span>
  );
}
