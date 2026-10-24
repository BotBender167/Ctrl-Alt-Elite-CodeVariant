// Painterly layered landscape, drawn as flat SVG shapes. Coordinates are in a 1600x900 box.
import type { ReactNode } from 'react'

const VB = '0 0 1600 900'

function mulberry(seed: number): () => number {
  let s = seed
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const r1 = (n: number): number => Math.round(n * 10) / 10

function ridgePoints(seed: number, base: number, amp: number, step: number): Array<[number, number]> {
  const rand = mulberry(seed)
  const pts: Array<[number, number]> = []
  let x = -60
  let up = true
  while (x <= 1660) {
    pts.push([x, base - (up ? rand() * 0.6 + 0.4 : rand() * 0.3) * amp])
    x += step * (0.6 + rand() * 0.8)
    up = !up
  }
  return pts
}

function ridgePath(pts: Array<[number, number]>): string {
  const first = pts[0]
  const last = pts[pts.length - 1]
  if (!first || !last) return ''
  return `M${first[0]},920 ${pts.map(([x, y]) => `L${r1(x)},${r1(y)}`).join(' ')} L${last[0]},920 Z`
}

function pinePath(x: number, y: number, h: number): string {
  const w = h * 0.36
  return (
    `M${r1(x)},${r1(y - h)} L${r1(x + w * 0.55)},${r1(y - h * 0.55)} L${r1(x + w * 0.25)},${r1(y - h * 0.55)} ` +
    `L${r1(x + w * 0.8)},${r1(y - h * 0.22)} L${r1(x + w * 0.3)},${r1(y - h * 0.22)} L${r1(x + w)},${r1(y)} ` +
    `L${r1(x - w)},${r1(y)} L${r1(x - w * 0.3)},${r1(y - h * 0.22)} L${r1(x - w * 0.8)},${r1(y - h * 0.22)} ` +
    `L${r1(x - w * 0.25)},${r1(y - h * 0.55)} L${r1(x - w * 0.55)},${r1(y - h * 0.55)} Z`
  )
}

function pinesAlong(pts: Array<[number, number]>, seed: number, chance: number, hMin: number, hMax: number): string {
  const rand = mulberry(seed)
  let d = ''
  for (const [x, y] of pts) {
    if (rand() < chance) d += pinePath(x + (rand() - 0.5) * 24, y + 10, hMin + rand() * (hMax - hMin))
  }
  return d
}

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg className="layer" viewBox={VB} preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      {children}
    </svg>
  )
}

function Cloud({ x, y, s, o = 1, slow = false }: { x: number; y: number; s: number; o?: number; slow?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
      <g className={slow ? 'drift slow' : 'drift'}>
        <ellipse cx="6" cy="16" rx="108" ry="22" fill="#a9b8c3" opacity=".55" />
        <ellipse cx="0" cy="0" rx="100" ry="26" fill="#f1e4d0" />
        <ellipse cx="-48" cy="-16" rx="52" ry="28" fill="#f5e9d6" />
        <ellipse cx="22" cy="-30" rx="60" ry="32" fill="#f8eddb" />
        <ellipse cx="72" cy="-8" rx="42" ry="22" fill="#f3e6d2" />
        <ellipse cx="14" cy="-44" rx="40" ry="14" fill="#fff6e6" opacity=".7" />
      </g>
    </g>
  )
}

export function SkyArt() {
  return (
    <Svg>
      <defs>
        <linearGradient id="sky-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#47708f" />
          <stop offset=".34" stopColor="#8db0c6" />
          <stop offset=".62" stopColor="#d2ddd5" />
          <stop offset="1" stopColor="#ebdfc6" />
        </linearGradient>
        <radialGradient id="sky-sun" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#ffe3b3" stopOpacity=".85" />
          <stop offset="1" stopColor="#ffe3b3" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#sky-g)" />
      <circle cx="800" cy="540" r="560" fill="url(#sky-sun)" />
      <Cloud x={250} y={120} s={1.7} />
      <Cloud x={640} y={70} s={1.1} o={0.9} slow />
      <Cloud x={1140} y={150} s={1.9} />
      <Cloud x={1500} y={80} s={1.2} o={0.95} slow />
      <Cloud x={430} y={300} s={0.9} o={0.7} />
    </Svg>
  )
}

function Island({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className="bob">
        <path d="M-70,0 Q0,-18 70,0 Q58,36 24,64 Q4,86 -10,62 Q-46,38 -70,0Z" fill="#4a4a60" />
        <path d="M-70,0 Q0,-18 70,0 Q40,12 0,10 Q-40,12 -70,0Z" fill="#4d7a5a" />
        <path d={`${pinePath(-22, -4, 46)} ${pinePath(8, -6, 60)} ${pinePath(34, -2, 38)}`} fill="#2f5748" />
      </g>
    </g>
  )
}

