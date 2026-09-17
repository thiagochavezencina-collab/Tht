import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'cinestream_search_history';
export const MAX_SEARCH_HISTORY = 5;

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
            .slice(0, MAX_SEARCH_HISTORY);
        }
      }
    } catch (e) {
      console.error('Error loading search history:', e);
    }
    return [];
  });

  // Save updated history to localStorage and trigger state update
  const updateStorage = (newHistory: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      // Dispatch custom event for cross-component synchronization if needed
      window.dispatchEvent(new Event('cinestream_search_history_updated'));
    } catch (e) {
      console.error('Error writing search history to localStorage:', e);
    }
  };

  const saveTerm = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;

    setHistory((prev) => {
      // Remove any case-insensitive duplicates of the trimmed term
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, MAX_SEARCH_HISTORY);
      updateStorage(updated);
      return updated;
    });
  }, []);

  const removeTerm = useCallback((termToRemove: string) => {
    setHistory((prev) => {
      const updated = prev.filter(
        (item) => item.toLowerCase() !== termToRemove.trim().toLowerCase()
      );
      updateStorage(updated);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event('cinestream_search_history_updated'));
    } catch (e) {
      console.error('Error clearing search history:', e);
    }
  }, []);

  // Sync listener across tabs/events
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setHistory(
              parsed
                .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
                .slice(0, MAX_SEARCH_HISTORY)
            );
          }
        } else {
          setHistory([]);
        }
      } catch (e) {
        console.error('Error syncing search history:', e);
      }
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('cinestream_search_history_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('cinestream_search_history_updated', handleSync);
    };
  }, []);

  return {
    history,
    saveTerm,
    removeTerm,
    clearHistory,
  };
}
