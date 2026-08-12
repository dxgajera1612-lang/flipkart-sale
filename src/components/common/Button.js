// components/common/Button.js
export default function Button({ 
  children, 
  onClick, 
  type = 'button', 
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
  icon: Icon,
}) {
  const baseClasses = 'btn inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    success: 'btn-success',
  };
  
  const sizeClasses = {
    sm: 'btn-sm',
    md: 'px-4 py-2',
    lg: 'btn-lg',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading && (
        <div className="spinner w-4 h-4 mr-2 border-2"></div>
      )}
      {!loading && Icon && <Icon className="mr-2" size={18} />}
      {children}
    </button>
  );
}
