export default function Button({
  children, variant = 'primary', size = 'md',
  className = '', loading = false, ...props
}) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-[#c9a84c] hover:bg-[#e8c96d] text-[#0d1b2a]',
    secondary: 'bg-[#2d5a8e] hover:bg-[#3a6fa8] text-white',
    outline: 'border border-[#2d5a8e] text-gray-300 hover:bg-[#2d5a8e]/20 hover:text-white',
    ghost: 'text-gray-300 hover:bg-white/5 hover:text-white',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-7 py-3 text-base gap-2',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
