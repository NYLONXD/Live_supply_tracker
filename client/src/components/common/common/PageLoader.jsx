// client/src/components/common/PageLoader.jsx
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import logoImg from '../../../../src/assets/TrackEdge1.png';

export default function PageLoader() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [fading, setFading]   = useState(false);
  const timerRef = useRef(null);
  const firstRender = useRef(true);

  useEffect(() => {
    // Skip the very first mount (initial page load)
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    // Clear any in-flight timers
    clearTimeout(timerRef.current);
    setFading(false);
    setVisible(true);

    // After 550 ms start fading out
    timerRef.current = setTimeout(() => {
      setFading(true);
      // Remove from DOM after fade completes
      timerRef.current = setTimeout(() => setVisible(false), 300);
    }, 550);

    return () => clearTimeout(timerRef.current);
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
      style={{
        transition: 'opacity 300ms ease',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'all',
      }}
    >
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative flex flex-col items-center gap-5">
        {/* Logo box with pulse ring */}
        <div className="relative">
          {/* Outer pulse ring */}
          <div
            className="absolute inset-0 rounded-sm bg-black"
            style={{ animation: 'loaderRing 1.2s ease-out infinite', transformOrigin: 'center' }}
          />
          {/* Logo */}
          <div className="relative w-16 h-16 bg-black rounded-sm flex items-center justify-center overflow-hidden shadow-xl">
            <img
              src={logoImg}
              alt="Loading"
              className="w-full h-full object-contain p-1.5"
            />
            {/* Scan line sweep */}
            <div
              className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-transparent"
              style={{ animation: 'loaderScan 1.2s linear infinite' }}
            />
          </div>
        </div>

        {/* Dot progress indicator */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-black"
              style={{
                animation: `loaderDot 0.9s ease-in-out ${i * 0.18}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Keyframes injected inline */}
      <style>{`
        @keyframes loaderRing {
          0%   { opacity: 0.6; transform: scale(1); }
          100% { opacity: 0;   transform: scale(1.65); }
        }
        @keyframes loaderScan {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes loaderDot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40%            { transform: scale(1);   opacity: 1;   }
        }
      `}</style>
    </div>
  );
}