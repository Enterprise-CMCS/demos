import React from "react";
import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { getCurrentUser, isReadonly, CurrentUser } from "./UserContext";
import { TestProvider } from "test-utils/TestProvider";
import { developmentMockUser } from "mock-data/userMocks";

describe("UserContext", () => {
  describe("isReadonly", () => {
    it("returns true when personType is 'demos-readonly'", () => {
      const readonlyUser: CurrentUser = {
        id: "user-1",
        username: "readonly-user",
        person: {
          id: "person-1",
          personType: "demos-readonly",
          fullName: "Readonly User",
          firstName: "Readonly",
          lastName: "User",
          email: "readonly@example.com",
        },
      };

      expect(isReadonly(readonlyUser)).toBe(true);
    });

    it("returns false when personType is not 'demos-readonly'", () => {
      const adminUser: CurrentUser = {
        id: "user-2",
        username: "admin-user",
        person: {
          id: "person-2",
          personType: "demos-admin",
          fullName: "Admin User",
          firstName: "Admin",
          lastName: "User",
          email: "admin@example.com",
        },
      };

      expect(isReadonly(adminUser)).toBe(false);
    });

    it("returns false when personType is 'demos-state'", () => {
      const stateUser: CurrentUser = {
        id: "user-3",
        username: "state-user",
        person: {
          id: "person-3",
          personType: "demos-state-user",
          fullName: "State User",
          firstName: "State",
          lastName: "User",
          email: "state@example.com",
        },
      };

      expect(isReadonly(stateUser)).toBe(false);
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
