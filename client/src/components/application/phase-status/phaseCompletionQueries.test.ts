import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  useCompletePhase,
  useDeclareCompletenessPhaseIncomplete,
  useSkipConceptPhase,
} from "./phaseCompletionQueries";
import { TestProvider } from "test-utils/TestProvider";
import React from "react";

describe("phaseStatusQueries", () => {
  describe("useCompletePhase", () => {
    it("should return an object with completePhase function and mutation states", () => {
      const { result } = renderHook(() => useCompletePhase(), {
        wrapper: ({ children }) => React.createElement(TestProvider, null, children),
      });

      expect(result.current).toHaveProperty("completePhase");
      expect(result.current).toHaveProperty("data");
      expect(result.current).toHaveProperty("loading");
      expect(result.current).toHaveProperty("error");
      expect(typeof result.current.completePhase).toBe("function");
    });

    it("should have loading set to false initially", () => {
      const { result } = renderHook(() => useCompletePhase(), {
        wrapper: ({ children }) => React.createElement(TestProvider, null, children),
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe("useDeclareCompletenessPhaseIncomplete", () => {
    it("should return an object with declareCompletenessPhaseIncomplete function and mutation states", () => {
      const { result } = renderHook(() => useDeclareCompletenessPhaseIncomplete(), {
        wrapper: ({ children }) => React.createElement(TestProvider, null, children),
      });

      expect(result.current).toHaveProperty("declareCompletenessPhaseIncomplete");
      expect(result.current).toHaveProperty("data");
      expect(result.current).toHaveProperty("loading");
      expect(result.current).toHaveProperty("error");
      expect(typeof result.current.declareCompletenessPhaseIncomplete).toBe("function");
    });

    it("should have loading set to false initially", () => {
      const { result } = renderHook(() => useDeclareCompletenessPhaseIncomplete(), {
        wrapper: ({ children }) => React.createElement(TestProvider, null, children),
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe("useSkipConceptPhase", () => {
    it("should return an object with skipConceptPhase function and mutation states", () => {
      const { result } = renderHook(() => useSkipConceptPhase(), {
        wrapper: ({ children }) => React.createElement(TestProvider, null, children),
      });

      expect(result.current).toHaveProperty("skipConceptPhase");
      expect(result.current).toHaveProperty("data");
      expect(result.current).toHaveProperty("loading");
      expect(result.current).toHaveProperty("error");
      expect(typeof result.current.skipConceptPhase).toBe("function");
    });

    it("should have loading set to false initially", () => {
      const { result } = renderHook(() => useSkipConceptPhase(), {
        wrapper: ({ children }) => React.createElement(TestProvider, null, children),
      });

      expect(result.current.loading).toBe(false);
    });
  });
});
