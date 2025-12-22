// client/src/components/common/Button.jsx
export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  icon: Icon,
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20 focus:ring-purple-500',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-white focus:ring-slate-500',
    outline: 'border-2 border-purple-600 text-purple-400 hover:bg-purple-600/10 focus:ring-purple-500',
    ghost: 'text-slate-400 hover:text-white hover:bg-slate-800 focus:ring-slate-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 focus:ring-red-500',
    success: 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20 focus:ring-green-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </>
      ) : (
        <>
          {Icon && <Icon size={18} className="mr-2" />}
          {children}
        </>
      )}
    </button>
  );
}