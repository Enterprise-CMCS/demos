import { GraphQLError, GraphQLFormattedError } from "graphql";

export const CUSTOM_INTERNAL_ERROR_CODES = [
  "ON_DEMAND_REPORT_ZOD_ERROR",
  "REFERENCE_AGREEMENT_ERROR",
  "REFERENCE_AGREEMENT_NOT_ACTIVE",
  "REFERENCE_AGREEMENT_NOT_FOUND",
  "REFERENCE_NOT_ACTIVE",
  "REFERENCE_NOT_FOUND",
  "USER_MIGRATION_MULTIPLE_RECORD_ERROR",
] as const;

export const CUSTOM_PUBLIC_ERROR_CODES = [
  "REFERENCE_ERROR",
  "ON_DEMAND_REPORT_ERROR",
  "AUTHENTICATION_ERROR",
] as const;

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
  ON_DEMAND_REPORT_ZOD_ERROR: { publicErrorCode: "ON_DEMAND_REPORT_ERROR", logLevel: "error" },
  REFERENCE_NOT_FOUND: { publicErrorCode: "REFERENCE_ERROR", logLevel: "debug" },
  REFERENCE_AGREEMENT_ERROR: { publicErrorCode: "REFERENCE_ERROR", logLevel: "debug" },
  REFERENCE_NOT_ACTIVE: { publicErrorCode: "REFERENCE_ERROR", logLevel: "debug" },
  REFERENCE_AGREEMENT_NOT_FOUND: { publicErrorCode: "REFERENCE_ERROR", logLevel: "debug" },
  REFERENCE_AGREEMENT_NOT_ACTIVE: { publicErrorCode: "REFERENCE_ERROR", logLevel: "debug" },
  USER_MIGRATION_MULTIPLE_RECORD_ERROR: {
    publicErrorCode: "AUTHENTICATION_ERROR",
    logLevel: "error",
  },
} as const;

const CUSTOM_PUBLIC_ERROR_MESSAGES: Record<CustomPublicErrorCode, string | undefined> = {
  ON_DEMAND_REPORT_ERROR: "An error occurred while running an on-demand report.",
  REFERENCE_ERROR: undefined,
  AUTHENTICATION_ERROR: undefined,
};

export function getPublicErrorCodeFromInternal(
  errorCode: CustomInternalErrorCode
): CustomPublicErrorCode {
  return CUSTOM_ERROR_CODES[errorCode].publicErrorCode;
}

export function getPublicErrorMessageFromCode(
  publicErrorCode: CustomPublicErrorCode,
  originalMessage: string
): string {
  return CUSTOM_PUBLIC_ERROR_MESSAGES[publicErrorCode] ?? originalMessage;
}

export function throwCustomGQLError(message: string, errorCode: CustomInternalErrorCode): never {
  throw new GraphQLError(message, {
    extensions: {
      code: errorCode,
    },
  });
}

export function formatGraphQLErrorCode(
  formattedError: GraphQLFormattedError
): GraphQLFormattedError {
  const internalErrorCode = formattedError.extensions?.code;

  // In the specific case of a masking, rewrite it
  if (typeof internalErrorCode === "string" && isCustomInternalErrorCode(internalErrorCode)) {
    const publicErrorCode = getPublicErrorCodeFromInternal(internalErrorCode);
    const publicErrorMessage = getPublicErrorMessageFromCode(
      publicErrorCode,
      formattedError.message
    );
    return {
      ...formattedError,
      message: publicErrorMessage,
      extensions: { ...formattedError.extensions, code: publicErrorCode },
    };
  }

  // Otherwise, do not touch it
  return formattedError;
}
