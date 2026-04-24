/**
 * North Indian Kundali Chart (Diamond/Square style)
 *
 * Layout — 12 houses in a 4×4 grid with corners cut:
 *
 *   ┌────┬────────┬────┐
 *   │ 12 │   1    │  2 │
 *   ├────┼────────┼────┤
 *   │ 11 │        │  3 │
 *   ├────┼────────┼────┤
 *   │ 10 │   7    │  4 │
 *   └────┴────────┴────┘
 *        │   6    │
 *        └────────┘
 *
 * Actually the standard North Indian layout is:
 *
 *   ┌──────┬──────┬──────┐
 *   │  12  │  1   │  2   │
 *   ├──────┼──────┼──────┤
 *   │  11  │(mid) │  3   │
 *   ├──────┼──────┼──────┤
 *   │  10  │  7   │  4   │
 *   └──────┴──────┴──────┘
 * with 5,6,8,9 in the triangular corners of the center diamond.
 *
 * We use SVG polygons for the 12 house cells.
 */

const ZODIAC_SIGNS = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces',
]

const ZODIAC_SHORT = {
  Aries:'Ari', Taurus:'Tau', Gemini:'Gem', Cancer:'Can',
  Leo:'Leo', Virgo:'Vir', Libra:'Lib', Scorpio:'Sco',
  Sagittarius:'Sag', Capricorn:'Cap', Aquarius:'Aqu', Pisces:'Pis',
}

const PLANET_SHORT = {
  Sun:'Su', Moon:'Mo', Mars:'Ma', Mercury:'Me',
  Jupiter:'Ju', Venus:'Ve', Saturn:'Sa', Rahu:'Ra',
  Ketu:'Ke', Uranus:'Ur', Neptune:'Ne', Pluto:'Pl',
  Ascendant:'As',
}

const PLANET_COLORS = {
  Sun:'#f59e0b', Moon:'#94a3b8', Mars:'#ef4444', Mercury:'#22c55e',
  Jupiter:'#f97316', Venus:'#ec4899', Saturn:'#8b5cf6', Rahu:'#6b7280',
  Ketu:'#6b7280', Uranus:'#06b6d4', Neptune:'#3b82f6', Pluto:'#a855f7',
  Ascendant:'#c9a84c',
}

/**
 * North Indian chart: Ascendant is always house 1 (top-center).
 * Houses are fixed positions; signs rotate based on Ascendant sign.
 *
 * House positions in the grid (SVG coordinates, 300×300 canvas):
 * The chart is divided into 12 triangular/rectangular cells.
 */

// SVG size
const S = 300
const H = S / 2  // 150 — center

// The 12 house polygons in North Indian style
// Each entry: [houseNumber, polygon points as "x,y x,y ..."]
const HOUSE_POLYGONS = [
  // House 1 — top center triangle
  { h: 1,  pts: `${H},0 ${S},0 ${H},${H}` },
  // House 2 — top right triangle
  { h: 2,  pts: `${S},0 ${S},${H} ${H},${H}` },
  // House 3 — right center triangle
  { h: 3,  pts: `${S},${H} ${S},${S} ${H},${H}` },
  // House 4 — bottom right triangle
  { h: 4,  pts: `${S},${S} ${H},${S} ${H},${H}` },
  // House 5 — bottom center triangle
  { h: 5,  pts: `${H},${S} 0,${S} ${H},${H}` },
  // House 6 — bottom left triangle
  { h: 6,  pts: `0,${S} 0,${H} ${H},${H}` },
  // House 7 — left center triangle
  { h: 7,  pts: `0,${H} 0,0 ${H},${H}` },
  // House 8 — top left triangle
  { h: 8,  pts: `0,0 ${H},0 ${H},${H}` },
  // Houses 9-12 are the corner rectangles
  // Actually North Indian uses a different layout — let me use the standard one:
]

