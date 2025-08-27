import { print } from "graphql";
import {
  describe,
  expect,
  it,
} from "vitest";

import { MockedResponse } from "@apollo/client/testing";

import { ALL_MOCKS } from "./index";

describe("ALL_MOCKS", () => {
  it("should have a request and result for each mock", () => {
    ALL_MOCKS.forEach((mock) => {
      expect(mock.request).toBeDefined();
      expect(mock.error || mock.result).toBeDefined();
    });
  });

  it("should not have overlapping queries", () => {
    const queries = ALL_MOCKS.map((mock: MockedResponse) => {
      if (!mock.request.query) {
        throw new Error(`Mock is missing query: ${JSON.stringify(mock, null, 2)}`);
      }
      return {
        query: print(mock.request.query),
        variables: mock.request.variables,
        result: mock.result,
        error: mock.error,
      };
    });

    const uniqueQueries = new Set(queries);
    expect(uniqueQueries.size).toBe(queries.length);
  });
});
