import { Star } from 'lucide-react'

export default function StarRating({ rating, max = 5, size = 'sm' }) {
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={`${sz} ${i < Math.round(rating) ? 'text-[#c9a84c] fill-[#c9a84c]' : 'text-gray-600'}`}
        />
      ))}
    </div>
  )
}
