// client/src/pages/Admin/CreateShipment.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Package, Route, Phone, UserRound, Map, RotateCcw } from 'lucide-react';
import DashboardLayout from '../../components/common/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import GooglePlacesInput from '../../components/common/GooglePlacesInput';
import { adminAPI, shipmentAPI } from '../../services/api';
import { loadGoogleMaps } from '../../utils/googleMaps';
import useDraft from '../../hooks/useDraft';
import toast from 'react-hot-toast';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const DRAFT_KEY = 'create-shipment-admin';

const emptyLocation = { address: '', lat: null, lng: null };

const INITIAL_FORM = {
  customerName:   '',
  customerPhone:  '',
  pickup:         emptyLocation,
  delivery:       emptyLocation,
  notes:          '',
  selectedDriver: '',
};

// ── Map preview ──────────────────────────────────────────────────────────────
function RouteMapPreview({ pickup, delivery, routeGeometry }) {
  const mapRef         = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeLineRef   = useRef(null);
  const markersRef     = useRef([]);

  const drawMap = useCallback(async () => {
    if (!mapRef.current) return;
    if (!pickup.lat || !delivery.lat) return;

    const google = await loadGoogleMaps(GOOGLE_MAPS_API_KEY).catch(() => null);
    if (!google) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center: { lat: pickup.lat, lng: pickup.lng },
        zoom: 10,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
      });
    }
    const map = mapInstanceRef.current;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    markersRef.current.push(
      new google.maps.Marker({
        map,
        position: { lat: pickup.lat, lng: pickup.lng },
        title: pickup.address,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#16a34a',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
      }),
    );

    markersRef.current.push(
      new google.maps.Marker({
        map,
        position: { lat: delivery.lat, lng: delivery.lng },
        title: delivery.address,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#dc2626',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
      }),
    );

    if (routeLineRef.current) {
      routeLineRef.current.setMap(null);
      routeLineRef.current = null;
    }

    if (routeGeometry?.length) {
      routeLineRef.current = new google.maps.Polyline({
        path: routeGeometry.map(([lng, lat]) => ({ lat, lng })),
        geodesic: true,
        strokeColor: '#111111',
        strokeOpacity: 0.9,
        strokeWeight: 4,
      });
      routeLineRef.current.setMap(map);

      const bounds = new google.maps.LatLngBounds();
      routeGeometry.forEach(([lng, lat]) => bounds.extend({ lat, lng }));
      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    } else {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: pickup.lat, lng: pickup.lng });
      bounds.extend({ lat: delivery.lat, lng: delivery.lng });
      map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    }
  }, [pickup, delivery, routeGeometry]);

  const prevKey = useRef('');
  const key = `${pickup.lat},${pickup.lng}|${delivery.lat},${delivery.lng}|${routeGeometry?.length ?? 0}`;
  if (key !== prevKey.current) {
    prevKey.current = key;
    setTimeout(drawMap, 0);
  }

  const bothSelected = pickup.lat && delivery.lat;
  if (!bothSelected) return null;

  return (
    <div className="mt-4 rounded-sm border border-brand-zinc-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-brand-zinc-50 border-b border-brand-zinc-200">
        <Map size={14} className="text-brand-zinc-500" />
        <span className="text-xs font-bold uppercase tracking-wider text-brand-zinc-500">
          {routeGeometry?.length ? 'Calculated Route' : 'Location Preview'}
        </span>
        <div className="ml-auto flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-brand-zinc-500">
            <span className="w-2 h-2 rounded-full bg-green-600 inline-block" />Pickup
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-brand-zinc-500">
            <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />Delivery
          </span>
        </div>
      </div>
      <div ref={mapRef} className="w-full h-64" />
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function AdminCreateShipment() {
  const navigate = useNavigate();
  const { draft, restored, saveDraft, clearDraft } = useDraft(DRAFT_KEY);

  const [loading,       setLoading]       = useState(false);
  const [estimating,    setEstimating]    = useState(false);
  const [drivers,       setDrivers]       = useState([]);
  const [driversLoaded, setDriversLoaded] = useState(false);
  const [routeDetails,  setRouteDetails]  = useState(null);
  const [draftBanner,   setDraftBanner]   = useState(false);

  const [formData, setFormData] = useState(INITIAL_FORM);

  // ── Restore draft once IndexedDB has been read ───────────────────────────
  useEffect(() => {
    if (!restored) return;
    if (draft) {
      setFormData(draft.formData ?? INITIAL_FORM);
      if (draft.routeDetails) setRouteDetails(draft.routeDetails);
      setDraftBanner(true);
    }
  }, [restored]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-save on every change ─────────────────────────────────────────────
  useEffect(() => {
    if (!restored) return; // don't save before we've loaded
    saveDraft({ formData, routeDetails });
  }, [formData, routeDetails]); // eslint-disable-line react-hooks/exhaustive-deps

  const discardDraft = () => {
    clearDraft();
    setFormData(INITIAL_FORM);
    setRouteDetails(null);
    setDraftBanner(false);
    toast('Draft cleared');
  };

  // ── Field handlers ────────────────────────────────────────────────────────
  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressText = useCallback(
    (field) => (e) => {
      const newAddress = e.target.value;
      setRouteDetails(null);
      setFormData((prev) => {
        const current = prev[field];
        const coordsInvalid = newAddress !== current.address;
        return {
          ...prev,
          [field]: {
            address: newAddress,
            lat: coordsInvalid ? null : current.lat,
            lng: coordsInvalid ? null : current.lng,
          },
        };
      });
    },
    [],
  );

  const handlePickupSelect = useCallback((place) => {
    setRouteDetails(null);
    setFormData((prev) => ({ ...prev, pickup: place }));
  }, []);

  const handleDeliverySelect = useCallback((place) => {
    setRouteDetails(null);
    setFormData((prev) => ({ ...prev, delivery: place }));
  }, []);

  // ── Route calculation ─────────────────────────────────────────────────────
  const canEstimate = useMemo(
    () => formData.pickup.lat !== null && formData.delivery.lat !== null,
    [formData.pickup.lat, formData.delivery.lat],
  );

  const calculateRoute = async () => {
    if (!canEstimate) {
      toast.error('Select both pickup and delivery from the dropdown suggestions first');
      return;
    }
    setEstimating(true);
    try {
      const google = await loadGoogleMaps(GOOGLE_MAPS_API_KEY);
      const ds = new google.maps.DirectionsService();
      const result = await ds.route({
        origin:      { lat: formData.pickup.lat,   lng: formData.pickup.lng   },
        destination: { lat: formData.delivery.lat, lng: formData.delivery.lng },
        travelMode:  google.maps.TravelMode.DRIVING,
      });
      const route = result.routes[0];
      const leg   = route.legs[0];
      const details = {
        distanceKm:      Number((leg.distance.value / 1000).toFixed(2)),
        durationMinutes: Math.ceil(leg.duration.value / 60),
        routeGeometry:   route.overview_path.map((p) => [p.lng(), p.lat()]),
      };
      setRouteDetails(details);
      toast.success('Route calculated');
      fetchDrivers();
    } catch (error) {
      toast.error(error.message || 'Failed to calculate route');
    } finally {
      setEstimating(false);
    }
  };

  // ── Drivers ───────────────────────────────────────────────────────────────
  const fetchDrivers = async () => {
    if (driversLoaded) return;
    try {
      const { data } = await adminAPI.getAllDrivers();
      setDrivers(data);
      setDriversLoaded(true);
    } catch {
      toast.error('Failed to load drivers');
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
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
        customerName:     formData.customerName.trim(),
        customerPhone:    formData.customerPhone.trim(),
        from:             formData.pickup.address,
        to:               formData.delivery.address,
        fromLat:          formData.pickup.lat,
        fromLng:          formData.pickup.lng,
        toLat:            formData.delivery.lat,
        toLng:            formData.delivery.lng,
        notes:            formData.notes.trim(),
        distance:         routeDetails.distanceKm,
        estimatedMinutes: routeDetails.durationMinutes,
        routeGeometry:    routeDetails.routeGeometry,
      });
      if (formData.selectedDriver) {
        await adminAPI.assignDriver(shipment._id, formData.selectedDriver);
      }
      clearDraft(); // wipe IndexedDB draft on success
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

        {/* Draft restored banner */}
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

        <Card variant="elevated">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Customer Info */}
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

            {/* Location Inputs */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <GooglePlacesInput
                  label="Pickup Address"
                  name="pickup"
                  value={formData.pickup.address}
                  onChange={handleAddressText('pickup')}
                  onPlaceSelect={handlePickupSelect}
                  placeholder="Search pickup location"
                  required
                />
                {formData.pickup.lat && (
                  <p className="mt-1.5 text-[10px] font-medium text-green-600 flex items-center gap-1">
                    <MapPin size={10} /> Location confirmed
                  </p>
                )}
              </div>

              <div>
                <GooglePlacesInput
                  label="Delivery Address"
                  name="delivery"
                  value={formData.delivery.address}
                  onChange={handleAddressText('delivery')}
                  onPlaceSelect={handleDeliverySelect}
                  placeholder="Search delivery location"
                  required
                />
                {formData.delivery.lat && (
                  <p className="mt-1.5 text-[10px] font-medium text-green-600 flex items-center gap-1">
                    <MapPin size={10} /> Location confirmed
                  </p>
                )}
              </div>
            </div>

            {/* Map Preview */}
            <RouteMapPreview
              pickup={formData.pickup}
              delivery={formData.delivery}
              routeGeometry={routeDetails?.routeGeometry ?? null}
            />

            {/* Notes */}
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

            {/* Route Summary */}
            <Card className="border-dashed">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-black">
                    <Route size={18} /> Google route summary
                  </h3>
                  <p className="mt-1 text-sm text-brand-zinc-500">
                    {canEstimate
                      ? 'Both locations confirmed — ready to calculate.'
                      : 'Select both locations from the suggestions above.'}
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

            {/* Driver assignment */}
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
                    {driver.displayName}{driver.vehicleInfo ? ` • ${driver.vehicleInfo}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 border-t border-brand-zinc-200 pt-6 sm:flex-row">
              <Button
                type="button"
                variant="ghost"
                className="sm:flex-1"
                onClick={() => navigate('/admin/shipments')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="sm:flex-1"
                loading={loading}
                disabled={!routeDetails}
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