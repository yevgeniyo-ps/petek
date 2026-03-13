-- Add position field to labels for drag-and-drop reordering
ALTER TABLE labels ADD COLUMN position integer NOT NULL DEFAULT 0;
