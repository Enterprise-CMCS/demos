import React from "react";
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { getCurrentUser, isReadonly, CurrentUser } from "./UserContext";
import { TestProvider } from "test-utils/TestProvider";
import { developmentMockUser } from "mock-data/userMocks";

const BASE_CURRENT_USER: CurrentUser = {
  id: "user-1",
  username: "base-user",
  person: {
    id: "person-1",
    personType: "demos-cms-user",
    fullName: "Base User",
    firstName: "Base",
    lastName: "User",
    email: "base@example.com",
  },
};

describe("UserContext", () => {
  describe("isReadonly", () => {
    it("returns true when personType is 'demos-restricted-cms-user'", () => {
      const readonlyUser: CurrentUser = {
        ...BASE_CURRENT_USER,
        person: {
          ...BASE_CURRENT_USER.person,
          personType: "demos-restricted-cms-user",
        },
      };

      expect(isReadonly(readonlyUser)).toBe(true);
    });

    it("returns false when personType is not 'demos-restricted-cms-user'", () => {
      const adminUser: CurrentUser = {
        ...BASE_CURRENT_USER,
        person: {
          ...BASE_CURRENT_USER.person,
          personType: "demos-admin",
        },
      };

      expect(isReadonly(adminUser)).toBe(false);
    });

    it("returns false when personType is 'demos-state'", () => {
      const stateUser: CurrentUser = {
        ...BASE_CURRENT_USER,
        person: {
          ...BASE_CURRENT_USER.person,
          personType: "demos-state-user",
        },
      };

      expect(isReadonly(stateUser)).toBe(false);
    });

    it("returns true when personType is 'demos-cms-reviewer-user' in ApplicationWorkflow section", () => {
      const reviewerUser: CurrentUser = {
        ...BASE_CURRENT_USER,
        person: {
          ...BASE_CURRENT_USER.person,
          personType: "demos-cms-reviewer-user",
        },
      };

      expect(isReadonly(reviewerUser, "ApplicationWorkflow")).toBe(true);
    });

    it("returns true when personType is 'demos-restricted-cms-user' even in Homepage section", () => {
      const readonlyUser: CurrentUser = {
        ...BASE_CURRENT_USER,
        person: {
          ...BASE_CURRENT_USER.person,
          personType: "demos-restricted-cms-user",
        },
      };

      expect(isReadonly(readonlyUser, "Homepage")).toBe(true);
    });

    it("returns false when personType is 'demos-cms-reviewer-user' in Homepage", () => {
      const reviewerUser: CurrentUser = {
        ...BASE_CURRENT_USER,
        person: {
          ...BASE_CURRENT_USER.person,
          personType: "demos-cms-reviewer-user",
        },
      };

      expect(isReadonly(reviewerUser, "Homepage")).toBe(false);
    });

    it("returns true when personType is 'demos-cms-reviewer-user' in DemonstrationDetail", () => {
      const reviewerUser: CurrentUser = {
        ...BASE_CURRENT_USER,
        person: {
          ...BASE_CURRENT_USER.person,
          personType: "demos-cms-reviewer-user",
        },
      };

      expect(isReadonly(reviewerUser, "DemonstrationDetail")).toBe(true);
    });

    it("returns true when personType is 'demos-oact-user' in DemonstrationDetail", () => {
      const oactUser: CurrentUser = {
        ...BASE_CURRENT_USER,
        person: {
          ...BASE_CURRENT_USER.person,
          personType: "demos-oact-user",
        },
      };

      expect(isReadonly(oactUser, "DemonstrationDetail")).toBe(true);
    });

    it("returns true when personType is 'demos-oact-user' in Homepage", () => {
      const oactUser: CurrentUser = {
        ...BASE_CURRENT_USER,
        person: {
          ...BASE_CURRENT_USER.person,
          personType: "demos-oact-user",
        },
      };

      expect(isReadonly(oactUser, "Homepage")).toBe(true);
    });

    it("returns false when personType is 'demos-oact-user' in ApplicationWorkflow", () => {
      const oactUser: CurrentUser = {
        ...BASE_CURRENT_USER,
        person: {
          ...BASE_CURRENT_USER.person,
          personType: "demos-oact-user",
        },
      };

      expect(isReadonly(oactUser, "ApplicationWorkflow")).toBe(false);
    });

    it("returns false for other user types in ApplicationWorkflow section", () => {
      const adminUser: CurrentUser = {
        ...BASE_CURRENT_USER,
        person: {
          ...BASE_CURRENT_USER.person,
          personType: "demos-admin",
        },
      };

      expect(isReadonly(adminUser, "Homepage")).toBe(false);
    });

    it("returns false when personType is 'demos-cms-reviewer-user' in Homepage section", () => {
      const reviewerUser: CurrentUser = {
        ...BASE_CURRENT_USER,
        person: {
          ...BASE_CURRENT_USER.person,
          personType: "demos-cms-reviewer-user",
        },
      };

      expect(isReadonly(reviewerUser, "Homepage")).toBe(false);
    });
  });

  describe("getCurrentUser", () => {
    it("throws error when used outside UserProvider", () => {
      expect(() => {
        renderHook(() => getCurrentUser());
      }).toThrow("getCurrentUser must be used within <UserProvider>");
    });

    it("returns context with current user when used inside UserProvider", () => {
      const { result } = renderHook(() => getCurrentUser(), {
        wrapper: TestProvider,
      });

      expect(result.current).toBeDefined();
      expect(result.current.currentUser).toBeDefined();
      expect(result.current.currentUser.id).toBe(developmentMockUser.id);
      expect(result.current.currentUser.username).toBe(developmentMockUser.username);
    });

    it("returns user with correct structure via currentUser property", () => {
      const { result } = renderHook(() => getCurrentUser(), {
        wrapper: TestProvider,
      });

      const currentUser = result.current.currentUser;

      expect(currentUser).toHaveProperty("id");
      expect(currentUser).toHaveProperty("username");
      expect(currentUser).toHaveProperty("person");
      expect(currentUser.person).toHaveProperty("id");
      expect(currentUser.person).toHaveProperty("personType");
      expect(currentUser.person).toHaveProperty("fullName");
      expect(currentUser.person).toHaveProperty("firstName");
      expect(currentUser.person).toHaveProperty("lastName");
      expect(currentUser.person).toHaveProperty("email");
    });

    it("returns custom user when passed via TestProvider", () => {
      const customUser: CurrentUser = {
        id: "custom-user-id",
        username: "custom-username",
        person: {
          id: "custom-person-id",
          personType: "demos-admin",
          fullName: "Custom User",
          firstName: "Custom",
          lastName: "User",
          email: "custom@example.com",
        },
      };

      const { result } = renderHook(() => getCurrentUser(), {
        wrapper: (props) => <TestProvider currentUser={customUser} {...props} />,
      });

      expect(result.current.currentUser.id).toBe("custom-user-id");
      expect(result.current.currentUser.username).toBe("custom-username");
      expect(result.current.currentUser.person.fullName).toBe("Custom User");
    });
  });
});
