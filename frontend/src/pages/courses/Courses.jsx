import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Clock, Users, Star, Search } from 'lucide-react'
import { getCourses } from '../../api/courses'
import Layout from '../../components/layout/Layout'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import StarRating from '../../components/ui/StarRating'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'

const LEVELS = ['All', 'beginner', 'intermediate', 'advanced']

export default function Courses() {
  const [search, setSearch] = useState('')
  const [level, setLevel] = useState('All')
  const [freeOnly, setFreeOnly] = useState(false)
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['courses', level, freeOnly],
    queryFn: () => getCourses({
      ...(level !== 'All' && { level }),
      ...(freeOnly && { is_free: true }),
    }).then((r) => r.data),
  })

  const courses = (data?.results || data || []).filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white font-serif mb-3">Astrology Courses</h1>
          <p className="text-gray-400">Learn Vedic astrology from beginner to advanced</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#1a2f4a]/60 border border-[#2d5a8e]/30 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/50"
            />
          </div>
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1a2f4a]/60 border border-[#2d5a8e]/30 cursor-pointer">
            <input type="checkbox" checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)} className="accent-[#c9a84c]" />
            <span className="text-sm text-gray-300">Free Only</span>
          </label>
        </div>

        {/* Level tabs */}
        <div className="flex gap-2 mb-8">
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`px-4 py-1.5 rounded-full text-sm capitalize transition-all ${
                level === l
                  ? 'bg-[#c9a84c] text-[#0d1b2a] font-medium'
                  : 'bg-[#1a2f4a]/60 border border-[#2d5a8e]/30 text-gray-300 hover:border-[#c9a84c]/40'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {isLoading && <Spinner size="lg" className="py-20" />}

        {!isLoading && courses.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No courses available yet.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} hover className="overflow-hidden flex flex-col"
              onClick={() => navigate(`/courses/${course.slug}`)}>
              {/* Thumbnail */}
              <div className="aspect-video bg-gradient-to-br from-[#1e3a5f] to-[#0d1b2a] flex items-center justify-center overflow-hidden">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <BookOpen className="w-12 h-12 text-[#2d5a8e]" />
                )}
              </div>

              <div className="p-5 flex flex-col flex-1 gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge color={course.level === 'beginner' ? 'green' : course.level === 'intermediate' ? 'blue' : 'purple'}>
                    {course.level}
                  </Badge>
                  {course.is_free && <Badge color="gold">Free</Badge>}
                  {course.is_featured && <Badge color="gold">Featured</Badge>}
                </div>

                <h3 className="font-semibold text-white leading-tight">{course.title}</h3>
                <p className="text-xs text-gray-400 line-clamp-2">{course.short_description || course.description}</p>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.duration_hours}h</span>
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {course.lesson_count} lessons</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {course.enrollment_count}</span>
                </div>

                <div className="flex items-center gap-2">
                  <StarRating rating={course.rating} />
                  <span className="text-xs text-gray-500">{course.rating}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#2d5a8e]/20 mt-auto">
                  <div>
                    {course.is_free ? (
                      <span className="text-green-400 font-bold">Free</span>
                    ) : (
                      <>
                        <span className="text-[#c9a84c] font-bold">Rs {course.price_npr}</span>
                        <span className="text-gray-500 text-xs ml-2">${course.price_usd}</span>
                      </>
                    )}
                  </div>
                  <Badge color={course.is_enrolled ? 'green' : 'blue'}>
                    {course.is_enrolled ? 'Enrolled' : 'Enroll'}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  )
}
