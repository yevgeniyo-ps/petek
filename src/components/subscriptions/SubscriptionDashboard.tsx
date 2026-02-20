import { useMemo, useState } from 'react';
import { Subscription, Currency } from '../../types';
import { toMonthly, formatAmount } from '../../lib/subscription-constants';

interface Props {
  subscriptions: Subscription[];
}

type Period = 'monthly' | 'yearly';

export default function SubscriptionDashboard({ subscriptions }: Props) {
  const [period, setPeriod] = useState<Period>('monthly');

  const stats = useMemo(() => {
    const monthlyByCurrency: Partial<Record<Currency, number>> = {};
    let activeCount = 0;
    let blockedCount = 0;
    for (const s of subscriptions) {
      const cur = s.currency ?? 'USD';
      monthlyByCurrency[cur] = (monthlyByCurrency[cur] ?? 0) + toMonthly(s.amount, s.billing_cycle);
      if (s.status === 'blocked') blockedCount++;
      else activeCount++;
    }

    const activeCurrencies = Object.entries(monthlyByCurrency)
      .filter(([, v]) => v && v > 0) as [Currency, number][];

    return {
      count: subscriptions.length,
      activeCurrencies,
      activeCount,
      blockedCount,
    };
  }, [subscriptions]);

  return (
    <div className="mt-8 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total cost */}
        <div className="bg-[#13111c] border border-[#1c1928] rounded-xl px-5 py-4">
          <div className="space-y-1">
            {stats.activeCurrencies.length === 0 ? (
              <div className="text-[22px] font-bold text-white tabular-nums">
                {formatAmount(0)}
              </div>
            ) : (
              stats.activeCurrencies.map(([cur, monthly]) => {
                const cost = period === 'monthly' ? monthly : monthly * 12;
                return (
                  <div key={cur} className="text-[22px] font-bold text-white tabular-nums">
                    {formatAmount(cost, cur)}
                  </div>
                );
              })
            )}
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
            {stats.activeCount} active{stats.blockedCount > 0 && ` · ${stats.blockedCount} blocked`}
          </div>
        </div>

      </div>
    </div>
  );
}
