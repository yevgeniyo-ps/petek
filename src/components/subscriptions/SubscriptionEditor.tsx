import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { Subscription, BillingCycle, SubscriptionCategory } from '../../types';
import { BILLING_CYCLES, SUBSCRIPTION_CATEGORIES } from '../../lib/subscription-constants';

interface SubscriptionEditorProps {
  subscription: Subscription | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Subscription, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

const inputClass = 'w-full px-3 py-2 bg-transparent border border-[#1c1928] rounded-lg text-[13px] text-[#e0dfe4] placeholder-[#4a4660] outline-none focus:border-[#2d2a40] transition-colors';
const labelClass = 'text-[12px] text-[#7a7890] mb-1.5 block';
const selectClass = 'w-full px-3 py-2 bg-[#0c0a12] border border-[#1c1928] rounded-lg text-[13px] text-[#e0dfe4] outline-none focus:border-[#2d2a40] transition-colors appearance-none cursor-pointer';

export default function SubscriptionEditor({ subscription, open, onClose, onSave }: SubscriptionEditorProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [category, setCategory] = useState<SubscriptionCategory>('other');
  const [nextPaymentDate, setNextPaymentDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [autoRenew, setAutoRenew] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (subscription) {
        setName(subscription.name);
        setAmount(String(subscription.amount));
        setBillingCycle(subscription.billing_cycle);
        setCategory(subscription.category);
        setNextPaymentDate(subscription.next_payment_date ?? '');
        setStartDate(subscription.start_date ?? '');
        setUrl(subscription.url);
        setNotes(subscription.notes);
        setAutoRenew(subscription.auto_renew);
      } else {
        setName('');
        setAmount('');
        setBillingCycle('monthly');
        setCategory('other');
        setNextPaymentDate('');
        setStartDate('');
        setUrl('');
        setNotes('');
        setAutoRenew(true);
      }
    }
  }, [open, subscription]);

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    if (!name.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        amount: parsedAmount,
        billing_cycle: billingCycle,
        category,
        next_payment_date: nextPaymentDate || null,
        start_date: startDate || null,
        url: url.trim(),
        notes: notes.trim(),
        auto_renew: autoRenew,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const isValid = name.trim() && amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0;
  const isEdit = !!subscription;

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6">
        <h3 className="text-[15px] font-semibold text-white mb-6">
          {isEdit ? 'Edit Subscription' : 'New Subscription'}
        </h3>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className={labelClass}>Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Netflix, Spotify, GitHub..."
              className={inputClass}
              autoFocus
            />
          </div>

          {/* Amount + Billing Cycle */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Amount (₪)</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Billing Cycle</label>
              <select
                value={billingCycle}
                onChange={e => setBillingCycle(e.target.value as BillingCycle)}
                className={selectClass}
              >
                {BILLING_CYCLES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className={labelClass}>Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as SubscriptionCategory)}
              className={selectClass}
            >
              {SUBSCRIPTION_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Next Payment</label>
              <input
                type="date"
                value={nextPaymentDate}
                onChange={e => setNextPaymentDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* URL */}
          <div>
            <label className={labelClass}>Website URL</label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Auto-renew toggle */}
          <div className="flex items-center justify-between px-1 py-1">
            <span className="text-[13px] text-[#c0bfd0]">Auto-renew</span>
            <button
              type="button"
              role="switch"
              aria-checked={autoRenew}
              onClick={() => setAutoRenew(!autoRenew)}
              className={`relative w-9 h-5 rounded-full transition-colors ${
                autoRenew ? 'bg-[#ec4899]' : 'bg-[#2a2740]'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                autoRenew ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[13px] text-[#7a7890] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid || saving}
            className="px-5 py-2 text-[13px] font-medium text-white bg-[#ec4899] hover:bg-[#db2777] disabled:opacity-40 disabled:cursor-not-allowed rounded-full transition-colors"
          >
            {saving ? 'Saving...' : isEdit ? 'Save' : 'Add'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
