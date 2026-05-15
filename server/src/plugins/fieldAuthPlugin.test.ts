import { buildSchema, parse } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDirective } from "@graphql-tools/utils";
import {
  checkFieldAuthorization,
  fieldAuthPlugin,
  validateAuthDirectives,
} from "./fieldAuthPlugin";
import type { GraphQLContext } from "../auth";
import { Permission } from "../types";

vi.mock("@graphql-tools/utils", () => ({
  getDirective: vi.fn(),
}));

describe("fieldAuthPlugin", () => {
  const requiredPermission = "Access CMS-Only Fields" as Permission;
  const invalidPermission = "Access Anything I Want" as Permission;
  const validAuthDirective = { requires: requiredPermission };
  const invalidAuthDirective = { requires: invalidPermission };
  const schema = buildSchema(/* GraphQL */ `
    type Query {
      restrictedField: String
    }
  `);
  const document = parse(/* GraphQL */ `
    query RestrictedFieldQuery {
      restrictedField
    }
  `);
  const parentType = schema.getQueryType();
  const fieldDef = parentType?.getFields().restrictedField;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAuthDirectives = (authDirectives?: Record<"requires", Permission>[]) => {
    vi.mocked(getDirective).mockReturnValue(authDirectives);
  };

  const createContextValue = (permissions: Permission[]) =>
    ({
      user: {
        permissions,
      },
    }) as GraphQLContext;

  const expectDidResolveOperation = async (permissions: Permission[]) => {
    const requestListener = await fieldAuthPlugin.requestDidStart();

    return requestListener.didResolveOperation({
      document,
      contextValue: createContextValue(permissions),
      schema,
    });
  };

  describe("validateAuthDirectives", () => {
    it("ensures that a given permission is a valid permission", () => {
      expect(() => validateAuthDirectives([validAuthDirective])).not.toThrow();

      expect(() => validateAuthDirectives([invalidAuthDirective])).toThrow(
        "Invalid @auth directive: 'requires' argument must be a valid permission"
      );
    });
  });

  describe("checkFieldAuthorization", () => {
    it("returns false when the field has no auth directives", () => {
      mockAuthDirectives();

      expect(checkFieldAuthorization(schema, fieldDef!, parentType!, [requiredPermission])).toBe(
        false
      );
    });

    it("returns false when the user has the required permission", () => {
      mockAuthDirectives([validAuthDirective]);

      expect(checkFieldAuthorization(schema, fieldDef!, parentType!, [requiredPermission])).toBe(
        false
      );
    });

    it("returns an authorization error when the user lacks the required permission", () => {
      mockAuthDirectives([validAuthDirective]);

      expect(checkFieldAuthorization(schema, fieldDef!, parentType!, [])).toBe(
        "Unauthorized: You do not have permission to access Query.restrictedField."
      );
    });
  });

  describe("fieldAuthPlugin", () => {
    it("allows the operation when there are no authorization violations", async () => {
      mockAuthDirectives([validAuthDirective]);

      await expect(expectDidResolveOperation([requiredPermission])).resolves.toBeUndefined();
    });

    it("throws a forbidden GraphQLError when a field authorization check fails", async () => {
      mockAuthDirectives([validAuthDirective]);

      await expect(
        expectDidResolveOperation(["Test Permission" as Permission])
      ).rejects.toMatchObject({
        message: "Authorization failed with 1 violation(s)",
        extensions: {
          code: "FORBIDDEN",
          violations: [
            {
              message: "Unauthorized: You do not have permission to access Query.restrictedField.",
            },
          ],
        },
      });
    });
  });
});
