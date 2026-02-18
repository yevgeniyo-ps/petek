import { useMemo } from 'react';
import { InsurancePolicy } from '../../types';
import { type InsuranceLang, translateCategory, translateValue } from '../../lib/insurance-i18n';

interface Props {
  policies: InsurancePolicy[];
  lang: InsuranceLang;
}

function annualize(premium: number | null, type: string): number {
  if (premium == null) return 0;
  if (type === 'חודשית') return premium * 12;
  if (type === 'שנתית') return premium;
  if (type === 'רבעונית') return premium * 4;
  return premium;
}

function formatNIS(amount: number): string {
  if (amount >= 1000) {
    const k = amount / 1000;
    return `₪${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  return `₪${Math.round(amount).toLocaleString('en-IL')}`;
}

export default function InsuranceDashboard({ policies, lang }: Props) {
  const stats = useMemo(() => {
    let monthlyTotal = 0;
    let annualTotal = 0;
    const companies = new Set<string>();
    const byCategory = new Map<string, number>();
    const byCompany = new Map<string, number>();

    for (const p of policies) {
      companies.add(p.company);

      const annual = annualize(p.premium_nis, p.premium_type);
      annualTotal += annual;

      const cat = p.category || 'Other';
      byCategory.set(cat, (byCategory.get(cat) ?? 0) + annual);
      byCompany.set(p.company, (byCompany.get(p.company) ?? 0) + annual);
    }

    monthlyTotal = annualTotal / 12;

    const sortDesc = (m: Map<string, number>) =>
      Array.from(m.entries()).sort((a, b) => b[1] - a[1]);

    return {
      totalPolicies: policies.length,
      monthlyTotal,
      annualTotal,
      companiesCount: companies.size,
      byCategory: sortDesc(byCategory),
      byCompany: sortDesc(byCompany),
    };
  }, [policies]);

  const maxCategoryCost = stats.byCategory[0]?.[1] ?? 1;
  const maxCompanyCost = stats.byCompany[0]?.[1] ?? 1;

  const labels = lang === 'he'
    ? { policies: 'פוליסות', monthly: 'חודשי', annual: 'שנתי', companies: 'חברות', byCategory: 'לפי תחום', byCompany: 'לפי חברה' }
    : { policies: 'Policies', monthly: 'Monthly', annual: 'Annual', companies: 'Companies', byCategory: 'By Category', byCompany: 'By Company' };

  return (
    <div className="mt-8 mb-6">
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard value={stats.totalPolicies.toString()} label={labels.policies} />
        <StatCard
          value={`₪${Math.round(stats.monthlyTotal).toLocaleString('en-IL')}`}
          label={labels.monthly}
        />
        <StatCard
          value={`₪${Math.round(stats.annualTotal).toLocaleString('en-IL')}`}
          label={labels.annual}
        />
        <StatCard value={stats.companiesCount.toString()} label={labels.companies} />
      </div>

      {/* Bar charts */}
      <div className="grid grid-cols-2 gap-8">
        <BarChart
          title={labels.byCategory}
          items={stats.byCategory.map(([name, cost]) => ({
            label: translateCategory(name, lang),
            cost,
            pct: (cost / maxCategoryCost) * 100,
          }))}
        />
        <BarChart
          title={labels.byCompany}
          items={stats.byCompany.map(([name, cost]) => ({
            label: translateValue(name, lang),
            cost,
            pct: (cost / maxCompanyCost) * 100,
          }))}
        />
      </div>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-[#13111c] border border-[#1c1928] rounded-xl px-5 py-4">
      <div className="text-[22px] font-bold text-white tabular-nums">{value}</div>
      <div className="text-[12px] text-[#7a7890] mt-0.5">{label}</div>
    </div>
  );
}

function BarChart({ title, items }: { title: string; items: { label: string; cost: number; pct: number }[] }) {
  return (
    <div>
      <h3 className="text-[13px] text-[#7a7890] font-medium mb-3">{title}</h3>
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[13px] text-[#e0dfe4] truncate mr-3">{item.label}</span>
              <span className="text-[12px] text-[#7a7890] tabular-nums whitespace-nowrap">
                {formatNIS(item.cost)}
              </span>
            </div>
            <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#ec4899] rounded-full transition-all duration-500"
                style={{ width: `${Math.max(item.pct, 2)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
