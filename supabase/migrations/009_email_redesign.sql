-- ============================================
-- Petek: Redesigned approval email
-- Run this in Supabase SQL Editor
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
  _html text;
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

  -- Build branded email HTML
  _html :=
    '<!DOCTYPE html>'
    || '<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>'
    || '<body style="margin:0;padding:0;background:#08060e;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif;">'
    || '<table width="100%" cellpadding="0" cellspacing="0" style="background:#08060e;padding:40px 16px;">'
    || '<tr><td align="center">'

    -- Card container
    || '<table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;border-radius:16px;overflow:hidden;background:#0c0a12;border:1px solid #1c1928;">'

    -- Gradient accent bar
    || '<tr><td style="height:4px;background:linear-gradient(90deg,#ec4899,#a855f7,#6366f1);"></td></tr>'

    -- Logo section
    || '<tr><td style="padding:36px 40px 0 40px;">'
    || '<h1 style="font-size:26px;font-weight:800;margin:0;color:#ffffff;letter-spacing:-0.5px;">petek<span style="color:#ec4899;">.</span></h1>'
    || '</td></tr>'

    -- Divider
    || '<tr><td style="padding:20px 40px 0 40px;"><div style="height:1px;background:#1c1928;"></div></td></tr>'

    -- Checkmark icon + heading
    || '<tr><td style="padding:28px 40px 0 40px;">'
    || '<table cellpadding="0" cellspacing="0"><tr>'
    || '<td style="width:44px;height:44px;background:rgba(16,185,129,0.12);border-radius:12px;text-align:center;vertical-align:middle;">'
    || '<span style="font-size:22px;line-height:44px;">&#10003;</span>'
    || '</td>'
    || '<td style="padding-left:16px;">'
    || '<h2 style="font-size:18px;font-weight:700;color:#ffffff;margin:0;">You''re in!</h2>'
    || '</td>'
    || '</tr></table>'
    || '</td></tr>'

    -- Body text
    || '<tr><td style="padding:16px 40px 0 40px;">'
    || '<p style="font-size:15px;line-height:1.7;color:#a09cb2;margin:0;">Your access to Petek has been approved. Sign in to start organizing your notes, collections, and more&mdash;all in one place.</p>'
    || '</td></tr>'

    -- CTA button
    || '<tr><td style="padding:28px 40px 0 40px;">'
    || '<table cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background:linear-gradient(135deg,#ec4899,#d946ef);">'
    || '<a href="' || _app_url || '" style="display:inline-block;padding:13px 36px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.2px;">Open Petek &rarr;</a>'
    || '</td></tr></table>'
    || '</td></tr>'

    -- Footer
    || '<tr><td style="padding:36px 40px 32px 40px;">'
    || '<p style="font-size:12px;line-height:1.6;color:#4a4660;margin:0;">You received this because your Petek account was approved. If you didn''t request this, you can ignore this email.</p>'
    || '</td></tr>'

    || '</table>'  -- end card
    || '</td></tr></table>'  -- end outer
    || '</body></html>';

  -- Send via Resend
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
        'subject', 'You''re in! Welcome to Petek',
        'html', _html
      )
    );
  END IF;
END;
$$;
