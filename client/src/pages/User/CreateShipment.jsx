import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Package, Clock } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { shipmentAPI, aiAPI } from '../../services/api';
import toast from 'react-hot-toast';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export default function CreateShipment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [etaPrediction, setEtaPrediction] = useState(null);
  const [coords, setCoords] = useState(null); // store resolved coords separately
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    vehicleType: 'Car',
    weather: 'Clear',
    notes: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setEtaPrediction(null);
    setCoords(null);
  };

  // Real Mapbox Geocoding API
  const geocodeLocation = async (location) => {
    const encoded = encodeURIComponent(location);
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=IN`
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
        toLat: toCoords.lat,
        toLng: toCoords.lng,
        vehicleType: formData.vehicleType,
        weather: formData.weather,
      });

      setEtaPrediction({
        distance: data.distance.toFixed(1),
        estimatedMinutes: Math.round(data.estimatedMinutes),
        confidence: data.confidence,
        model: data.model || 'AI',
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
        from: formData.from,
        to: formData.to,
        fromLat: coords.fromCoords.lat,
        fromLng: coords.fromCoords.lng,
        toLat: coords.toCoords.lat,
        toLng: coords.toCoords.lng,
        vehicleType: formData.vehicleType,
        weather: formData.weather,
        notes: formData.notes,
      });

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
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Locations */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <MapPin size={20} className="text-purple-400" />
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
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Package size={20} className="text-purple-400" />
                Shipment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Vehicle Type</label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Car">Car</option>
                    <option value="Bike">Bike</option>
                    <option value="Truck">Truck</option>
                    <option value="Van">Van</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Weather</label>
                  <select
                    name="weather"
                    value={formData.weather}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Clear">Clear</option>
                    <option value="Rainy">Rainy</option>
                    <option value="Foggy">Foggy</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Any special instructions..."
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              <Card gradient className="animate-slideUp">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-green-400" />
                  AI ETA Prediction
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-900/50 p-4 rounded-lg">
                    <p className="text-slate-400 text-sm mb-1">Road Distance</p>
                    <p className="text-2xl font-bold text-white">{etaPrediction.distance} km</p>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-lg">
                    <p className="text-slate-400 text-sm mb-1">Estimated Time</p>
                    <p className="text-2xl font-bold text-purple-400">{etaPrediction.estimatedMinutes} min</p>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-lg">
                    <p className="text-slate-400 text-sm mb-1">Confidence</p>
                    <p className="text-2xl font-bold text-green-400 capitalize">{etaPrediction.confidence}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3 text-center">
                  Powered by {etaPrediction.model} · Real road distance via Mapbox
                </p>
              </Card>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="ghost" onClick={() => navigate('/user/dashboard')} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" loading={loading} disabled={!etaPrediction} className="flex-1">
                Create Shipment
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}