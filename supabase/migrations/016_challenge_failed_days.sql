ALTER TABLE challenges ADD COLUMN failed_days jsonb NOT NULL DEFAULT '[]'::jsonb;
