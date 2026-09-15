export function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 480 420"
      className="h-full w-full drop-shadow-[0_20px_35px_rgba(37,99,235,0.25)]"
      role="img"
      aria-label="Patient having a video consultation with a doctor on a laptop"
    >
      <defs>
        <linearGradient id="bgBlob" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#DBEAFE" />
          <stop offset="100%" stopColor="#BFDBFE" />
        </linearGradient>
        <linearGradient id="laptop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="coat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#EFF6FF" />
        </linearGradient>
      </defs>

      {/* backdrop blob */}
      <path
        d="M60 260C10 190 40 90 130 55C220 20 320 30 380 90C440 150 460 250 400 310C340 370 220 400 140 375C60 350 110 330 60 260Z"
        fill="url(#bgBlob)"
      />

      {/* desk */}
      <rect x="70" y="300" width="340" height="16" rx="8" fill="#93C5FD" />
      <rect x="90" y="316" width="20" height="60" rx="4" fill="#93C5FD" />
      <rect x="370" y="316" width="20" height="60" rx="4" fill="#93C5FD" />

      {/* laptop */}
      <g>
        <rect x="150" y="190" width="180" height="120" rx="10" fill="url(#laptop)" />
        <rect x="164" y="204" width="152" height="92" rx="6" fill="#F5F9FF" />
        {/* doctor on screen */}
        <circle cx="240" cy="240" r="22" fill="#93C5FD" />
        <path
          d="M204 292c6-24 26-38 36-38s30 14 36 38"
          fill="none"
          stroke="#2563EB"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <rect x="130" y="308" width="220" height="14" rx="7" fill="#1D4ED8" />
      </g>

      {/* patient (front, sitting) */}
      <g>
        <ellipse cx="240" cy="392" rx="90" ry="14" fill="#BFDBFE" opacity="0.6" />
        <rect x="205" y="255" width="70" height="110" rx="24" fill="#10B981" />
        <circle cx="240" cy="230" r="30" fill="#F5D6B8" />
        <path d="M212 222c4-18 20-26 28-26s24 8 28 26" fill="#3B2A1E" />
      </g>

      {/* stethoscope accent on coat */}
      <g>
        <rect x="360" y="150" width="60" height="90" rx="18" fill="url(#coat)" stroke="#BFDBFE" />
        <circle cx="390" cy="175" r="16" fill="#93C5FD" />
        <path d="M374 185c-6 14 0 30 16 30s22-16 16-30" fill="none" stroke="#2563EB" strokeWidth="5" strokeLinecap="round" />
      </g>

      {/* floating plus icons */}
      <g fill="#2563EB" opacity="0.8">
        <rect x="60" y="90" width="6" height="24" rx="3" />
        <rect x="51" y="99" width="24" height="6" rx="3" />
      </g>
      <g fill="#10B981" opacity="0.8">
        <rect x="410" y="230" width="6" height="20" rx="3" />
        <rect x="403" y="237" width="20" height="6" rx="3" />
      </g>
      <circle cx="420" cy="90" r="8" fill="#FDE68A" opacity="0.9" />
      <circle cx="40" cy="240" r="6" fill="#93C5FD" />
    </svg>
  )
}
