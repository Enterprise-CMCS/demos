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

function useWebStorage(
  storageKey: string,
  storageType: StorageType
): [value: string, setValue: (value: string) => void] {
  const [storedValue, setStoredValue] = useState<string>(
    () => getStorage(storageType)?.getItem(storageKey) ?? ""
  );

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

  return [storedValue, setValue];
}

export function useLocalStorage(
  storageKey: string
): [value: string, setValue: (value: string) => void] {
  return useWebStorage(storageKey, "localStorage");
}

export function useSessionStorage(
  storageKey: string
): [value: string, setValue: (value: string) => void] {
  return useWebStorage(storageKey, "sessionStorage");
}

/** Clears all localStorage and sessionStorage. Intended for use in test `beforeEach` cleanup. */
export function clearWebStorage(): void {
  if (typeof window === "undefined") return;
  window.localStorage.clear();
  window.sessionStorage.clear();
}
