export default function Input({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  icon: Icon,
  className = '',
  containerClassName = '',
  ...props
}) {
  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={name} className="block text-xs font-semibold uppercase tracking-wider text-brand-zinc-500 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-brand-zinc-400" />
          </div>
        )}

        <input
          type={type}
          name={name}
          id={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`
            w-full
            ${Icon ? 'pl-10' : 'pl-4'}
            pr-4 py-2.5
            bg-white
            border border-brand-zinc-200
            text-black
            placeholder-brand-zinc-400
            focus:outline-none
            focus:ring-1 focus:ring-black focus:border-black
            disabled:bg-brand-zinc-50 disabled:text-brand-zinc-400
            transition-all duration-200
            rounded-sm
            ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
}