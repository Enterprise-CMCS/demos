import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AdminPage } from "./AdminPage";
import { TestProvider } from "test-utils/TestProvider";
import { developmentMockUser } from "mock-data/userMocks";
import { CurrentUser } from "components/user/UserContext";
import { DialogProvider } from "components/dialog/DialogContext";
import { USER_MANAGEMENT_TEST_ID } from "./UserManagement";
import { TYPE_TAG_ASSOCIATED_RECORDS_TEST_ID } from "./TypeTagAssociatedRecords";
import { TYPE_TAG_SEARCH_PARAM } from "./useSelectedTypeTag";

const ADMIN_USER: CurrentUser = {...developmentMockUser, person: { ...developmentMockUser.person, personType: "demos-admin" } };

const renderAdminPage = (routerEntry = "/admin") => {
  render(
    <TestProvider currentUser={ADMIN_USER} routerEntries={[routerEntry]}>
      <DialogProvider>
        <AdminPage />
      </DialogProvider>
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

  it("renders Login History tab", () => {
    renderAdminPage();
    expect(screen.getByTestId("button-login-history")).toBeInTheDocument();
  });

  it("shows User Management content by default", () => {
    renderAdminPage();
    expect(screen.getByTestId(USER_MANAGEMENT_TEST_ID)).toBeInTheDocument();
  });

  it("opens the associated records view when the URL selects a type/tag", () => {
    renderAdminPage(`/admin?${TYPE_TAG_SEARCH_PARAM}=Aggregate%20Cap`);
    expect(screen.getByTestId(TYPE_TAG_ASSOCIATED_RECORDS_TEST_ID)).toBeInTheDocument();
  });
});
