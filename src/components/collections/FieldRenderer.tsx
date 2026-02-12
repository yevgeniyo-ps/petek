import { Check, Minus, ExternalLink } from 'lucide-react';
import { CollectionField } from '../../types';

interface FieldRendererProps {
  field: CollectionField;
  value: unknown;
}

export default function FieldRenderer({ field, value }: FieldRendererProps) {
  if (value === undefined || value === null || value === '') {
    return <span className="text-[#4a4660]">—</span>;
  }

  switch (field.field_type) {
    case 'text':
      return <span className="text-[#e0dfe4] truncate block max-w-[200px]">{String(value)}</span>;

    case 'number': {
      const prefix = field.options?.prefix ?? '';
      const suffix = field.options?.suffix ?? '';
      return <span className="text-[#e0dfe4]">{prefix}{String(value)}{suffix}</span>;
    }

    case 'date': {
      const d = new Date(String(value));
      const formatted = isNaN(d.getTime()) ? String(value) : d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
      return <span className="text-[#e0dfe4]">{formatted}</span>;
    }

    case 'select':
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#ec4899]/15 text-[#ec4899] border border-[#ec4899]/20">
          {String(value)}
        </span>
      );

    case 'checkbox':
      return value ? (
        <Check size={16} className="text-[#ec4899]" />
      ) : (
        <Minus size={16} className="text-[#4a4660]" />
      );

    case 'url': {
      const url = String(value);
      let domain = url;
      try { domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname; } catch {}
      return (
        <a
          href={url.startsWith('http') ? url : `https://${url}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[#ec4899] hover:text-[#db2777] transition-colors text-[13px]"
          onClick={e => e.stopPropagation()}
        >
          {domain}
          <ExternalLink size={12} />
        </a>
      );
    }

    default:
      return <span className="text-[#e0dfe4]">{String(value)}</span>;
  }
}
