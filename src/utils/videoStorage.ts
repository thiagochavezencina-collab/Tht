/**
 * IndexedDB Video Storage Engine
 * Stores uploaded video files (MP4, MKV, WebM) locally in the browser database
 * so they persist across page refreshes and reloads without revoking blob URLs.
 */

const DB_NAME = 'CineStreamVideoDB';
const DB_VERSION = 1;
const STORE_NAME = 'video_blobs';

// Memory cache of active object URLs to prevent memory leaks and redundant createObjectURL calls
const activeObjectUrlCache = new Map<string, string>();

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB no soportado'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Save a video File or Blob in IndexedDB by ID (movie ID or episode ID)
 */
export async function saveVideoBlob(id: string, blob: Blob | File): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(blob, id);

      req.onsuccess = () => {
        // Invalidate any old cached object URL for this id
        if (activeObjectUrlCache.has(id)) {
          try {
            URL.revokeObjectURL(activeObjectUrlCache.get(id)!);
          } catch {}
          activeObjectUrlCache.delete(id);
        }
        resolve();
      };

      req.onerror = () => {
        console.error('Error saving video to IndexedDB:', req.error);
        reject(req.error);
      };
    });
  } catch (error) {
    console.error('Failed to save video blob to IndexedDB:', error);
  }
}

/**
 * Get a video Blob from IndexedDB by ID
 */
export async function getVideoBlob(id: string): Promise<Blob | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => {
        resolve(req.result || null);
      };

      req.onerror = () => {
        reject(req.error);
      };
    });
  } catch (error) {
    console.error('Failed to get video blob from IndexedDB:', error);
    return null;
  }
}

/**
 * Delete a video Blob from IndexedDB
 */
export async function deleteVideoBlob(id: string): Promise<void> {
  try {
    if (activeObjectUrlCache.has(id)) {
      try {
        URL.revokeObjectURL(activeObjectUrlCache.get(id)!);
      } catch {}
      activeObjectUrlCache.delete(id);
    }
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('Failed to delete video blob from IndexedDB:', error);
  }
}

/**
 * Obtains a playable live URL for a movie or episode:
 * 1. Checks if it is stored in IndexedDB (recreating a fresh valid blob URL on each reload)
 * 2. If not in IndexedDB, returns the fallbackUrl if valid
 */
export async function resolvePlayableVideoUrl(id: string, fallbackUrl: string): Promise<string> {
  try {
    // Check if we already have an active live object URL in memory
    if (activeObjectUrlCache.has(id)) {
      return activeObjectUrlCache.get(id)!;
    }

    const blob = await getVideoBlob(id);
    if (blob) {
      const newUrl = URL.createObjectURL(blob);
      activeObjectUrlCache.set(id, newUrl);
      return newUrl;
    }
  } catch (err) {
    console.warn('Could not resolve video from IndexedDB:', err);
  }

  // Fallback to existing URL (e.g. http/https link)
  return fallbackUrl;
}
