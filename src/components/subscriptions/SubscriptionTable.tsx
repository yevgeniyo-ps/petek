import { useState } from 'react';
import { Pencil, Trash2, ExternalLink } from 'lucide-react';
import { Subscription } from '../../types';
import { formatAmount, getCategoryLabel, getCategoryIcon, getBillingCycleShort } from '../../lib/subscription-constants';

function getFaviconUrl(url: string): string | null {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return null;
  }
}

function SubIcon({ sub }: { sub: Subscription }) {
  const [faviconError, setFaviconError] = useState(false);
  const faviconUrl = sub.url ? getFaviconUrl(sub.url) : null;

  if (faviconUrl && !faviconError) {
    return (
      <img
        src={faviconUrl}
        alt=""
        width={16}
        height={16}
        className="shrink-0 rounded-sm"
        onError={() => setFaviconError(true)}
      />
    );
  }

  const Icon = getCategoryIcon(sub.category);
  return <Icon size={14} className="text-[#4a4660] shrink-0" />;
}

interface Props {
  subscriptions: Subscription[];
  onEdit: (subscription: Subscription) => void;
  onDelete: (subscription: Subscription) => void;
}

export default function SubscriptionTable({ subscriptions, onEdit, onDelete }: Props) {
  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-12 text-[14px] text-[#7a7890]">
        No subscriptions match your search.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#1c1928] overflow-hidden">
      <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-[#0f0d18] border-b border-[#1c1928]">
            <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7890] uppercase tracking-wider">Name</th>
            <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7890] uppercase tracking-wider">Amount</th>
            <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7890] uppercase tracking-wider">Category</th>
            <th className="text-center px-4 py-3 text-[12px] font-medium text-[#7a7890] uppercase tracking-wider w-24">Status</th>
            <th className="text-right px-4 py-3 text-[12px] font-medium text-[#7a7890] uppercase tracking-wider w-24">Actions</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map(sub => (
            <tr key={sub.id} className="border-b border-[#1c1928] last:border-b-0 hover:bg-white/[0.02] transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <SubIcon sub={sub} />
                  <span className="text-[13px] text-[#e0dfe4] font-medium">{sub.name}</span>
                  {sub.url && (
                    <a
                      href={sub.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#4a4660] hover:text-[#7a7890] transition-colors"
                      onClick={e => e.stopPropagation()}
                    >
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                {sub.notes && (
                  <div className="text-[11px] text-[#4a4660] mt-0.5 truncate max-w-xs">{sub.notes}</div>
                )}
              </td>
              <td className="px-4 py-3">
                <span className="text-[13px] text-white font-medium tabular-nums">
                  {formatAmount(sub.amount, sub.currency)}
                </span>
                <span className="text-[11px] text-[#4a4660] ml-0.5">
                  {getBillingCycleShort(sub.billing_cycle)}
                </span>
              </td>
              <td className="px-4 py-3 text-[13px] text-[#e0dfe4]">
                {getCategoryLabel(sub.category)}
              </td>
              <td className="px-4 py-3 text-center">
                <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/[0.06] text-[#7a7890]">
                  {sub.status === 'active' ? 'Active' : 'Blocked'}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onEdit(sub)}
                    className="p-1.5 rounded-md text-[#4a4660] hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => onDelete(sub)}
                    className="p-1.5 rounded-md text-[#4a4660] hover:text-red-400 hover:bg-red-500/[0.08] transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
