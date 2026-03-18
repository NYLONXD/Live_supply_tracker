import { useEffect, useRef } from 'react';
import Input from './Input';
import { loadGoogleMaps } from '../../utils/googleMaps';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export default function GooglePlacesInput({
  label,
  name,
  value,
  onChange,
  onPlaceSelect,
  placeholder,
  required = false,
  disabled = false,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    let autocomplete;

    loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then((google) => {
        if (!inputRef.current) return;

        autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          fields: ['formatted_address', 'geometry', 'name'],
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          const lat = place.geometry?.location?.lat?.();
          const lng = place.geometry?.location?.lng?.();

          if (lat === undefined || lng === undefined) {
            return;
          }

          onPlaceSelect?.({
            address: place.formatted_address || place.name || '',
            lat,
            lng,
          });
        });
      })
      .catch(() => {
        // Keep manual text entry working if Google Maps fails to load.
      });

    return () => {
      if (autocomplete && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, [onPlaceSelect]);

  return (
    <Input
      ref={inputRef}
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
    />
  );
}
