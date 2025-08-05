import { shouldUseMocks } from "config/env";

/**
 * Validates if a string is a valid UUID format
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Converts a user ID to the appropriate format based on environment
 * In mock mode, keeps the original format (string)
 * In real mode, ensures it's a valid UUID or converts it
 */
export const normalizeUserId = (userId: string): string => {
  if (shouldUseMocks()) {
    // In mock mode, return the original value as string
    return userId;
  }

  // In real mode, ensure it's a valid UUID string
  if (isValidUUID(userId)) {
    return userId;
  }

  // If it's not a valid UUID in real mode, this might be an error
  // Log it for debugging and return the bypassed user UUID
  console.warn(
    `Invalid UUID format in real mode: ${userId}, using bypassed user`
  );
  return "00000000-1111-2222-3333-123abc123abc"; // The bypassed user from the database
};

/**
 * Converts a demonstration ID to the appropriate format based on environment
 */
export const normalizeDemonstrationId = (demoId: string): string => {
  if (shouldUseMocks()) {
    return demoId;
  }

  // In real mode, map demo values to actual UUIDs from the database
  const demoMappings: Record<string, string> = {
    "medicaid-fl": "12fa64c4-45a3-4412-aefa-5f1a6e7904ad", // First demo from database
    "innovative-ca": "947cc760-9287-4012-aa94-ff1a90faed74", // Second demo from database
  };

  return demoMappings[demoId] || demoId;
};
