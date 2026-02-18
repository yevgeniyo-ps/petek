-- ============================================
-- Petek: Admin suspend/unsuspend users
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- admin_suspend_user() — ban a user until far future
-- ============================================

CREATE OR REPLACE FUNCTION admin_suspend_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE auth.users SET banned_until = '2999-12-31'::timestamptz WHERE id = target_user_id;
END;
$$;

-- ============================================
-- admin_unsuspend_user() — remove ban
-- ============================================

CREATE OR REPLACE FUNCTION admin_unsuspend_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE auth.users SET banned_until = NULL WHERE id = target_user_id;
END;
$$;

-- ============================================
-- Update admin_get_users() — add banned_until
-- ============================================

DROP FUNCTION IF EXISTS admin_get_users();
CREATE OR REPLACE FUNCTION admin_get_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  banned_until timestamptz,
  notes_count bigint,
  collections_count bigint,
  labels_count bigint,
  policies_count bigint,
  disk_usage bigint,
  notes_this_month bigint,
  policies_this_month bigint
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
    u.banned_until,
    COALESCE(n.cnt, 0) AS notes_count,
    COALESCE(c.cnt, 0) AS collections_count,
    COALESCE(l.cnt, 0) AS labels_count,
    COALESCE(p.cnt, 0) AS policies_count,
    COALESCE(n.sz, 0) + COALESCE(c.sz, 0) + COALESCE(l.sz, 0)
      + COALESCE(ci.sz, 0) + COALESCE(cf.sz, 0) + COALESCE(nl.sz, 0)
      + COALESCE(p.sz, 0) AS disk_usage,
    COALESCE(n.this_month, 0) AS notes_this_month,
    COALESCE(p.this_month, 0) AS policies_this_month
  FROM auth.users u
  LEFT JOIN (
    SELECT user_id, count(*) AS cnt, sum(pg_column_size(notes.*)) AS sz,
      count(*) FILTER (WHERE notes.created_at >= date_trunc('month', now())) AS this_month
    FROM notes GROUP BY user_id
  ) n ON n.user_id = u.id
  LEFT JOIN (SELECT user_id, count(*) AS cnt, sum(pg_column_size(collections.*)) AS sz FROM collections GROUP BY user_id) c ON c.user_id = u.id
  LEFT JOIN (SELECT user_id, count(*) AS cnt, sum(pg_column_size(labels.*)) AS sz FROM labels GROUP BY user_id) l ON l.user_id = u.id
  LEFT JOIN (
    SELECT user_id, count(*) AS cnt, sum(pg_column_size(insurance_policies.*)) AS sz,
      count(*) FILTER (WHERE insurance_policies.created_at >= date_trunc('month', now())) AS this_month
    FROM insurance_policies GROUP BY user_id
  ) p ON p.user_id = u.id
  LEFT JOIN (SELECT user_id, sum(pg_column_size(collection_items.*)) AS sz FROM collection_items GROUP BY user_id) ci ON ci.user_id = u.id
  LEFT JOIN (
    SELECT cc.user_id, sum(pg_column_size(cf2.*)) AS sz
    FROM collection_fields cf2 JOIN collections cc ON cc.id = cf2.collection_id
    GROUP BY cc.user_id
  ) cf ON cf.user_id = u.id
  LEFT JOIN (
    SELECT nn.user_id, sum(pg_column_size(nl2.*)) AS sz
    FROM note_labels nl2 JOIN notes nn ON nn.id = nl2.note_id
    GROUP BY nn.user_id
  ) nl ON nl.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;

-- ============================================
-- Grants
-- ============================================

GRANT EXECUTE ON FUNCTION admin_suspend_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_unsuspend_user(uuid) TO authenticated;
