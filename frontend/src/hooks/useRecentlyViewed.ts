import { useCallback, useEffect, useState } from 'react';

const KEY = 'sazu-study-hub.recently-viewed.v1';

/**
 * Recently viewed resource IDs, persisted to localStorage.
 * Capped at 6 entries. Only stores resource IDs — no private data.
 */
export function useRecentlyViewed() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setIds(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const add = useCallback((id: string) => {
    setIds((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, 6);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setIds([]);
    localStorage.removeItem(KEY);
  }, []);

  return { ids, add, clear };
}