export function FarArt() {
  const hills = ridgePoints(11, 690, 70, 70)
  return (
    <Svg>
      <defs>
        <linearGradient id="far-fort" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3d3858" />
          <stop offset="1" stopColor="#262339" />
        </linearGradient>
        <linearGradient id="far-fall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2fbfd" />
          <stop offset="1" stopColor="#a9d4dc" />
        </linearGradient>
        <radialGradient id="far-eye" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#dff6f6" stopOpacity=".9" />
          <stop offset="1" stopColor="#dff6f6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M-100,640 L120,530 L330,300 L420,120 L520,262 L640,420 L760,520 L900,640 Z" fill="#7188a3" />
      <path d="M420,120 L520,262 L452,336 L396,206 Z" fill="#aabdcc" />
      <path d="M360,640 L560,440 L700,230 L820,380 L960,520 L1100,640 Z" fill="#64799a" />
      <path d="M700,230 L820,380 L760,420 L690,300 Z" fill="#8da2b8" />
      <path d="M1000,640 L1200,480 L1330,340 L1450,440 L1700,640 Z" fill="#7b91a8" />
      <rect x="196" y="338" width="26" height="250" fill="url(#far-fall)" opacity=".8" />
      <Island x={700} y={210} s={1.15} />
      <Island x={520} y={370} s={1.35} />
      <Island x={230} y={330} s={0.8} />
      <Island x={1040} y={310} s={0.7} />
      <path
        d="M610,640 L650,390 L700,300 L690,190 L722,122 L736,50 L762,150 L800,172 L842,150 L866,40 L882,130 L912,190 L906,300 L960,390 L1010,640 Z"
        fill="url(#far-fort)"
      />
      <circle cx="770" cy="208" r="26" fill="url(#far-eye)" className="glowpulse" />
      <circle cx="836" cy="210" r="26" fill="url(#far-eye)" className="glowpulse" />
      <circle cx="770" cy="208" r="6" fill="#e9fbfb" />
      <circle cx="836" cy="210" r="6" fill="#e9fbfb" />
      <g fill="#8fa6b6" opacity=".85">
        <rect x="560" y="610" width="14" height="46" />
        <rect x="582" y="590" width="16" height="66" />
        <path d="M580,590 L590,568 L600,590Z" />
        <rect x="608" y="604" width="12" height="52" />
        <rect x="626" y="618" width="22" height="38" />
      </g>
      <path d={ridgePath(hills)} fill="#5c7e6a" />
      <path d={pinesAlong(hills, 3, 0.55, 22, 40)} fill="#3f6150" />
    </Svg>
  )
}

