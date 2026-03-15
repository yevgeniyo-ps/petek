import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Search, Plus, Archive, Tag, X, Star } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { arrayMove, SortableContext, horizontalListSortingStrategy, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useNotes } from '../context/NotesContext';
import { useLabels } from '../context/LabelsContext';
import NoteEditor from '../components/notes/NoteEditor';
import NoteCard from '../components/notes/NoteCard';
import { Note } from '../types';

function SortableLabelChip({ label, isSelected, onClick, onDelete }: {
  label: import('../types').Label;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: label.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'none',
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`group inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium transition-all cursor-grab active:cursor-grabbing ${
        isSelected
          ? 'bg-[#ec4899]/20 text-[#f472b6]'
          : 'bg-white/[0.04] text-[#7a7890] hover:text-[#b0adc0] hover:bg-white/[0.06]'
      }`}
    >
      <Tag size={11} />
      <span>{label.name}</span>
      <X
        size={10}
        className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
        onClick={e => { e.stopPropagation(); onDelete(); }}
      />
    </button>
  );
}

export default function HomePage() {
  const { notes, loading, createNote, updateNote, reorderNotes } = useNotes();
  const { labels, getLabelsForNote, getNoteIdsForLabel, createLabel, deleteLabel, reorderLabels, addLabelToNote, removeLabelFromNote } = useLabels();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [search, setSearch] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filterImportant, setFilterImportant] = useState(false);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const selectedTagId = searchParams.get('tag');

  useEffect(() => {
    if (addingCategory) categoryInputRef.current?.focus();
  }, [addingCategory]);

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (name) await createLabel(name);
    setNewCategoryName('');
    setAddingCategory(false);
  };

  const labelSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const handleLabelDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = labels.findIndex(l => l.id === active.id);
    const newIndex = labels.findIndex(l => l.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      reorderLabels(arrayMove(labels, oldIndex, newIndex));
    }
  }, [labels, reorderLabels]);

  const handleCategoryClick = (labelId: string) => {
    if (selectedTagId === labelId) {
      searchParams.delete('tag');
    } else {
      searchParams.set('tag', labelId);
    }
    setSearchParams(searchParams);
  };

  const filtered = useMemo(() => {
    let result = notes.filter(n => !n.is_archived && !n.is_trashed);
    if (filterImportant) {
      result = result.filter(n => n.is_important);
    }
    if (selectedTagId) {
      const noteIds = getNoteIdsForLabel(selectedTagId);
      result = result.filter(n => noteIds.includes(n.id));
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return a.position - b.position;
    });
  }, [notes, search, selectedTagId, filterImportant, getNoteIdsForLabel]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

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

  const handleDragCancel = () => setActiveId(null);

  const draggedNote = activeId ? filtered.find(n => n.id === activeId) : null;

  const handleSave = async (data: { title: string; content: string; emoji: string | null; labelId: string | null }) => {
    const { labelId, ...noteData } = data;
    if (editingNote) {
      await updateNote(editingNote.id, noteData);
      const currentLabel = getLabelsForNote(editingNote.id)[0];
      if (currentLabel?.id !== labelId) {
        if (currentLabel) await removeLabelFromNote(editingNote.id, currentLabel.id);
        if (labelId) await addLabelToNote(editingNote.id, labelId);
      }
    } else {
      const created = await createNote(noteData);
      if (labelId) await addLabelToNote(created.id, labelId);
    }
    setEditingNote(null);
  };

  const handleNoteClick = (note: Note) => {
    setEditingNote(note);
    setEditorOpen(true);
  };

  const handleNewNote = () => {
    setEditingNote(null);
    setEditorOpen(true);
  };

  if (loading) {
    return <div className="text-[#7a7890] text-[14px] text-center pt-40">Loading notes...</div>;
  }

  return (
    <div className="max-w-[1200px] px-4 py-6 md:px-12 md:py-10">
      {/* Page header */}
      <div className="mb-1">
        <h1 className="text-[26px] font-bold text-white leading-tight">Notes</h1>
        <p className="text-[14px] text-[#7a7890] mt-1">Create and manage your markdown notes</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mt-8 mb-4">
        <div className="relative">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a7890]" />
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-5 py-2 bg-transparent border border-[#1c1928] rounded-full text-[13px] text-[#e0dfe4] placeholder-[#4a4660] outline-none focus:border-[#2d2a40] transition-colors w-full md:w-72"
          />
        </div>
        <button
          onClick={() => setFilterImportant(!filterImportant)}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-medium transition-all ${
            filterImportant
              ? 'bg-[#ec4899]/20 text-[#f472b6]'
              : 'text-[#7a7890] hover:text-[#b0adc0] hover:bg-white/[0.04]'
          }`}
          title="Filter starred"
        >
          <Star size={13} className={filterImportant ? 'fill-[#f472b6]' : ''} />
          <span>Starred</span>
        </button>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2 flex-wrap mb-8">
        <DndContext
          id="label-sort"
          sensors={labelSensors}
          collisionDetection={closestCenter}
          onDragEnd={handleLabelDragEnd}
        >
          <SortableContext items={labels.map(l => l.id)} strategy={horizontalListSortingStrategy}>
            {labels.map(label => (
              <SortableLabelChip
                key={label.id}
                label={label}
                isSelected={selectedTagId === label.id}
                onClick={() => handleCategoryClick(label.id)}
                onDelete={() => deleteLabel(label.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
        {addingCategory ? (
          <input
            ref={categoryInputRef}
            type="text"
            value={newCategoryName}
            onChange={e => setNewCategoryName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleCreateCategory();
              if (e.key === 'Escape') { setAddingCategory(false); setNewCategoryName(''); }
            }}
            onBlur={handleCreateCategory}
            placeholder="Category name..."
            className="px-3 py-1 rounded-full bg-transparent border border-[#2d2a40] text-[12px] text-white placeholder-[#6b6882] outline-none focus:border-[#ec4899]/50 w-32"
          />
        ) : (
          <button
            onClick={() => setAddingCategory(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] text-[#7a7890] hover:text-[#ec4899] hover:bg-white/[0.04] transition-colors"
            title="Add category"
          >
            <Plus size={12} />
            <span>Category</span>
          </button>
        )}
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[#1c1928] bg-[#0f0d18] py-24 text-center">
          <p className="text-[14px] text-[#7a7890]">
            {search ? 'No notes found matching your criteria.' : 'No notes yet. Create one to get started.'}
          </p>
        </div>
      ) : (
        <DndContext
          id="note-sort"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={filtered.map(n => n.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(note => (
                <NoteCard key={note.id} note={note} onClick={() => handleNoteClick(note)} />
              ))}
            </div>
          </SortableContext>
          <DragOverlay dropAnimation={null}>
            {draggedNote ? <NoteCard note={draggedNote} onClick={() => {}} overlay /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Archive link */}
      {notes.some(n => n.is_archived) && (
        <button
          onClick={() => navigate('/archive')}
          className="mt-10 mx-auto flex items-center gap-2 text-[13px] text-[#7a7890] hover:text-[#b0adc0] transition-colors"
        >
          <Archive size={14} />
          <span>{notes.filter(n => n.is_archived).length} archived notes</span>
        </button>
      )}

      <NoteEditor
        note={editingNote}
        open={editorOpen}
        onClose={() => { setEditorOpen(false); setEditingNote(null); }}
        onSave={handleSave}
      />

      <button
        onClick={handleNewNote}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-[#ec4899] hover:bg-[#db2777] text-white shadow-lg shadow-[#ec4899]/25 hover:shadow-[#ec4899]/40 transition-all flex items-center justify-center z-30"
        title="New Note"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>
    </div>
  );
}
