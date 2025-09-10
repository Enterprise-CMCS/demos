import { MockedApolloWrapper } from "router/MockedApolloWrapper";

import {
  renderHook,
  waitFor,
} from "@testing-library/react";

import { useDemonstrationOptions } from "./useDemonstrationOptions";

const renderUseDemonstrationOptionsHook = () => {
  return renderHook(() => useDemonstrationOptions(), {
    wrapper: MockedApolloWrapper,
  });
};

describe("useDemonstrationOptions", () => {
  it("should fetch and format demonstration options", async () => {
    const { result } = renderUseDemonstrationOptionsHook();

    // Initially loading should be true
    expect(result.current.loading).toBe(true);
    expect(result.current.demoOptions).toEqual([]);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await waitFor(() => {
      if (result.current.demoOptions.length > 0) {
        const firstOption = result.current.demoOptions[0];
        expect(firstOption).toHaveProperty("label");
        expect(firstOption).toHaveProperty("value");
        expect(typeof firstOption.label).toBe("string");
        expect(typeof firstOption.value).toBe("string");
      }
    });
  });

  it("should return empty options array when no data", () => {
    const { result } = renderUseDemonstrationOptionsHook();

    // Before data loads, should return empty array
    expect(result.current.demoOptions).toEqual([]);
  });

  it("should expose loading and error states", () => {
    const { result } = renderUseDemonstrationOptionsHook();

    expect(result.current).toHaveProperty("loading");
    expect(result.current).toHaveProperty("error");
    expect(result.current).toHaveProperty("demoOptions");
  });
});
