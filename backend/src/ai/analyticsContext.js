let cachedContext = null;
let lastCacheTime = null;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

const getCachedAIContext = async (fetchFunction, forceRefresh = false) => {
  const now = new Date().getTime();

  if (!forceRefresh && cachedContext && lastCacheTime && (now - lastCacheTime < CACHE_TTL_MS)) {
    return { ...cachedContext, isCached: true };
  }

  const freshData = await fetchFunction();
  cachedContext = freshData;
  lastCacheTime = now;

  return { ...freshData, isCached: false };
};

const invalidateCache = () => {
  cachedContext = null;
  lastCacheTime = null;
};

module.exports = {
  getCachedAIContext,
  invalidateCache
};
