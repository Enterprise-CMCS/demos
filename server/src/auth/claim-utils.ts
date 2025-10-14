
// Type safe getter and multi-key look up.
export const getString = (obj: Record<string, unknown>, key: string): string | undefined => {
  const value = obj[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

// Try several keys (snake/camel/cognito) and return the first non-empty string
export const pickString = (obj: Record<string, unknown>, keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = getString(obj, key);
    if (value) return value;
  }
  return undefined;
};
