import { useCallback, useState } from "react";

type StorageType = "localStorage" | "sessionStorage";

function getStorage(storageType: StorageType): Storage | null {
  if (typeof window === "undefined") return null;
  return storageType === "sessionStorage" ? window.sessionStorage : window.localStorage;
}

export function useLocalStorage(
  key: string,
  defaultValue: string,
  storageType: StorageType = "localStorage"
): [string, (value: string) => void] {
  const [storedValue, setStoredValue] = useState<string>(() => {
    const storage = getStorage(storageType);
    if (!storage) return defaultValue;
    return storage.getItem(key) ?? defaultValue;
  });

  const setValue = useCallback(
    (value: string) => {
      setStoredValue(value);
      try {
        getStorage(storageType)?.setItem(key, value);
      } catch {
        // Storage quota exceeded or access denied — state still updates in memory
      }
    },
    [key, storageType]
  );

  return [storedValue, setValue];
}

export function clearStoredValue(key: string, storageType: StorageType = "localStorage"): void {
  getStorage(storageType)?.removeItem(key);
}

export function setStoredValue(
  key: string,
  value: string,
  storageType: StorageType = "localStorage"
): void {
  getStorage(storageType)?.setItem(key, value);
}
