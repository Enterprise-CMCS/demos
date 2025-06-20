import { renderHook, waitFor } from "@testing-library/react";
import { useDemonstration } from "./useDemonstration";
import { AddDemonstrationInput } from "demos-server";
import {
  mockAddDemonstrationInput,
  testDemonstration,
} from "mock-data/demonstrationMocks";
import { DemosApolloProvider } from "router/DemosApolloProvider";

const expectedDemonstration = testDemonstration;

const renderUseDemonstrationHook = () => {
  return renderHook(() => useDemonstration(), {
    wrapper: DemosApolloProvider,
  });
};

describe("useDemonstration", () => {
  describe("getAllDemonstrations", () => {
    it("should fetch all demonstrations successfully", async () => {
      const { result } = renderUseDemonstrationHook();

      expect(result.current.getAllDemonstrations.loading).toBe(false);
      expect(result.current.getAllDemonstrations.data).toBeUndefined();

      result.current.getAllDemonstrations.trigger();

      await waitFor(() => {
        expect(result.current.getAllDemonstrations.data).toBeDefined();
        const actualDemonstrations = result.current.getAllDemonstrations.data!;
        expect(actualDemonstrations.length).toBeGreaterThan(0);
        expect(actualDemonstrations[0].name).toEqual(
          expectedDemonstration.name
        );
      });
      expect(result.current.getAllDemonstrations.error).toBeUndefined();
    });
  });

  describe("getDemonstrationById", () => {
    it("should fetch demonstration by id successfully", async () => {
      const { result } = renderUseDemonstrationHook();

      result.current.getDemonstrationById.trigger(expectedDemonstration.id);

      await waitFor(() => {
        expect(result.current.getDemonstrationById.data).toBeDefined();
        const actualDemonstration = result.current.getDemonstrationById.data!;
        expect(actualDemonstration.name).toEqual(testDemonstration.name);
      });
      expect(result.current.getDemonstrationById.error).toBeUndefined();
    });

    it("should handle error when fetching demonstration by id", async () => {
      const { result } = renderUseDemonstrationHook();

      result.current.getDemonstrationById.trigger("fakeID");

      await waitFor(() => {
        expect(result.current.getDemonstrationById.error).toBeDefined();
      });

      expect(result.current.getDemonstrationById.data).toBeUndefined();
    });
  });

  describe("addDemonstration", () => {
    it("should add demonstration successfully", async () => {
      const { result } = renderUseDemonstrationHook();

      expect(result.current.addDemonstration.loading).toBe(false);
      expect(result.current.addDemonstration.data).toBeUndefined();

      result.current.addDemonstration.trigger(mockAddDemonstrationInput);

      await waitFor(() => {
        expect(result.current.addDemonstration.data).toBeDefined();
        const actualDemonstration = result.current.addDemonstration.data!;

        expect(actualDemonstration?.description).toEqual(
          expectedDemonstration.description
        );
      });
      expect(result.current.addDemonstration.error).toBeUndefined();
    });

    it("should handle error when adding demonstration", async () => {
      const { result } = renderUseDemonstrationHook();

      result.current.addDemonstration.trigger({
        demonstrationStatusId: "incomplete add demonstration input",
      } as AddDemonstrationInput);

      await waitFor(() => {
        expect(result.current.addDemonstration.error).toBeDefined();
      });

      expect(result.current.addDemonstration.data).toBeUndefined();
    });
  });

  describe("initial state", () => {
    it("should have correct initial state for all operations", () => {
      const { result } = renderUseDemonstrationHook();

      // Check initial state for all operations
      expect(result.current.getAllDemonstrations.loading).toBe(false);
      expect(result.current.getAllDemonstrations.data).toBeUndefined();
      expect(result.current.getAllDemonstrations.error).toBeUndefined();

      expect(result.current.getDemonstrationById.loading).toBe(false);
      expect(result.current.getDemonstrationById.data).toBeUndefined();
      expect(result.current.getDemonstrationById.error).toBeUndefined();

      expect(result.current.addDemonstration.loading).toBe(false);
      expect(result.current.addDemonstration.data).toBeUndefined();
      expect(result.current.addDemonstration.error).toBeUndefined();
    });
  });
});
