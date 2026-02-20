import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Search, Plus, Archive, Tag, X } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { arrayMove } from '@dnd-kit/sortable';
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
import NoteBoard from '../components/notes/NoteBoard';
import NoteEditor from '../components/notes/NoteEditor';
import NoteCard from '../components/notes/NoteCard';
import { Note } from '../types';

export default function HomePage() {
  const { notes, loading, createNote, updateNote, reorderNotes } = useNotes();
  const { labels, getLabelsForNote, getNoteIdsForLabel, createLabel, deleteLabel, addLabelToNote, removeLabelFromNote } = useLabels();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [search, setSearch] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
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

  const handleCategoryClick = (labelId: string) => {
    if (selectedTagId === labelId) {
      searchParams.delete('tag');
    } else {
      searchParams.set('tag', labelId);
    }
    setSearchParams(searchParams);
  };

  const activeNotes = useMemo(() => {
    let filtered = notes.filter(n => !n.is_archived);
    if (selectedTagId) {
      const noteIds = getNoteIdsForLabel(selectedTagId);
      filtered = filtered.filter(n => noteIds.includes(n.id));
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [notes, search, selectedTagId, getNoteIdsForLabel]);

  const groupedNotes = useMemo(() => {
    const groups = new Map<string, { name: string; notes: Note[] }>();
    const uncategorized: Note[] = [];

    // When filtering by category, only show that category
    const visibleLabels = selectedTagId
      ? labels.filter(l => l.id === selectedTagId)
      : labels;

    for (const label of visibleLabels) {
      groups.set(label.id, { name: label.name, notes: [] });
    }

    for (const note of activeNotes) {
      const noteLabels = getLabelsForNote(note.id);
      const label = noteLabels[0];
      if (label && groups.has(label.id)) {
        groups.get(label.id)!.notes.push(note);
      } else if (!selectedTagId) {
        uncategorized.push(note);
      }
    }

    const sorted = [...groups.entries()]
      .sort(([, a], [, b]) => a.name.localeCompare(b.name))
      .map(([id, { name, notes }]) => ({ id, name, notes }));

    return { labeled: sorted, uncategorized };
  }, [activeNotes, getLabelsForNote, labels, selectedTagId]);

  // Lookup: noteId → labelId (or 'uncategorized')
  const noteGroupMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const group of groupedNotes.labeled) {
      for (const note of group.notes) {
        map.set(note.id, group.id);
      }
    }
    for (const note of groupedNotes.uncategorized) {
      map.set(note.id, 'uncategorized');
    }
    return map;
  }, [groupedNotes]);

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
    if (!over) return;

    const draggedId = active.id as string;
    const overId = over.id as string;

    const sourceGroupId = noteGroupMap.get(draggedId);

    // Determine target group: could be a group container ID or a note ID
    let targetGroupId: string;
    if (noteGroupMap.has(overId)) {
      targetGroupId = noteGroupMap.get(overId)!;
    } else {
      // overId is a droppable container ID (label ID or 'uncategorized')
      targetGroupId = overId;
    }

    if (sourceGroupId === targetGroupId) {
      // Same group — reorder within
      const groupNotes = targetGroupId === 'uncategorized'
        ? groupedNotes.uncategorized
        : groupedNotes.labeled.find(g => g.id === targetGroupId)?.notes ?? [];

      const oldIndex = groupNotes.findIndex(n => n.id === draggedId);
      const newIndex = groupNotes.findIndex(n => n.id === overId);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reordered = arrayMove(groupNotes, oldIndex, newIndex);
        const updates = reordered.map((n, i) => ({ id: n.id, position: i + 1 }));
        reorderNotes(updates);
      }
    } else {
      // Cross-group — move note to new category
      if (sourceGroupId && sourceGroupId !== 'uncategorized') {
        removeLabelFromNote(draggedId, sourceGroupId);
      }
      if (targetGroupId !== 'uncategorized') {
        addLabelToNote(draggedId, targetGroupId);
      }
    }
  }, [noteGroupMap, groupedNotes, reorderNotes, addLabelToNote, removeLabelFromNote]);

  const handleDragCancel = () => setActiveId(null);

  const draggedNote = activeId ? activeNotes.find(n => n.id === activeId) : null;

  const handleSave = async (data: { title: string; content: string; emoji: string | null; labelId: string | null }) => {
    const { labelId, ...noteData } = data;
    if (editingNote) {
      await updateNote(editingNote.id, noteData);
      // Update category if changed
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
      <div className="flex items-center justify-between mt-8 mb-4">
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
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2 flex-wrap mb-8">
        {labels.map(label => (
          <button
            key={label.id}
            onClick={() => handleCategoryClick(label.id)}
            className={`group inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium transition-all ${
              selectedTagId === label.id
                ? 'bg-[#ec4899]/20 text-[#f472b6]'
                : 'bg-white/[0.04] text-[#7a7890] hover:text-[#b0adc0] hover:bg-white/[0.06]'
            }`}
          >
            <Tag size={11} />
            <span>{label.name}</span>
            <X
              size={10}
              className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
              onClick={e => { e.stopPropagation(); deleteLabel(label.id); }}
            />
          </button>
        ))}
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
      {activeNotes.length === 0 && groupedNotes.labeled.length === 0 ? (
        <div className="rounded-xl border border-[#1c1928] bg-[#0f0d18] py-24 text-center">
          <p className="text-[14px] text-[#7a7890]">
            {search ? 'No notes found matching your criteria.' : 'No notes yet. Create one to get started.'}
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          {groupedNotes.labeled.map(group => (
            <NoteBoard key={group.id} groupId={group.id} notes={group.notes} onNoteClick={handleNoteClick} sectionTitle={group.name} />
          ))}
          {!selectedTagId && (
            <NoteBoard groupId="uncategorized" notes={groupedNotes.uncategorized} onNoteClick={handleNoteClick} sectionTitle="Uncategorized" />
          )}
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
