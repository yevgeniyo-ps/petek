import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@shared/config/supabase';

interface ExtAuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const ExtAuthContext = createContext<ExtAuthContextType | undefined>(undefined);

export function useExtAuth() {
  const context = useContext(ExtAuthContext);
  if (!context) throw new Error('useExtAuth must be used within ExtAuthProvider');
  return context;
}

// Re-export as useAuth so shared contexts (NotesContext, LabelsContext) can use it
export { useExtAuth as useAuth };

// Safe wrapper for chrome.runtime.sendMessage
async function sendMsg(msg: unknown): Promise<Record<string, unknown> | null> {
  try {
    if (typeof chrome === 'undefined' || !chrome?.runtime?.sendMessage) return null;
    const res = await chrome.runtime.sendMessage(msg);
    return res as Record<string, unknown> | null;
  } catch {
    return null;
  }
}

export function ExtAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        // 1. Check if we already have a stored session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSession(session);
          setLoading(false);
          return;
        }

        // 2. Try to grab session from an open petek.app tab (3s timeout)
        const res = await Promise.race([
          sendMsg({ type: 'GET_EXISTING_SESSION' }),
          new Promise<null>(resolve => setTimeout(() => resolve(null), 3000)),
        ]);

        const s = res as Record<string, unknown> | null;
        const grabbed = s?.session as Record<string, string> | undefined;

        if (grabbed?.access_token && grabbed?.refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token: grabbed.access_token,
            refresh_token: grabbed.refresh_token,
          });
          if (!error) {
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        setInitError(err instanceof Error ? err.message : String(err));
      }

      setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<{ error: Error | null }> => {
    try {
      const redirectRes = await sendMsg({ type: 'GET_REDIRECT_URL' });
      const redirectUrl = (redirectRes as Record<string, string> | null)?.redirectUrl;

      if (!redirectUrl) {
        return { error: new Error('Could not get redirect URL from background script') };
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error || !data.url) {
        return { error: (error as Error | null) ?? new Error('Failed to get OAuth URL') };
      }

      const result = await sendMsg({ type: 'GOOGLE_SIGN_IN', oauthUrl: data.url });

      if (!result) {
        return { error: new Error('No response from background script') };
      }

      if ((result as Record<string, string>).error) {
        return { error: new Error((result as Record<string, string>).error) };
      }

      const { access_token, refresh_token } = result as Record<string, string>;

      if (!access_token || !refresh_token) {
        return { error: new Error('No tokens received') };
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      return { error: sessionError as Error | null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Google sign-in failed') };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const user = session?.user ?? null;

  if (loading) {
    return (
      <ExtAuthContext.Provider value={{ session, user, loading, signInWithGoogle, signOut }}>
        <div className="flex items-center justify-center h-screen bg-[#0c0a12]">
          <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </ExtAuthContext.Provider>
    );
  }

  return (
    <ExtAuthContext.Provider value={{ session, user, loading, signInWithGoogle, signOut }}>
      {user ? children : <LoginForm initError={initError} />}
    </ExtAuthContext.Provider>
  );
}

function LoginForm({ initError }: { initError: string }) {
  const { signInWithGoogle } = useExtAuth();
  const [error, setError] = useState(initError);
  const [submitting, setSubmitting] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('');

  useEffect(() => {
    sendMsg({ type: 'GET_REDIRECT_URL' }).then((res) => {
      const url = (res as Record<string, string> | null)?.redirectUrl;
      if (url) setRedirectUrl(url);
    });
  }, []);

  const handleGoogleSignIn = async () => {
    setError('');
    setSubmitting(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0c0a12] px-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          petek<span className="text-pink-500">.</span>
        </h1>
        <p className="text-[#7a7890] text-sm mt-1">Sign in to your notes</p>
      </div>

      <div className="w-full max-w-[280px] space-y-3">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-gray-100 text-gray-800 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {submitting ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.26c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
          )}
          Continue with Google
        </button>

        {error && (
          <div className="space-y-2">
            <p className="text-red-400 text-xs text-center break-all">{error}</p>
            {redirectUrl && (
              <div className="bg-[#13111c] border border-[#1c1928] rounded-lg p-3 space-y-1.5">
                <p className="text-[#7a7890] text-[10px] leading-tight">
                  Add this URL to Supabase → Authentication → URL Configuration → Redirect URLs:
                </p>
                <p className="text-pink-400 text-[10px] break-all font-mono select-all">{redirectUrl}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
