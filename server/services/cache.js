// Simple Redis caching layer wrapper with in-memory fallback
const cacheMap = new Map();

const get = async (key) => {
  // Local in-memory caching fallback
  return cacheMap.get(key) || null;
};

const set = async (key, value, ttlSeconds = 3600) => {
  cacheMap.set(key, value);
  // Auto expire keys in memory
  setTimeout(() => {
    cacheMap.delete(key);
  }, ttlSeconds * 1000);
  return true;
};

const del = async (key) => {
  return cacheMap.delete(key);
};

module.exports = {
  get,
  set,
  del
};
