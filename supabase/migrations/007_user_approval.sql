-- ============================================
-- Petek: User Approval Waiting Room
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable pg_net for HTTP calls (Resend email)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ============================================
-- approved_users — tracks which users are approved
-- ============================================

CREATE TABLE approved_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  approved_at timestamptz NOT NULL DEFAULT now(),
  approved_by uuid REFERENCES auth.users(id)
);

ALTER TABLE approved_users ENABLE ROW LEVEL SECURITY;
-- No public policies — only SECURITY DEFINER functions access this table

-- ============================================
-- petek_config — key/value store for secrets
-- ============================================

CREATE TABLE petek_config (
  key text PRIMARY KEY,
  value text NOT NULL
);

ALTER TABLE petek_config ENABLE ROW LEVEL SECURITY;
-- No public policies — only SECURITY DEFINER functions read this

INSERT INTO petek_config (key, value) VALUES
  ('resend_api_key', 'YOUR_KEY'),
  ('app_url', 'https://yevgeniy-ovsyannikov.github.io/petek/');

-- ============================================
-- Auto-approve all existing users
-- ============================================

INSERT INTO approved_users (user_id, approved_at)
SELECT id, now() FROM auth.users
ON CONFLICT DO NOTHING;

-- ============================================
-- is_approved() — check if current user is approved or admin
-- ============================================

CREATE OR REPLACE FUNCTION is_approved()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  IF is_admin() THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM approved_users WHERE user_id = auth.uid()
  );
END;
$$;

-- ============================================
-- admin_approve_user() — approve a user and send branded email
-- ============================================

CREATE OR REPLACE FUNCTION admin_approve_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _api_key text;
  _app_url text;
  _email text;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Insert approval record
  INSERT INTO approved_users (user_id, approved_by)
  VALUES (target_user_id, auth.uid())
  ON CONFLICT (user_id) DO NOTHING;

  -- Get user email
  SELECT email INTO _email FROM auth.users WHERE id = target_user_id;

  -- Get config
  SELECT value INTO _api_key FROM petek_config WHERE key = 'resend_api_key';
  SELECT value INTO _app_url FROM petek_config WHERE key = 'app_url';

  -- Send branded email via Resend
  IF _api_key IS NOT NULL AND _api_key != 'YOUR_KEY' THEN
    PERFORM net.http_post(
      url := 'https://api.resend.com/emails',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || _api_key,
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'from', 'Petek <noreply@petek.app>',
        'to', _email,
        'subject', 'Welcome to Petek!',
        'html', '<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;color:#e0dfe4;background:#0c0a12;">'
          || '<h1 style="font-size:28px;font-weight:700;margin:0 0 4px;">petek<span style="color:#ec4899;">.</span></h1>'
          || '<p style="color:#7a7890;font-size:14px;margin:0 0 32px;">Keep everything in one place.</p>'
          || '<p style="font-size:15px;line-height:1.6;margin:0 0 24px;">Your access has been approved! You can now sign in and start using Petek.</p>'
          || '<a href="' || _app_url || '" style="display:inline-block;padding:10px 28px;background:#ec4899;color:#fff;font-size:14px;font-weight:600;border-radius:9999px;text-decoration:none;">Open Petek</a>'
          || '<p style="color:#4a4660;font-size:12px;margin:32px 0 0;">You received this email because someone approved your Petek account.</p>'
          || '</div>'
      )
    );
  END IF;
END;
$$;

-- ============================================
-- Update admin_get_users() — add approved_at
-- ============================================

DROP FUNCTION IF EXISTS admin_get_users();
CREATE OR REPLACE FUNCTION admin_get_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  banned_until timestamptz,
  approved_at timestamptz,
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
    a.approved_at,
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
  LEFT JOIN approved_users a ON a.user_id = u.id
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

GRANT EXECUTE ON FUNCTION is_approved() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_approve_user(uuid) TO authenticated;