// Standard North Indian Kundali — 12 triangular houses around a center square
// Using a 300×300 SVG with center at 150,150
const HOUSES = [
  // House 1 — top center (Lagna)
  { h: 1,  pts: [[150,0],[300,0],[150,150]] },
  // House 2 — top right
  { h: 2,  pts: [[300,0],[300,150],[150,150]] },
  // House 3 — right center
  { h: 3,  pts: [[300,150],[300,300],[150,150]] },
  // House 4 — bottom right
  { h: 4,  pts: [[300,300],[150,300],[150,150]] },
  // House 5 — bottom center
  { h: 5,  pts: [[150,300],[0,300],[150,150]] },
  // House 6 — bottom left
  { h: 6,  pts: [[0,300],[0,150],[150,150]] },
  // House 7 — left center
  { h: 7,  pts: [[0,150],[0,0],[150,150]] },
  // House 8 — top left
  { h: 8,  pts: [[0,0],[150,0],[150,150]] },
  // Houses 9-12 are the 4 corner rectangles in the outer ring
  // In standard North Indian, there are only 8 triangles + 4 corner squares
  // Let me use the proper 12-house layout:
]

// Proper North Indian Kundali layout
// The chart is a square divided into 12 sections
// Top row: houses 12, 1, 2
// Middle row: houses 11, (center), 3
// Bottom row: houses 10, 9, 4 ... wait, let me use the correct layout

// CORRECT North Indian layout:
// ┌─────┬─────┬─────┐
// │ 12  │  1  │  2  │
// ├─────┼─────┼─────┤
// │ 11  │     │  3  │
// ├─────┼─────┼─────┤
// │ 10  │  9  │  4  │
// └─────┴─────┴─────┘
// With 5,6,7,8 in the center diamond triangles

// Actually the most common North Indian style uses this exact layout:
const CELL_SIZE = S / 3  // 100

const NORTH_INDIAN_HOUSES = [
  // Outer 8 rectangular cells (corners + edges)
  { h: 12, x: 0,           y: 0,           w: CELL_SIZE, ht: CELL_SIZE },
  { h: 1,  x: CELL_SIZE,   y: 0,           w: CELL_SIZE, ht: CELL_SIZE },
  { h: 2,  x: CELL_SIZE*2, y: 0,           w: CELL_SIZE, ht: CELL_SIZE },
  { h: 3,  x: CELL_SIZE*2, y: CELL_SIZE,   w: CELL_SIZE, ht: CELL_SIZE },
  { h: 4,  x: CELL_SIZE*2, y: CELL_SIZE*2, w: CELL_SIZE, ht: CELL_SIZE },
  { h: 5,  x: CELL_SIZE,   y: CELL_SIZE*2, w: CELL_SIZE, ht: CELL_SIZE },
  { h: 6,  x: 0,           y: CELL_SIZE*2, w: CELL_SIZE, ht: CELL_SIZE },
  { h: 7,  x: 0,           y: CELL_SIZE,   w: CELL_SIZE, ht: CELL_SIZE },
  // Center 4 triangular cells (the diamond)
  { h: 8,  triangle: [[CELL_SIZE,CELL_SIZE],[CELL_SIZE*2,CELL_SIZE],[CELL_SIZE*1.5,CELL_SIZE*1.5]] },
  { h: 9,  triangle: [[CELL_SIZE,CELL_SIZE],[CELL_SIZE*1.5,CELL_SIZE*1.5],[CELL_SIZE,CELL_SIZE*2]] },
  { h: 10, triangle: [[CELL_SIZE,CELL_SIZE*2],[CELL_SIZE*1.5,CELL_SIZE*1.5],[CELL_SIZE*2,CELL_SIZE*2]] },
  { h: 11, triangle: [[CELL_SIZE*2,CELL_SIZE],[CELL_SIZE*1.5,CELL_SIZE*1.5],[CELL_SIZE*2,CELL_SIZE*2]] },
]

// Centroid of a polygon for text placement
function centroid(pts) {
  const x = pts.reduce((s, p) => s + p[0], 0) / pts.length
  const y = pts.reduce((s, p) => s + p[1], 0) / pts.length
  return [x, y]
}

function rectCenter(x, y, w, h) {
  return [x + w / 2, y + h / 2]
}

