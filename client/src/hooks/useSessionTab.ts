import { useCallback, useState } from "react";

type UseSessionTabOptions<T extends string> = {
  key: string;
  defaultValue: T;
  allowedValues: readonly T[];
};

function getInitialTabValue<T extends string>({
  key,
  defaultValue,
  allowedValues,
}: UseSessionTabOptions<T>): T {
  if (typeof window === "undefined") {
    return defaultValue;
  }

  const stored = sessionStorage.getItem(key);
  const tabValue = allowedValues.includes(stored as T) ? (stored as T) : defaultValue;
  sessionStorage.setItem(key, tabValue);

  return tabValue;
}

export function useSessionTab<T extends string>({
  key,
  defaultValue,
  allowedValues,
}: UseSessionTabOptions<T>): readonly [T, (value: string) => void] {
  const [tabValue, setTabValue] = useState<T>(() =>
    getInitialTabValue({ key, defaultValue, allowedValues })
  );

  const onTabSelect = useCallback(
    (value: string) => {
      const nextValue = allowedValues.includes(value as T) ? (value as T) : defaultValue;
      setTabValue(nextValue);

      if (typeof window !== "undefined") {
        sessionStorage.setItem(key, nextValue);
      }
    },
    [allowedValues, defaultValue, key]
  );

  return [tabValue, onTabSelect] as const;
}
