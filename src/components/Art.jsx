// Illustrations de remplacement (en attendant les vraies photos uploadées dans l'admin) :
// sachet kraft, bocal et bol, avec des clusters de granola générés à partir du nom.

function rng(seed = 'granola') {
  let h = 2166136261
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

const CLUSTER = ['#B9874F', '#A0703C', '#C99A5E', '#8A5A2E', '#D8B27A']
const CHOCO = ['#3B2218', '#4A2C20', '#5C3A2A']

function Clusters({ seed, cx, cy, rx, ry, count = 70, choco = false }) {
  const r = rng(seed)
  const out = []
  for (let i = 0; i < count; i++) {
    const a = r() * Math.PI * 2
    const d = Math.sqrt(r())
    const x = cx + Math.cos(a) * rx * d
    const y = cy + Math.sin(a) * ry * d
    const isChoco = choco && r() < 0.25
    const pal = isChoco ? CHOCO : CLUSTER
    const fill = pal[Math.floor(r() * pal.length)]
    out.push(
      isChoco ? (
        <rect key={i} x={x - 5} y={y - 5} width={10 + r() * 4} height={9 + r() * 4} rx="1.5"
          transform={`rotate(${r() * 90} ${x} ${y})`} fill={fill} />
      ) : (
        <ellipse key={i} cx={x} cy={y} rx={4 + r() * 8} ry={3 + r() * 6}
          transform={`rotate(${r() * 180} ${x} ${y})`} fill={fill} />
      ),
    )
  }
  return <g>{out}</g>
}

// Bord dentelé du haut du sachet (de x=108 à x=292)
const ZIGZAG = `M108 92 ${Array.from({ length: 23 }, (_, i) => `L${116 + i * 8} ${i % 2 ? 92 : 84}`).join(' ')} L292 92 Z`

const shortName =(name) => name.replace(/^(granola|pack)\s*/i, '').toUpperCase() || 'CLASSIC'

export function BagArt({ name = 'Granola', seed = name, choco }) {
  const id = `w-${seed.replace(/\W/g, '')}`
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" role="img" aria-label={name}>
      <ellipse cx="200" cy="356" rx="110" ry="10" fill="rgba(0,0,0,.12)" />
      <path d="M110 92 L290 92 L300 350 Q300 358 292 358 L108 358 Q100 358 100 350 Z" fill="#C9A273" />
      <path d="M108 92 L292 92 L293 118 L107 118 Z" fill="#B88F5E" />
      <path d={ZIGZAG} fill="#B88F5E" />
      <rect x="140" y="146" width="120" height="90" fill="#FBF7F1" />
      <text x="200" y="178" textAnchor="middle" fontFamily="Cardo, serif" fontSize="16" fill="#6B2D3C">Granola</text>
      <text x="200" y="195" textAnchor="middle" fontFamily="Cardo, serif" fontSize="11" fontStyle="italic" fill="#6B2D3C">Maison Faiz</text>
      <line x1="170" y1="206" x2="230" y2="206" stroke="#6B2D3C" strokeWidth=".8" />
      <text x="200" y="223" textAnchor="middle" fontFamily="Archivo, sans-serif" fontSize="9" letterSpacing="1.5" fill="#4A2C20">
        {shortName(name)}
      </text>
      <clipPath id={id}><rect x="150" y="256" width="100" height="72" rx="6" /></clipPath>
      <rect x="150" y="256" width="100" height="72" rx="6" fill="#E9D9BE" />
      <g clipPath={`url(#${id})`}><Clusters seed={seed} cx={200} cy={292} rx={64} ry={44} count={55} choco={choco} /></g>
    </svg>
  )
}

export function JarArt({ name = 'Granola', seed = name, choco }) {
  const id = `j-${seed.replace(/\W/g, '')}`
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" role="img" aria-label={name}>
      <ellipse cx="200" cy="360" rx="100" ry="10" fill="rgba(0,0,0,.12)" />
      <rect x="128" y="70" width="144" height="36" fill="#6B2D3C" />
      <rect x="128" y="96" width="144" height="10" fill="#55222F" />
      <path d="M118 112 Q118 106 124 106 L276 106 Q282 106 282 112 L290 340 Q290 358 272 358 L128 358 Q110 358 110 340 Z" fill="rgba(255,255,255,.45)" stroke="rgba(255,255,255,.8)" strokeWidth="2" />
      <clipPath id={id}><path d="M122 140 L278 140 L286 340 Q286 354 270 354 L130 354 Q114 354 114 340 Z" /></clipPath>
      <g clipPath={`url(#${id})`}>
        <rect x="110" y="140" width="180" height="220" fill="#C99A5E" />
        <Clusters seed={seed} cx={200} cy={250} rx={110} ry={120} count={170} choco={choco} />
      </g>
      <rect x="150" y="200" width="100" height="60" fill="#FBF7F1" />
      <text x="200" y="226" textAnchor="middle" fontFamily="Cardo, serif" fontSize="14" fill="#6B2D3C">Granola</text>
      <text x="200" y="243" textAnchor="middle" fontFamily="Cardo, serif" fontSize="10" fontStyle="italic" fill="#6B2D3C">Maison Faiz</text>
      <path d="M134 130 Q130 230 136 330" stroke="rgba(255,255,255,.7)" strokeWidth="6" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export function BowlArt({ name = 'Granola', seed = name, choco }) {
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" role="img" aria-label={name}>
      <circle cx="208" cy="210" r="150" fill="rgba(0,0,0,.1)" />
      <circle cx="200" cy="200" r="150" fill="#FBF7F1" />
      <circle cx="200" cy="200" r="122" fill="#EFE7DA" />
      <circle cx="200" cy="200" r="118" fill="#FFFDF9" />
      <Clusters seed={seed} cx={200} cy={200} rx={96} ry={96} count={150} choco={choco} />
      <circle cx="250" cy="150" r="14" fill="#C2334D" />
      <circle cx="160" cy="250" r="12" fill="#C2334D" />
      <circle cx="232" cy="262" r="10" fill="#5B3A7A" />
    </svg>
  )
}

export function DuoArt({ name = 'Pack', seed = name }) {
  return (
    <div className="flex h-full w-full items-end justify-center">
      <div className="-mr-[12%] h-[88%] w-[60%]"><BagArt name="Classic" seed={`${seed}a`} /></div>
      <div className="h-[88%] w-[60%]"><BagArt name="Chocolat" seed={`${seed}b`} choco /></div>
    </div>
  )
}
