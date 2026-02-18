import { RepeatIcon } from 'lucide-react';

export default function SubscriptionsPage() {
  return (
    <div className="max-w-[1200px] px-12 py-10">
      <div className="flex items-center gap-3 mb-1">
        <RepeatIcon size={24} className="text-[#ec4899]" />
        <h1 className="text-[26px] font-bold text-white leading-tight">Subscriptions</h1>
      </div>
      <p className="text-[14px] text-[#7a7890] mt-2 mb-8">
        Track your recurring subscriptions and payments.
      </p>

      <div className="flex flex-col items-center justify-center py-20 rounded-xl bg-[#0f0d18] border border-[#1c1928]">
        <RepeatIcon size={40} className="text-[#4a4660] mb-4" />
        <p className="text-[15px] text-[#7a7890]">Coming soon</p>
      </div>
    </div>
  );
}
