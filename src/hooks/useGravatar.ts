import { useState, useEffect } from 'react';

async function sha256(message: string): Promise<string> {
  const data = new TextEncoder().encode(message);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function useGravatar(email: string | undefined, size = 64): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!email) return;
    let cancelled = false;
    sha256(email.trim().toLowerCase()).then((hash) => {
      if (!cancelled) {
        setUrl(`https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`);
      }
    });
    return () => { cancelled = true; };
  }, [email, size]);

  return url;
}
