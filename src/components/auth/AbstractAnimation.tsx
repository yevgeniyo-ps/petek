export default function AbstractAnimation() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, #1a0a1e 0%, #0c0a12 100%)',
        }}
      />

      {/* SVG filter for gooey blob merging */}
      <svg className="absolute w-0 h-0">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Animated blobs */}
      <div className="absolute inset-0" style={{ filter: 'url(#goo)' }}>
        {/* Primary pink blob */}
        <div
          className="absolute rounded-full"
          style={{
            width: '45%',
            height: '45%',
            left: '25%',
            top: '20%',
            background: 'radial-gradient(circle, #ec489940 0%, #ec489915 50%, transparent 70%)',
            animation: 'blob-drift 18s ease-in-out infinite',
          }}
        />
        {/* Deep purple blob */}
        <div
          className="absolute rounded-full"
          style={{
            width: '55%',
            height: '50%',
            left: '35%',
            top: '35%',
            background: 'radial-gradient(circle, #6d28d935 0%, #6d28d910 50%, transparent 70%)',
            animation: 'blob-drift 22s ease-in-out -4s infinite reverse',
          }}
        />
        {/* Warm accent blob */}
        <div
          className="absolute rounded-full"
          style={{
            width: '40%',
            height: '40%',
            left: '15%',
            top: '50%',
            background: 'radial-gradient(circle, #f472b630 0%, #f472b610 50%, transparent 70%)',
            animation: 'blob-drift 20s ease-in-out -8s infinite',
          }}
        />
        {/* Cool blue blob */}
        <div
          className="absolute rounded-full"
          style={{
            width: '35%',
            height: '45%',
            left: '50%',
            top: '10%',
            background: 'radial-gradient(circle, #818cf825 0%, #818cf808 50%, transparent 70%)',
            animation: 'blob-drift 24s ease-in-out -12s infinite reverse',
          }}
        />
      </div>

      {/* Mesh gradient overlay for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 50% 40% at 30% 40%, rgba(236, 72, 153, 0.08) 0%, transparent 100%),
            radial-gradient(ellipse 40% 50% at 70% 60%, rgba(109, 40, 217, 0.06) 0%, transparent 100%)
          `,
          animation: 'mesh-shift 30s ease-in-out infinite',
        }}
      />

      {/* Flowing lines / ribbons */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 800" preserveAspectRatio="none">
        <path
          d="M-50,200 C100,180 200,350 350,300 S550,200 650,250"
          fill="none"
          stroke="rgba(236, 72, 153, 0.12)"
          strokeWidth="1.5"
          style={{ animation: 'ribbon-flow 16s ease-in-out infinite' }}
        />
        <path
          d="M-50,400 C150,380 250,500 400,450 S600,350 700,400"
          fill="none"
          stroke="rgba(129, 140, 248, 0.08)"
          strokeWidth="1"
          style={{ animation: 'ribbon-flow 20s ease-in-out -6s infinite reverse' }}
        />
        <path
          d="M-50,550 C120,530 280,620 420,580 S580,500 700,540"
          fill="none"
          stroke="rgba(244, 114, 182, 0.10)"
          strokeWidth="1.2"
          style={{ animation: 'ribbon-flow 18s ease-in-out -3s infinite' }}
        />
      </svg>

      {/* Grain / noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />

      {/* Edge fade */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 60% at 50% 50%, transparent 0%, #0c0a12 100%)',
        }}
      />
    </div>
  );
}
