let googleMapsPromise = null;

export const GOOGLE_MAPS_LIBRARIES = ['places'];

export function loadGoogleMaps(apiKey) {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps can only be loaded in the browser.'));
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google);
  }

  if (!apiKey) {
    return Promise.reject(new Error('Missing Google Maps API key. Set VITE_GOOGLE_MAPS_API_KEY.'));
  }

  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[data-google-maps-loader="true"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(window.google));
        existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps script.')));
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${GOOGLE_MAPS_LIBRARIES.join(',')}`;
      script.async = true;
      script.defer = true;
      script.dataset.googleMapsLoader = 'true';
      script.onload = () => resolve(window.google);
      script.onerror = () => reject(new Error('Failed to load Google Maps script.'));
      document.head.appendChild(script);
    });
  }

  return googleMapsPromise;
}
