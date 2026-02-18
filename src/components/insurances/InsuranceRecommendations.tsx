import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Clock, Copy, AlertTriangle, ShieldQuestion, Building2 } from 'lucide-react';
import { InsurancePolicy } from '../../types';
import { type InsuranceLang, translateValue } from '../../lib/insurance-i18n';

interface Props {
  policies: InsurancePolicy[];
  lang: InsuranceLang;
}

type Severity = 'orange' | 'yellow' | 'blue' | 'gray';

interface Recommendation {
  severity: Severity;
  title: string;
  description: string;
  icon: React.ReactNode;
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
  gray: 'border-l-[#4a4660]',
};

export default function InsuranceRecommendations({ policies, lang }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const recommendations = useMemo(() => {
    const recs: Recommendation[] = [];
    const isHe = lang === 'he';
    const now = new Date();
    const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;

    // 1. Expiring soon
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
        });
      }
    }

    // 2. Possible duplicates
    const combos = new Map<string, InsurancePolicy[]>();
    for (const p of policies) {
      const key = `${p.main_branch}|${p.sub_branch}`;
      const arr = combos.get(key) ?? [];
      arr.push(p);
      combos.set(key, arr);
    }
    for (const [, group] of combos) {
      if (group.length < 2) continue;
      const p = group[0]!;
      const name = isHe ? p.sub_branch : translateValue(p.sub_branch, 'en');
      recs.push({
        severity: 'yellow',
        title: isHe
          ? `כפילות אפשרית: ${name} (${group.length} פוליסות)`
          : `Possible duplicate: ${name} (${group.length} policies)`,
        description: isHe
          ? `נמצאו ${group.length} פוליסות עם אותו ענף ראשי ומשני. בדוק אם מדובר בכיסוי כפול.`
          : `Found ${group.length} policies with the same main & sub branch. Check if this is redundant coverage.`,
        icon: <Copy size={16} />,
      });
    }

    // 3. High premium alert
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
        });
      }
    }

    // 4. Missing coverage
    const allSubBranches = new Set(policies.map(p => p.sub_branch));
    const allMainBranches = new Set(policies.map(p => p.main_branch));
    const missing: { name: string; nameEn: string }[] = [];
    if (!allSubBranches.has('אובדן כושר עבודה') && !allMainBranches.has('אובדן כושר עבודה')) {
      missing.push({ name: 'אובדן כושר עבודה', nameEn: 'Disability (Loss of Work Capacity)' });
    }
    if (!allSubBranches.has('ביטוח נסיעות לחו"ל') && !allMainBranches.has('ביטוח נסיעות לחו"ל')) {
      missing.push({ name: 'ביטוח נסיעות לחו"ל', nameEn: 'Travel Insurance' });
    }
    if (!allSubBranches.has('ביטוח צד ג') && !allMainBranches.has('ביטוח צד ג')) {
      missing.push({ name: 'ביטוח צד ג', nameEn: 'Third Party Liability' });
    }
    for (const m of missing) {
      recs.push({
        severity: 'gray',
        title: isHe
          ? `כיסוי חסר: ${m.name}`
          : `Missing coverage: ${m.nameEn}`,
        description: isHe
          ? 'לא נמצא כיסוי זה בפוליסות שלך. שקול אם הוא נחוץ עבורך.'
          : 'This coverage type was not found in your policies. Consider if you need it.',
        icon: <ShieldQuestion size={16} />,
      });
    }

    // 5. Single provider concentration
    const byCompany = new Map<string, number>();
    let totalAnnual = 0;
    for (const p of policies) {
      const annual = annualize(p.premium_nis, p.premium_type);
      totalAnnual += annual;
      byCompany.set(p.company, (byCompany.get(p.company) ?? 0) + annual);
    }
    if (totalAnnual > 0) {
      for (const [company, amount] of byCompany) {
        const ratio = amount / totalAnnual;
        if (ratio > 0.7) {
          const name = isHe ? company : translateValue(company, 'en');
          recs.push({
            severity: 'gray',
            title: isHe
              ? `ריכוז גבוה: ${Math.round(ratio * 100)}% מהפרמיות ב-${name}`
              : `High concentration: ${Math.round(ratio * 100)}% of premiums at ${name}`,
            description: isHe
              ? 'שקול לפזר סיכונים בין מספר חברות ביטוח.'
              : 'Consider diversifying across multiple insurance providers.',
            icon: <Building2 size={16} />,
          });
        }
      }
    }

    return recs;
  }, [policies, lang]);

  if (recommendations.length === 0) return null;

  const isHe = lang === 'he';

  return (
    <div className="mb-6">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 w-full text-left mb-3 group"
      >
        <span className="text-[13px] text-[#7a7890] font-medium">
          {isHe ? 'המלצות' : 'Recommendations'} ({recommendations.length})
        </span>
        {collapsed
          ? <ChevronDown size={14} className="text-[#7a7890]" />
          : <ChevronUp size={14} className="text-[#7a7890]" />
        }
      </button>

      {!collapsed && (
        <div className="space-y-2">
          {recommendations.map((rec, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 bg-[#13111c] border border-[#1c1928] border-l-[3px] ${BORDER_COLORS[rec.severity]} rounded-lg px-4 py-3`}
            >
              <div className={`mt-0.5 shrink-0 ${
                rec.severity === 'orange' ? 'text-orange-500' :
                rec.severity === 'yellow' ? 'text-yellow-500' :
                rec.severity === 'blue' ? 'text-blue-500' :
                'text-[#7a7890]'
              }`}>
                {rec.icon}
              </div>
              <div className="min-w-0">
                <div className="text-[13px] text-white font-medium">{rec.title}</div>
                <div className="text-[12px] text-[#7a7890] mt-0.5">{rec.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
