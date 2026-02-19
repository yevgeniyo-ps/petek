import { Pencil, Trash2, ExternalLink, RotateCw } from 'lucide-react';
import { Subscription } from '../../types';
import { formatNIS, getCategoryLabel, getCategoryEmoji, getBillingCycleShort } from '../../lib/subscription-constants';

interface Props {
  subscriptions: Subscription[];
  onEdit: (subscription: Subscription) => void;
  onDelete: (subscription: Subscription) => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getDateStatus(dateStr: string | null): 'overdue' | 'soon' | 'normal' {
  if (!dateStr) return 'normal';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateStr + 'T00:00:00');
  const diffDays = (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 7) return 'soon';
  return 'normal';
}

const dateStatusClass = {
  overdue: 'text-red-400',
  soon: 'text-amber-400',
  normal: 'text-[#e0dfe4]',
};

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
      <table className="w-full">
        <thead>
          <tr className="bg-[#0f0d18] border-b border-[#1c1928]">
            <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7890] uppercase tracking-wider">Name</th>
            <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7890] uppercase tracking-wider">Amount</th>
            <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7890] uppercase tracking-wider">Category</th>
            <th className="text-left px-4 py-3 text-[12px] font-medium text-[#7a7890] uppercase tracking-wider">Next Payment</th>
            <th className="text-center px-4 py-3 text-[12px] font-medium text-[#7a7890] uppercase tracking-wider w-20">Renew</th>
            <th className="text-right px-4 py-3 text-[12px] font-medium text-[#7a7890] uppercase tracking-wider w-24">Actions</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map(sub => {
            const dateStatus = getDateStatus(sub.next_payment_date);
            return (
              <tr key={sub.id} className="border-b border-[#1c1928] last:border-b-0 hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px]">{getCategoryEmoji(sub.category)}</span>
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
                    {formatNIS(sub.amount)}
                  </span>
                  <span className="text-[11px] text-[#4a4660] ml-0.5">
                    {getBillingCycleShort(sub.billing_cycle)}
                  </span>
                </td>
                <td className="px-4 py-3 text-[13px] text-[#e0dfe4]">
                  {getCategoryLabel(sub.category)}
                </td>
                <td className={`px-4 py-3 text-[13px] ${dateStatusClass[dateStatus]}`}>
                  {formatDate(sub.next_payment_date)}
                </td>
                <td className="px-4 py-3 text-center">
                  {sub.auto_renew && (
                    <RotateCw size={14} className="inline-block text-[#4a4660]" />
                  )}
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
