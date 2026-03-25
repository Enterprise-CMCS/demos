import { describe, it, expect } from "vitest";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs } from "../../model/graphql.js";
import { validateDocumentPermissions } from "./fieldAuthPlugin.js";
import { Permission } from "../../types.js";
import {
  ADMIN_USER_PERMISSIONS,
  CMS_USER_PERMISSIONS,
  READ_ONLY_CMS_USER_PERMISSIONS,
  STATE_USER_PERMISSIONS,
} from "../../constants.js";
import { manageDemonstrationDocumentsScenarios } from "./fieldAuthPluginTestScenarios/manageDemonstrationDocumentsScenarios.js";

const schema = makeExecutableSchema({ typeDefs });

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  "Admin User": ADMIN_USER_PERMISSIONS,
  "CMS User": CMS_USER_PERMISSIONS,
  "Read-Only CMS User": READ_ONLY_CMS_USER_PERMISSIONS,
  "State User": STATE_USER_PERMISSIONS,
};

describe("Field Authorization", () => {
  describe("Manage Demonstration Documents", () => {
    manageDemonstrationDocumentsScenarios.forEach((scenario) => {
      describe(scenario.description, () => {
        scenario.allowedRoles.forEach((role) => {
          it(`allows ${role}`, () => {
            expect(() =>
              validateDocumentPermissions(scenario.document, schema, ROLE_PERMISSIONS[role])
            ).not.toThrow();
          });
        });

        scenario.deniedRoles.forEach((role) => {
          it(`denies ${role}`, () => {
            expect(() =>
              validateDocumentPermissions(scenario.document, schema, ROLE_PERMISSIONS[role])
            ).toThrow();
          });
        });
      });
    });
  });
});
