export default function Card({ 
  children, 
  className = '', 
  hover = false,
  noPadding = false
}) {
  return (
    <div
      className={`
        bg-white 
        border border-brand-zinc-200 
        ${noPadding ? 'p-0' : 'p-6'}
        ${hover ? 'hover:border-black transition-colors duration-300' : ''}
        rounded-sm
        ${className}
      `}
    >
      {children}
    </div>
  );
}