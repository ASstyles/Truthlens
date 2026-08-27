/**
 * In-Memory LRU & TTL Caching Utility for TruthLens
 * Caches heavy operations (Repository Analysis, IPFS fetches, verification results)
 * to avoid duplicate API calls and network roundtrips.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache {
  private store: Map<string, CacheEntry<any>> = new Map();
  private maxEntries: number;

  constructor(maxEntries: number = 500) {
    this.maxEntries = maxEntries;
  }

  public get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  public set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    // Evict oldest if exceeding max entries
    if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) this.store.delete(oldestKey);
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  public has(key: string): boolean {
    return this.get(key) !== null;
  }

  public delete(key: string): void {
    this.store.delete(key);
  }

  public clear(): void {
    this.store.clear();
  }
}

// Global singletons for server runtime
const globalForCache = globalThis as unknown as {
  analysisCache?: MemoryCache;
  ipfsCache?: MemoryCache;
  verifyCache?: MemoryCache;
};

export const analysisCache = globalForCache.analysisCache || (globalForCache.analysisCache = new MemoryCache(200));
export const ipfsCache = globalForCache.ipfsCache || (globalForCache.ipfsCache = new MemoryCache(300));
export const verifyCache = globalForCache.verifyCache || (globalForCache.verifyCache = new MemoryCache(200));

/**
 * Builds a deterministic cache key for repository analysis.
 */
export function buildRepoAnalysisKey(repoUrl: string, commitSha?: string, version: string = "v1"): string {
  const cleanUrl = repoUrl.toLowerCase().trim().replace(/\.git$/, "").replace(/\/+$/, "");
  const sha = (commitSha || "latest").trim();
  return `analysis:${cleanUrl}:${sha}:${version}`;
}
