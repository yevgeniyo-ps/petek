import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Note } from '../../types';
import NoteCard from './NoteCard';

interface NoteBoardProps {
  notes: Note[];
  onNoteClick: (note: Note) => void;
  onReorder?: (activeId: string, overId: string) => void;
  sectionTitle?: string;
  groupId?: string;
}

export default function NoteBoard({ notes, onNoteClick, onReorder, sectionTitle, groupId }: NoteBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: groupId || '_standalone',
    disabled: !groupId,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // In standalone mode, hide when empty
  if (!groupId && notes.length === 0) return null;

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && onReorder) {
      onReorder(active.id as string, over.id as string);
    }
    setActiveId(null);
  };
  const handleDragCancel = () => setActiveId(null);
  const activeNote = activeId ? notes.find(n => n.id === activeId) : null;

  const grid = (
    <div
      ref={groupId ? setDroppableRef : undefined}
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${
        groupId && notes.length === 0 ? 'min-h-[80px]' : ''
      }`}
    >
      {notes.length > 0 ? (
        notes.map(note => (
          <NoteCard key={note.id} note={note} onClick={() => onNoteClick(note)} />
        ))
      ) : (
        <div className="col-span-full flex items-center justify-center py-4 text-[13px] text-[#4a4660]">
          Drag notes here
        </div>
      )}
    </div>
  );

  const content = (
    <SortableContext items={notes.map(n => n.id)} strategy={rectSortingStrategy}>
      {grid}
    </SortableContext>
  );

  return (
    <div className={`mb-6 rounded-xl border transition-colors ${
      isOver && groupId ? 'border-[#ec4899]/40 bg-[#ec4899]/[0.03]' : 'border-[#2a2740] bg-[#1a1726]/40'
    }`}>
      {sectionTitle && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`w-full flex items-center gap-2.5 px-5 py-3 text-left transition-colors hover:bg-white/[0.02] ${collapsed ? '' : 'border-b border-white/[0.04]'}`}
        >
          {collapsed ? (
            <ChevronRight size={14} className="text-[#7a7890] shrink-0" />
          ) : (
            <ChevronDown size={14} className="text-[#7a7890] shrink-0" />
          )}
          <div className="w-1.5 h-1.5 rounded-full bg-[#ec4899] shrink-0" />
          <h2 className="text-[12px] font-semibold text-[#b0adc0] uppercase tracking-wider">
            {sectionTitle}
          </h2>
          <span className="text-[11px] text-[#4a4660] ml-auto">{notes.length}</span>
        </button>
      )}
      {!collapsed && <div className="p-4">
        {groupId ? content : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            {content}
            <DragOverlay dropAnimation={null}>
              {activeNote ? <NoteCard note={activeNote} onClick={() => {}} overlay /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>}
    </div>
  );
}
