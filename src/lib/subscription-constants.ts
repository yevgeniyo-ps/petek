import {
  Tv, Laptop, Dumbbell, Music, Cloud, Newspaper, Gamepad2, Package,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BillingCycle, Currency, SubscriptionCategory } from '../types';

export const BILLING_CYCLES: { value: BillingCycle; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export const SUBSCRIPTION_CATEGORIES: { value: SubscriptionCategory; label: string; icon: LucideIcon }[] = [
  { value: 'streaming', label: 'Streaming', icon: Tv },
  { value: 'software', label: 'Software', icon: Laptop },
  { value: 'fitness', label: 'Fitness', icon: Dumbbell },
  { value: 'music', label: 'Music', icon: Music },
  { value: 'cloud', label: 'Cloud', icon: Cloud },
  { value: 'news', label: 'News', icon: Newspaper },
  { value: 'gaming', label: 'Gaming', icon: Gamepad2 },
  { value: 'other', label: 'Other', icon: Package },
];

export function getCategoryLabel(category: SubscriptionCategory): string {
  return SUBSCRIPTION_CATEGORIES.find(c => c.value === category)?.label ?? category;
}

export function getCategoryIcon(category: SubscriptionCategory): LucideIcon {
  return SUBSCRIPTION_CATEGORIES.find(c => c.value === category)?.icon ?? Package;
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

export const CURRENCIES: { value: Currency; label: string; symbol: string }[] = [
  { value: 'USD', label: '$ USD', symbol: '$' },
  { value: 'ILS', label: '₪ ILS', symbol: '₪' },
  { value: 'EUR', label: '€ EUR', symbol: '€' },
  { value: 'GBP', label: '£ GBP', symbol: '£' },
  { value: 'RUB', label: '₽ RUB', symbol: '₽' },
  { value: 'UAH', label: '₴ UAH', symbol: '₴' },
];

export function getCurrencySymbol(currency: Currency): string {
  return CURRENCIES.find(c => c.value === currency)?.symbol ?? '₪';
}

export function formatAmount(amount: number, currency: Currency = 'ILS'): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${amount.toLocaleString('en-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
