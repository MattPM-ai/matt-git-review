import { SimplifiedCommitDto, SimplifiedIssueDto, SimplifiedPullRequestDto } from "./matt-api";

const DB_NAME = "github-activity-cache";
const DB_VERSION = 1;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
// const MAX_CACHE_SIZE = 1000; // Maximum items to cache per store (unused for now)

interface CachedData<T> {
  data: T;
  timestamp: number;
  key: string;
}

class CacheStore {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  private async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores for different data types
        if (!db.objectStoreNames.contains("commits")) {
          db.createObjectStore("commits", { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains("issues")) {
          db.createObjectStore("issues", { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains("pulls")) {
          db.createObjectStore("pulls", { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains("activity")) {
          db.createObjectStore("activity", { keyPath: "key" });
        }
      };
    });

    return this.dbPromise;
  }

  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > CACHE_DURATION;
  }

  async get<T>(storeName: string, key: string): Promise<T | null> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([storeName], "readonly");
      const store = transaction.objectStore(storeName);

      return new Promise((resolve) => {
        const request = store.get(key);

        request.onsuccess = () => {
          const cached = request.result as CachedData<T> | undefined;

          if (!cached || this.isExpired(cached.timestamp)) {
            resolve(null);
          } else {
            resolve(cached.data);
          }
        };

        request.onerror = () => resolve(null);
      });
    } catch (error) {
      console.warn("Cache get error:", error);
      return null;
    }
  }

  async set<T>(storeName: string, key: string, data: T): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);

      const cached: CachedData<T> = {
        key,
        data,
        timestamp: Date.now(),
      };

      store.put(cached);
    } catch (error) {
      console.warn("Cache set error:", error);
    }
  }

  async clear(storeName?: string): Promise<void> {
    try {
      const db = await this.initDB();

      if (storeName) {
        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        store.clear();
      } else {
        // Clear all stores
        const storeNames = ["commits", "issues", "pulls", "activity"];
        const transaction = db.transaction(storeNames, "readwrite");

        storeNames.forEach((name) => {
          transaction.objectStore(name).clear();
        });
      }
    } catch (error) {
      console.warn("Cache clear error:", error);
    }
  }
}

// Create singleton instance
const cacheStore = new CacheStore();

// Cache key generators
export function getCommitsCacheKey(
  org: string,
  repo?: string,
  author?: string
): string {
  return `commits:${org}${repo ? `:${repo}` : ""}${author ? `:${author}` : ""}`;
}

export function getIssuesCacheKey(
  org: string,
  repo: string,
  author?: string
): string {
  return `issues:${org}:${repo}${author ? `:${author}` : ""}`;
}

export function getPullsCacheKey(
  org: string,
  repo: string,
  author?: string
): string {
  return `pulls:${org}:${repo}${author ? `:${author}` : ""}`;
}

export function getActivityCacheKey(org: string, user?: string): string {
  return `activity:${org}${user ? `:${user}` : ""}`;
}

// Cached API functions
export async function getCachedCommits(
  key: string,
  fetcher: () => Promise<SimplifiedCommitDto[]>
): Promise<SimplifiedCommitDto[]> {
  const cached = await cacheStore.get<SimplifiedCommitDto[]>("commits", key);

  if (cached) {
    return cached;
  }

  const fresh = await fetcher();
  await cacheStore.set("commits", key, fresh);
  return fresh;
}

export async function getCachedIssues(
  key: string,
  fetcher: () => Promise<SimplifiedIssueDto[]>
): Promise<SimplifiedIssueDto[]> {
  const cached = await cacheStore.get<SimplifiedIssueDto[]>("issues", key);

  if (cached) {
    return cached;
  }

  const fresh = await fetcher();
  await cacheStore.set("issues", key, fresh);
  return fresh;
}

export async function getCachedPulls(
  key: string,
  fetcher: () => Promise<SimplifiedPullRequestDto[]>
): Promise<SimplifiedPullRequestDto[]> {
  const cached = await cacheStore.get<SimplifiedPullRequestDto[]>("pulls", key);

  if (cached) {
    return cached;
  }

  const fresh = await fetcher();
  await cacheStore.set("pulls", key, fresh);
  return fresh;
}

export async function getCachedActivity(
  key: string,
  fetcher: () => Promise<{
    commits: GitHubCommit[];
    issues: GitHubIssue[];
    pulls: GitHubPullRequest[];
  }>
): Promise<{
  commits: GitHubCommit[];
  issues: GitHubIssue[];
  pulls: GitHubPullRequest[];
}> {
  const cached = await cacheStore.get<{
    commits: GitHubCommit[];
    issues: GitHubIssue[];
    pulls: GitHubPullRequest[];
  }>("activity", key);

  if (cached) {
    return cached;
  }

  const fresh = await fetcher();
  await cacheStore.set("activity", key, fresh);
  return fresh;
}

// Export cache management functions
export async function clearCache(storeName?: string): Promise<void> {
  return cacheStore.clear(storeName);
}

// Check if running in browser
export const isBrowser =
  typeof window !== "undefined" && typeof indexedDB !== "undefined";
