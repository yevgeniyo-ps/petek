import { useMemo, useState, useCallback } from 'react';
import { useNotes } from '@shared/context/NotesContext';
import { useLabels } from '@shared/context/LabelsContext';
import { useTags } from '@shared/context/TagsContext';
import { useLanguage } from '@shared/i18n';
import { Note } from '@shared/types';
import { NoteCard } from './NoteCard';
import { Plus, FileText } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

type View = 'notes' | 'archive';

interface NoteListProps {
  view: View;
  search: string;
  filterLabel: string | null;
  filterImportant: boolean;
  filterTagIds: string[];
  onEdit: (note: Note) => void;
  onNew: () => void;
}

export function NoteList({ view, search, filterLabel, filterImportant, filterTagIds, onEdit, onNew }: NoteListProps) {
  const { notes, loading, reorderNotes } = useNotes();
  const { labels, getNoteIdsForLabel } = useLabels();
  const { getNoteIdsForTag } = useTags();
  const { t } = useLanguage();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const filtered = useMemo(() => {
    let result = notes.filter(n => {
      if (view === 'notes') return !n.is_archived && !n.is_trashed;
      if (view === 'archive') return n.is_archived && !n.is_trashed;
      return false;
    });

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
      );
    }

    if (filterImportant) {
      result = result.filter(n => n.is_important);
    }

    if (filterLabel === '__uncategorized') {
      const allLabeledIds = new Set<string>();
      for (const nl of labels) {
        for (const id of getNoteIdsForLabel(nl.id)) allLabeledIds.add(id);
      }
      result = result.filter(n => !allLabeledIds.has(n.id));
    } else if (filterLabel) {
      const noteIds = new Set(getNoteIdsForLabel(filterLabel));
      result = result.filter(n => noteIds.has(n.id));
    }

    if (filterTagIds.length > 0) {
      const noteIdSets = filterTagIds.map(tagId => new Set(getNoteIdsForTag(tagId)));
      result = result.filter(n => noteIdSets.every(s => s.has(n.id)));
    }

    // Pinned first, then by position
    return result.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return a.position - b.position;
    });
  }, [notes, view, search, filterImportant, filterLabel, filterTagIds, getNoteIdsForLabel, getNoteIdsForTag]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIndex = filtered.findIndex(n => n.id === active.id);
    const newIndex = filtered.findIndex(n => n.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(filtered, oldIndex, newIndex);
      reorderNotes(reordered.map((n, i) => ({ id: n.id, position: i + 1 })));
    }
  }, [filtered, reorderNotes]);

  const handleDragCancel = useCallback(() => setActiveId(null), []);

  const activeNote = activeId ? filtered.find(n => n.id === activeId) : null;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto relative">
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-[#4a4660]">
          <FileText size={32} className="mb-2 opacity-50" />
          <p className="text-sm">
            {search ? t.ext.noMatchingNotes : view === 'notes' ? t.ext.noNotesYet : t.ext.noArchiveNotes}
          </p>
        </div>
      ) : view === 'notes' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={filtered.map(n => n.id)} strategy={verticalListSortingStrategy}>
            <div className="p-3 space-y-2">
              {filtered.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onClick={() => onEdit(note)}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay dropAnimation={null}>
            {activeNote ? <NoteCard note={activeNote} onClick={() => {}} overlay /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="p-3 space-y-2">
          {filtered.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onClick={() => onEdit(note)}
            />
          ))}
        </div>
      )}

      {/* FAB for new note */}
      {view === 'notes' && (
        <button
          onClick={onNew}
          className="absolute bottom-4 right-4 w-11 h-11 bg-pink-500 hover:bg-pink-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
        >
          <Plus size={20} />
        </button>
      )}
    </div>
  );
}