export function MidArt() {
  const stepTops = 'M-20,290 L110,280 L125,300 L250,305 L262,370 L370,375 L385,445 L480,450 L492,520 L610,525'
  return (
    <Svg>
      <defs>
        <linearGradient id="mid-rust" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b9724f" />
          <stop offset=".5" stopColor="#8a4b44" />
          <stop offset="1" stopColor="#4b2f3c" />
        </linearGradient>
        <linearGradient id="mid-teal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#35625b" />
          <stop offset=".5" stopColor="#1f3d3e" />
          <stop offset="1" stopColor="#101f24" />
        </linearGradient>
        <linearGradient id="mid-fall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eefafc" />
          <stop offset="1" stopColor="#8ec9d2" />
        </linearGradient>
        <linearGradient id="mid-lake" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a8d0d2" />
          <stop offset="1" stopColor="#d7e5da" />
        </linearGradient>
        <radialGradient id="mid-fire" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#f6b25a" stopOpacity=".7" />
          <stop offset="1" stopColor="#f6b25a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mid-portal" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#7fe3e0" stopOpacity=".6" />
          <stop offset="1" stopColor="#7fe3e0" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* valley water */}
      <path d="M560,700 Q740,650 960,690 Q1040,720 1110,790 L520,790 Z" fill="url(#mid-lake)" />
      <path d="M640,730 L860,722 M700,750 L930,744 M610,768 L820,762" stroke="#ffffff" strokeWidth="2" opacity=".35" />
      <path d="M520,800 Q600,730 720,742 Q650,770 610,820 Z" fill="#718f55" />
      <path d="M980,770 Q1070,730 1170,760 L1190,820 Q1070,806 980,770 Z" fill="#6b8a52" />

      {/* left rust cliff */}
      <path
        d="M-20,900 L-20,290 L110,280 L125,300 L250,305 L262,370 L370,375 L385,445 L480,450 L492,520 L610,525 L640,600 L700,640 L690,700 L640,760 L620,900 Z"
        fill="url(#mid-rust)"
      />
      <path d="M-20,570 L300,530 L300,900 L-20,900 Z" fill="#1e0f19" opacity=".28" />
      <path d={stepTops} stroke="#d49a62" strokeWidth="7" fill="none" strokeLinejoin="round" />
      <path d={stepTops} stroke="#6f8f55" strokeWidth="3" fill="none" strokeLinejoin="round" transform="translate(0 -5)" />
      <path d="M60,330 L60,560 M180,320 L180,540 M310,400 L310,620 M430,470 L430,700" stroke="#000" strokeWidth="3" opacity=".16" />
      <path d={`${pinePath(205, 305, 62)} ${pinePath(238, 308, 48)} ${pinePath(402, 380, 58)} ${pinePath(436, 384, 44)} ${pinePath(520, 525, 52)}`} fill="#2f5240" />

      {/* tents and flags */}
      <path d="M55,290 L125,224 L195,290 Z" fill="#d09a5e" />
      <path d="M125,224 L195,290 L150,290 Z" fill="#b57d49" />
      <path d="M113,290 L125,262 L137,290 Z" fill="#3b2a2c" />
      <path d="M125,224 L125,184" stroke="#4a3330" strokeWidth="3" />
      <path d="M125,184 L172,196 L125,209 Z" fill="#c0432f" />
      <path d="M265,372 L320,322 L380,372 Z" fill="#8c6446" />
      <path d="M320,322 L380,372 L345,372 Z" fill="#6f4d36" />
      <path d="M320,322 L320,286" stroke="#4a3330" strokeWidth="3" />
      <path d="M320,286 L358,296 L320,306 Z" fill="#c0432f" />

      {/* campfire ledge, sitter and fire */}
      <path d="M470,592 L650,586 L672,622 L458,628 Z" fill="#5a3a36" />
      <path d="M470,592 L650,586" stroke="#d49a62" strokeWidth="4" />
      <circle cx="548" cy="560" r="150" fill="url(#mid-fire)" className="glowpulse" />
      <g transform="translate(548 590)">
        <rect x="-34" y="-7" width="68" height="10" rx="5" fill="#3a2820" transform="rotate(-8)" />
        <rect x="-34" y="-7" width="68" height="10" rx="5" fill="#4a3126" transform="rotate(9)" />
        <g className="flame">
          <path d="M0,-4 C-22,-6 -27,-38 -8,-64 C-6,-46 5,-45 3,-66 C24,-46 28,-12 0,-4Z" fill="#e98a3c" />
          <path d="M0,-4 C-12,-5 -14,-22 -3,-37 C0,-27 7,-26 7,-39 C16,-24 14,-8 0,-4Z" fill="#f6b25a" />
          <path d="M0,-4 C-6,-4 -7,-12 -1,-20 C4,-14 6,-8 0,-4Z" fill="#fce3a8" />
        </g>
      </g>
      <path d="M596,590 Q604,550 622,553 Q640,557 644,590 Z" fill="#2a3138" />
      <circle cx="620" cy="546" r="11" fill="#3a4048" />
      <path d="M612,548 Q620,540 628,548" stroke="#e98a3c" strokeWidth="2" fill="none" opacity=".8" />

      {/* right teal cliff */}
      <path
        d="M1600,230 L1480,262 L1420,300 L1370,345 L1318,372 L1286,430 L1250,452 L1212,520 L1190,600 L1196,700 L1215,900 L1600,900 Z"
        fill="url(#mid-teal)"
      />
      <path d="M1600,226 L1480,258 L1420,296 L1370,341 L1318,368 L1286,426 L1250,448" stroke="#6a9a6a" strokeWidth="9" fill="none" strokeLinejoin="round" />
      <path d="M1600,226 L1480,258 L1420,296" stroke="#8fba7a" strokeWidth="3" fill="none" />
      <path d="M1392,318 L1450,318 L1464,728 L1380,728 Z" fill="url(#mid-fall)" />
      <g stroke="#ffffff" strokeWidth="3" opacity=".55" fill="none">
        <path className="fallflow" d="M1404,326 L1398,722" />
        <path className="fallflow" d="M1420,326 L1422,722" style={{ animationDelay: '-.5s' }} />
        <path className="fallflow" d="M1438,326 L1446,722" style={{ animationDelay: '-1s' }} />
      </g>
      <ellipse cx="1422" cy="736" rx="96" ry="20" fill="#ffffff" opacity=".35" />
      <path d="M1296,566 L1328,566 L1338,784 L1288,784 Z" fill="url(#mid-fall)" opacity=".9" />
      <ellipse cx="1312" cy="790" rx="52" ry="12" fill="#ffffff" opacity=".3" />

      {/* mushroom trees */}
      <path d="M1520,300 Q1512,250 1524,214" stroke="#6b4637" strokeWidth="13" fill="none" strokeLinecap="round" />
      <ellipse cx="1524" cy="212" rx="74" ry="26" fill="#8c6350" />
      <ellipse cx="1524" cy="200" rx="52" ry="14" fill="#a87a62" />
      <path d="M1566,300 Q1560,276 1568,258" stroke="#6b4637" strokeWidth="8" fill="none" strokeLinecap="round" />
      <ellipse cx="1568" cy="256" rx="36" ry="13" fill="#7a5644" />
      <path d="M1228,440 Q1222,414 1230,394" stroke="#5a3b30" strokeWidth="8" fill="none" strokeLinecap="round" />
      <ellipse cx="1230" cy="392" rx="40" ry="14" fill="#6d4a3c" />

      {/* glowing doorway */}
      <circle cx="1276" cy="496" r="54" fill="url(#mid-portal)" className="glowpulse" />
      <path d="M1252,536 L1252,484 Q1252,454 1276,454 Q1300,454 1300,484 L1300,536 Z" fill="#141a2d" stroke="#7fe3e0" strokeWidth="3" />
      <path d="M1276,480 L1286,496 L1276,512 L1266,496 Z" fill="none" stroke="#7fe3e0" strokeWidth="2.5" />
    </Svg>
  )
}

