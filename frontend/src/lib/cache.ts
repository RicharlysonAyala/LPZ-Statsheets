type Entry<T> = {
  data: T;
  expiresAt: number;
};

const store = new Map<string, Entry<unknown>>();

/** TTL padrão: 60s — navegação rápida, mas não eterniza dado */
const DEFAULT_TTL_MS = 60_000;

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function cacheSet<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS): void {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

/** Apaga tudo que começa com o prefixo (ex.: "teams") */
export function cacheInvalidatePrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key === prefix || key.startsWith(prefix + ":") || key.startsWith(prefix + "/")) {
      store.delete(key);
    }
  }
}

export function cacheInvalidateAll(): void {
  store.clear();
}

/** Chaves padronizadas */
export const CacheKeys = {
  teams: "teams:list",
  team: (id: string) => `teams:id:${id}`,
  teamMatches: (id: string) => `teams:matches:${id}`,
  teamRoster: (id: string) => `teams:roster:${id}`,
  matchStatsheet: (id: string) => `matches:statsheet:${id}`,
} as const;