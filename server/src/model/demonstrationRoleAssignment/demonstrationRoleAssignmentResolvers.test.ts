import { describe, it, expect, vi, beforeEach } from "vitest";
import { demonstrationRoleAssigmentResolvers } from "./demonstrationRoleAssignmentResolvers";

vi.mock("../../prismaClient", () => ({ prisma: () => mockedPrisma }));

const mockedPrisma: any = {
  person: { findUnique: vi.fn() },
  demonstration: { findUnique: vi.fn() },
};

describe("demonstrationRoleAssigmentResolvers", () => {
  beforeEach(() => vi.resetAllMocks());

  it("person resolver returns person by parent.personId", async () => {
    const p = { id: "p1" };
    mockedPrisma.person.findUnique.mockResolvedValueOnce(p);
    const res = await (demonstrationRoleAssigmentResolvers as any).DemonstrationRoleAssignment.person({ personId: "p1" });
    expect(res).toEqual(p);
    expect(mockedPrisma.person.findUnique).toHaveBeenCalledWith({ where: { id: "p1" } });
  });

  it("role resolver returns parent.roleId", async () => {
    const res = await (demonstrationRoleAssigmentResolvers as any).DemonstrationRoleAssignment.role({ roleId: "Project Officer" });
    expect(res).toBe("Project Officer");
  });

  it("demonstration resolver returns demo by parent.demonstrationId", async () => {
    const d = { id: "d1" };
    mockedPrisma.demonstration.findUnique.mockResolvedValueOnce(d);
    const res = await (demonstrationRoleAssigmentResolvers as any).DemonstrationRoleAssignment.demonstration({ demonstrationId: "d1" });
    expect(res).toEqual(d);
  });
});
