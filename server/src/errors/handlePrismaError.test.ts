import { describe, it, expect } from "vitest";
import { handlePrismaError, isKnownRequestError, isUnknownRequestError } from "./handlePrismaError";
import { GraphQLError } from "graphql";

describe("handlePrismaError", () => {
  describe("isKnownRequestError", () => {
    it("returns true for objects with string code and message", () => {
      expect(isKnownRequestError({ code: "P2003", message: "fk" })).toBe(true);
    });

    it("returns false for non-objects", () => {
      expect(isKnownRequestError(null)).toBe(false);
      expect(isKnownRequestError("oops")).toBe(false);
      expect(isKnownRequestError(123)).toBe(false);
    });

    it("returns false when code or message are not strings", () => {
      expect(isKnownRequestError({ code: 123, message: "ok" })).toBe(false);
      expect(isKnownRequestError({ code: "P2003", message: 123 })).toBe(false);
      expect(isKnownRequestError({})).toBe(false);
    });
  });

  describe("isUnknownRequestError", () => {
    it("returns true for objects with string message", () => {
      expect(isUnknownRequestError({ message: "boom" })).toBe(true);
    });

    it("returns false for non-objects", () => {
      expect(isUnknownRequestError(null)).toBe(false);
      expect(isUnknownRequestError("boom")).toBe(false);
      expect(isUnknownRequestError(42)).toBe(false);
    });

    it("returns false when message is not a string", () => {
      expect(isUnknownRequestError({ message: 42 })).toBe(false);
      expect(isUnknownRequestError({})).toBe(false);
    });
  });

  describe("PrismaClientKnownRequestError", () => {
    it("throws friendly message for P2003 (foreign key constraint)", () => {
      const err = {
        message: "fk",
        code: "P2003",
        meta: { constraint: "fk_constraint" },
      };
      try {
        handlePrismaError(err);
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        if (error instanceof GraphQLError) {
          expect(error.message).toContain("A foreign key constraint");
          expect(error.message).toContain("fk_constraint");
          expect(error.extensions.code).toBe("VIOLATED_FOREIGN_KEY");
        }
      }
    });

    it("uses unknown constraint name when P2003 metadata is missing", () => {
      const err = {
        message: "fk",
        code: "P2003",
      };
      try {
        handlePrismaError(err);
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        if (error instanceof GraphQLError) {
          expect(error.message).toContain("A foreign key constraint unknown was violated");
          expect(error.extensions.code).toBe("VIOLATED_FOREIGN_KEY");
        }
      }
    });

    it("throws friendly message for P2025 (no record to update)", () => {
      const err = {
        message: "no-record-found",
        code: "P2025",
      };
      try {
        handlePrismaError(err);
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        if (error instanceof GraphQLError) {
          expect(error.message).toBe("An operation was attempted on a record that does not exist.");
          expect(error.extensions.code).toBe("NO_RECORD_FOUND_FOR_OPERATION");
        }
      }
    });

    it("throws generic message for other known request errors", () => {
      const err = {
        message: "other",
        code: "P1000",
      };
      try {
        handlePrismaError(err);
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        if (error instanceof GraphQLError) {
          expect(error.message).toContain("A known Prisma error was encountered");
          expect(error.extensions.code).toBe("KNOWN_PRISMA_ERROR");
        }
      }
    });
  });

  describe("PrismaClientUnknownRequestError", () => {
    it("throws friendly-ish message for check constraint", () => {
      const err = {
        // Pulled example test message, this is just a portion of it
        message:
          '\"new row for relation \\\"demonstration\\\" violates check constraint \\\"' +
          'effective_date_check\\\"\", severity: \"ERROR\",',
      };
      try {
        handlePrismaError(err);
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        if (error instanceof GraphQLError) {
          expect(error.message).toContain("A check constraint was violated");
          expect(error.extensions.constraintName).toBe("effective_date_check");
          expect(error.extensions.code).toBe("VIOLATED_CHECK_CONSTRAINT");
        }
      }
    });

    it("throws fails gracefully if unable to extract the name of the constraint", () => {
      const err = {
        message: '\"new row for relation \\\"demonstration\\\" violates check constraint \\\"',
      };
      try {
        handlePrismaError(err);
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        if (error instanceof GraphQLError) {
          expect(error.message).toContain("A check constraint was violated");
          expect(error.extensions.constraintName).toBe("unknown");
          expect(error.extensions.code).toBe("VIOLATED_CHECK_CONSTRAINT");
        }
      }
    });
  });

  describe("Generic error path", () => {
    it("re-throws non-Prisma errors unchanged", () => {
      const err = new Error("boom");
      expect(() => handlePrismaError(err)).toThrow(err);
    });
  });
});
