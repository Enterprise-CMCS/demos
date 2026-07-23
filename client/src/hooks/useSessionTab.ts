import { useCallback } from "react";
import { useLocalStorage } from "hooks/useLocalStorage";

type UseSessionTabOptions<T extends string> = {
  key: string;
  defaultValue: T;
  allowedValues: readonly T[];
};

export function useSessionTab<T extends string>({
  key,
  defaultValue,
  allowedValues,
}: UseSessionTabOptions<T>): readonly [T, (value: string) => void] {
  const [tabValue, setTabValue] = useLocalStorage(key, "sessionStorage");

  const onTabSelect = useCallback(
    (value: string) => {
      const nextValue = allowedValues.includes(value as T) ? (value as T) : defaultValue;
      setTabValue(nextValue);
    },
    [allowedValues, defaultValue, setTabValue]
  );

  return [tabValue as T, onTabSelect] as const;
}
