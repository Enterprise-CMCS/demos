import { ApolloError, ServerError } from "@apollo/client";

function isServerError(value: unknown): value is ServerError {
  return value instanceof Error && value?.name === "ServerError";
}

type AuthorizerErrorResult = {
  code: string;
  message: string;
};

function isAuthorizerErrorResult(value: unknown): value is AuthorizerErrorResult {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (!("code" in value) || typeof value.code !== "string") {
    return false;
  }

  if (!("message" in value) || typeof value.message !== "string") {
    return false;
  }

  return true;
}

export function getApolloErrorMessage(error?: ApolloError): string {
  if (!error) return "";

  const networkError = error.networkError;

  if (isServerError(networkError) && isAuthorizerErrorResult(networkError.result)) {
    return networkError.result.message;
  }

  return error.message;
}
