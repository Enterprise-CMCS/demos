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

function tryStringifyJson<T>(value: T): string | undefined {
  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
}

function tryParseJson<T>(value: string): T | undefined {
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

export function useSessionStorageJson<T extends object>(
  storageKey: string
): [T | undefined, (value: T) => void] {
  const [stringValue, setStringValue] = useWebStorage(storageKey, "sessionStorage");
  return [
    stringValue ? tryParseJson<T>(stringValue) : undefined,
    (next) => {
      const serialized = tryStringifyJson(next);
      if (serialized !== undefined) setStringValue(serialized);
    },
  ];
}
