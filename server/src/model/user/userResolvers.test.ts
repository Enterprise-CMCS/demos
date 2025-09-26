import { describe, it, expect, vi, beforeEach } from "vitest";

import { userResolvers } from "./userResolvers";

vi.mock("../../prismaClient", () => ({ prisma: () => mockedPrisma }));

const mockedPrisma: any = {
  user: {
    findUnique: vi.fn(),
  },
  person: {
    findUnique: vi.fn(),
  },
  event: {
    findMany: vi.fn(),
  },
  document: {
    findMany: vi.fn(),
  },
};

describe("userResolvers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("currentUser returns null when no user in context", async () => {
    const res = await (userResolvers as any).Query.currentUser(undefined, {}, { user: null });
    expect(res).toBeNull();
  });

  it("currentUser returns user when present in context", async () => {
    const user = { id: "u1", name: "Sam" };
    mockedPrisma.user.findUnique.mockResolvedValueOnce(user);
    const res = await (userResolvers as any).Query.currentUser(undefined, {}, { user: { id: "u1" } });
    expect(res).toEqual(user);
  });

  it("User.person resolves to prisma.person.findUnique", async () => {
    const person = { id: "u1", firstName: "F" };
    mockedPrisma.person.findUnique.mockResolvedValueOnce(person);
    const res = await (userResolvers as any).User.person({ id: "u1" });
    expect(res).toEqual(person);
    expect(mockedPrisma.person.findUnique).toHaveBeenCalledWith({ where: { id: "u1" } });
  });

  it("User.events resolves to prisma.event.findMany", async () => {
    mockedPrisma.event.findMany.mockResolvedValueOnce([{ id: "e1" }]);
    const res = await (userResolvers as any).User.events({ id: "u1" });
    expect(res).toEqual([{ id: "e1" }]);
  });

  it("User.ownedDocuments resolves to prisma.document.findMany", async () => {
    mockedPrisma.document.findMany.mockResolvedValueOnce([{ id: "d1" }]);
    const res = await (userResolvers as any).User.ownedDocuments({ id: "u1" });
    expect(res).toEqual([{ id: "d1" }]);
  });
});
