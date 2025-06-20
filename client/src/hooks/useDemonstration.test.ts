import { renderHook, waitFor } from "@testing-library/react";
import { useDemonstration } from "./useDemonstration";
import { AddDemonstrationInput } from "demos-server";
import { testDemonstration } from "mock-data/demonstrationMocks";
import { california } from "mock-data/stateMocks";
import { johnDoe } from "mock-data/userMocks";
import { DemosApolloProvider } from "router/DemosApolloProvider";

const mockAddDemonstrationInput: AddDemonstrationInput = {
  name: "New Demonstration",
  description: "New Description",
  evaluationPeriodStartDate: new Date("2025-01-01"),
  evaluationPeriodEndDate: new Date("2025-12-31"),
  demonstrationStatusId: "1",
  stateId: california.id,
  userIds: [johnDoe.id],
};

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
        expect(result.current.getAllDemonstrations.data).toEqual([
          testDemonstration,
        ]);
      });
      expect(result.current.getAllDemonstrations.error).toBeUndefined();
    });

    it("should handle error when fetching all demonstrations", async () => {
      const { result } = renderUseDemonstrationHook();

      result.current.getAllDemonstrations.trigger();
      await waitFor(() => {
        expect(result.current.getAllDemonstrations.error).toBeDefined();
      });

      expect(result.current.getAllDemonstrations.data).toBeUndefined();
    });
  });

  describe("getDemonstrationById", () => {
    it("should fetch demonstration by id successfully", async () => {
      const demonstrationId = "1";

      const { result } = renderUseDemonstrationHook();

      result.current.getDemonstrationById.trigger(demonstrationId);

      await waitFor(() => {
        expect(result.current.getDemonstrationById.data).toEqual(
          testDemonstration
        );
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
        expect(result.current.addDemonstration.data).toEqual(testDemonstration);
      });
      expect(result.current.addDemonstration.error).toBeUndefined();
    });

    it("should handle error when adding demonstration", async () => {
      const { result } = renderUseDemonstrationHook();

      result.current.addDemonstration.trigger(mockAddDemonstrationInput);

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
