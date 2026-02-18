import type { InsurancePolicy } from '../../types';
import {
  COLUMN_LABELS,
  VISIBLE_COLUMNS,
  translateValue,
  translateCategory,
  type InsuranceLang,
  type ColumnKey,
} from '../../lib/insurance-i18n';

interface InsuranceTableProps {
  policies: InsurancePolicy[];
  lang: InsuranceLang;
}

const PREMIUM_SUFFIX: Record<string, string> = {
  'חודשית': '/mo',
  'שנתית': '/yr',
  'רבעונית': '/qtr',
};

function formatPremium(value: number | null, premiumType: string): string {
  if (value == null) return '—';
  const formatted = value.toLocaleString('en-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const suffix = PREMIUM_SUFFIX[premiumType] ?? '';
  return `₪${formatted}${suffix}`;
}

function getCellValue(policy: InsurancePolicy, col: ColumnKey, lang: InsuranceLang): string {
  const raw = policy[col as keyof InsurancePolicy];
  if (raw == null || raw === '') return '—';

  if (col === 'premium_nis') return formatPremium(raw as number | null, policy.premium_type);
  if (col === 'category') return translateCategory(String(raw), lang);

  return translateValue(String(raw), lang);
}

export default function InsuranceTable({ policies, lang }: InsuranceTableProps) {
  const labels = COLUMN_LABELS[lang];

  return (
    <div className="rounded-xl border border-[#1c1928] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1c1928]">
              {VISIBLE_COLUMNS.map(col => (
                <th
                  key={col}
                  className={`px-4 py-3 text-left text-[12px] font-medium text-[#7a7890] uppercase tracking-wider whitespace-nowrap bg-[#0f0d18] ${
                    col === 'premium_nis' ? 'text-right' : ''
                  }`}
                >
                  {labels[col]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {policies.map(policy => (
              <tr
                key={policy.id}
                className="border-b border-[#1c1928] last:border-b-0 hover:bg-white/[0.02] transition-colors"
              >
                {VISIBLE_COLUMNS.map(col => (
                  <td
                    key={col}
                    className={`px-4 py-3 text-[13px] whitespace-nowrap ${
                      col === 'premium_nis'
                        ? 'text-right text-white font-medium tabular-nums'
                        : 'text-[#e0dfe4]'
                    }`}
                  >
                    {getCellValue(policy, col, lang)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {policies.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-[14px] text-[#7a7890]">No policies match your search.</p>
        </div>
      )}
    </div>
  );
}
