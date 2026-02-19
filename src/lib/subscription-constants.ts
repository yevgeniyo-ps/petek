import { BillingCycle, SubscriptionCategory } from '../types';

export const BILLING_CYCLES: { value: BillingCycle; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export const SUBSCRIPTION_CATEGORIES: { value: SubscriptionCategory; label: string; emoji: string }[] = [
  { value: 'streaming', label: 'Streaming', emoji: '🎬' },
  { value: 'software', label: 'Software', emoji: '💻' },
  { value: 'fitness', label: 'Fitness', emoji: '💪' },
  { value: 'music', label: 'Music', emoji: '🎵' },
  { value: 'cloud', label: 'Cloud', emoji: '☁️' },
  { value: 'news', label: 'News', emoji: '📰' },
  { value: 'gaming', label: 'Gaming', emoji: '🎮' },
  { value: 'other', label: 'Other', emoji: '📦' },
];

export function getCategoryLabel(category: SubscriptionCategory): string {
  return SUBSCRIPTION_CATEGORIES.find(c => c.value === category)?.label ?? category;
}

export function getCategoryEmoji(category: SubscriptionCategory): string {
  return SUBSCRIPTION_CATEGORIES.find(c => c.value === category)?.emoji ?? '📦';
}

export function getBillingCycleLabel(cycle: BillingCycle): string {
  return BILLING_CYCLES.find(c => c.value === cycle)?.label ?? cycle;
}

export function getBillingCycleShort(cycle: BillingCycle): string {
  switch (cycle) {
    case 'weekly': return '/wk';
    case 'monthly': return '/mo';
    case 'quarterly': return '/qtr';
    case 'yearly': return '/yr';
  }
}

export function toMonthly(amount: number, cycle: BillingCycle): number {
  switch (cycle) {
    case 'weekly': return amount * 4.33;
    case 'monthly': return amount;
    case 'quarterly': return amount / 3;
    case 'yearly': return amount / 12;
  }
}

export function toYearly(amount: number, cycle: BillingCycle): number {
  return toMonthly(amount, cycle) * 12;
}

export function formatNIS(amount: number): string {
  return `₪${amount.toLocaleString('en-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
