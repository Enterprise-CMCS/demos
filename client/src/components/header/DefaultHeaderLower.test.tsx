// src/components/DefaultHeaderLower.test.tsx
import React from "react";

import * as UserContext from "components/user/UserContext";
import { DemosApolloProvider } from "router/DemosApolloProvider";
import { vi } from "vitest";

import { fireEvent, render, screen } from "@testing-library/react";

import { DefaultHeaderLower } from "./DefaultHeaderLower";
import { mockUsers } from "mock-data/userMocks";

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

// Mock UserContext
vi.mock("components/user/UserContext", async (importOriginal) => {
  const actual = await importOriginal<typeof UserContext>();
  return {
    ...actual,
    getCurrentUser: vi.fn(),
  };
});

// Stub modals
vi.mock("components/dialog", () => ({
  EditDemonstrationDialog: () => <div>EditDemonstrationDialog</div>,
  CreateDemonstrationDialog: () => <div>CreateDemonstrationDialog</div>,
}));

vi.mock("components/dialog/AmendmentDialog", () => ({
  AmendmentDialog: ({ mode, onClose }: { mode: string; onClose: () => void }) => (
    <div>
      AmendmentDialog ({mode})<button onClick={onClose}>Close</button>
    </div>
  ),
}));

vi.mock("components/dialog/ExtensionDialog", () => ({
  ExtensionDialog: ({ mode, onClose }: { mode: string; onClose: () => void }) => (
    <div>
      ExtensionDialog ({mode})<button onClick={onClose}>Close</button>
    </div>
  ),
}));

describe("DefaultHeaderLower", () => {
  const mockGetCurrentUser = vi.mocked(UserContext.getCurrentUser);

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("displays user greeting", () => {
    mockGetCurrentUser.mockReturnValue({
      currentUser: mockUsers[0],
    });
    render(<DefaultHeaderLower />);
    expect(screen.getByText("Hello John Doe")).toBeInTheDocument();
  });

  it("opens and closes the dropdown", () => {
    mockGetCurrentUser.mockReturnValue({
      currentUser: mockUsers[0],
    });
    render(<DefaultHeaderLower />);
    const button = screen.getByText("Create New");
    fireEvent.click(button);
    expect(screen.getByText("Demonstration")).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Demonstration")).not.toBeInTheDocument();
  });

  it("opens CreateDemonstrationDialog when demonstration modal is clicked", () => {
    mockGetCurrentUser.mockReturnValue({
      currentUser: mockUsers[0],
    });

    render(
      <DemosApolloProvider>
        <DefaultHeaderLower />
      </DemosApolloProvider>
    );
    fireEvent.click(screen.getByText("Create New"));
    fireEvent.click(screen.getByText("Demonstration"));
    expect(showCreateDemonstrationDialog).toHaveBeenCalledWith();
  });

  it("opens AmendmentDialog for amendment", () => {
    mockGetCurrentUser.mockReturnValue({
      currentUser: mockUsers[0],
    });
    render(<DefaultHeaderLower />);
    fireEvent.click(screen.getByText("Create New"));
    fireEvent.click(screen.getByText("Amendment"));
    expect(showCreateAmendmentDialog).toHaveBeenCalledWith();
  });

  it("opens ExtensionDialog for extension", () => {
    mockGetCurrentUser.mockReturnValue({
      currentUser: mockUsers[0],
    });
    render(<DefaultHeaderLower />);
    fireEvent.click(screen.getByText("Create New"));
    fireEvent.click(screen.getByText("Extension"));
    expect(showCreateExtensionDialog).toHaveBeenCalledWith();
  });
});
