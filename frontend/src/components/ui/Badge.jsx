export default function Badge({ children, color = 'blue' }) {
  const colors = {
    blue: 'bg-[#2d5a8e]/30 text-blue-300 border-[#2d5a8e]/50',
    gold: 'bg-[#c9a84c]/20 text-[#c9a84c] border-[#c9a84c]/40',
    green: 'bg-green-500/20 text-green-400 border-green-500/40',
    red: 'bg-red-500/20 text-red-400 border-red-500/40',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[color]}`}>
      {children}
    </span>
  )
}
