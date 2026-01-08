/**
 * Generic localStorage adapter with schema versioning
 * All keys are prefixed with 'kosmix_' and versioned
 */

const STORAGE_PREFIX = "kosmix_";

export interface StorageSchema<T> {
  version: string;
  data: T;
}

/**
 * Get data from localStorage with version checking
 */
export function getStorage<T>(key: string, version: string): T | null {
  try {
    const fullKey = `${STORAGE_PREFIX}${key}_${version}`;
    const item = localStorage.getItem(fullKey);
    if (!item) return null;

    const parsed: StorageSchema<T> = JSON.parse(item);
    
    // Version mismatch - could implement migration here
    if (parsed.version !== version) {
      console.warn(`Storage version mismatch for ${key}: expected ${version}, got ${parsed.version}`);
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.error(`Error reading storage for ${key}:`, error);
    return null;
  }
}

/**
 * Set data to localStorage with version
 */
export function setStorage<T>(key: string, version: string, data: T): void {
  try {
    const fullKey = `${STORAGE_PREFIX}${key}_${version}`;
    const schema: StorageSchema<T> = {
      version,
      data,
    };
    localStorage.setItem(fullKey, JSON.stringify(schema));
  } catch (error) {
    console.error(`Error writing storage for ${key}:`, error);
    throw error;
  }
}

/**
 * Remove data from localStorage
 */
export function removeStorage(key: string, version: string): void {
  try {
    const fullKey = `${STORAGE_PREFIX}${key}_${version}`;
    localStorage.removeItem(fullKey);
  } catch (error) {
    console.error(`Error removing storage for ${key}:`, error);
  }
}

/**
 * Clear all kosmix storage (useful for reset)
 */
export function clearAllKosmixStorage(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error("Error clearing kosmix storage:", error);
  }
}
