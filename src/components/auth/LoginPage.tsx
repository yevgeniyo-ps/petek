import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

function AbstractAnimation() {
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

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState('');

  return (
    <div className="min-h-screen bg-[#0c0a12] flex items-center justify-center relative overflow-hidden">
      <AbstractAnimation />

      <div className="relative z-10 w-full max-w-sm px-6 text-center">
        <h1 className="text-[32px] font-bold text-white mb-1">
          petek<span className="text-[#ec4899]">.</span>
        </h1>
        <p className="text-[14px] text-[#7a7890] mb-10">
          Keep everything in one place.
        </p>

        <button
          onClick={async () => {
            setError('');
            const { error } = await signInWithGoogle();
            if (error) setError(error.message);
          }}
          className="w-full flex items-center justify-center gap-3 py-2.5 bg-[#13111c]/80 backdrop-blur-sm border border-[#1c1928] hover:border-[#2d2a40] rounded-lg text-[13px] text-[#e0dfe4] transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {error && (
          <p className="text-[13px] text-[#f87171] mt-3">{error}</p>
        )}
      </div>
    </div>
  );
}
