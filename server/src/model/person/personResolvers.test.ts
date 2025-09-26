import { describe, it, expect, vi, beforeEach } from "vitest";

import { personResolvers } from "./personResolvers";

vi.mock("../../prismaClient", () => ({ prisma: () => mockedPrisma }));

const mockedPrisma: any = {
  person: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  demonstrationRoleAssignment: {
    findMany: vi.fn(),
  },
  personState: {
    findMany: vi.fn(),
  },
};

describe("personResolvers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("Query.person returns a person by id", async () => {
    const p = { id: "p1" };
    mockedPrisma.person.findUnique.mockResolvedValueOnce(p);
    const res = await (personResolvers as any).Query.person(undefined, { id: "p1" });
    expect(res).toEqual(p);
  });

  it("Query.people returns list of people", async () => {
    const list = [{ id: "p1" }, { id: "p2" }];
    mockedPrisma.person.findMany.mockResolvedValueOnce(list);
    const res = await (personResolvers as any).Query.people();
    expect(res).toEqual(list);
  });

  it("Person.personType returns person.personTypeId", async () => {
    const res = await (personResolvers as any).Person.personType({ personTypeId: "type1" });
    expect(res).toBe("type1");
  });

  it("Person.roles maps primaryDemonstrationRoleAssignment to isPrimary", async () => {
    const assignments = [
      { id: "r1", primaryDemonstrationRoleAssignment: { id: "p1" } },
      { id: "r2", primaryDemonstrationRoleAssignment: null },
    ];
    mockedPrisma.demonstrationRoleAssignment.findMany.mockResolvedValueOnce(assignments as any);
    const res = await (personResolvers as any).Person.roles({ id: "p1" });
    expect(res[0].isPrimary).toBe(true);
    expect(res[1].isPrimary).toBe(false);
  });

  it("Person.states maps personState entries to state objects", async () => {
    const ps = [{ state: { id: "s1" } }, { state: { id: "s2" } }];
    mockedPrisma.personState.findMany.mockResolvedValueOnce(ps as any);
    const res = await (personResolvers as any).Person.states({ id: "p1" });
    expect(res).toEqual([{ id: "s1" }, { id: "s2" }]);
  });
});
