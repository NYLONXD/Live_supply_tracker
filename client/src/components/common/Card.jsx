export default function Card({ 
  children, 
  className = '', 
  hover = false,
  gradient = false 
}) {
  return (
    <div
      className={`
        bg-slate-800/50 
        backdrop-blur-sm 
        border border-slate-700 
        rounded-xl 
        p-6
        ${hover ? 'hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300' : ''}
        ${gradient ? 'from-purple-900/20 to-pink-900/20' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}