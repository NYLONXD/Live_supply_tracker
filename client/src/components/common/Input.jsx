import { forwardRef } from 'react';

const Input = forwardRef(function Input({
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
}, ref) {
  return (
    <div className={`space-y-2 ${containerClassName}`}>
      {label && (
        <label htmlFor={name} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
            <Icon className="h-4 w-4" />
          </div>
        )}

        <input
          ref={ref}
          type={type}
          name={name}
          id={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`
            flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background
            file:border-0 file:bg-transparent file:text-sm file:font-medium
            placeholder:text-muted-foreground
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-50
            transition-colors duration-200
            ${Icon ? 'pl-10' : ''}
            ${error ? 'border-destructive focus-visible:ring-destructive' : ''}
            ${className}
          `}
          {...props}
        />
      </div>

      {error && (
        <p className="text-[13px] font-medium text-destructive">{error}</p>
      )}
    </div>
  );
});

export default Input;
