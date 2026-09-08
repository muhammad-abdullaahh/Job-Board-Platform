/**
 * Client-Side Stale-While-Revalidate (SWR) In-Memory Cache
 * Eliminates redundant Supabase network requests when switching between pages.
 */

const memoryCache = new Map();
const inflightRequests = new Map();

export const getCache = (key) => {
  const entry = memoryCache.get(key);
  if (!entry) return null;

  const now = Date.now();
  const age = now - entry.timestamp;

  return {
    data: entry.data,
    isFresh: age < entry.freshTtl,
    isExpired: age > entry.maxTtl,
  };
};

export const setCache = (key, data, freshTtlMs = 45000, maxTtlMs = 180000) => {
  memoryCache.set(key, {
    data,
    timestamp: Date.now(),
    freshTtl: freshTtlMs,
    maxTtl: maxTtlMs,
  });
};

export const invalidateCache = (prefix = '') => {
  if (!prefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
};

/**
 * Executes a fetcher with Stale-While-Revalidate semantics:
 * 1. If fresh cached data exists, returns it immediately (0ms).
 * 2. If stale cached data exists, invokes onData immediately with cached data, then revalidates in the background.
 * 3. If no cached data exists, triggers fetcher and invokes onData when ready.
 * 4. Deduplicates simultaneous in-flight requests for the exact same key.
 */
export const swrFetch = async (key, fetcher, { onData, onError, freshTtl = 45000, maxTtl = 180000 }) => {
  const cached = getCache(key);

  if (cached && !cached.isExpired) {
    // Deliver cached data immediately for instant 0ms UI render
    if (onData) onData(cached.data, false);

    // If still fresh, no background revalidation needed
    if (cached.isFresh) {
      return cached.data;
    }
  }

  // Deduplicate simultaneous requests
  if (inflightRequests.has(key)) {
    return inflightRequests.get(key);
  }

  const promise = (async () => {
    try {
      const freshData = await fetcher();
      setCache(key, freshData, freshTtl, maxTtl);
      if (onData) onData(freshData, false);
      return freshData;
    } catch (err) {
      // If we had cached data, do not wipe it on network glitch
      if (cached && !cached.isExpired) {
        console.warn(`[swrFetch] Background revalidation failed for ${key}, using cached data.`, err);
        return cached.data;
      }
      if (onError) onError(err);
      throw err;
    } finally {
      inflightRequests.delete(key);
    }
  })();

  inflightRequests.set(key, promise);
  return promise;
};
