-- ============================================
-- Petek: Admin remove user (full tenant delete)
-- Run this in Supabase SQL Editor
-- ============================================

CREATE OR REPLACE FUNCTION admin_remove_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Delete all user data first
  DELETE FROM note_labels WHERE note_id IN (SELECT id FROM notes WHERE user_id = target_user_id);
  DELETE FROM notes WHERE user_id = target_user_id;
  DELETE FROM labels WHERE user_id = target_user_id;
  DELETE FROM collections WHERE user_id = target_user_id;
  DELETE FROM insurance_policies WHERE user_id = target_user_id;
  DELETE FROM approved_users WHERE user_id = target_user_id;

  -- Remove the user account from auth.users
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_remove_user(uuid) TO authenticated;
