export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-gray-300">{label}</label>
      )}
      <input
        className={`
          w-full px-4 py-2.5 rounded-lg bg-[#0d1b2a] border text-white placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50 transition-colors
          ${error ? 'border-red-500' : 'border-[#2d5a8e]/50 hover:border-[#2d5a8e]'}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
