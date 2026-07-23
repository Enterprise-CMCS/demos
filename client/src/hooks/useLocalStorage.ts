import { useCallback, useState } from "react";

type StorageType = "localStorage" | "sessionStorage";

function getStorage(storageType: StorageType): Storage | null {
  if (typeof window === "undefined") return null;
  return storageType === "sessionStorage" ? window.sessionStorage : window.localStorage;
}

export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  storageType: StorageType = "localStorage"
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    const storage = getStorage(storageType);
    if (!storage) return defaultValue;

    try {
      const item = storage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        const storage = getStorage(storageType);
        if (storage) {
          try {
            storage.setItem(key, JSON.stringify(next));
          } catch {
            // Storage quota exceeded or access denied — state still updates in memory
          }
        }
        return next;
      });
    },
    [key, storageType]
  );

  return [storedValue, setValue];
}

export function clearStoredValue(key: string, storageType: StorageType = "localStorage"): void {
  getStorage(storageType)?.removeItem(key);
}
