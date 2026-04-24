export default function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      {...props}
      className={`
      bg-[#1a2f4a]/60 border border-[#2d5a8e]/30 rounded-2xl backdrop-blur-sm
      ${hover ? 'hover:border-[#c9a84c]/40 hover:bg-[#1a2f4a]/80 transition-all duration-300 cursor-pointer' : ''}
      ${className}
    `}>
      {children}
    </div>
  )
}
