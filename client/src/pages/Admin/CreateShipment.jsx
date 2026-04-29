// client/src/pages/Admin/CreateShipment.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Package, Route, Phone, UserRound, Map, RotateCcw, Hexagon, Crosshair } from 'lucide-react';
import { formatETA } from '../../utils/formatTime';
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
        styles: [
          { elementType: "geometry", stylers: [{ color: "#212121" }] },
          { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
          { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
          { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
          { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
          { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
          { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
          { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#181818" }] },
          { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
          { featureType: "poi.park", elementType: "labels.text.stroke", stylers: [{ color: "#1b1b1b" }] },
          { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
          { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
          { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#373737" }] },
          { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3c3c3c" }] },
          { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#4e4e4e" }] },
          { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
          { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
          { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d3d3d" }] }
        ]
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
          fillColor: '#00ff66',
          fillOpacity: 1,
          strokeColor: '#000',
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
          fillColor: '#ff003c',
          fillOpacity: 1,
          strokeColor: '#000',
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
        strokeColor: '#00f0ff',
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
    <div className="mt-6 rounded-xl border border-white/10 overflow-hidden shadow-2xl relative">
      <div className="absolute top-0 right-0 p-2 z-10 pointer-events-none opacity-50">
        <Crosshair size={40} className="text-neon-blue" />
      </div>
      <div className="flex items-center gap-2 px-4 py-3 bg-black/60 border-b border-white/10 backdrop-blur-md">
        <Map size={14} className="text-neon-blue" />
        <span className="text-xs font-bold uppercase tracking-widest text-white">
          {routeGeometry?.length ? 'Calculated Route' : 'Location Preview'}
        </span>
        <div className="ml-auto flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-neon-green inline-block shadow-[0_0_8px_rgba(0,255,102,0.8)]" />Pickup
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-neon-pink inline-block shadow-[0_0_8px_rgba(255,0,60,0.8)]" />Delivery
          </span>
        </div>
      </div>
      <div ref={mapRef} className="w-full h-72" />
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
      <div className="mx-auto max-w-4xl relative z-10 animate-modern-fade">

        {/* Draft restored banner */}
        {draftBanner && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-neon-blue/30 bg-neon-blue/5 px-4 py-3 text-sm shadow-[0_0_15px_rgba(0,240,255,0.1)]">
            <span className="text-neon-blue font-bold tracking-wide flex items-center gap-2">
              <RotateCcw size={16} /> Draft restored. Continue where you left off.
            </span>
            <button
              type="button"
              onClick={discardDraft}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-white font-bold text-[10px] uppercase tracking-widest transition-colors"
            >
              Discard
            </button>
          </div>
        )}

        <div className="glass-dark border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-green via-neon-blue to-neon-purple" />
          
          {/* Header Section */}
          <div className="relative overflow-hidden bg-black/40 px-8 py-10 border-b border-white/10">
            <div className="absolute top-1/2 right-10 -translate-y-1/2 opacity-10 pointer-events-none">
              <Package size={140} className="text-neon-blue" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/10">
                <Hexagon size={24} className="text-white" />
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">New Shipment</h2>
              <p className="text-muted-foreground text-sm max-w-lg">
                Enter logistics details to deploy a new tracking instance to the global node network.
              </p>
            </div>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Customer Info */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4 flex items-center gap-2">
                  <UserRound size={14} className="text-neon-blue" /> Client Intel
                </h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <Input
                    label="Customer Name"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleTextChange}
                    placeholder="Business or customer name"
                    required
                    icon={UserRound}
                    className="bg-black/50 border-white/10 focus-visible:ring-neon-blue text-white"
                  />
                  <Input
                    label="Customer Phone"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleTextChange}
                    placeholder="Optional contact number"
                    icon={Phone}
                    className="bg-black/50 border-white/10 focus-visible:ring-neon-blue text-white"
                  />
                </div>
              </div>

              <div className="h-px w-full bg-white/5" />

              {/* Location Inputs */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4 flex items-center gap-2">
                  <MapPin size={14} className="text-neon-green" /> Trajectory Vectors
                </h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <GooglePlacesInput
                      label="Origin / Pickup Address"
                      name="pickup"
                      value={formData.pickup.address}
                      onChange={handleAddressText('pickup')}
                      onPlaceSelect={handlePickupSelect}
                      placeholder="Search origin location"
                      required
                    />
                    {formData.pickup.lat && (
                      <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-neon-green flex items-center gap-1">
                        <MapPin size={12} /> Origin Locked
                      </p>
                    )}
                  </div>

                  <div>
                    <GooglePlacesInput
                      label="Destination / Delivery Address"
                      name="delivery"
                      value={formData.delivery.address}
                      onChange={handleAddressText('delivery')}
                      onPlaceSelect={handleDeliverySelect}
                      placeholder="Search destination location"
                      required
                    />
                    {formData.delivery.lat && (
                      <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-neon-pink flex items-center gap-1">
                        <MapPin size={12} /> Destination Locked
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
              </div>

              {/* Route Summary (Glass Card inside Form) */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 relative overflow-hidden group">
                {/* Subtle highlight effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between relative z-10">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white">
                      <Route size={16} className="text-neon-blue" /> Telemetry Calculation
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {canEstimate
                        ? 'Nodes acquired. Ready for route synthesis.'
                        : 'Awaiting complete trajectory vectors.'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={calculateRoute}
                    loading={estimating}
                    disabled={!canEstimate}
                    variant={canEstimate ? 'neon' : 'outline'}
                    className={!canEstimate ? 'border-white/20 text-muted-foreground' : ''}
                    icon={Route}
                  >
                    Synthesize Route
                  </Button>
                </div>

                {routeDetails && (
                  <div className="mt-6 grid gap-4 md:grid-cols-3 relative z-10">
                    <div className="rounded-lg border border-white/10 bg-black/40 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Distance</p>
                      <p className="mt-1 text-2xl font-black text-white tracking-tighter">{routeDetails.distanceKm} <span className="text-sm font-normal text-muted-foreground">km</span></p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/40 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Est. Duration</p>
                      <p className="mt-1 text-2xl font-black text-neon-green tracking-tighter">{formatETA(routeDetails.durationMinutes)}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/40 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Waypoints</p>
                      <p className="mt-1 text-2xl font-black text-white tracking-tighter">{routeDetails.routeGeometry.length}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="h-px w-full bg-white/5" />

              {/* Notes & Assignment */}
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="notes" className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Package size={14} className="text-white" /> Operational Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={5}
                    value={formData.notes}
                    onChange={handleTextChange}
                    placeholder="Package details, special handling..."
                    className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white placeholder-zinc-600 focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue transition-colors resize-none"
                  />
                </div>

                <div>
                  <label htmlFor="selectedDriver" className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Crosshair size={14} className="text-neon-pink" /> Fleet Assignment
                  </label>
                  <select
                    id="selectedDriver"
                    name="selectedDriver"
                    value={formData.selectedDriver}
                    onChange={handleTextChange}
                    onFocus={fetchDrivers}
                    className="w-full rounded-lg border border-white/10 bg-black/50 px-4 py-3 text-white focus:border-neon-blue focus:outline-none focus:ring-1 focus:ring-neon-blue transition-colors appearance-none"
                  >
                    <option value="" className="text-zinc-500">Unassigned (Open Pool)</option>
                    {drivers.map((driver) => (
                      <option key={driver._id} value={driver._id}>
                        {driver.displayName}{driver.vehicleInfo ? ` • ${driver.vehicleInfo}` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-muted-foreground">Select an operator to dispatch immediately, or leave unassigned to enter the general queue.</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 border-t border-white/10 pt-8 sm:flex-row mt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="sm:flex-1 border-white/20 text-white hover:bg-white/10"
                  onClick={() => navigate('/admin/shipments')}
                >
                  Abort
                </Button>
                <Button
                  type="submit"
                  className="sm:flex-1 bg-white text-black hover:bg-zinc-200"
                  loading={loading}
                  disabled={!routeDetails}
                  size="lg"
                >
                  Deploy Shipment
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}