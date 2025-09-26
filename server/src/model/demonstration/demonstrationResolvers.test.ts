import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  getDemonstration,
  getManyDemonstrations,
  createDemonstration,
  updateDemonstration,
  demonstrationResolvers,
} from "./demonstrationResolvers";

vi.mock("../../prismaClient", () => ({ prisma: () => mockedPrisma }));

const mockedPrisma: any = {
  demonstration: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  bundle: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  person: {
    findUnique: vi.fn(),
  },
  demonstrationRoleAssignment: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  primaryDemonstrationRoleAssignment: {
    create: vi.fn(),
  },
  document: {
    findMany: vi.fn(),
  },
  modification: {
    findMany: vi.fn(),
  },
  state: {
    findUnique: vi.fn(),
  },
  bundlePhase: {
    findMany: vi.fn(),
  },
  $transaction: vi.fn(),
};

describe("demonstrationResolvers (unit)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("getDemonstration calls prisma.findUnique", async () => {
    const demo = { id: "d1" };
    mockedPrisma.demonstration.findUnique.mockResolvedValueOnce(demo);
    const res = await getDemonstration(undefined, { id: "d1" });
    expect(res).toEqual(demo);
    expect(mockedPrisma.demonstration.findUnique).toHaveBeenCalledWith({ where: { id: "d1" } });
  });

  it("getManyDemonstrations calls prisma.findMany", async () => {
    const list = [{ id: "d1" }, { id: "d2" }];
    mockedPrisma.demonstration.findMany.mockResolvedValueOnce(list);
    const res = await getManyDemonstrations();
    expect(res).toEqual(list);
  });

  it("createDemonstration returns success when transaction runs", async () => {
    // simulate tx behavior by calling the provided callback
    mockedPrisma.$transaction.mockImplementationOnce(async (fn: any) => {
      // create bundle
      const tx = {
        bundle: { create: vi.fn().mockResolvedValue({ id: "b1", bundleTypeId: "DEMONSTRATION" }) },
        demonstration: { create: vi.fn().mockResolvedValue({}) },
        person: { findUnique: vi.fn().mockResolvedValue({ personTypeId: "pType" }) },
        demonstrationRoleAssignment: { create: vi.fn() },
        primaryDemonstrationRoleAssignment: { create: vi.fn() },
      };
      return await fn(tx);
    });

    const input = { name: "n", projectOfficerUserId: "u1", cmcsDivision: "cd", signatureLevel: "sl", stateId: "st" };
    const res = await createDemonstration(undefined, { input });
    expect(res.success).toBe(true);
  });

  it("createDemonstration returns error message when person not found", async () => {
    mockedPrisma.$transaction.mockImplementationOnce(async (fn: any) => {
      const tx = {
        bundle: { create: vi.fn().mockResolvedValue({ id: "b1", bundleTypeId: "DEMONSTRATION" }) },
        demonstration: { create: vi.fn().mockResolvedValue({}) },
        person: { findUnique: vi.fn().mockResolvedValue(null) },
        demonstrationRoleAssignment: { create: vi.fn() },
        primaryDemonstrationRoleAssignment: { create: vi.fn() },
      };
      return await fn(tx);
    });

    const input = { name: "n", projectOfficerUserId: "missing", cmcsDivision: "cd", signatureLevel: "sl", stateId: "st" };
    const res = await createDemonstration(undefined, { input });
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/Error creating demonstration/);
  });

  it("updateDemonstration calls prisma.update with provided fields", async () => {
    const updated = { id: "u1" };
    mockedPrisma.demonstration.update.mockResolvedValueOnce(updated);
    const res = await updateDemonstration(undefined, { id: "u1", input: { name: "x" } });
    expect(mockedPrisma.demonstration.update).toHaveBeenCalled();
    expect(res).toEqual(updated);
  });

  it("Demonstration state resolves using prisma.state.findUnique", async () => {
    const demo = { stateId: "s1" };
    const st = { id: "s1", name: "State" };
    mockedPrisma.state.findUnique.mockResolvedValueOnce(st);
    const res = await (demonstrationResolvers as any).Demonstration.state(demo);
    expect(res).toEqual(st);
  });

  it("Demonstration.documents resolves with prisma.document.findMany", async () => {
    mockedPrisma.document.findMany.mockResolvedValueOnce([{ id: "doc1" }]);
    const res = await (demonstrationResolvers as any).Demonstration.documents({ id: "d1" });
    expect(res).toEqual([{ id: "doc1" }]);
  });

  it("Demonstration.amendments and extensions filter by bundleTypeId", async () => {
    mockedPrisma.modification.findMany.mockResolvedValueOnce([{ id: "m1" }]);
    const a = await (demonstrationResolvers as any).Demonstration.amendments({ id: "d1" });
    expect(a).toEqual([{ id: "m1" }]);
    mockedPrisma.modification.findMany.mockResolvedValueOnce([{ id: "m2" }]);
    const e = await (demonstrationResolvers as any).Demonstration.extensions({ id: "d1" });
    expect(e).toEqual([{ id: "m2" }]);
  });

  it("Demonstration.roles maps isPrimary correctly", async () => {
    const assignments = [
      { id: "r1", primaryDemonstrationRoleAssignment: { id: "p1" } },
      { id: "r2", primaryDemonstrationRoleAssignment: null },
    ];
    mockedPrisma.demonstrationRoleAssignment.findMany.mockResolvedValueOnce(assignments as any);
    const res = await (demonstrationResolvers as any).Demonstration.roles({ id: "d1" });
    expect(res[0].isPrimary).toBe(true);
    expect(res[1].isPrimary).toBe(false);
  });

  it("Demonstration.phases calls bundlePhase.findMany", async () => {
    mockedPrisma.bundlePhase.findMany.mockResolvedValueOnce([{ id: "p1" }]);
    const res = await (demonstrationResolvers as any).Demonstration.phases({ id: "d1" });
    expect(res).toEqual([{ id: "p1" }]);
  });
});
