// client/src/components/common/Loader.jsx
export default function Loader({ 
  size = 'md', 
  text, 
  fullScreen = false,
  color = 'purple' 
}) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const colors = {
    purple: 'border-purple-500',
    blue: 'border-blue-500',
    green: 'border-green-500',
    white: 'border-white',
  };

  const loader = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className={`
          ${sizes[size]}
          border-4
          ${colors[color]}
          border-t-transparent
          rounded-full
          animate-spin
        `}
      />
      {text && (
        <p className="text-slate-400 text-sm animate-pulse">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50">
        {loader}
      </div>
    );
  }

  return loader;
}

// Loading Skeleton Component
export function Skeleton({ className = '', count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-slate-800/50 rounded ${className}`}
        />
      ))}
    </>
  );
}

// Card Skeleton
export function CardSkeleton({ count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 animate-pulse"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-slate-700 rounded-xl" />
            <div className="flex-1">
              <div className="h-4 bg-slate-700 rounded w-1/2 mb-2" />
              <div className="h-3 bg-slate-700 rounded w-1/3" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-slate-700 rounded" />
            <div className="h-3 bg-slate-700 rounded w-5/6" />
          </div>
        </div>
      ))}
    </>
  );
}