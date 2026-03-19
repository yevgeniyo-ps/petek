export function formatDate(dateStr: string, locale?: string, strings?: { yesterday: string; daysAgo: string }): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString(locale ? [locale] : [], { hour: '2-digit', minute: '2-digit' });
  }
  if (days === 1) return strings?.yesterday ?? 'Yesterday';
  if (days < 7) return strings?.daysAgo?.replace('{n}', String(days)) ?? `${days} days ago`;
  return date.toLocaleDateString(locale ? [locale] : [], { month: 'short', day: 'numeric' });
}

export function truncateMarkdown(content: string, maxLength = 200): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + '...';
}

/** Strip markdown syntax for plain-text preview (avoids importing react-markdown). */
export function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')        // headings
    .replace(/\*\*(.+?)\*\*/g, '$1')    // bold
    .replace(/\*(.+?)\*/g, '$1')        // italic
    .replace(/__(.+?)__/g, '$1')        // bold alt
    .replace(/_(.+?)_/g, '$1')          // italic alt
    .replace(/~~(.+?)~~/g, '$1')        // strikethrough
    .replace(/`(.+?)`/g, '$1')          // inline code
    .replace(/```[\s\S]*?```/g, '')     // code blocks
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // links/images
    .replace(/^\s*[-*+]\s+/gm, '')      // unordered lists
    .replace(/^\s*\d+\.\s+/gm, '')      // ordered lists
    .replace(/^\s*>\s+/gm, '')          // blockquotes
    .replace(/\n{2,}/g, '\n')           // collapse blank lines
    .trim();
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
