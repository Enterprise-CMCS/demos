import React from "react";

import * as UserContext from "components/user/UserContext";
import { fireEvent, render, screen } from "@testing-library/react";
import { mockUsers } from "mock-data/userMocks";
import { vi } from "vitest";

import { CreateNewButton } from "./CreateNewButton";

const showCreateDemonstrationDialog = vi.fn();
const showCreateAmendmentDialog = vi.fn();
const showCreateExtensionDialog = vi.fn();

vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({
    showCreateDemonstrationDialog,
    showCreateAmendmentDialog,
    showCreateExtensionDialog,
  }),
}));

vi.mock("components/user/UserContext", async (importOriginal) => {
  const actual = await importOriginal<typeof UserContext>();
  return {
    ...actual,
    getCurrentUser: vi.fn(),
  };
});

describe("CreateNewButton", () => {
  const mockGetCurrentUser = vi.mocked(UserContext.getCurrentUser);

  const renderCreateNewButton = (hasApprovedDemonstrations = true) =>
    render(<CreateNewButton hasApprovedDemonstrations={hasApprovedDemonstrations} />);

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("opens and closes the dropdown", () => {
    mockGetCurrentUser.mockReturnValue({
      currentUser: mockUsers[0],
    });

    renderCreateNewButton();

    fireEvent.click(screen.getByText("Create New"));
    expect(screen.getByText("Demonstration")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Demonstration")).not.toBeInTheDocument();
  });

  it("does not show the menu for state users", () => {
    mockGetCurrentUser.mockReturnValue({
      currentUser: {
        ...mockUsers[0],
        person: {
          ...mockUsers[0].person,
          personType: "demos-state-user",
        },
      },
    });

    renderCreateNewButton();

    expect(screen.queryByText("Create New")).not.toBeInTheDocument();
  });

  it("opens CreateDemonstrationDialog when demonstration is clicked", () => {
    mockGetCurrentUser.mockReturnValue({
      currentUser: mockUsers[0],
    });

    renderCreateNewButton();

    fireEvent.click(screen.getByText("Create New"));
    fireEvent.click(screen.getByText("Demonstration"));

    expect(showCreateDemonstrationDialog).toHaveBeenCalledWith();
  });

  it("opens CreateAmendmentDialog when amendment is clicked", () => {
    mockGetCurrentUser.mockReturnValue({
      currentUser: mockUsers[0],
    });

    renderCreateNewButton();

    fireEvent.click(screen.getByText("Create New"));
    fireEvent.click(screen.getByText("Amendment"));

    expect(showCreateAmendmentDialog).toHaveBeenCalledWith();
  });

  it("opens CreateExtensionDialog when extension is clicked", () => {
    mockGetCurrentUser.mockReturnValue({
      currentUser: mockUsers[0],
    });

    renderCreateNewButton();

    fireEvent.click(screen.getByText("Create New"));
    fireEvent.click(screen.getByText("Extension"));

    expect(showCreateExtensionDialog).toHaveBeenCalledWith();
  });

  it("disables amendment and extension creation when no approved demonstrations exist", () => {
    mockGetCurrentUser.mockReturnValue({
      currentUser: mockUsers[0],
    });

    renderCreateNewButton(false);

    fireEvent.click(screen.getByText("Create New"));
    const amendmentButton = screen.getByTestId("button-create-new-amendment");
    const extensionButton = screen.getByTestId("button-create-new-extension");

    expect(amendmentButton).toBeDisabled();
    expect(extensionButton).toBeDisabled();
    expect(amendmentButton).toHaveAttribute("title", "No Approved Demonstrations Exist");
    expect(extensionButton).toHaveAttribute("title", "No Approved Demonstrations Exist");

    fireEvent.click(amendmentButton);
    fireEvent.click(extensionButton);

    expect(showCreateAmendmentDialog).not.toHaveBeenCalled();
    expect(showCreateExtensionDialog).not.toHaveBeenCalled();
  });

  it("keeps demonstration creation enabled when no approved demonstrations exist", () => {
    mockGetCurrentUser.mockReturnValue({
      currentUser: mockUsers[0],
    });

    renderCreateNewButton(false);

    fireEvent.click(screen.getByText("Create New"));
    fireEvent.click(screen.getByText("Demonstration"));

    expect(showCreateDemonstrationDialog).toHaveBeenCalledWith();
  });
});
