import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Collection, CollectionField } from '../types';
import { useAuth } from './AuthContext';
import * as api from '../lib/collections';
import { slugify } from '../lib/utils';

interface CollectionsContextType {
  collections: Collection[];
  fieldsByCollection: Record<string, CollectionField[]>;
  loading: boolean;
  createCollection: (name: string, icon: string, fields?: Omit<CollectionField, 'id' | 'collection_id' | 'created_at'>[]) => Promise<Collection>;
  updateCollection: (id: string, updates: Partial<Pick<Collection, 'name' | 'icon' | 'slug'>>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  createField: (collectionId: string, field: { name: string; field_type: string; options?: Record<string, unknown>; position?: number; is_required?: boolean }) => Promise<void>;
  updateField: (id: string, updates: Partial<Pick<CollectionField, 'name' | 'field_type' | 'options' | 'position' | 'is_required'>>) => Promise<void>;
  deleteField: (id: string, collectionId: string) => Promise<void>;
  refreshFields: (collectionId: string) => Promise<void>;
}

const CollectionsContext = createContext<CollectionsContextType | undefined>(undefined);

export function CollectionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [fieldsByCollection, setFieldsByCollection] = useState<Record<string, CollectionField[]>>({});
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [cols, allFields] = await Promise.all([
        api.fetchCollections(),
        api.fetchAllFields(),
      ]);
      setCollections(cols);
      const grouped: Record<string, CollectionField[]> = {};
      for (const f of allFields) {
        if (!grouped[f.collection_id]) grouped[f.collection_id] = [];
        grouped[f.collection_id]!.push(f);
      }
      setFieldsByCollection(grouped);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setCollections([]);
      setFieldsByCollection({});
      setLoading(false);
    }
  }, [user, loadData]);

  const createCollection = async (
    name: string,
    icon: string,
    fields?: Omit<CollectionField, 'id' | 'collection_id' | 'created_at'>[]
  ): Promise<Collection> => {
    const slug = slugify(name);
    const position = collections.length;
    const col = await api.createCollection({ name, icon, slug, position });
    setCollections(prev => [...prev, col]);

    if (fields && fields.length > 0) {
      const createdFields: CollectionField[] = [];
      for (const f of fields) {
        const created = await api.createField({
          collection_id: col.id,
          name: f.name,
          field_type: f.field_type,
          options: f.options,
          position: f.position,
          is_required: f.is_required,
        });
        createdFields.push(created);
      }
      setFieldsByCollection(prev => ({ ...prev, [col.id]: createdFields }));
    }

    return col;
  };

  const updateCollection = async (id: string, updates: Partial<Pick<Collection, 'name' | 'icon' | 'slug'>>) => {
    const updated = await api.updateCollection(id, updates);
    setCollections(prev => prev.map(c => c.id === id ? updated : c));
  };

  const deleteCollection = async (id: string) => {
    await api.deleteCollection(id);
    setCollections(prev => prev.filter(c => c.id !== id));
    setFieldsByCollection(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const createField = async (collectionId: string, field: {
    name: string;
    field_type: string;
    options?: Record<string, unknown>;
    position?: number;
    is_required?: boolean;
  }) => {
    const created = await api.createField({ collection_id: collectionId, ...field });
    setFieldsByCollection(prev => ({
      ...prev,
      [collectionId]: [...(prev[collectionId] ?? []), created],
    }));
  };

  const updateField = async (id: string, updates: Partial<Pick<CollectionField, 'name' | 'field_type' | 'options' | 'position' | 'is_required'>>) => {
    const updated = await api.updateField(id, updates);
    setFieldsByCollection(prev => {
      const next = { ...prev };
      for (const colId of Object.keys(next)) {
        next[colId] = (next[colId] ?? []).map(f => f.id === id ? updated : f);
      }
      return next;
    });
  };

  const deleteField = async (id: string, collectionId: string) => {
    await api.deleteField(id);
    setFieldsByCollection(prev => ({
      ...prev,
      [collectionId]: (prev[collectionId] ?? []).filter(f => f.id !== id),
    }));
  };

  const refreshFields = async (collectionId: string) => {
    const fields = await api.fetchFields(collectionId);
    setFieldsByCollection(prev => ({ ...prev, [collectionId]: fields }));
  };

  return (
    <CollectionsContext.Provider value={{
      collections,
      fieldsByCollection,
      loading,
      createCollection,
      updateCollection,
      deleteCollection,
      createField,
      updateField,
      deleteField,
      refreshFields,
    }}>
      {children}
    </CollectionsContext.Provider>
  );
}

export function useCollections() {
  const context = useContext(CollectionsContext);
  if (!context) throw new Error('useCollections must be used within CollectionsProvider');
  return context;
}
