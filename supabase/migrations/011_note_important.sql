-- Add is_important flag to notes
ALTER TABLE notes ADD COLUMN is_important boolean NOT NULL DEFAULT false;
