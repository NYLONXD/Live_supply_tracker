// client/src/hooks/useDraft.js
/**
 * useDraft — lightweight IndexedDB-backed form draft hook.
 *
 * Usage:
 *   const { draft, saveDraft, clearDraft } = useDraft('create-shipment-admin');
 *
 * - `draft`      — the last saved value (or null on first visit)
 * - `saveDraft`  — call with the latest formData object; debounced 400 ms
 * - `clearDraft` — call after a successful submit to wipe the stored draft
 */
import { useCallback, useEffect, useRef, useState } from 'react';

const DB_NAME    = 'supply-tracker-drafts';
const DB_VERSION = 1;
const STORE_NAME = 'drafts';

// ── Open (or create) the DB once per tab ────────────────────────────────────
let dbPromise = null;
function getDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME, { keyPath: 'key' });
    };
    req.onsuccess  = (e) => resolve(e.target.result);
    req.onerror    = (e) => reject(e.target.error);
  });
  return dbPromise;
}

// ── Generic get / set / del helpers ─────────────────────────────────────────
async function idbGet(key) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result?.value ?? null);
    req.onerror   = () => reject(req.error);
  });
}

async function idbSet(key, value) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).put({ key, value, updatedAt: Date.now() });
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

async function idbDel(key) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).delete(key);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

// ── The hook ─────────────────────────────────────────────────────────────────
export default function useDraft(draftKey, debounceMs = 400) {
  const [draft,    setDraft]    = useState(null);
  const [restored, setRestored] = useState(false); // true once initial load done
  const timerRef = useRef(null);

  // Load existing draft on mount
  useEffect(() => {
    let cancelled = false;
    idbGet(draftKey)
      .then((val) => {
        if (!cancelled) {
          setDraft(val);
          setRestored(true);
        }
      })
      .catch(() => {
        if (!cancelled) setRestored(true); // don't block UI on error
      });
    return () => { cancelled = true; };
  }, [draftKey]);

  // Save (debounced)
  const saveDraft = useCallback(
    (data) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        idbSet(draftKey, data).catch(() => {}); // silent failure
      }, debounceMs);
    },
    [draftKey, debounceMs],
  );

  // Clear on successful submit
  const clearDraft = useCallback(() => {
    clearTimeout(timerRef.current);
    setDraft(null);
    idbDel(draftKey).catch(() => {});
  }, [draftKey]);

  return { draft, restored, saveDraft, clearDraft };
}