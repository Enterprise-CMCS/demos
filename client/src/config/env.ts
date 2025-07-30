const VALID_MODES = ["development", "test", "production"] as const;

export type AppMode = (typeof VALID_MODES)[number];

export const getAppMode = (): AppMode => {
  const mode = import.meta.env.MODE;

  if (!VALID_MODES.includes(mode as AppMode)) {
    throw new Error(
      `Invalid app mode: ${mode}. Must be one of: ${VALID_MODES.join(", ")}`
    );
  }

  return mode as AppMode;
};

export const isDevelopmentMode = (): boolean => {
  return getAppMode() === "development";
};

export const isTestMode = (): boolean => {
  return getAppMode() === "test";
};

export const isProductionMode = (): boolean => {
  return getAppMode() === "production";
};

export const shouldUseMocks = (): boolean => {
  const useMocks = import.meta.env.VITE_USE_MOCKS == "true";

  return isTestMode() || (isDevelopmentMode() && useMocks);
};
