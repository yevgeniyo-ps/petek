-- ============================================
-- Petek: Admin Panel
-- Run this in Supabase SQL Editor
-- ============================================

-- Admin whitelist table
CREATE TABLE admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO admin_users (email) VALUES ('281332@gmail.com');

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can check admin status"
  ON admin_users FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- is_admin() — check if current user is admin
-- ============================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE email = (auth.jwt()->>'email')
  );
$$;

-- ============================================
-- admin_get_users() — list all users with stats
-- ============================================

CREATE OR REPLACE FUNCTION admin_get_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  notes_count bigint,
  collections_count bigint,
  labels_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    u.created_at,
    u.last_sign_in_at,
    COALESCE(n.cnt, 0) AS notes_count,
    COALESCE(c.cnt, 0) AS collections_count,
    COALESCE(l.cnt, 0) AS labels_count
  FROM auth.users u
  LEFT JOIN (SELECT user_id, count(*) AS cnt FROM notes GROUP BY user_id) n ON n.user_id = u.id
  LEFT JOIN (SELECT user_id, count(*) AS cnt FROM collections GROUP BY user_id) c ON c.user_id = u.id
  LEFT JOIN (SELECT user_id, count(*) AS cnt FROM labels GROUP BY user_id) l ON l.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;

-- ============================================
-- admin_delete_user_data() — wipe a user's data
-- ============================================

CREATE OR REPLACE FUNCTION admin_delete_user_data(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- note_labels via notes cascade
  DELETE FROM note_labels WHERE note_id IN (SELECT id FROM notes WHERE user_id = target_user_id);
  DELETE FROM notes WHERE user_id = target_user_id;
  DELETE FROM labels WHERE user_id = target_user_id;
  -- collection_items and collection_fields cascade from collections
  DELETE FROM collections WHERE user_id = target_user_id;
END;
$$;

-- ============================================
-- Grants — allow authenticated users to call RPCs
-- ============================================

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_get_users() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_user_data(uuid) TO authenticated;
