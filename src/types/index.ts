export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  color: string;
  is_pinned: boolean;
  is_archived: boolean;
  is_trashed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Label {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface NoteLabel {
  note_id: string;
  label_id: string;
}

export type NoteColor =
  | 'default'
  | 'coral'
  | 'peach'
  | 'sand'
  | 'mint'
  | 'sage'
  | 'sky'
  | 'lavender'
  | 'rose';

export interface NoteColorConfig {
  name: string;
  bg: string;
  border: string;
}

// Collections

export type FieldType = 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'url';

export type FieldOptions = {
  choices?: string[];
  prefix?: string;
  suffix?: string;
  [key: string]: unknown;
};

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  slug: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface CollectionField {
  id: string;
  collection_id: string;
  name: string;
  field_type: FieldType;
  options: FieldOptions;
  position: number;
  is_required: boolean;
  created_at: string;
}

export interface CollectionItem {
  id: string;
  collection_id: string;
  user_id: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Insurances

export interface InsurancePolicy {
  id: string;
  user_id: string;
  upload_batch_id: string;
  category: string;
  identity_number: string;
  main_branch: string;
  sub_branch: string;
  product_type: string;
  company: string;
  coverage_period: string;
  additional_details: string;
  premium_nis: number | null;
  premium_type: string;
  policy_number: string;
  plan_classification: string;
  created_at: string;
}

// Admin

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  notes_count: number;
  collections_count: number;
  labels_count: number;
  policies_count: number;
  disk_usage: number;
  notes_this_month: number;
  policies_this_month: number;
}
