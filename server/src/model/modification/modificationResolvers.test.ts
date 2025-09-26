import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  getAmendment,
  getExtension,
  getManyAmendments,
  getManyExtensions,
  createAmendment,
  createExtension,
  updateAmendment,
  updateExtension,
  modificationResolvers,
} from "./modificationResolvers";

vi.mock("../../prismaClient", () => ({ prisma: () => mockedPrisma }));
vi.mock("../bundleStatus/bundleStatusResolvers", () => ({ resolveBundleStatus: vi.fn(() => "STATUS") }));

const mockedPrisma: any = {
  modification: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  bundle: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
  demonstration: {
    findUnique: vi.fn(),
  },
  document: {
    findMany: vi.fn(),
  },
  bundlePhase: {
    findMany: vi.fn(),
  },
};

describe("modificationResolvers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("getAmendment delegates to modification.findUnique with amendment bundleType", async () => {
    mockedPrisma.modification.findUnique.mockResolvedValueOnce({ id: "m1" });
    const res = await getAmendment(undefined, { id: "m1" });
    expect(res).toEqual({ id: "m1" });
  });

  it("getExtension delegates to modification.findUnique with extension bundleType", async () => {
    mockedPrisma.modification.findUnique.mockResolvedValueOnce({ id: "m2" });
    const res = await getExtension(undefined, { id: "m2" });
    expect(res).toEqual({ id: "m2" });
  });

  it("getManyAmendments and getManyExtensions return arrays", async () => {
    mockedPrisma.modification.findMany.mockResolvedValueOnce([{ id: "a1" }]);
    const a = await getManyAmendments();
    expect(a).toEqual([{ id: "a1" }]);
    mockedPrisma.modification.findMany.mockResolvedValueOnce([{ id: "e1" }]);
    const e = await getManyExtensions();
    expect(e).toEqual([{ id: "e1" }]);
  });

  it("createAmendment/createExtension call transaction and return created modification", async () => {
    mockedPrisma.$transaction.mockImplementationOnce(async (fn: any) => {
      const tx = {
        bundle: { create: vi.fn().mockResolvedValue({ id: "b1", bundleTypeId: "AMENDMENT" }) },
        modification: { create: vi.fn().mockResolvedValue({ id: "mcreated" }) },
      };
      return await fn(tx);
    });
    const res = await createAmendment(undefined, { input: { demonstrationId: "d1", name: "n" } as any });
    expect(res).toEqual({ id: "mcreated" });
  });

  it("updateAmendment/updateExtension call modification.update and return updated", async () => {
    mockedPrisma.modification.update.mockResolvedValueOnce({ id: "mu1" });
    const res = await updateAmendment(undefined, { id: "mu1", input: { name: "x" } as any });
    expect(mockedPrisma.modification.update).toHaveBeenCalled();
    expect(res).toEqual({ id: "mu1" });
  });

  it("Amendment and Extension field resolvers work: demonstration, documents, currentPhase, status", async () => {
    mockedPrisma.demonstration.findUnique.mockResolvedValueOnce({ id: "d1" });
    const demo = await (modificationResolvers as any).Amendment.demonstration({ demonstrationId: "d1" });
    expect(demo).toEqual({ id: "d1" });

    mockedPrisma.document.findMany.mockResolvedValueOnce([{ id: "doc1" }]);
    const docs = await (modificationResolvers as any).Amendment.documents({ id: "m1" });
    expect(docs).toEqual([{ id: "doc1" }]);

    const phase = await (modificationResolvers as any).Amendment.currentPhase({ currentPhaseId: "Concept" });
    expect(phase).toBe("Concept");

    const status = await (modificationResolvers as any).Amendment.status({ id: "m1" });
    expect(status).toBe("STATUS");
  });
});
