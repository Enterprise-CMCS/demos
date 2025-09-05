const VALID_MODES = ["development", "test", "production"] as const;

export type AppMode = (typeof VALID_MODES)[number];

export const getAppMode = (): AppMode => {
  const mode = import.meta.env.MODE;

  if (!VALID_MODES.includes(mode as AppMode)) {
    throw new Error(`Invalid app mode: ${mode}. Must be one of: ${VALID_MODES.join(", ")}`);
  }

  return mode as AppMode;
};

// App mode is "development" when running locally with `npm run dev`
export const isLocalDevelopment = (): boolean => {
  return getAppMode() === "development";
};

export const isTestMode = (): boolean => {
  return getAppMode() === "test";
};

// This will be true in dev, prod, and impl
export const isProductionMode = (): boolean => {
  return getAppMode() === "production";
};

export const shouldUseMocks = (): boolean => {
  const useMocks = import.meta.env.VITE_USE_MOCKS == "true";

  return isTestMode() || (isLocalDevelopment() && useMocks);
};

export const getIdleTimeoutMs = (): number => {
  const n = Number(import.meta.env.VITE_IDLE_TIMEOUT);
  return Number.isFinite(n) ? n : 15 * 60 * 1000; // default 15 min
};
