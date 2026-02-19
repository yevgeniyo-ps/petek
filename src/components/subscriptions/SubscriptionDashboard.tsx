import { useMemo, useState } from 'react';
import { Subscription } from '../../types';
import { toMonthly, formatNIS } from '../../lib/subscription-constants';

interface Props {
  subscriptions: Subscription[];
}

type Period = 'monthly' | 'yearly';

export default function SubscriptionDashboard({ subscriptions }: Props) {
  const [period, setPeriod] = useState<Period>('monthly');

  const stats = useMemo(() => {
    let monthlyTotal = 0;
    let autoRenewCount = 0;
    const categories = new Set<string>();

    for (const s of subscriptions) {
      monthlyTotal += toMonthly(s.amount, s.billing_cycle);
      categories.add(s.category);
      if (s.auto_renew) autoRenewCount++;
    }

    return {
      count: subscriptions.length,
      monthlyTotal,
      yearlyTotal: monthlyTotal * 12,
      autoRenewCount,
      categoriesCount: categories.size,
    };
  }, [subscriptions]);

  const cost = period === 'monthly' ? stats.monthlyTotal : stats.yearlyTotal;

  return (
    <div className="mt-8 mb-6">
      <div className="grid grid-cols-3 gap-4">
        {/* Total cost */}
        <div className="bg-[#13111c] border border-[#1c1928] rounded-xl px-5 py-4">
          <div className="text-[22px] font-bold text-white tabular-nums">
            {formatNIS(cost)}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex rounded border border-[#1c1928] overflow-hidden">
              <button
                onClick={() => setPeriod('monthly')}
                className={`px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  period === 'monthly'
                    ? 'bg-[#1a1730] text-white'
                    : 'text-[#4a4660] hover:text-[#7a7890]'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setPeriod('yearly')}
                className={`px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  period === 'yearly'
                    ? 'bg-[#1a1730] text-white'
                    : 'text-[#4a4660] hover:text-[#7a7890]'
                }`}
              >
                Yearly
              </button>
            </div>
          </div>
        </div>

        {/* Active count */}
        <div className="bg-[#13111c] border border-[#1c1928] rounded-xl px-5 py-4">
          <div className="text-[22px] font-bold text-white tabular-nums">{stats.count}</div>
          <div className="text-[12px] text-[#7a7890] mt-0.5">
            Subscriptions{stats.autoRenewCount > 0 && ` · ${stats.autoRenewCount} auto-renewing`}
          </div>
        </div>

        {/* Categories */}
        <div className="bg-[#13111c] border border-[#1c1928] rounded-xl px-5 py-4">
          <div className="text-[22px] font-bold text-white tabular-nums">{stats.categoriesCount}</div>
          <div className="text-[12px] text-[#7a7890] mt-0.5">Categories</div>
        </div>
      </div>
    </div>
  );
}
