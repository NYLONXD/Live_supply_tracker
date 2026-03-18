import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Package, Route, Phone, UserRound } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import GooglePlacesInput from '../../components/common/GooglePlacesInput';
import { adminAPI, shipmentAPI } from '../../services/api';
import { loadGoogleMaps } from '../../utils/googleMaps';
import toast from 'react-hot-toast';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const emptyLocation = { address: '', lat: null, lng: null };

export default function AdminCreateShipment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [driversLoaded, setDriversLoaded] = useState(false);
  const [routeDetails, setRouteDetails] = useState(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    pickup: emptyLocation,
    delivery: emptyLocation,
    notes: '',
    selectedDriver: '',
  });

  const canEstimate = useMemo(
    () => formData.pickup.lat !== null && formData.delivery.lat !== null,
    [formData.pickup, formData.delivery]
  );

  const handleTextChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationTextChange = (field) => (event) => {
    const { value } = event.target;
    setRouteDetails(null);
    setFormData((prev) => ({
      ...prev,
      [field]: { address: value, lat: null, lng: null },
    }));
  };

  const handlePlaceSelect = (field) => (place) => {
    setRouteDetails(null);
    setFormData((prev) => ({
      ...prev,
      [field]: place,
    }));
  };

  const fetchDrivers = async () => {
    if (driversLoaded) return;
    try {
      const { data } = await adminAPI.getAllDrivers();
      setDrivers(data);
      setDriversLoaded(true);
    } catch (error) {
      toast.error('Failed to load drivers');
    }
  };

  const calculateRoute = async () => {
    if (!canEstimate) {
      toast.error('Select both pickup and delivery from Google suggestions first');
      return;
    }

    setEstimating(true);
    try {
      const google = await loadGoogleMaps(GOOGLE_MAPS_API_KEY);
      const directionsService = new google.maps.DirectionsService();

      const result = await directionsService.route({
        origin: { lat: formData.pickup.lat, lng: formData.pickup.lng },
        destination: { lat: formData.delivery.lat, lng: formData.delivery.lng },
        travelMode: google.maps.TravelMode.DRIVING,
      });

      const route = result.routes[0];
      const leg = route.legs[0];

      setRouteDetails({
        distanceKm: Number((leg.distance.value / 1000).toFixed(2)),
        durationMinutes: Math.ceil(leg.duration.value / 60),
        routeGeometry: route.overview_path.map((point) => [point.lng(), point.lat()]),
      });

      toast.success('Distance and ETA calculated with Google Maps');
      fetchDrivers();
    } catch (error) {
      toast.error(error.message || 'Failed to calculate route');
    } finally {
      setEstimating(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!routeDetails) {
      toast.error('Please calculate the route before creating the shipment');
      return;
    }

    if (!formData.customerName.trim()) {
      toast.error('Customer name is required');
      return;
    }

    setLoading(true);
    try {
      const { data: shipment } = await shipmentAPI.create({
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        from: formData.pickup.address,
        to: formData.delivery.address,
        fromLat: formData.pickup.lat,
        fromLng: formData.pickup.lng,
        toLat: formData.delivery.lat,
        toLng: formData.delivery.lng,
        notes: formData.notes.trim(),
        distance: routeDetails.distanceKm,
        estimatedMinutes: routeDetails.durationMinutes,
        routeGeometry: routeDetails.routeGeometry,
      });

      if (formData.selectedDriver) {
        await adminAPI.assignDriver(shipment._id, formData.selectedDriver);
      }

      toast.success('Shipment created successfully');
      navigate('/admin/shipments');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create shipment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Create Shipment">
      <div className="mx-auto max-w-4xl">
        <Card variant="elevated">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Customer Name"
                name="customerName"
                value={formData.customerName}
                onChange={handleTextChange}
                placeholder="Business or customer name"
                required
                icon={UserRound}
              />

              <Input
                label="Customer Phone"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleTextChange}
                placeholder="Optional contact number"
                icon={Phone}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <GooglePlacesInput
                label="Pickup Address"
                name="pickup"
                value={formData.pickup.address}
                onChange={handleLocationTextChange('pickup')}
                onPlaceSelect={handlePlaceSelect('pickup')}
                placeholder="Search pickup location"
                required
              />

              <GooglePlacesInput
                label="Delivery Address"
                name="delivery"
                value={formData.delivery.address}
                onChange={handleLocationTextChange('delivery')}
                onPlaceSelect={handlePlaceSelect('delivery')}
                placeholder="Search delivery location"
                required
              />
            </div>

            <div>
              <label htmlFor="notes" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-brand-zinc-500">
                Shipment Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleTextChange}
                placeholder="Package details, cash on delivery notes, special handling, etc."
                className="w-full rounded-sm border border-brand-zinc-200 bg-white px-4 py-2.5 text-black placeholder-brand-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <Card className="border-dashed">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-black">
                    <Route size={18} />
                    Google route summary
                  </h3>
                  <p className="mt-1 text-sm text-brand-zinc-500">
                    Calculate distance and ETA before saving the shipment.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={calculateRoute}
                  loading={estimating}
                  disabled={!canEstimate}
                  icon={MapPin}
                >
                  Calculate Route
                </Button>
              </div>

              {routeDetails && (
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div className="rounded-sm border border-brand-zinc-200 bg-brand-zinc-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-zinc-500">Distance</p>
                    <p className="mt-2 text-2xl font-bold text-black">{routeDetails.distanceKm} km</p>
                  </div>
                  <div className="rounded-sm border border-brand-zinc-200 bg-brand-zinc-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-zinc-500">ETA</p>
                    <p className="mt-2 text-2xl font-bold text-black">{routeDetails.durationMinutes} min</p>
                  </div>
                  <div className="rounded-sm border border-brand-zinc-200 bg-brand-zinc-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-zinc-500">Route points</p>
                    <p className="mt-2 text-2xl font-bold text-black">{routeDetails.routeGeometry.length}</p>
                  </div>
                </div>
              )}
            </Card>

            <div>
              <label htmlFor="selectedDriver" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-brand-zinc-500">
                Assign Driver
              </label>
              <select
                id="selectedDriver"
                name="selectedDriver"
                value={formData.selectedDriver}
                onChange={handleTextChange}
                onFocus={fetchDrivers}
                className="w-full rounded-sm border border-brand-zinc-200 bg-white px-4 py-2.5 text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              >
                <option value="">Create as unassigned</option>
                {drivers.map((driver) => (
                  <option key={driver._id} value={driver._id}>
                    {driver.displayName} {driver.vehicleInfo ? `• ${driver.vehicleInfo}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-3 border-t border-brand-zinc-200 pt-6 sm:flex-row">
              <Button type="button" variant="ghost" className="sm:flex-1" onClick={() => navigate('/admin/shipments')}>
                Cancel
              </Button>
              <Button type="submit" className="sm:flex-1" loading={loading} disabled={!routeDetails}>
                Create Shipment
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