export function ForeArt() {
  return (
    <Svg>
      <defs>
        <radialGradient id="fg-lantern" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#bff7f4" stopOpacity=".95" />
          <stop offset="1" stopColor="#7fe3e0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="fg-cape" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d4563a" />
          <stop offset="1" stopColor="#9c3526" />
        </linearGradient>
      </defs>

      {/* dark foliage, left */}
      <g fill="#091519">
        <path d="M-30,900 L-30,640 Q30,590 76,650 Q64,700 118,722 Q58,742 92,806 Q40,832 36,900 Z" />
        <path d="M70,900 Q40,760 104,640 Q118,770 168,900 Z" />
        <path d="M-20,900 Q10,780 -10,700 Q70,780 52,900 Z" />
        <path d="M140,900 Q150,820 210,770 Q196,840 236,900 Z" />
      </g>
      {/* dark foliage, right */}
      <g fill="#091519">
        <path d="M1630,900 L1630,610 Q1556,584 1512,650 Q1530,700 1470,724 Q1536,744 1500,810 Q1556,836 1560,900 Z" />
        <path d="M1530,900 Q1560,760 1496,640 Q1480,770 1432,900 Z" />
        <path d="M1380,900 Q1370,826 1318,780 Q1332,846 1296,900 Z" />
      </g>

      {/* the traveller */}
      <g className="glowpulse">
        <circle cx="868" cy="752" r="48" fill="url(#fg-lantern)" />
      </g>
      <path d="M708,900 L736,846 Q800,826 876,848 L904,900 Z" fill="#0c1a20" />
      <path d="M736,846 Q800,826 876,848" stroke="#2b4650" strokeWidth="3" fill="none" />
      <path d="M866,858 L866,764" stroke="#1d130f" strokeWidth="5" strokeLinecap="round" />
      <path d="M868,742 L878,752 L868,762 L858,752 Z" fill="#e9fffe" stroke="#7fe3e0" strokeWidth="2" />
      <path d="M778,800 Q770,846 764,850 L836,850 Q830,830 822,800 Z" fill="url(#fg-cape)" />
      <path d="M778,800 Q800,792 822,800" stroke="#f0a070" strokeWidth="3" fill="none" />
      <path d="M800,812 L808,824 L800,836 L792,824 Z" fill="#e8b25a" />
      <rect x="788" y="842" width="9" height="12" fill="#1d2430" />
      <rect x="805" y="842" width="9" height="12" fill="#1d2430" />
      <path d="M786,790 Q800,780 814,790 L816,804 L784,804 Z" fill="#3f6b6a" />
      <circle cx="800" cy="772" r="15" fill="#2a2420" />
      <path d="M786,766 Q800,748 816,764 Q806,760 800,764 Q792,758 786,766Z" fill="#3a2d26" />
      <path d="M822,806 Q846,800 862,774" stroke="#3f6b6a" strokeWidth="9" fill="none" strokeLinecap="round" />
    </Svg>
  )
}
