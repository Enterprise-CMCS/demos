import { Role } from "../types";
import * as roles from "./roles";
import { deleteSecureStrings, storeSecureString } from "./parameters";

import {
  loginRolesNotInDb,
  deleteRoles,
  syncRoleMemberships,
  createRole,
  validateRolesExist,
} from "../database/queries";

import { hasDuplicates, isValidRoleName } from "../util/validation";
import { deleteSecrets, storeSecret } from "./secrets";
import { generateTempPassword } from "../util/password";

jest.mock("../util/validation");
jest.mock("../database/queries");
jest.mock("./parameters");
jest.mock("./secrets");
jest.mock("../util/password");

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

describe("roles", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe("applyRoleChanges", () => {
    let provisionSpy: jest.SpyInstance;
    beforeAll(() => {
      provisionSpy = jest.spyOn(roles, "provisionRoles");
    });
    afterAll(() => {
      provisionSpy.mockRestore();
    });
    test("should all proper methods when there are no new roles", async () => {
      (isValidRoleName as jest.Mock).mockReturnValue(true);
      (loginRolesNotInDb as jest.Mock).mockReturnValue([]);

      await roles.applyRoleChanges(mockRoles);
      expect(deleteRoles).not.toHaveBeenCalled();
      expect(provisionSpy).not.toHaveBeenCalled();
      expect(syncRoleMemberships).toHaveBeenCalledWith(mockRoles[0]);
      expect(syncRoleMemberships).toHaveBeenCalledWith(mockRoles[1]);
    });

    test("should provision new roles when included", async () => {
      (isValidRoleName as jest.Mock).mockReturnValue(true);
      (loginRolesNotInDb as jest.Mock).mockReturnValue([mockRoles[1]]);

      await roles.applyRoleChanges(mockRoles);
      expect(deleteRoles).not.toHaveBeenCalled();
      expect(provisionSpy).toHaveBeenCalledWith([mockRoles[1]]);
      expect(syncRoleMemberships).toHaveBeenCalledWith(mockRoles[0]);
      expect(syncRoleMemberships).toHaveBeenCalledWith(mockRoles[1]);
    });

    test("should delete differing roles on an update", async () => {
      (isValidRoleName as jest.Mock).mockReturnValue(true);

      await roles.applyRoleChanges([mockRoles[0]], mockRoles);
      expect(deleteRoles).toHaveBeenCalledTimes(1);
      expect(deleteRoles).toHaveBeenCalledWith(mockRoles.slice(1));
      expect(deleteSecureStrings).toHaveBeenCalledWith(
        "unit-test",
        mockRoles
          .slice(1)
          .filter((r) => !r.systemRole)
          .map((r) => r.name)
      );
      expect(deleteSecrets).toHaveBeenCalledWith(mockRoles.slice(1).filter((r) => r.systemRole));
    });
  });
  describe("provisionRoles", () => {
    test("should create role and properly store passwords", async () => {
      await roles.provisionRoles(mockRoles);
      expect(generateTempPassword).toHaveBeenCalledTimes(mockRoles.length);
      expect(createRole).toHaveBeenCalledTimes(mockRoles.length);
      expect(storeSecret).toHaveBeenCalledTimes(mockRoles.filter((r) => r.systemRole).length);
      expect(storeSecureString).toHaveBeenCalledTimes(mockRoles.filter((r) => !r.systemRole).length);
    });
  });
  describe("findDeletedRoleNames", () => {
    test("should create role and properly store passwords", async () => {
      const nextRoles = mockRoles.slice(0, -1);
      const missingRoles = mockRoles.slice(-1);

      expect(roles.findDeletedRoleNames(nextRoles, mockRoles)).toEqual(missingRoles);
    });
  });
  describe("validateRoleInput", () => {
    afterEach(() => {
      jest.resetAllMocks();
    });
    test("should allow properRoles", async () => {
      await expect(roles.validateRoleInput(mockRoles)).resolves.not.toThrow();
      expect(validateRolesExist).toHaveBeenCalledTimes(1);
    });
    test("should throw if member roles are identified as invalid", async () => {
      (isValidRoleName as jest.Mock).mockReturnValue(false);
      await expect(
        roles.validateRoleInput([{ name: "valid_role", memberships: ["hyphens-are-invalid"] }])
      ).rejects.toThrow("invalid member role names");
    });

    test("should throw if role names are identified as invalid", async () => {
      (isValidRoleName as jest.Mock).mockImplementation((r) => r == "valid_role");
      await expect(
        roles.validateRoleInput([{ name: "hyphens-are-invalid", memberships: ["valid_role"] }])
      ).rejects.toThrow("invalid role names");
    });

    test("should throw if duplicate role names are listed", async () => {
      (isValidRoleName as jest.Mock).mockReturnValue(true);
      (hasDuplicates as jest.Mock).mockReturnValue(true);
      await expect(
        roles.validateRoleInput([
          { name: "same_name", memberships: ["valid_role"] },
          { name: "same_name", memberships: ["valid_role"] },
        ])
      ).rejects.toThrow("duplicate role names listed");
    });

    test("should throw if duplicate role names are listed", async () => {
      (isValidRoleName as jest.Mock).mockReturnValue(true);
      (hasDuplicates as jest.Mock).mockReturnValue(true);
      await expect(
        roles.validateRoleInput([
          { name: "same_name", memberships: ["valid_role"] },
          { name: "same_name", memberships: ["valid_role"] },
        ])
      ).rejects.toThrow("duplicate role names listed");
    });
  });
  describe("deleteAllRoles", () => {
    afterEach(() => {
      jest.resetAllMocks();
    });
    test("should properly manage deletion or db roles and aws secrets/params", async () => {
      await roles.deleteAllRoles(mockRoles);
      expect(deleteRoles).toHaveBeenCalledWith(mockRoles);
      expect(deleteSecureStrings).toHaveBeenCalledWith(
        expect.any(String),
        mockRoles.filter((r) => !r.systemRole).map((r) => r.name)
      );
      expect(deleteSecrets).toHaveBeenCalledWith(mockRoles.filter((r) => r.systemRole));
    });
  });
});
