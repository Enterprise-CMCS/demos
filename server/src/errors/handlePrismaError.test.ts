import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";
import { handlePrismaError } from "./handlePrismaError";

describe("handlePrismaError", () => {
  it("throws friendly message for P2003 (FK constraint)", () => {
    const err = new Prisma.PrismaClientKnownRequestError("fk", {
      code: "P2003",
      clientVersion: "x",
      meta: { constraint: "fk_constraint" },
    });
    expect(() => handlePrismaError(err)).toThrow(/Foreign key constraint failed/);
    expect(() => handlePrismaError(err)).toThrow(/fk_constraint/);
  });

  it("throws generic message for other known request errors", () => {
    const err = new Prisma.PrismaClientKnownRequestError("other", {
      code: "P1000",
      clientVersion: "x",
    });
    expect(() => handlePrismaError(err)).toThrow(/A Prisma error was encountered/);
  });

  it("re-throws non-Prisma errors unchanged", () => {
    const err = new Error("boom");
    expect(() => handlePrismaError(err)).toThrow(err);
  });
});
