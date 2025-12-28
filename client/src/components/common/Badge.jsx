// client/src/components/common/Badge.jsx - NEW FILE

export default function Badge({ 
  children, 
  variant = 'default',
  size = 'md',
  className = '' 
}) {
  const variants = {
    default: 'bg-brand-zinc-100 text-brand-zinc-700 border-brand-zinc-200',
    primary: 'bg-black text-white border-black',
    success: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    danger: 'bg-red-100 text-red-700 border-red-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1
        font-bold uppercase tracking-wider
        rounded-sm border
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

// Status Badge with dot indicator
export function StatusBadge({ status, size = 'md' }) {
  const statusConfig = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
    assigned: { label: 'Assigned', color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
    picked_up: { label: 'Picked Up', color: 'bg-cyan-100 text-cyan-700 border-cyan-200', dot: 'bg-cyan-500' },
    in_transit: { label: 'In Transit', color: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500 animate-pulse' },
    delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500' },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-sm border ${config.color} ${sizes[size]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}