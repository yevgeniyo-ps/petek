import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Clock, Copy, AlertTriangle } from 'lucide-react';
import { InsurancePolicy } from '../../types';
import { type InsuranceLang, translateValue } from '../../lib/insurance-i18n';

interface Props {
  policies: InsurancePolicy[];
  lang: InsuranceLang;
  activeRecIndex: number | null;
  onSelect: (index: number | null, policyNumbers: string[], severity: Severity) => void;
}

type Severity = 'orange' | 'yellow' | 'blue';

interface Recommendation {
  severity: Severity;
  title: string;
  description: string;
  icon: React.ReactNode;
  policies: { number: string; company: string }[];
  savingsPerYear: number;
}

function annualize(premium: number | null, type: string): number {
  if (premium == null) return 0;
  if (type === 'חודשית') return premium * 12;
  if (type === 'שנתית') return premium;
  if (type === 'רבעונית') return premium * 4;
  return premium;
}

function parseEndDate(coveragePeriod: string): Date | null {
  // Format: "dd/mm/yyyy - dd/mm/yyyy"
  const parts = coveragePeriod.split(' - ');
  if (parts.length < 2) return null;
  const end = parts[1]!.trim();
  const match = end.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  return new Date(+match[3]!, +match[2]! - 1, +match[1]!);
}

const BORDER_COLORS: Record<Severity, string> = {
  orange: 'border-l-orange-500',
  yellow: 'border-l-yellow-500',
  blue: 'border-l-blue-500',
};

export { type Severity };

