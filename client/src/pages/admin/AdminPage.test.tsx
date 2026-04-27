import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AdminPage } from "./AdminPage";
import { TestProvider } from "test-utils/TestProvider";
import { developmentMockUser } from "mock-data/userMocks";
import { CurrentUser } from "components/user/UserContext";
import { USER_MANAGEMENT_TEST_ID } from "./UserManagement";

const ADMIN_USER: CurrentUser = {...developmentMockUser, person: { ...developmentMockUser.person, personType: "demos-admin" } };

const renderAdminPage = () => {
  render(
    <TestProvider currentUser={ADMIN_USER}>
      <AdminPage />
    </TestProvider>
  );
};

describe("AdminPage", () => {
  it("renders the Admin card title", () => {
    renderAdminPage();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("renders User Management tab", () => {
    renderAdminPage();
    expect(screen.getByTestId("button-user-management")).toBeInTheDocument();
  });

  it("renders Type/Tag Management tab", () => {
    renderAdminPage();
    expect(screen.getByTestId("button-type-tag-management")).toBeInTheDocument();
  });

  it("shows User Management content by default", () => {
    renderAdminPage();
    expect(screen.getByTestId(USER_MANAGEMENT_TEST_ID)).toBeInTheDocument();
  });
});