export default function KundaliChart({ chartData, ascendantSign, size = 300 }) {
  if (!chartData || !ascendantSign) return null

  const scale = size / S

  // Determine which zodiac sign is in which house
  // House 1 = Ascendant sign, House 2 = next sign, etc.
  const ascIdx = ZODIAC_SIGNS.findIndex(s => s.toLowerCase() === ascendantSign.toLowerCase())
  const houseSign = (houseNum) => ZODIAC_SIGNS[(ascIdx + houseNum - 1) % 12]

  // Map each planet to its house number
  const planetHouses = {}
  Object.entries(chartData).forEach(([planet, data]) => {
    if (!data?.sign) return
    const signIdx = ZODIAC_SIGNS.findIndex(s => s.toLowerCase() === data.sign.toLowerCase())
    if (signIdx === -1) return
    // House = (signIdx - ascIdx + 12) % 12 + 1
    const house = ((signIdx - ascIdx + 12) % 12) + 1
    if (!planetHouses[house]) planetHouses[house] = []
    planetHouses[house].push({ name: planet, degree: data.degree })
  })

  const strokeColor = '#2d5a8e'
  const bgColor = '#0d1b2a'
  const cellBg = '#1a2f4a'
  const centerBg = '#0f2035'

  return (
    <svg
      viewBox={`0 0 ${S} ${S}`}
      width={size}
      height={size}
      className="rounded-xl overflow-hidden"
      style={{ background: bgColor }}
    >
      {/* Outer border */}
      <rect x="0" y="0" width={S} height={S} fill={bgColor} stroke={strokeColor} strokeWidth="1.5" />

      {/* Render each house */}
      {NORTH_INDIAN_HOUSES.map(({ h, x, y, w, ht, triangle }) => {
        const sign = houseSign(h)
        const planets = planetHouses[h] || []
        const isLagna = h === 1

        if (triangle) {
          const pts = triangle.map(p => p.join(',')).join(' ')
          const [cx, cy] = centroid(triangle)
          return (
            <g key={h}>
              <polygon
                points={pts}
                fill={isLagna ? '#1e3a5f' : centerBg}
                stroke={strokeColor}
                strokeWidth="1"
              />
              {/* House number */}
              <text x={cx} y={cy - 6} textAnchor="middle" fontSize="8" fill="#4a6fa5" fontFamily="sans-serif">
                {h}
              </text>
              {/* Sign */}
              <text x={cx} y={cy + 5} textAnchor="middle" fontSize="7" fill="#6b8ab5" fontFamily="sans-serif">
                {ZODIAC_SHORT[sign]}
              </text>
              {/* Planets */}
              {planets.map((p, i) => (
                <text
                  key={p.name}
                  x={cx}
                  y={cy + 14 + i * 9}
                  textAnchor="middle"
                  fontSize="7.5"
                  fontWeight="600"
                  fill={PLANET_COLORS[p.name] || '#c9a84c'}
                  fontFamily="sans-serif"
                >
                  {PLANET_SHORT[p.name] || p.name.slice(0,2)}
                </text>
              ))}
            </g>
          )
        }

        // Rectangular cell
        const [cx, cy] = rectCenter(x, y, w, ht)
        return (
          <g key={h}>
            <rect
              x={x} y={y} width={w} height={ht}
              fill={isLagna ? '#1e3a5f' : cellBg}
              stroke={strokeColor}
              strokeWidth="1"
            />
            {/* House number — small, top-left */}
            <text x={x + 4} y={y + 11} fontSize="8" fill="#4a6fa5" fontFamily="sans-serif">
              {h}
            </text>
            {/* Lagna marker */}
            {isLagna && (
              <text x={x + w - 4} y={y + 11} textAnchor="end" fontSize="7" fill="#c9a84c" fontFamily="sans-serif" fontWeight="bold">
                Lag
              </text>
            )}
            {/* Sign name */}
            <text x={cx} y={y + 22} textAnchor="middle" fontSize="8" fill="#6b8ab5" fontFamily="sans-serif">
              {ZODIAC_SHORT[sign]}
            </text>
            {/* Planets stacked */}
            {planets.map((p, i) => (
              <text
                key={p.name}
                x={cx}
                y={y + 34 + i * 11}
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                fill={PLANET_COLORS[p.name] || '#c9a84c'}
                fontFamily="sans-serif"
              >
                {PLANET_SHORT[p.name] || p.name.slice(0,2)}
                <tspan fontSize="6.5" fill={PLANET_COLORS[p.name] || '#c9a84c'} opacity="0.8">
                  {' '}{Math.round(p.degree)}°
                </tspan>
              </text>
            ))}
          </g>
        )
      })}

      {/* Center label */}
      <text x={S/2} y={S/2 - 4} textAnchor="middle" fontSize="8" fill="#c9a84c" fontFamily="sans-serif" fontWeight="bold">
        KUNDALI
      </text>
      <text x={S/2} y={S/2 + 7} textAnchor="middle" fontSize="7" fill="#4a6fa5" fontFamily="sans-serif">
        {ascendantSign}
      </text>
    </svg>
  )
}
