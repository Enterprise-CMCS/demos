import { Role } from "../types";
import { getPool } from "./pool";
import { createRole, deleteRoles, loginRolesNotInDb, syncRoleMemberships, validateRolesExist } from "./queries";

jest.mock("./pool");

const mockRoles: Role[] = [
  {
    name: "mock_role_1",
    memberships: ["mock_read"],
  },
  {
    name: "mock_role_2",
    memberships: ["mock_read", "mock_write"],
  },
  {
    name: "mock_system_role",
    memberships: ["mock_read", "mock_write"],
    systemRole: true,
  },
];

describe("queries", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe("deleteRoles", () => {
    test("should query proper delete command", async () => {
      const querySpy = jest.fn();
      (getPool as jest.Mock).mockImplementation(() => ({
        query: querySpy,
      }));
      await deleteRoles(mockRoles);
      expect(querySpy).toHaveBeenCalledWith(`DROP ROLE ${mockRoles.map((r) => r.name).join(",")}`);
    });
  });
  describe("validateRolesExist", () => {
    test("should properly call request to validate roles", async () => {
      const querySpy = jest
        .fn()
        .mockImplementation((_, p: string[]) => ({ rows: p.map((r) => ({ role: r, exists: true })) }));
      (getPool as jest.Mock).mockImplementation(() => ({
        query: querySpy,
      }));
      const flatRoles = mockRoles.map((r) => r.memberships).flat();
      await validateRolesExist(flatRoles);
      expect(querySpy).toHaveBeenCalledWith(expect.stringContaining("SELECT"), [flatRoles]);
    });

    test("should throw when role is missing", async () => {
      const querySpy = jest
        .fn()
        .mockImplementation((_, p: string[]) => ({ rows: p.map((r) => ({ role: r, exists: false })) }));
      (getPool as jest.Mock).mockImplementation(() => ({
        query: querySpy,
      }));
      const flatRoles = mockRoles.map((r) => r.memberships).flat();
      await expect(validateRolesExist(flatRoles)).rejects.toThrow("at least one role does not exist");
    });
  });
  describe("syncRoleMemberships", () => {
    test("should add and remove proper member roles", async () => {
      const mockDBRows = [{ role: "demos_read" }, { role: "demos_write" }];
      const roleAfter: Role = {
        name: "mock_role",
        memberships: ["demos_read", "demos_delete"],
      };

      const querySpy = jest
        .fn()
        .mockImplementationOnce(() => null)
        .mockImplementationOnce((_, p: string[]) => ({ rows: mockDBRows }));
      (getPool as jest.Mock).mockImplementation(() => ({
        query: querySpy,
      }));
      await syncRoleMemberships(roleAfter);
      expect(querySpy).toHaveBeenNthCalledWith(1, "BEGIN");
      expect(querySpy).toHaveBeenNthCalledWith(2, expect.stringContaining("SELECT"), [roleAfter.name]);
      expect(querySpy).toHaveBeenNthCalledWith(3, "REVOKE demos_write FROM mock_role");
      expect(querySpy).toHaveBeenNthCalledWith(4, "GRANT demos_delete TO mock_role");
      expect(querySpy).toHaveBeenLastCalledWith("COMMIT");
    });

    test("should rollback if there is a failed query", async () => {
      const mockDBRows = [{ role: "demos_read" }, { role: "demos_write" }];
      const roleAfter: Role = {
        name: "mock_role",
        memberships: ["demos_read", "demos_delete"],
      };

      const querySpy = jest
        .fn()
        .mockImplementationOnce(() => null)
        .mockRejectedValueOnce(1);
      (getPool as jest.Mock).mockImplementation(() => ({
        query: querySpy,
      }));
      await syncRoleMemberships(roleAfter);
      expect(querySpy).toHaveBeenNthCalledWith(1, "BEGIN");
      expect(querySpy).toHaveBeenLastCalledWith("ROLLBACK");
    });
  });

  describe("loginRolesNotInDb", () => {
    test("should return proper list of missing roles", async () => {
      const querySpy = jest.fn().mockResolvedValue({ rows: [{ rolname: "mock_role_1" }, { rolname: "mock_role_2" }] });
      (getPool as jest.Mock).mockImplementation(() => ({
        query: querySpy,
      }));
      const list = await loginRolesNotInDb(mockRoles);
      expect(list).toEqual(expect.arrayContaining([expect.objectContaining({ name: "mock_system_role" })]));
      expect(querySpy).toHaveBeenCalledWith(expect.any(String), [mockRoles.map((r) => r.name)]);
    });
  });
  describe("createRole", () => {
    test("should properly create a role", async () => {
      const querySpy = jest.fn();
      (getPool as jest.Mock).mockImplementation(() => ({
        query: querySpy,
      }));
      await createRole(mockRoles[0], "fakepw");
      expect(querySpy).toHaveBeenCalledWith(`CREATE ROLE ${mockRoles[0].name} LOGIN PASSWORD 'fakepw'`);
    });
  });
});
