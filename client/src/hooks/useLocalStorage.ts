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

type UseLocalStorageReturn = [value: string, setValue: (value: string) => void];

export function useLocalStorage(
  storageKey: string,
  storageType: StorageType = "localStorage"
): UseLocalStorageReturn {
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