export default function InsuranceRecommendations({ policies, lang, activeRecIndex, onSelect }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const recommendations = useMemo(() => {
    const recs: Recommendation[] = [];
    const isHe = lang === 'he';
    const now = new Date();
    const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;

    // 1. Expiring soon (no direct savings)
    for (const p of policies) {
      const end = parseEndDate(p.coverage_period);
      if (!end) continue;
      const diff = end.getTime() - now.getTime();
      if (diff > 0 && diff <= sixtyDaysMs) {
        const daysLeft = Math.ceil(diff / (24 * 60 * 60 * 1000));
        const name = isHe ? p.sub_branch : translateValue(p.sub_branch, 'en');
        recs.push({
          severity: 'orange',
          title: isHe
            ? `${name} פג תוקף בעוד ${daysLeft} ימים`
            : `${name} expires in ${daysLeft} days`,
          description: isHe
            ? `פוליסה ${p.policy_number} ב-${p.company} מסתיימת בקרוב. שקול לחדש.`
            : `Policy ${p.policy_number} at ${translateValue(p.company, 'en')} expires soon. Consider renewing.`,
          icon: <Clock size={16} />,
          policies: [{ number: p.policy_number, company: isHe ? p.company : translateValue(p.company, 'en') }],
          savingsPerYear: 0,
        });
      }
    }

    // 2. Possible duplicates — group by sub_branch, only flag if 2+ distinct policy numbers
    const combos = new Map<string, InsurancePolicy[]>();
    for (const p of policies) {
      const arr = combos.get(p.sub_branch) ?? [];
      arr.push(p);
      combos.set(p.sub_branch, arr);
    }
    for (const [, group] of combos) {
      const uniqueByNumber = new Map<string, InsurancePolicy>();
      for (const g of group) {
        if (!uniqueByNumber.has(g.policy_number)) uniqueByNumber.set(g.policy_number, g);
      }
      const unique = Array.from(uniqueByNumber.values());
      if (unique.length < 2) continue;
      const p = unique[0]!;
      const name = isHe ? p.sub_branch : translateValue(p.sub_branch, 'en');
      const annuals = unique.map(g => annualize(g.premium_nis, g.premium_type)).sort((a, b) => a - b);
      const dupSavings = annuals.slice(1).reduce((sum, v) => sum + v, 0);
      recs.push({
        severity: 'yellow',
        title: isHe
          ? `כפילות אפשרית: ${name} (${unique.length} פוליסות)`
          : `Possible duplicate: ${name} (${unique.length} policies)`,
        description: isHe
          ? `נמצאו ${unique.length} פוליסות שונות עם אותו סוג כיסוי. בדוק אם מדובר בכיסוי כפול.`
          : `Found ${unique.length} distinct policies with the same coverage type. Check if this is redundant.`,
        icon: <Copy size={16} />,
        policies: unique.map(g => ({ number: g.policy_number, company: isHe ? g.company : translateValue(g.company, 'en') })),
        savingsPerYear: dupSavings,
      });
    }

    // 3. High premium — estimated ~20% savings by shopping around
    for (const p of policies) {
      const annual = annualize(p.premium_nis, p.premium_type);
      if (annual > 2000) {
        const name = isHe ? p.sub_branch : translateValue(p.sub_branch, 'en');
        recs.push({
          severity: 'blue',
          title: isHe
            ? `פרמיה גבוהה: ${name} — ₪${Math.round(annual).toLocaleString('en-IL')}/שנה`
            : `High premium: ${name} — ₪${Math.round(annual).toLocaleString('en-IL')}/yr`,
          description: isHe
            ? 'שקול להשוות הצעות מחיר מחברות ביטוח אחרות.'
            : 'Consider comparing quotes from other insurers.',
          icon: <AlertTriangle size={16} />,
          policies: [{ number: p.policy_number, company: isHe ? p.company : translateValue(p.company, 'en') }],
          savingsPerYear: Math.round(annual * 0.2),
        });
      }
    }

    return recs;
  }, [policies, lang]);

  const totalSavings = useMemo(
    () => recommendations.reduce((sum, r) => sum + r.savingsPerYear, 0),
    [recommendations],
  );

  if (recommendations.length === 0) return null;

  const isHe = lang === 'he';
  const fmtSavings = (n: number) => `₪${Math.round(n).toLocaleString('en-IL')}`;

  return (
    <div className="mb-6">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 w-full text-left mb-3 group"
      >
        <span className="text-[13px] text-[#7a7890] font-medium">
          {isHe ? 'המלצות' : 'Recommendations'} ({recommendations.length})
        </span>
        {totalSavings > 0 && (
          <span className="text-[12px] text-emerald-400 font-medium">
            {isHe
              ? `חיסכון פוטנציאלי: ~${fmtSavings(totalSavings)}/שנה`
              : `Potential savings: ~${fmtSavings(totalSavings)}/yr`
            }
          </span>
        )}
        {collapsed
          ? <ChevronDown size={14} className="text-[#7a7890]" />
          : <ChevronUp size={14} className="text-[#7a7890]" />
        }
      </button>

      {!collapsed && (
        <div className="space-y-2">
          {recommendations.map((rec, i) => {
            const isActive = activeRecIndex === i;
            return (
              <button
                key={i}
                onClick={() => {
                  const numbers = rec.policies.map(p => p.number);
                  onSelect(isActive ? null : i, numbers, rec.severity);
                }}
                className={`flex items-start gap-3 w-full text-left border border-l-[3px] ${BORDER_COLORS[rec.severity]} rounded-lg px-4 py-3 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#1a1730] border-[#2d2a40]'
                    : 'bg-[#13111c] border-[#1c1928] hover:bg-[#16141f]'
                }`}
              >
                <div className={`mt-0.5 shrink-0 ${
                  rec.severity === 'orange' ? 'text-orange-500' :
                  rec.severity === 'yellow' ? 'text-yellow-500' :
                  'text-blue-500'
                }`}>
                  {rec.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] text-white font-medium flex items-center gap-2 flex-wrap">
                    {rec.title}
                    {rec.savingsPerYear > 0 && (
                      <span className="text-[11px] text-emerald-400 font-normal">
                        {isHe ? `~${fmtSavings(rec.savingsPerYear)}/שנה` : `~${fmtSavings(rec.savingsPerYear)}/yr`}
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-[#7a7890] mt-0.5">{rec.description}</div>
                  <div className="text-[11px] mt-1 flex items-center gap-2 flex-wrap">
                    {rec.policies.map((p, j) => (
                      <span key={j} className={isActive ? 'text-[#7a7890]' : 'text-[#4a4660]'}>
                        {isHe ? 'פוליסה' : 'Policy'} {p.number} · {p.company}
                      </span>
                    ))}
                    <span className={`text-[11px] ${isActive ? 'text-[#7a7890]' : 'text-[#4a4660]'}`}>
                      {isActive
                        ? (isHe ? '— לחץ לביטול' : '— click to clear')
                        : (isHe ? '— לחץ להדגשה בטבלה' : '— click to highlight')
                      }
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
