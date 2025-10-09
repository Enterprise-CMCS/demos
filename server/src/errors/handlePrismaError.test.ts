import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";
import { handlePrismaError } from "./handlePrismaError";
import { GraphQLError } from "graphql";

describe("handlePrismaError", () => {
  describe("PrismaClientKnownRequestError", () => {
    it("throws friendly message for P2003 (foreign key constraint)", () => {
      const err = new Prisma.PrismaClientKnownRequestError("fk", {
        code: "P2003",
        clientVersion: "x",
        meta: { constraint: "fk_constraint" },
      });
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

    it("throws generic message for other known request errors", () => {
      const err = new Prisma.PrismaClientKnownRequestError("other", {
        code: "P1000",
        clientVersion: "x",
      });
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
      const err = new Prisma.PrismaClientUnknownRequestError(
        "Your payload violates check constraint check_my_payload.",
        {
          clientVersion: "x",
        }
      );
      try {
        handlePrismaError(err);
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        if (error instanceof GraphQLError) {
          expect(error.message).toContain("A check constraint was violated");
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
