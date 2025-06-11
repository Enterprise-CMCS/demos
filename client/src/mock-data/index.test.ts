import { describe, it, expect } from "vitest";
import { print } from "graphql";
import { ALL_MOCKS } from "./index";

describe("ALL_MOCKS", () => {
  it("should have a request and result for each mock", () => {
    ALL_MOCKS.forEach((mock) => {
      expect(mock.request).toBeDefined();
      expect(mock.result).toBeDefined();
    });
  });

  it("should not have overlapping queries", () => {
    const queries = ALL_MOCKS.map((mock) => {
      return {
        query: print(mock.request.query),
        variables: mock.request.variables,
      };
    });

    const uniqueQueries = new Set(queries);
    expect(uniqueQueries.size).toBe(queries.length);
  });
});
