import { describe, it, expect, vi, beforeEach } from "vitest";
import { State } from "@prisma/client";

// Mock dependencies
vi.mock("../../prismaClient.js", () => ({
  prisma: vi.fn(() => ({
    state: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    demonstration: {
      findMany: vi.fn(),
    },
  })),
}));

import { prisma } from "../../prismaClient.js";
import { stateResolvers } from "./stateResolvers";

describe("stateResolvers", () => {
  const mockPrisma = {
    state: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    demonstration: {
      findMany: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (prisma as any).mockReturnValue(mockPrisma);
  });

  describe("Query resolvers", () => {
    describe("state", () => {
      it("should return state by id", async () => {
        const mockState = {
          id: "CA",
          name: "California",
          abbreviation: "CA",
          region: "West",
        };

        mockPrisma.state.findUnique.mockResolvedValue(mockState);

        const result = await stateResolvers.Query.state(undefined, { id: "CA" });

        expect(mockPrisma.state.findUnique).toHaveBeenCalledWith({
          where: { id: "CA" },
        });
        expect(result).toEqual(mockState);
      });

      it("should return null when state not found", async () => {
        mockPrisma.state.findUnique.mockResolvedValue(null);

        const result = await stateResolvers.Query.state(undefined, { id: "XX" });

        expect(mockPrisma.state.findUnique).toHaveBeenCalledWith({
          where: { id: "XX" },
        });
        expect(result).toBeNull();
      });

      it("should handle database errors", async () => {
        const dbError = new Error("Database connection failed");
        mockPrisma.state.findUnique.mockRejectedValue(dbError);

        await expect(
          stateResolvers.Query.state(undefined, { id: "CA" })
        ).rejects.toThrow("Database connection failed");
      });

      it("should handle different state id formats", async () => {
        const testCases = [
          { id: "CA", name: "California" },
          { id: "NY", name: "New York" },
          { id: "TX", name: "Texas" },
          { id: "FL", name: "Florida" },
        ];

        for (const testCase of testCases) {
          mockPrisma.state.findUnique.mockResolvedValue(testCase);

          const result = await stateResolvers.Query.state(undefined, { id: testCase.id });

          expect(mockPrisma.state.findUnique).toHaveBeenCalledWith({
            where: { id: testCase.id },
          });
          expect(result).toEqual(testCase);
        }
      });

      it("should handle empty string id", async () => {
        mockPrisma.state.findUnique.mockResolvedValue(null);

        const result = await stateResolvers.Query.state(undefined, { id: "" });

        expect(mockPrisma.state.findUnique).toHaveBeenCalledWith({
          where: { id: "" },
        });
        expect(result).toBeNull();
      });

      it("should handle special characters in id", async () => {
        const specialId = "DC-001";
        const mockState = {
          id: specialId,
          name: "District of Columbia",
          abbreviation: "DC",
        };

        mockPrisma.state.findUnique.mockResolvedValue(mockState);

        const result = await stateResolvers.Query.state(undefined, { id: specialId });

        expect(mockPrisma.state.findUnique).toHaveBeenCalledWith({
          where: { id: specialId },
        });
        expect(result).toEqual(mockState);
      });
    });

    describe("states", () => {
      it("should return all states", async () => {
        const mockStates = [
          {
            id: "CA",
            name: "California",
            abbreviation: "CA",
            region: "West",
          },
          {
            id: "NY",
            name: "New York",
            abbreviation: "NY",
            region: "Northeast",
          },
          {
            id: "TX",
            name: "Texas",
            abbreviation: "TX",
            region: "South",
          },
        ];

        mockPrisma.state.findMany.mockResolvedValue(mockStates);

        const result = await stateResolvers.Query.states();

        expect(mockPrisma.state.findMany).toHaveBeenCalledWith();
        expect(result).toEqual(mockStates);
        expect(result).toHaveLength(3);
      });

      it("should return empty array when no states exist", async () => {
        mockPrisma.state.findMany.mockResolvedValue([]);

        const result = await stateResolvers.Query.states();

        expect(mockPrisma.state.findMany).toHaveBeenCalledWith();
        expect(result).toEqual([]);
        expect(Array.isArray(result)).toBe(true);
      });

      it("should handle database errors", async () => {
        const dbError = new Error("Database connection failed");
        mockPrisma.state.findMany.mockRejectedValue(dbError);

        await expect(stateResolvers.Query.states()).rejects.toThrow(
          "Database connection failed"
        );
      });

      it("should return states in database order", async () => {
        const mockStates = [
          { id: "AL", name: "Alabama", abbreviation: "AL" },
          { id: "AK", name: "Alaska", abbreviation: "AK" },
          { id: "AZ", name: "Arizona", abbreviation: "AZ" },
        ];

        mockPrisma.state.findMany.mockResolvedValue(mockStates);

        const result = await stateResolvers.Query.states();

        expect(result).toEqual(mockStates);
        expect(result[0].id).toBe("AL");
        expect(result[1].id).toBe("AK");
        expect(result[2].id).toBe("AZ");
      });

      it("should handle large number of states", async () => {
        const mockStates = Array.from({ length: 50 }, (_, i) => ({
          id: `STATE${i.toString().padStart(2, '0')}`,
          name: `State ${i}`,
          abbreviation: `S${i}`,
        }));

        mockPrisma.state.findMany.mockResolvedValue(mockStates);

        const result = await stateResolvers.Query.states();

        expect(result).toHaveLength(50);
        expect(result[0].id).toBe("STATE00");
        expect(result[49].id).toBe("STATE49");
      });

      it("should handle states with null/undefined fields", async () => {
        const mockStates = [
          {
            id: "CA",
            name: "California",
            abbreviation: "CA",
            region: null,
          },
          {
            id: "NY",
            name: "New York",
            abbreviation: null,
            region: "Northeast",
          },
        ];

        mockPrisma.state.findMany.mockResolvedValue(mockStates);

        const result = await stateResolvers.Query.states();

        expect(result).toEqual(mockStates);
        expect(result[0].region).toBeNull();
        expect(result[1].abbreviation).toBeNull();
      });
    });
  });

  describe("State field resolvers", () => {
    describe("demonstrations", () => {
      const mockState: State = {
        id: "CA",
        name: "California",
        abbreviation: "CA",
        region: "West",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      it("should return demonstrations for a state", async () => {
        const mockDemonstrations = [
          {
            id: "demo-1",
            name: "California Demo 1",
            stateId: "CA",
            description: "First demonstration in California",
          },
          {
            id: "demo-2",
            name: "California Demo 2",
            stateId: "CA",
            description: "Second demonstration in California",
          },
        ];

        mockPrisma.demonstration.findMany.mockResolvedValue(mockDemonstrations);

        const result = await stateResolvers.State.demonstrations(mockState);

        expect(mockPrisma.demonstration.findMany).toHaveBeenCalledWith({
          where: { stateId: "CA" },
        });
        expect(result).toEqual(mockDemonstrations);
        expect(result).toHaveLength(2);
      });

      it("should return empty array when state has no demonstrations", async () => {
        mockPrisma.demonstration.findMany.mockResolvedValue([]);

        const result = await stateResolvers.State.demonstrations(mockState);

        expect(mockPrisma.demonstration.findMany).toHaveBeenCalledWith({
          where: { stateId: "CA" },
        });
        expect(result).toEqual([]);
        expect(Array.isArray(result)).toBe(true);
      });

      it("should handle database errors", async () => {
        const dbError = new Error("Database connection failed");
        mockPrisma.demonstration.findMany.mockRejectedValue(dbError);

        await expect(
          stateResolvers.State.demonstrations(mockState)
        ).rejects.toThrow("Database connection failed");
      });

      it("should handle different state ids", async () => {
        const states = [
          { id: "NY", name: "New York" },
          { id: "TX", name: "Texas" },
          { id: "FL", name: "Florida" },
        ];

        for (const state of states) {
          const mockStateObj: State = {
            ...state,
            abbreviation: state.id,
            region: "Test",
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const mockDemonstrations = [
            { id: `demo-${state.id}-1`, stateId: state.id, name: `${state.name} Demo` },
          ];

          mockPrisma.demonstration.findMany.mockResolvedValue(mockDemonstrations);

          const result = await stateResolvers.State.demonstrations(mockStateObj);

          expect(mockPrisma.demonstration.findMany).toHaveBeenCalledWith({
            where: { stateId: state.id },
          });
          expect(result).toEqual(mockDemonstrations);
        }
      });

      it("should handle state with null id", async () => {
        const stateWithNullId: State = {
          id: null as any,
          name: "Test State",
          abbreviation: "TS",
          region: "Test",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrisma.demonstration.findMany.mockResolvedValue([]);

        const result = await stateResolvers.State.demonstrations(stateWithNullId);

        expect(mockPrisma.demonstration.findMany).toHaveBeenCalledWith({
          where: { stateId: null },
        });
        expect(result).toEqual([]);
      });

      it("should handle state with undefined id", async () => {
        const stateWithUndefinedId: State = {
          id: undefined as any,
          name: "Test State",
          abbreviation: "TS",
          region: "Test",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockPrisma.demonstration.findMany.mockResolvedValue([]);

        const result = await stateResolvers.State.demonstrations(stateWithUndefinedId);

        expect(mockPrisma.demonstration.findMany).toHaveBeenCalledWith({
          where: { stateId: undefined },
        });
        expect(result).toEqual([]);
      });

      it("should handle large number of demonstrations", async () => {
        const mockDemonstrations = Array.from({ length: 100 }, (_, i) => ({
          id: `demo-${i}`,
          name: `Demonstration ${i}`,
          stateId: "CA",
          description: `Demo description ${i}`,
        }));

        mockPrisma.demonstration.findMany.mockResolvedValue(mockDemonstrations);

        const result = await stateResolvers.State.demonstrations(mockState);

        expect(result).toHaveLength(100);
        expect(result[0].id).toBe("demo-0");
        expect(result[99].id).toBe("demo-99");
      });

      it("should handle demonstrations with various statuses", async () => {
        const mockDemonstrations = [
          {
            id: "demo-1",
            name: "Active Demo",
            stateId: "CA",
            status: "Active",
          },
          {
            id: "demo-2",
            name: "Pending Demo",
            stateId: "CA",
            status: "Pending",
          },
          {
            id: "demo-3",
            name: "Completed Demo",
            stateId: "CA",
            status: "Completed",
          },
        ];

        mockPrisma.demonstration.findMany.mockResolvedValue(mockDemonstrations);

        const result = await stateResolvers.State.demonstrations(mockState);

        expect(result).toHaveLength(3);
        expect(result.map(d => d.status)).toEqual(["Active", "Pending", "Completed"]);
      });

      it("should handle demonstrations with null/undefined fields", async () => {
        const mockDemonstrations = [
          {
            id: "demo-1",
            name: "Demo with nulls",
            stateId: "CA",
            description: null,
            status: undefined,
          },
          {
            id: "demo-2",
            name: null,
            stateId: "CA",
            description: "Valid description",
            status: "Active",
          },
        ];

        mockPrisma.demonstration.findMany.mockResolvedValue(mockDemonstrations);

        const result = await stateResolvers.State.demonstrations(mockState);

        expect(result).toEqual(mockDemonstrations);
        expect(result[0].description).toBeNull();
        expect(result[0].status).toBeUndefined();
        expect(result[1].name).toBeNull();
      });
    });
  });

  describe("Error handling and edge cases", () => {
    it("should handle concurrent queries gracefully", async () => {
      const mockStates = [
        { id: "CA", name: "California" },
        { id: "NY", name: "New York" },
      ];

      mockPrisma.state.findMany.mockResolvedValue(mockStates);
      mockPrisma.state.findUnique.mockImplementation((args) => {
        const state = mockStates.find(s => s.id === args.where.id);
        return Promise.resolve(state || null);
      });

      const promises = [
        stateResolvers.Query.states(),
        stateResolvers.Query.state(undefined, { id: "CA" }),
        stateResolvers.Query.state(undefined, { id: "NY" }),
        stateResolvers.Query.state(undefined, { id: "XX" }),
      ];

      const results = await Promise.all(promises);

      expect(results[0]).toEqual(mockStates);
      expect(results[1]).toEqual(mockStates[0]);
      expect(results[2]).toEqual(mockStates[1]);
      expect(results[3]).toBeNull();
    });

    it("should handle network timeouts", async () => {
      const timeoutError = new Error("Network timeout");
      timeoutError.name = "TimeoutError";
      mockPrisma.state.findUnique.mockRejectedValue(timeoutError);

      await expect(
        stateResolvers.Query.state(undefined, { id: "CA" })
      ).rejects.toThrow("Network timeout");
    });

    it("should handle database constraint violations", async () => {
      const constraintError = new Error("Foreign key constraint violation");
      constraintError.name = "ConstraintError";
      mockPrisma.demonstration.findMany.mockRejectedValue(constraintError);

      const mockState: State = {
        id: "CA",
        name: "California",
        abbreviation: "CA",
        region: "West",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await expect(
        stateResolvers.State.demonstrations(mockState)
      ).rejects.toThrow("Foreign key constraint violation");
    });

    it("should handle malformed database responses", async () => {
      // Test with malformed response that's not an array
      mockPrisma.state.findMany.mockResolvedValue(null);

      const result = await stateResolvers.Query.states();

      expect(result).toBeNull();
    });

    it("should handle very long state names and ids", async () => {
      const longId = "A".repeat(1000);
      const longName = "State Name ".repeat(100);
      
      const mockState = {
        id: longId,
        name: longName,
        abbreviation: "LNG",
      };

      mockPrisma.state.findUnique.mockResolvedValue(mockState);

      const result = await stateResolvers.Query.state(undefined, { id: longId });

      expect(result).toEqual(mockState);
      expect(result.id).toHaveLength(1000);
      expect(result.name).toContain("State Name");
    });

    it("should handle unicode characters in state data", async () => {
      const mockState = {
        id: "PR",
        name: "Puerto Rico 🇵🇷",
        abbreviation: "PR",
        region: "Caribbean",
        description: "Estado Libre Asociado de Puerto Rico",
      };

      mockPrisma.state.findUnique.mockResolvedValue(mockState);

      const result = await stateResolvers.Query.state(undefined, { id: "PR" });

      expect(result).toEqual(mockState);
      expect(result.name).toContain("🇵🇷");
      expect(result.description).toContain("Puerto Rico");
    });
  });

  describe("Performance and scalability", () => {
    it("should handle rapid successive calls", async () => {
      const mockState = { id: "CA", name: "California" };
      mockPrisma.state.findUnique.mockResolvedValue(mockState);

      const calls = Array.from({ length: 100 }, () =>
        stateResolvers.Query.state(undefined, { id: "CA" })
      );

      const results = await Promise.all(calls);

      expect(results).toHaveLength(100);
      results.forEach(result => {
        expect(result).toEqual(mockState);
      });
      expect(mockPrisma.state.findUnique).toHaveBeenCalledTimes(100);
    });

    it("should handle memory pressure scenarios", async () => {
      // Create large objects to simulate memory pressure
      const largeStates = Array.from({ length: 1000 }, (_, i) => ({
        id: `STATE${i}`,
        name: `State ${i}`,
        data: new Array(1000).fill(`data-${i}`).join(''),
      }));

      mockPrisma.state.findMany.mockResolvedValue(largeStates);

      const result = await stateResolvers.Query.states();

      expect(result).toHaveLength(1000);
      expect(result[0].data).toBeDefined();
    });
  });

  describe("Integration scenarios", () => {
    it("should handle complete state-demonstration relationship", async () => {
      const mockState: State = {
        id: "CA",
        name: "California",
        abbreviation: "CA",
        region: "West",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockDemonstrations = [
        { id: "demo-1", name: "CA Demo 1", stateId: "CA" },
        { id: "demo-2", name: "CA Demo 2", stateId: "CA" },
      ];

      mockPrisma.state.findUnique.mockResolvedValue(mockState);
      mockPrisma.demonstration.findMany.mockResolvedValue(mockDemonstrations);

      // First get the state
      const state = await stateResolvers.Query.state(undefined, { id: "CA" });
      expect(state).toEqual(mockState);

      // Then get its demonstrations
      const demonstrations = await stateResolvers.State.demonstrations(mockState);
      expect(demonstrations).toEqual(mockDemonstrations);

      expect(mockPrisma.state.findUnique).toHaveBeenCalledWith({
        where: { id: "CA" },
      });
      expect(mockPrisma.demonstration.findMany).toHaveBeenCalledWith({
        where: { stateId: "CA" },
      });
    });

    it("should handle state queries with different access patterns", async () => {
      const states = [
        { id: "CA", name: "California" },
        { id: "NY", name: "New York" },
        { id: "TX", name: "Texas" },
      ];

      mockPrisma.state.findMany.mockResolvedValue(states);
      mockPrisma.state.findUnique.mockImplementation((args) => {
        const state = states.find(s => s.id === args.where.id);
        return Promise.resolve(state || null);
      });

      // Test getting all states first, then individual ones
      const allStates = await stateResolvers.Query.states();
      expect(allStates).toEqual(states);

      // Test getting individual states
      for (const state of states) {
        const individualState = await stateResolvers.Query.state(undefined, { id: state.id });
        expect(individualState).toEqual(state);
      }

      expect(mockPrisma.state.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.state.findUnique).toHaveBeenCalledTimes(3);
    });
  });
});