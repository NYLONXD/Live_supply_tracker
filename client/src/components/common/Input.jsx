// client/src/components/common/Input.jsx
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
        <label
          htmlFor={name}
          className="block text-sm font-medium text-slate-300 mb-2"
        >
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-slate-500" />
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
            bg-slate-800/50
            border border-slate-700
            rounded-lg
            text-slate-100
            placeholder-slate-500
            focus:outline-none
            focus:ring-2
            focus:ring-purple-500
            focus:border-transparent
            disabled:opacity-50
            disabled:cursor-not-allowed
            transition-all
            duration-200
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
          {...props}
        />
      </div>

      {error && (
        <p className="mt-1.5 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}