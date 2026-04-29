// client/src/pages/User/CreateShipment.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Package, Clock, RotateCcw, Box, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { formatETA } from '../../utils/formatTime';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { shipmentAPI, aiAPI } from '../../services/api';
import useDraft from '../../hooks/useDraft';
import toast from 'react-hot-toast';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const DRAFT_KEY = 'create-shipment-user';

const INITIAL_FORM = {
  from: '',
  to: '',
  vehicleType: 'Car',
  weather: 'Clear',
  notes: '',
};

export default function CreateShipment() {
  const navigate = useNavigate();
  const { draft, restored, saveDraft, clearDraft } = useDraft(DRAFT_KEY);

  const [loading,      setLoading]      = useState(false);
  const [calculating,  setCalculating]  = useState(false);
  const [etaPrediction,setEtaPrediction]= useState(null);
  const [coords,       setCoords]       = useState(null);
  const [draftBanner,  setDraftBanner]  = useState(false);

  const [formData, setFormData] = useState(INITIAL_FORM);

  // ── Restore draft ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!restored) return;
    if (draft) {
      setFormData(draft.formData ?? INITIAL_FORM);
      if (draft.etaPrediction) setEtaPrediction(draft.etaPrediction);
      if (draft.coords)        setCoords(draft.coords);
      setDraftBanner(true);
    }
  }, [restored]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-save ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!restored) return;
    saveDraft({ formData, etaPrediction, coords });
  }, [formData, etaPrediction, coords]); // eslint-disable-line react-hooks/exhaustive-deps

  const discardDraft = () => {
    clearDraft();
    setFormData(INITIAL_FORM);
    setEtaPrediction(null);
    setCoords(null);
    setDraftBanner(false);
    toast('Draft cleared');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setEtaPrediction(null);
    setCoords(null);
  };

  const geocodeLocation = async (location) => {
    const encoded = encodeURIComponent(location);
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=IN`,
    );
    const data = await res.json();
    if (!data.features || data.features.length === 0) {
      throw new Error(`Could not find location: "${location}"`);
    }
    const [lng, lat] = data.features[0].center;
    return { lat, lng };
  };

  const calculateETA = async () => {
    if (!formData.from || !formData.to) {
      toast.error('Please enter both pickup and delivery locations');
      return;
    }
    setCalculating(true);
    try {
      const [fromCoords, toCoords] = await Promise.all([
        geocodeLocation(formData.from),
        geocodeLocation(formData.to),
      ]);
      const resolvedCoords = { fromCoords, toCoords };
      setCoords(resolvedCoords);

      const { data } = await aiAPI.previewETA({
        fromLat: fromCoords.lat,
        fromLng: fromCoords.lng,
        toLat:   toCoords.lat,
        toLng:   toCoords.lng,
        vehicleType: formData.vehicleType,
        weather:     formData.weather,
      });

      setEtaPrediction({
        distance:         data.distance.toFixed(1),
        estimatedMinutes: Math.round(data.estimatedMinutes),
        confidence:       data.confidence,
        model:            data.model || 'AI',
      });
      toast.success('ETA calculated successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to calculate ETA');
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!etaPrediction || !coords) {
      toast.error('Please calculate ETA first');
      return;
    }
    setLoading(true);
    try {
      await shipmentAPI.create({
        from:        formData.from,
        to:          formData.to,
        fromLat:     coords.fromCoords.lat,
        fromLng:     coords.fromCoords.lng,
        toLat:       coords.toCoords.lat,
        toLng:       coords.toCoords.lng,
        vehicleType: formData.vehicleType,
        weather:     formData.weather,
        notes:       formData.notes,
      });
      clearDraft(); // wipe draft on success
      toast.success('Shipment deployed successfully!');
      navigate('/user/shipments');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create shipment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Initialize Shipment">
      <div className="max-w-5xl mx-auto">

        {/* Draft banner */}
        {draftBanner && (
          <div className="mb-6 flex items-center justify-between gap-4 bg-amber-50/80 backdrop-blur-md border border-amber-200/50 rounded-2xl p-4 shadow-sm animate-modern-fade">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <RotateCcw size={14} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-900 tracking-tight">Draft Restored</p>
                <p className="text-xs text-amber-700/80">We've loaded your previous unsaved session.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={discardDraft}
              className="px-4 py-2 bg-white text-xs font-bold text-amber-700 hover:text-amber-900 rounded-lg shadow-sm border border-amber-200 hover:border-amber-300 transition-all"
            >
              Discard Draft
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-xl border border-zinc-200/50 rounded-3xl p-8 shadow-xl relative overflow-hidden animate-modern-fade">
              <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-100 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              
              <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                {/* Locations */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2 mb-6">
                    <MapPin size={16} className="text-black" />
                    Coordinate Entry
                  </h3>
                  <div className="grid grid-cols-1 gap-6 relative">
                    <div className="absolute left-[19px] top-10 bottom-10 w-0.5 bg-zinc-200/50 rounded-full" />
                    
                    <div className="relative z-10">
                      <div className="absolute -left-[5px] top-11 w-3 h-3 rounded-full bg-black border-2 border-white shadow-sm z-10" />
                      <Input
                        label="Extraction Point (Pickup)"
                        name="from"
                        placeholder="e.g., Connaught Place, New Delhi"
                        value={formData.from}
                        onChange={handleChange}
                        required
                        className="bg-white/50 border-zinc-200/50 focus:border-black focus:ring-black h-12 rounded-xl"
                      />
                    </div>

                    <div className="relative z-10">
                      <div className="absolute -left-[5px] top-11 w-3 h-3 rounded-full border-2 border-black bg-white shadow-sm z-10" />
                      <Input
                        label="Drop Zone (Delivery)"
                        name="to"
                        placeholder="e.g., Bandra West, Mumbai"
                        value={formData.to}
                        onChange={handleChange}
                        required
                        className="bg-white/50 border-zinc-200/50 focus:border-black focus:ring-black h-12 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                <div className="w-full h-px bg-zinc-100" />

                {/* Logistics Details */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2 mb-6">
                    <Package size={16} className="text-black" />
                    Logistics Parameters
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Vehicle Class</label>
                      <div className="relative">
                        <select
                          name="vehicleType"
                          value={formData.vehicleType}
                          onChange={handleChange}
                          className="w-full appearance-none h-12 px-4 bg-white/50 border border-zinc-200/50 rounded-xl text-sm font-medium text-black focus:outline-none focus:ring-1 focus:ring-black focus:border-black shadow-sm"
                        >
                          <option value="Bike">Light Transport (Bike)</option>
                          <option value="Car">Standard Transport (Car)</option>
                          <option value="Van">Medium Transport (Van)</option>
                          <option value="Truck">Heavy Freight (Truck)</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-zinc-400">
                          <Box size={16} />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Weather Conditions</label>
                      <div className="relative">
                        <select
                          name="weather"
                          value={formData.weather}
                          onChange={handleChange}
                          className="w-full appearance-none h-12 px-4 bg-white/50 border border-zinc-200/50 rounded-xl text-sm font-medium text-black focus:outline-none focus:ring-1 focus:ring-black focus:border-black shadow-sm"
                        >
                          <option value="Clear">Clear / Optimal</option>
                          <option value="Rainy">Rainy / Sub-optimal</option>
                          <option value="Foggy">Foggy / Hazardous</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-zinc-400">
                          <MapPin size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                      Operational Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Special handling instructions, gate codes, or access restrictions..."
                      className="w-full p-4 bg-white/50 border border-zinc-200/50 rounded-xl text-sm text-black placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black shadow-sm resize-none"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-100 flex flex-col sm:flex-row items-center gap-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate('/user/dashboard')}
                    className="w-full sm:w-auto h-12 px-8 rounded-xl font-bold hover:bg-zinc-100 text-zinc-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={loading}
                    disabled={!etaPrediction}
                    className="w-full sm:flex-1 h-12 rounded-xl bg-black text-white hover:bg-zinc-800 shadow-xl shadow-black/10 text-xs font-bold uppercase tracking-widest disabled:opacity-50 disabled:shadow-none"
                  >
                    Deploy Shipment
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* AI Panel */}
          <div className="space-y-6">
            <div className="bg-black rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              
              <div className="flex items-center gap-3 mb-8 relative z-10">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 backdrop-blur-md">
                  <Zap size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg leading-tight">AI Telemetry</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Route Analysis</p>
                </div>
              </div>

              {!etaPrediction ? (
                <div className="relative z-10 text-center py-8">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 group-hover:scale-110 transition-transform duration-500">
                    <Clock size={24} className="text-zinc-500" />
                  </div>
                  <p className="text-zinc-400 text-sm mb-8 leading-relaxed px-4">
                    Establish coordinates to calculate predicted time of arrival and exact distance.
                  </p>
                  <Button
                    type="button"
                    onClick={calculateETA}
                    loading={calculating}
                    className="w-full bg-white text-black hover:bg-zinc-200 h-12 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-white/10"
                  >
                    Initialize AI Scan
                  </Button>
                </div>
              ) : (
                <div className="relative z-10 space-y-6 animate-modern-fade">
                  <div className="bg-white/10 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Distance</p>
                    <p className="text-3xl font-black text-white tracking-tighter flex items-baseline gap-1">
                      {etaPrediction.distance} <span className="text-sm font-bold text-zinc-500 uppercase tracking-widest">km</span>
                    </p>
                  </div>
                  
                  <div className="bg-white border border-white rounded-2xl p-5 shadow-[0_0_30px_rgba(255,255,255,0.2)] transform scale-105">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Estimated Time</p>
                    <p className="text-3xl font-black text-black tracking-tighter flex items-baseline gap-1">
                      {formatETA(etaPrediction.estimatedMinutes)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/10 pt-6">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Confidence</p>
                      <div className="flex items-center gap-1.5 text-white text-xs font-bold uppercase tracking-wider">
                        <CheckCircle2 size={12} className="text-green-400" /> {etaPrediction.confidence}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Engine</p>
                      <p className="text-white text-xs font-bold uppercase tracking-wider">{etaPrediction.model}</p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={calculateETA}
                    loading={calculating}
                    variant="outline"
                    className="w-full h-11 border-white/20 text-white hover:bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest mt-2"
                  >
                    Recalculate
                  </Button>
                </div>
              )}
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-zinc-200/50 rounded-3xl p-6 shadow-xl text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Secure Transit</p>
              <p className="text-xs text-zinc-400">All shipments are continuously monitored and tracked across our global network infrastructure.</p>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}