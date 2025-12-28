// client/src/components/common/Card.jsx - MODERNIZED VERSION

export default function Card({ 
  children, 
  className = '', 
  hover = false,
  gradient = false, // Legacy prop - now ignored
  noPadding = false,
  variant = 'default' // new: 'default', 'bordered', 'elevated', 'dark'
}) {
  const variants = {
    default: 'bg-white border border-brand-zinc-200',
    bordered: 'bg-white border-2 border-black',
    elevated: 'bg-white border border-brand-zinc-200 shadow-lg shadow-brand-zinc-200/50',
    dark: 'bg-black text-white border border-brand-zinc-800',
  };

  return (
    <div
      className={`
        ${variants[variant]}
        ${noPadding ? 'p-0' : 'p-6'}
        ${hover ? 'hover:border-black transition-all duration-300 cursor-pointer' : ''}
        rounded-sm
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// New: Specialized Card Components

export function StatCard({ icon: Icon, label, value, trend, variant = 'default' }) {
  const isPositive = trend?.startsWith('+');
  
  return (
    <Card 
      variant={variant} 
      hover 
      className="relative overflow-hidden group"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-zinc-50 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-300" />
      
      <div className="relative">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2.5 ${variant === 'dark' ? 'bg-white/10' : 'bg-brand-zinc-100'} rounded-sm`}>
            <Icon size={20} className={variant === 'dark' ? 'text-white' : 'text-black'} />
          </div>
          {trend && (
            <span className={`text-[10px] font-bold px-2 py-1 rounded-sm ${
              isPositive 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {trend}
            </span>
          )}
        </div>
        
        <div className="text-3xl font-bold tracking-tighter mb-1">{value}</div>
        <div className={`text-xs font-bold uppercase tracking-wider ${
          variant === 'dark' ? 'text-brand-zinc-500' : 'text-brand-zinc-400'
        }`}>
          {label}
        </div>
      </div>
    </Card>
  );
}

export function InfoCard({ title, children, icon: Icon, action }) {
  return (
    <Card hover>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 bg-black text-white rounded-sm">
              <Icon size={18} />
            </div>
          )}
          <h3 className="font-bold tracking-tight">{title}</h3>
        </div>
        {action}
      </div>
      <div className="text-sm text-brand-zinc-600 leading-relaxed">
        {children}
      </div>
    </Card>
  );
}