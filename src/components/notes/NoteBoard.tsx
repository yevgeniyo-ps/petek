import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { Note } from '../../types';
import NoteCard from './NoteCard';

interface NoteBoardProps {
  notes: Note[];
  onNoteClick: (note: Note) => void;
  onReorder?: (activeId: string, overId: string) => void;
  sectionTitle?: string;
}

export default function NoteBoard({ notes, onNoteClick, onReorder, sectionTitle }: NoteBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  if (notes.length === 0) return null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && onReorder) {
      onReorder(active.id as string, over.id as string);
    }
  };

  return (
    <div className="mb-8">
      {sectionTitle && (
        <h2 className="text-[11px] font-semibold text-[#7a7890] uppercase tracking-wider mb-4">
          {sectionTitle}
        </h2>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={notes.map(n => n.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {notes.map(note => (
              <NoteCard key={note.id} note={note} onClick={() => onNoteClick(note)} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
