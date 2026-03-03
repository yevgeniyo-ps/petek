import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import AbstractAnimation from './AbstractAnimation';

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
