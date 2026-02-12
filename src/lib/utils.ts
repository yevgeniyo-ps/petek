import { NoteColor, NoteColorConfig } from '../types';

export const NOTE_COLORS: Record<NoteColor, NoteColorConfig> = {
  default:  { name: 'Default',  bg: '#13111c', border: '#1c1928' },
  coral:    { name: 'Coral',    bg: '#1c1112', border: '#2a1a1c' },
  peach:    { name: 'Peach',    bg: '#1c1711', border: '#2a231a' },
  sand:     { name: 'Sand',     bg: '#1c1b11', border: '#2a281a' },
  mint:     { name: 'Mint',     bg: '#111c15', border: '#1a2a20' },
  sage:     { name: 'Sage',     bg: '#111c1a', border: '#1a2a28' },
  sky:      { name: 'Sky',      bg: '#11151c', border: '#1a202a' },
  lavender: { name: 'Lavender', bg: '#17111c', border: '#231a2a' },
  rose:     { name: 'Rose',     bg: '#1c1118', border: '#2a1a25' },
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
