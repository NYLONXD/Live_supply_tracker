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
  const inputRef       = useRef(null);
  const autocompleteRef = useRef(null);

  // ── Keep a stable ref to the callback so the autocomplete listener
  //    never needs to be torn down / re-created when the parent re-renders.
  const onPlaceSelectRef = useRef(onPlaceSelect);
  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect;
  }, [onPlaceSelect]);

  // ── Mount autocomplete exactly ONCE ───────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then((google) => {
        if (cancelled || !inputRef.current) return;

        const ac = new google.maps.places.Autocomplete(inputRef.current, {
          fields: ['formatted_address', 'geometry', 'name'],
        });

        autocompleteRef.current = ac;

        ac.addListener('place_changed', () => {
          const place = ac.getPlace();
          const lat   = place.geometry?.location?.lat?.();
          const lng   = place.geometry?.location?.lng?.();

          if (lat === undefined || lng === undefined) return;

          const address = place.formatted_address || place.name || '';

          // Fire the parent's onPlaceSelect via the stable ref
          onPlaceSelectRef.current?.({ address, lat, lng });
        });
      })
      .catch(() => {
        // Google Maps failed to load — manual text entry still works.
      });

    return () => {
      cancelled = true;
      // Clean up listener when the input unmounts (not on every render)
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, []); 

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