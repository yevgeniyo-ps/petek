import { NoteColor, NoteColorConfig } from '../types';

export const NOTE_COLORS: Record<NoteColor, NoteColorConfig> = {
  default:  { name: 'Default',  bg: '#13111c', border: '#1c1928' },
  coral:    { name: 'Coral',    bg: '#2d1518', border: '#4a2228' },
  peach:    { name: 'Peach',    bg: '#2d1f12', border: '#4a3320' },
  sand:     { name: 'Sand',     bg: '#2d2a12', border: '#4a4520' },
  mint:     { name: 'Mint',     bg: '#122d1c', border: '#204a30' },
  sage:     { name: 'Sage',     bg: '#122d28', border: '#204a42' },
  sky:      { name: 'Sky',      bg: '#121e2d', border: '#20334a' },
  lavender: { name: 'Lavender', bg: '#22152d', border: '#38244a' },
  rose:     { name: 'Rose',     bg: '#2d1226', border: '#4a2040' },
  ember:    { name: 'Ember',    bg: '#2d1a0e', border: '#4a2c18' },
  teal:     { name: 'Teal',     bg: '#0e2d2a', border: '#184a45' },
  plum:     { name: 'Plum',     bg: '#261228', border: '#402040' },
};

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function truncateMarkdown(content: string, maxLength = 200): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + '...';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
