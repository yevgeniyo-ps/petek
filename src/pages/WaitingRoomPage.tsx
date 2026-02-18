import { Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AbstractAnimation from '../components/auth/AbstractAnimation';

export default function WaitingRoomPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-[#0c0a12] flex items-center justify-center relative overflow-hidden">
      <AbstractAnimation />

      <div className="relative z-10 w-full max-w-sm px-6 text-center">
        <h1 className="text-[32px] font-bold text-white mb-6">
          petek<span className="text-[#ec4899]">.</span>
        </h1>

        <div className="flex justify-center mb-5">
          <div className="w-12 h-12 rounded-full bg-[#ec4899]/10 flex items-center justify-center">
            <Clock size={22} className="text-[#ec4899]" />
          </div>
        </div>

        <h2 className="text-[18px] font-semibold text-white mb-2">
          You're on the waiting list
        </h2>
        <p className="text-[14px] text-[#7a7890] mb-8 leading-relaxed">
          We'll send you an email at{' '}
          <span className="text-[#e0dfe4]">{user?.email}</span>{' '}
          once your access is approved.
        </p>

        <button
          onClick={signOut}
          className="text-[13px] text-[#7a7890] hover:text-white transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
