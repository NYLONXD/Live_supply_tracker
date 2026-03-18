import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../../utils/googleMaps';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export default function GoogleShipmentMap({ shipment, currentLocation, className = '' }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const routeRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!shipment?.delivery?.lat || !shipment?.delivery?.lng) return;

    let cancelled = false;

    loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then((google) => {
        if (cancelled || !mapRef.current) return;

        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new google.maps.Map(mapRef.current, {
            center: { lat: shipment.delivery.lat, lng: shipment.delivery.lng },
            zoom: 10,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          });
        }

        const map = mapInstanceRef.current;

        if (destinationMarkerRef.current) destinationMarkerRef.current.setMap(null);
        destinationMarkerRef.current = new google.maps.Marker({
          map,
          position: { lat: shipment.delivery.lat, lng: shipment.delivery.lng },
          title: shipment.to,
        });

        if (routeRef.current) {
          routeRef.current.setMap(null);
        }

        if (shipment.routeGeometry?.length) {
          routeRef.current = new google.maps.Polyline({
            path: shipment.routeGeometry.map(([lng, lat]) => ({ lat, lng })),
            geodesic: true,
            strokeColor: '#111111',
            strokeOpacity: 0.9,
            strokeWeight: 4,
          });
          routeRef.current.setMap(map);

          const bounds = new google.maps.LatLngBounds();
          shipment.routeGeometry.forEach(([lng, lat]) => bounds.extend({ lat, lng }));
          map.fitBounds(bounds);
        } else {
          map.setCenter({ lat: shipment.delivery.lat, lng: shipment.delivery.lng });
        }

        setError('');
      })
      .catch((err) => {
        setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [shipment]);

  useEffect(() => {
    if (!currentLocation || !mapInstanceRef.current || !window.google?.maps) return;

    const map = mapInstanceRef.current;

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setMap(null);
    }

    driverMarkerRef.current = new window.google.maps.Marker({
      map,
      position: currentLocation,
      title: 'Driver location',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#16a34a',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      },
    });

    map.panTo(currentLocation);
  }, [currentLocation]);

  if (error) {
    return (
      <div className={`flex h-full min-h-[320px] items-center justify-center rounded-sm border border-zinc-200 bg-zinc-50 p-6 text-center text-sm text-zinc-500 ${className}`}>
        {error}
      </div>
    );
  }

  return <div ref={mapRef} className={`h-full min-h-[320px] w-full rounded-sm ${className}`} />;
}
