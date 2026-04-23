import { describe, expect, it } from "vitest";
import type { ContextUser } from "./userContext";
import { buildAuthorizationFilter, PermissionFilters } from "./buildAuthorizationFilter";
import { ApplicationStatus, SignatureLevel } from "../types";

describe("buildAuthorizationFilter", () => {
  type TestWhereClause = {
    id?: string;
    name?: string;
    signatureLevelId?: SignatureLevel;
    statusId?: ApplicationStatus;
  };

  it("builds an OR filter from the permissions the user has", () => {
    const user: ContextUser = {
      id: "user-1",
      cognitoSubject: "sub-1",
      personTypeId: "demos-admin",
      permissions: ["View All Demonstrations", "View All Amendments"],
    };

    const mockGetPermissionFilters = (userId: string): PermissionFilters<TestWhereClause> => ({
      "View All Demonstrations": { name: "Name" },
      "View Assigned Demonstrations": { id: userId },
      "View All Amendments": { statusId: "Approved" },
    });

    const result = buildAuthorizationFilter<TestWhereClause>(user, mockGetPermissionFilters);

    expect(result).toEqual({
      OR: [{ name: "Name" }, { statusId: "Approved" }],
    });
  });

  it("returns null when the user has no matching permissions", () => {
    const user: ContextUser = {
      id: "user-2",
      cognitoSubject: "sub-2",
      personTypeId: "demos-cms-user",
      permissions: ["View All Extensions"],
    };

    const mockGetPermissionFilters = (): PermissionFilters<TestWhereClause> => ({
      "View All Demonstrations": { name: "Name" },
      "View All Amendments": { statusId: "Approved" },
    });

    const result = buildAuthorizationFilter<TestWhereClause>(user, mockGetPermissionFilters);

    expect(result).toBeNull();
  });

  it("skips permission entries that are undefined", () => {
    const user: ContextUser = {
      id: "user-3",
      cognitoSubject: "sub-3",
      personTypeId: "demos-state-user",
      permissions: ["View Assigned Demonstrations"],
    };

    const mockGetPermissionFilters = (userId: string): PermissionFilters<TestWhereClause> => ({
      "View All Demonstrations": undefined,
      "View Assigned Demonstrations": { id: userId },
    });

    const result = buildAuthorizationFilter<TestWhereClause>(user, mockGetPermissionFilters);

    expect(result).toEqual({
      OR: [{ id: "user-3" }],
    });
  });
});
