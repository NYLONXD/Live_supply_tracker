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
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed border';

  const variants = {
    primary: 'bg-black text-white border-black hover:bg-zinc-800 hover:border-zinc-800',
    secondary: 'bg-white text-black border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300',
    outline: 'bg-transparent text-black border-black hover:bg-black hover:text-white',
    ghost: 'bg-transparent text-zinc-600 border-transparent hover:text-black hover:bg-zinc-100',
    danger: 'bg-white text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300',
    success: 'bg-zinc-900 text-white border-zinc-900',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className} rounded-sm`}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Processing...
        </>
      ) : (
        <>
          {Icon && <Icon size={16} className="mr-2" />}
          {children}
        </>
      )}
    </button>
  );
}