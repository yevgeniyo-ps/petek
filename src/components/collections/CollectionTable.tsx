import { Trash2 } from 'lucide-react';
import { CollectionField, CollectionItem } from '../../types';
import FieldRenderer from './FieldRenderer';

interface CollectionTableProps {
  fields: CollectionField[];
  items: CollectionItem[];
  onItemClick: (item: CollectionItem) => void;
  onDeleteItem: (id: string) => void;
}

export default function CollectionTable({ fields, items, onItemClick, onDeleteItem }: CollectionTableProps) {
  if (fields.length === 0) {
    return (
      <div className="rounded-xl border border-[#1c1928] bg-[#0f0d18] py-16 text-center">
        <p className="text-[14px] text-[#7a7890]">No fields defined yet. Open settings to add fields.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#1c1928] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1c1928]">
              {fields.map(field => (
                <th
                  key={field.id}
                  className="px-4 py-3 text-left text-[12px] font-medium text-[#7a7890] uppercase tracking-wider whitespace-nowrap bg-[#0f0d18]"
                >
                  {field.name}
                </th>
              ))}
              <th className="w-10 bg-[#0f0d18]" />
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr
                key={item.id}
                onClick={() => onItemClick(item)}
                className="border-b border-[#1c1928] last:border-b-0 hover:bg-white/[0.02] cursor-pointer transition-colors group"
              >
                {fields.map(field => (
                  <td key={field.id} className="px-4 py-3 text-[13px]">
                    <FieldRenderer field={field} value={item.data[field.id]} />
                  </td>
                ))}
                <td className="px-2 py-3">
                  <button
                    onClick={e => { e.stopPropagation(); onDeleteItem(item.id); }}
                    className="opacity-0 group-hover:opacity-100 text-[#7a7890] hover:text-red-400 transition-all p-1"
                    title="Delete item"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-[14px] text-[#7a7890]">No items yet. Add one to get started.</p>
        </div>
      )}
    </div>
  );
}
