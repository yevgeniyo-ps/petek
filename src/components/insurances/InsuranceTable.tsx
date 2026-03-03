import { useState, useEffect } from 'react';
import { Columns3, Columns4 } from 'lucide-react';
import type { InsurancePolicy } from '../../types';
import {
  COLUMN_LABELS,
  VISIBLE_COLUMNS,
  EXPANDED_COLUMNS,
  translateValue,
  translateCategory,
  type InsuranceLang,
  type ColumnKey,
} from '../../lib/insurance-i18n';

type Severity = 'orange' | 'yellow' | 'blue';

interface InsuranceTableProps {
  policies: InsurancePolicy[];
  lang: InsuranceLang;
  highlightedPolicies?: Set<string>;
  highlightSeverity?: Severity | null;
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

const HIGHLIGHT_BG: Record<Severity, string> = {
  orange: 'bg-orange-500/[0.08]',
  yellow: 'bg-yellow-500/[0.08]',
  blue: 'bg-blue-500/[0.08]',
};

const HIGHLIGHT_BORDER: Record<Severity, string> = {
  orange: 'border-l-2 border-l-orange-500',
  yellow: 'border-l-2 border-l-yellow-500',
  blue: 'border-l-2 border-l-blue-500',
};

export default function InsuranceTable({ policies, lang, highlightedPolicies, highlightSeverity }: InsuranceTableProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedPolicyNumber, setSelectedPolicyNumber] = useState<string | null>(null);
  const columns = expanded ? EXPANDED_COLUMNS : VISIBLE_COLUMNS;
  const labels = COLUMN_LABELS[lang];
  const isHe = lang === 'he';

  // Clear row selection when recommendation highlight activates
  useEffect(() => {
    if (highlightedPolicies && highlightedPolicies.size > 0) setSelectedPolicyNumber(null);
  }, [highlightedPolicies]);

  const hasRecHighlight = highlightedPolicies && highlightedPolicies.size > 0;
  const activeHighlight = hasRecHighlight ? highlightedPolicies : selectedPolicyNumber ? new Set([selectedPolicyNumber]) : null;

  return (
    <div className="rounded-xl border border-[#1c1928] overflow-hidden">
      <div className="flex items-center justify-end px-4 py-2 bg-[#0f0d18] border-b border-[#1c1928]">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-[12px] text-[#7a7890] hover:text-white transition-colors"
        >
          {expanded ? <Columns3 size={14} /> : <Columns4 size={14} />}
          {expanded
            ? (isHe ? 'תצוגה מצומצמת' : 'Compact view')
            : (isHe ? 'כל העמודות' : 'All columns')
          }
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1c1928]">
              {columns.map(col => (
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
            {policies.map(policy => {
              const recHighlighted = highlightedPolicies?.has(policy.policy_number) && highlightSeverity;
              const rowSelected = !hasRecHighlight && selectedPolicyNumber === policy.policy_number;
              const dimmed = activeHighlight && !activeHighlight.has(policy.policy_number);
              return (
              <tr
                key={policy.id}
                onClick={() => {
                  if (hasRecHighlight) return; // don't override recommendation highlight
                  setSelectedPolicyNumber(
                    selectedPolicyNumber === policy.policy_number ? null : policy.policy_number
                  );
                }}
                className={`border-b border-[#1c1928] last:border-b-0 transition-colors cursor-pointer ${
                  recHighlighted
                    ? `${HIGHLIGHT_BG[highlightSeverity]} ${HIGHLIGHT_BORDER[highlightSeverity]}`
                    : rowSelected
                    ? 'bg-[#ec4899]/[0.08] border-l-2 border-l-[#ec4899]'
                    : dimmed
                    ? 'opacity-40'
                    : 'hover:bg-white/[0.02]'
                }`}
              >
                {columns.map(col => (
                  <td
                    key={col}
                    className={`px-4 py-3 text-[13px] ${
                      col === 'premium_nis'
                        ? 'text-right text-white font-medium tabular-nums whitespace-nowrap'
                        : col === 'additional_details'
                        ? 'text-[#e0dfe4] max-w-[200px] truncate'
                        : 'text-[#e0dfe4] whitespace-nowrap'
                    }`}
                  >
                    {getCellValue(policy, col, lang)}
                  </td>
                ))}
              </tr>
              );
            })}
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
