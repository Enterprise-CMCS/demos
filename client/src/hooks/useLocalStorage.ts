import { useCallback, useState } from "react";

/**
 * localStorage — persists across sessions, shared across tabs.
 * sessionStorage — cleared when the tab closes, isolated per tab.
 */
type StorageType = "localStorage" | "sessionStorage";

function getStorage(storageType: StorageType): Storage | null {
  if (typeof window === "undefined") return null;

  if (storageType === "localStorage") return window.localStorage;
  if (storageType === "sessionStorage") return window.sessionStorage;
  return null;
}

export function useLocalStorage(
  storageKey: string,
  defaultValue: string,
  storageType: StorageType = "localStorage"
): [string, (value: string) => void, () => void] {
  const [storedValue, setStoredValue] = useState<string>(() => {
    const storage = getStorage(storageType);
    if (!storage) return defaultValue;
    return storage.getItem(storageKey) ?? defaultValue;
  });

  const setValue = useCallback(
    (value: string) => {
      setStoredValue(value);
      try {
        getStorage(storageType)?.setItem(storageKey, value);
      } catch {
        // Storage quota exceeded or access denied — state still updates in memory
      }
    },
    [storageKey, storageType]
  );

  const clearValue = useCallback(() => {
    setStoredValue(defaultValue);
    getStorage(storageType)?.removeItem(storageKey);
  }, [storageKey, storageType, defaultValue]);

  return [storedValue, setValue, clearValue];
}
