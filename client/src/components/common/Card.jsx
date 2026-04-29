// client/src/components/common/Card.jsx

import React from 'react';

export default function Card({ 
  children, 
  className = '', 
  hover = false,
  noPadding = false,
  variant = 'default', // 'default', 'glass', 'outline'
  onClick
}) {
  const variants = {
    default: 'bg-card text-card-foreground shadow-sm border border-border',
    glass: 'glass',
    glassDark: 'glass-dark text-white',
    outline: 'bg-transparent border border-border',
  };

  return (
    <div
      onClick={onClick}
      className={`
        rounded-xl
        ${variants[variant] || variants.default}
        ${noPadding ? '' : 'p-6'}
        ${hover ? 'hover:shadow-md hover:border-ring/50 transition-all duration-300 cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, trend, variant = 'default' }) {
  const isPositive = trend?.startsWith('+');
  
  return (
    <Card 
      variant={variant} 
      hover 
      className="relative overflow-hidden group"
    >
      {/* Decorative gradient orb */}
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500" />
      
      <div className="relative z-10 flex flex-row items-center justify-between pb-2">
        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">
          {label}
        </h3>
        <Icon size={16} className="text-muted-foreground" />
      </div>
      
      <div className="relative z-10">
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className={`text-xs mt-1 ${isPositive ? 'text-green-500' : 'text-destructive'}`}>
            {trend} from last month
          </p>
        )}
      </div>
    </Card>
  );
}

export function InfoCard({ title, children, icon: Icon, action, variant="default" }) {
  return (
    <Card hover variant={variant}>
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={18} className="text-primary" />}
          <h3 className="font-semibold leading-none tracking-tight">{title}</h3>
        </div>
        {action}
      </div>
      <div className="text-sm text-muted-foreground mt-4">
        {children}
      </div>
    </Card>
  );
}