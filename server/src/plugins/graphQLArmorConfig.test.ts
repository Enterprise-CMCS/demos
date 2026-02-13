import { describe, it, expect, vi } from "vitest";
import { GraphQLArmorConfig, logRejection } from "./graphQLArmorConfig";
import { GraphQLError } from "graphql";
import * as logModule from "../log";

describe("GraphQLArmorConfig", () => {
  it("should have onReject arrays for all protections", () => {
    for (const key of [
      "costLimit",
      "maxAliases",
      "maxDepth",
      "maxDirectives",
      "maxTokens",
    ] as const) {
      expect(Array.isArray(GraphQLArmorConfig[key].onReject)).toBe(true);
      expect(GraphQLArmorConfig[key].onReject).toContain(logRejection);
    }
  });
});

describe("logRejection", () => {
  it("should log a warning with the correct structure", () => {
    const warnSpy = vi.spyOn(logModule.log, "warn").mockImplementation(() => undefined as any);
    const ctx = { some: "context" } as any;
    const error = new GraphQLError("Test error");
    logRejection(ctx, error);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "graphql.armor.rejection",
        error,
        ctx,
      })
    );
    warnSpy.mockRestore();
  });
});
