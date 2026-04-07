// client/src/pages/User/CreateShipment.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Package, Clock, RotateCcw } from 'lucide-react';
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
      toast.success('ETA calculated!');
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
      toast.success('Shipment created successfully!');
      navigate('/user/shipments');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create shipment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Create New Shipment">
      <div className="max-w-4xl mx-auto">

        {/* Draft banner */}
        {draftBanner && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-sm border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
            <span className="text-amber-800 font-medium">
              📝 We restored your unsaved draft. Continue where you left off.
            </span>
            <button
              type="button"
              onClick={discardDraft}
              className="flex items-center gap-1.5 text-amber-700 hover:text-amber-900 font-semibold text-xs shrink-0"
            >
              <RotateCcw size={13} /> Discard
            </button>
          </div>
        )}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Locations */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                <MapPin size={20} className="text-black" />
                Location Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Pickup Location"
                  name="from"
                  placeholder="e.g., New Delhi Railway Station"
                  value={formData.from}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Delivery Location"
                  name="to"
                  placeholder="e.g., Goa Airport"
                  value={formData.to}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Shipment Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                <Package size={20} className="text-black" />
                Shipment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-zinc-500 mb-1.5">Vehicle Type</label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-brand-zinc-200 rounded-sm text-black focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                  >
                    <option value="Car">Car</option>
                    <option value="Bike">Bike</option>
                    <option value="Truck">Truck</option>
                    <option value="Van">Van</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-brand-zinc-500 mb-1.5">Weather</label>
                  <select
                    name="weather"
                    value={formData.weather}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border border-brand-zinc-200 rounded-sm text-black focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                  >
                    <option value="Clear">Clear</option>
                    <option value="Rainy">Rainy</option>
                    <option value="Foggy">Foggy</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-brand-zinc-500 mb-1.5">
                  Additional Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Any special instructions..."
                  className="w-full px-4 py-2.5 bg-white border border-brand-zinc-200 rounded-sm text-black placeholder-brand-zinc-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                />
              </div>
            </div>

            {/* Calculate ETA */}
            <div className="flex justify-center">
              <Button
                type="button"
                onClick={calculateETA}
                loading={calculating}
                variant="outline"
                className="w-full md:w-auto"
              >
                <Clock size={20} className="mr-2" />
                Calculate AI-Powered ETA
              </Button>
            </div>

            {/* ETA Result */}
            {etaPrediction && (
              <div className="border-2 border-black rounded-sm p-6 animate-fadeIn">
                <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
                  <Clock size={20} /> AI ETA Prediction
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-brand-zinc-50 border border-brand-zinc-200 p-4 rounded-sm">
                    <p className="text-brand-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">Road Distance</p>
                    <p className="text-2xl font-bold text-black">{etaPrediction.distance} km</p>
                  </div>
                  <div className="bg-black p-4 rounded-sm">
                    <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">Estimated Time</p>
                    <p className="text-2xl font-bold text-white">{etaPrediction.estimatedMinutes} min</p>
                  </div>
                  <div className="bg-brand-zinc-50 border border-brand-zinc-200 p-4 rounded-sm">
                    <p className="text-brand-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">Confidence</p>
                    <p className="text-2xl font-bold text-black capitalize">{etaPrediction.confidence}</p>
                  </div>
                </div>
                <p className="text-xs text-brand-zinc-400 mt-3 text-center">
                  Powered by {etaPrediction.model} · Real road distance via Mapbox
                </p>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/user/dashboard')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
                disabled={!etaPrediction}
                className="flex-1"
              >
                Create Shipment
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}