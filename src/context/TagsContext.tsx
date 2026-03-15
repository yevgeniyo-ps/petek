import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Tag, NoteTag } from '../types';
import { useAuth } from './AuthContext';
import * as tagsApi from '../lib/tags';

interface TagsContextType {
  tags: Tag[];
  noteTags: NoteTag[];
  createTag: (labelId: string, name: string) => Promise<Tag>;
  deleteTag: (id: string) => Promise<void>;
  addTagToNote: (noteId: string, tagId: string) => Promise<void>;
  removeTagFromNote: (noteId: string, tagId: string) => Promise<void>;
  getTagsForNote: (noteId: string) => Tag[];
  getTagsForLabel: (labelId: string) => Tag[];
  getNoteIdsForTag: (tagId: string) => string[];
}

const TagsContext = createContext<TagsContextType | undefined>(undefined);

export function TagsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [noteTags, setNoteTags] = useState<NoteTag[]>([]);

  const refresh = useCallback(async () => {
    if (!user) return;
    const [tagsData, noteTagsData] = await Promise.all([
      tagsApi.fetchTags(),
      tagsApi.fetchNoteTags(),
    ]);
    setTags(tagsData);
    setNoteTags(noteTagsData);
  }, [user]);

  useEffect(() => {
    if (user) {
      refresh();
    } else {
      setTags([]);
      setNoteTags([]);
    }
  }, [user, refresh]);

  const createTag = async (labelId: string, name: string) => {
    const created = await tagsApi.createTag(labelId, name);
    setTags(prev => [...prev, created]);
    return created;
  };

  const deleteTag = async (id: string) => {
    await tagsApi.deleteTag(id);
    setTags(prev => prev.filter(t => t.id !== id));
    setNoteTags(prev => prev.filter(nt => nt.tag_id !== id));
  };

  const addTagToNote = async (noteId: string, tagId: string) => {
    await tagsApi.addTagToNote(noteId, tagId);
    setNoteTags(prev => [...prev, { note_id: noteId, tag_id: tagId }]);
  };

  const removeTagFromNote = async (noteId: string, tagId: string) => {
    await tagsApi.removeTagFromNote(noteId, tagId);
    setNoteTags(prev => prev.filter(nt => !(nt.note_id === noteId && nt.tag_id === tagId)));
  };

  const getTagsForNote = useCallback((noteId: string) => {
    const tagIds = noteTags.filter(nt => nt.note_id === noteId).map(nt => nt.tag_id);
    return tags.filter(t => tagIds.includes(t.id));
  }, [tags, noteTags]);

  const getTagsForLabel = useCallback((labelId: string) => {
    return tags.filter(t => t.label_id === labelId);
  }, [tags]);

  const getNoteIdsForTag = useCallback((tagId: string) => {
    return noteTags.filter(nt => nt.tag_id === tagId).map(nt => nt.note_id);
  }, [noteTags]);

  return (
    <TagsContext.Provider value={{
      tags, noteTags, createTag, deleteTag,
      addTagToNote, removeTagFromNote,
      getTagsForNote, getTagsForLabel, getNoteIdsForTag,
    }}>
      {children}
    </TagsContext.Provider>
  );
}

export function useTags() {
  const context = useContext(TagsContext);
  if (!context) throw new Error('useTags must be used within TagsProvider');
  return context;
}
