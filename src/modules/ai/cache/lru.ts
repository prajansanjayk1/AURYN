export class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map<K, V>();
  }

  /**
   * Retrieves an item from the cache and updates its recency.
   */
  public get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;

    // Remove and re-insert to mark as most recently used
    const val = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  /**
   * Adds or updates a cache entry. Evicts the oldest if capacity is exceeded.
   */
  public set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Evict least recently used (first key in Map iterator)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, value);
  }

  /**
   * Clears all cache entries.
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Returns current cache size.
   */
  public size(): number {
    return this.cache.size;
  }

  /**
   * Checks if cache contains key.
   */
  public has(key: K): boolean {
    return this.cache.has(key);
  }
}
