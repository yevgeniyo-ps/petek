-- Backfill display_name for existing participants from auth.users Google metadata
UPDATE challenge_participants cp
SET display_name = COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '')
FROM auth.users u
WHERE cp.user_id = u.id AND (cp.display_name = '' OR cp.display_name IS NULL);
