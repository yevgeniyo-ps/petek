import { useMemo, useState } from 'react';
import { InsurancePolicy } from '../../types';
import { type InsuranceLang } from '../../lib/insurance-i18n';

interface Props {
  policies: InsurancePolicy[];
  lang: InsuranceLang;
}

type Period = 'monthly' | 'yearly';

function annualize(premium: number | null, type: string): number {
  if (premium == null) return 0;
  if (type === 'חודשית') return premium * 12;
  if (type === 'שנתית') return premium;
  if (type === 'רבעונית') return premium * 4;
  return premium;
}

export default function InsuranceDashboard({ policies, lang }: Props) {
  const [period, setPeriod] = useState<Period>('monthly');

  const stats = useMemo(() => {
    let annualTotal = 0;
    const companies = new Set<string>();

    for (const p of policies) {
      companies.add(p.company);
      annualTotal += annualize(p.premium_nis, p.premium_type);
    }

    return {
      totalPolicies: policies.length,
      annualTotal,
      monthlyTotal: annualTotal / 12,
      companiesCount: companies.size,
    };
  }, [policies]);

  const isHe = lang === 'he';
  const cost = period === 'monthly' ? stats.monthlyTotal : stats.annualTotal;

  return (
    <div className="mt-8 mb-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#13111c] border border-[#1c1928] rounded-xl px-5 py-4">
          <div className="text-[22px] font-bold text-white tabular-nums">{stats.totalPolicies}</div>
          <div className="text-[12px] text-[#7a7890] mt-0.5">{isHe ? 'פוליסות' : 'Policies'}</div>
        </div>
        <div className="bg-[#13111c] border border-[#1c1928] rounded-xl px-5 py-4">
          <div className="text-[22px] font-bold text-white tabular-nums">
            ₪{Math.round(cost).toLocaleString('en-IL')}
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
                {isHe ? 'חודשי' : 'Monthly'}
              </button>
              <button
                onClick={() => setPeriod('yearly')}
                className={`px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  period === 'yearly'
                    ? 'bg-[#1a1730] text-white'
                    : 'text-[#4a4660] hover:text-[#7a7890]'
                }`}
              >
                {isHe ? 'שנתי' : 'Yearly'}
              </button>
            </div>
          </div>
        </div>
        <div className="bg-[#13111c] border border-[#1c1928] rounded-xl px-5 py-4">
          <div className="text-[22px] font-bold text-white tabular-nums">{stats.companiesCount}</div>
          <div className="text-[12px] text-[#7a7890] mt-0.5">{isHe ? 'חברות' : 'Companies'}</div>
        </div>
      </div>
    </div>
  );
}
