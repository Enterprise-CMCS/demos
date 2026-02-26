import { describe, expect, it } from "vitest";
import { typeDefs, resolvers } from "./graphql.js";

describe("graphql", () => {
  it("exports non-empty typeDefs and resolvers", () => {
    expect(Array.isArray(typeDefs)).toBe(true);
    expect(Array.isArray(resolvers)).toBe(true);
    expect(typeDefs.length).toBeGreaterThan(0);
    expect(resolvers.length).toBeGreaterThan(0);
  });
});
