import { GraphQLFormattedError } from "graphql";

export const CUSTOM_INTERNAL_ERROR_CODES = [
  "REFERENCE_NOT_FOUND",
  "REFERENCE_AGREEMENT_ERROR",
  "REFERENCE_NOT_ACTIVE",
  "REFERENCE_AGREEMENT_NOT_FOUND",
  "REFERENCE_AGREEMENT_NOT_ACTIVE",
] as const;

export const CUSTOM_PUBLIC_ERROR_CODES = ["REFERENCE_ERROR"] as const;

export const ERROR_LOG_LEVELS = ["debug", "info", "warn", "error"] as const;

export type CustomInternalErrorCode = (typeof CUSTOM_INTERNAL_ERROR_CODES)[number];
export type CustomPublicErrorCode = (typeof CUSTOM_PUBLIC_ERROR_CODES)[number];
export type ErrorLogLevel = (typeof ERROR_LOG_LEVELS)[number];

export function isCustomInternalErrorCode(value: string): value is CustomInternalErrorCode {
  return (CUSTOM_INTERNAL_ERROR_CODES as readonly string[]).includes(value);
}

export const CUSTOM_ERROR_CODES: Record<
  CustomInternalErrorCode,
  { publicErrorCode: CustomPublicErrorCode; logLevel: ErrorLogLevel }
> = {
  REFERENCE_NOT_FOUND: { publicErrorCode: "REFERENCE_ERROR", logLevel: "debug" },
  REFERENCE_AGREEMENT_ERROR: { publicErrorCode: "REFERENCE_ERROR", logLevel: "debug" },
  REFERENCE_NOT_ACTIVE: { publicErrorCode: "REFERENCE_ERROR", logLevel: "debug" },
  REFERENCE_AGREEMENT_NOT_FOUND: { publicErrorCode: "REFERENCE_ERROR", logLevel: "debug" },
  REFERENCE_AGREEMENT_NOT_ACTIVE: { publicErrorCode: "REFERENCE_ERROR", logLevel: "debug" },
} as const;

export function getPublicErrorCodeFromInternal(
  errorCode: CustomInternalErrorCode
): CustomPublicErrorCode {
  return CUSTOM_ERROR_CODES[errorCode].publicErrorCode;
}

export function formatGraphQLErrorCode(
  formattedError: GraphQLFormattedError
): GraphQLFormattedError {
  const internalErrorCode = formattedError.extensions?.code;

  // In the specific case of a masking, rewrite it
  if (typeof internalErrorCode === "string" && isCustomInternalErrorCode(internalErrorCode)) {
    const publicErrorCode = getPublicErrorCodeFromInternal(internalErrorCode);
    return {
      ...formattedError,
      extensions: { ...formattedError.extensions, code: publicErrorCode },
    };
  }

  // Otherwise, do not touch it
  return formattedError;
}
