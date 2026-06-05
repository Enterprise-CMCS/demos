import { describe, it, expect } from "vitest";
import { GraphQLError } from "graphql";
import {
  isCustomInternalErrorCode,
  getPublicErrorCodeFromInternal,
  getPublicErrorMessageFromCode,
  throwCustomGQLError,
  formatGraphQLErrorCode,
  CustomInternalErrorCode,
  CustomPublicErrorCode,
} from "./errorCodes";

describe("errorCodes", () => {
  describe("isCustomInternalErrorCode", () => {
    it("returns true for a known internal error code", () => {
      expect(
        isCustomInternalErrorCode("REFERENCE_NOT_FOUND" satisfies CustomInternalErrorCode)
      ).toBe(true);
    });

    it("returns false for an unknown string", () => {
      expect(isCustomInternalErrorCode("UNKNOWN_CODE")).toBe(false);
    });
  });

  describe("getPublicErrorCodeFromInternal", () => {
    it("returns the mapped public error code for a known internal code", () => {
      expect(
        getPublicErrorCodeFromInternal("REFERENCE_NOT_FOUND" satisfies CustomInternalErrorCode)
      ).toBe("REFERENCE_ERROR" satisfies CustomPublicErrorCode);
    });
  });

  describe("getPublicErrorMessageFromCode", () => {
    it("returns the custom message when one is defined for the public code", () => {
      expect(
        getPublicErrorMessageFromCode(
          "ON_DEMAND_REPORT_ERROR" satisfies CustomPublicErrorCode,
          "original message"
        )
      ).toBe("An error occurred while running an on-demand report.");
    });

    it("returns the original message when no custom message is defined for the public code", () => {
      expect(
        getPublicErrorMessageFromCode(
          "REFERENCE_ERROR" satisfies CustomPublicErrorCode,
          "original message"
        )
      ).toBe("original message");
    });
  });

  describe("throwCustomGQLError", () => {
    it("throws a GraphQLError with the given message and internal error code", () => {
      try {
        throwCustomGQLError("something failed", "REFERENCE_NOT_FOUND");
        throw new Error("Expected throwCustomGQLError to throw, but it did not.");
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        if (error instanceof GraphQLError) {
          expect(error.message).toBe("something failed");
          expect(error.extensions.code).toBe("REFERENCE_NOT_FOUND");
        }
      }
    });
  });

  describe("formatGraphQLErrorCode", () => {
    it("rewrites a known internal error code to its public code", () => {
      const input = {
        message: "something went wrong",
        locations: undefined,
        extensions: { code: "REFERENCE_NOT_FOUND" satisfies CustomInternalErrorCode },
      };
      const result = formatGraphQLErrorCode(input);
      expect(result.extensions!.code).toBe("REFERENCE_ERROR" satisfies CustomPublicErrorCode);
    });

    it("preserves all other fields when rewriting the code", () => {
      const input = {
        message: "something went wrong",
        locations: undefined,
        extensions: { code: "REFERENCE_NOT_ACTIVE", extra: "data" },
      };
      const result = formatGraphQLErrorCode(input);
      expect(result.message).toBe("something went wrong");
      expect(result.extensions!.code).toBe("REFERENCE_ERROR");
      expect(result.extensions!.extra).toBe("data");
    });

    it("does not modify the error when the code is not a known internal code", () => {
      const input = {
        message: "some error",
        locations: undefined,
        extensions: { code: "INTERNAL_SERVER_ERROR" },
      };
      const result = formatGraphQLErrorCode(input);
      expect(result).toBe(input);
    });

    it("does not modify the error when extensions are absent", () => {
      const input = {
        message: "some error",
        locations: undefined,
        extensions: undefined,
      };
      const result = formatGraphQLErrorCode(input);
      expect(result).toBe(input);
    });

    it("does not modify the error when the code is not a string", () => {
      const input = {
        message: "some error",
        locations: undefined,
        extensions: { code: 42 },
      };
      const result = formatGraphQLErrorCode(input);
      expect(result).toBe(input);
    });
  });
});
