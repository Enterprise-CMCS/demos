// src/components/DefaultHeaderLower.test.tsx
import React from "react";

import * as UserContext from "components/user/UserContext";
import { DemosApolloProvider } from "router/DemosApolloProvider";
import { vi } from "vitest";

import { fireEvent, render, screen } from "@testing-library/react";

import { DefaultHeaderLower } from "./DefaultHeaderLower";
import { PersonType } from "demos-server";

// Mock UserContext
vi.mock("components/user/UserContext", () => ({
  getCurrentUser: vi.fn(),
}));

// Stub modals
vi.mock("components/dialog/document/DocumentDialog", () => ({
  AddDocumentDialog: ({ onClose }: { onClose: () => void }) => (
    <div>
      AddDocumentDialog
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

vi.mock("components/dialog/DemonstrationDialog", () => ({
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

// Mock Toast Context
vi.mock("components/toast", () => ({
  useToast: () => ({ showSuccess: vi.fn() }),
}));

describe("DefaultHeaderLower", () => {
  const mockGetCurrentUser = vi.mocked(UserContext.getCurrentUser);

  const mockUser = {
    id: "1",
    username: "john",
    email: "john@test.com",
    fullName: "John Test",
    displayName: "John Test",
    personTypeId: "demos-cms-user" as PersonType,
  };

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("renders empty bar when no userId is passed", () => {
    mockGetCurrentUser.mockReturnValue({
      currentUser: null,
      loading: false,
      error: null,
      refresh: vi.fn(),
      hasRole: vi.fn(),
    });
    const { container } = render(<DefaultHeaderLower />);
    expect(container.firstChild?.childNodes.length).toBe(0);
  });

  it("shows loading state", () => {
    mockGetCurrentUser.mockReturnValue({
      currentUser: null,
      loading: true,
      error: null,
      refresh: vi.fn(),
      hasRole: vi.fn(),
    });
    render(<DefaultHeaderLower />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("shows error message", () => {
    mockGetCurrentUser.mockReturnValue({
      currentUser: null,
      loading: false,
      error: { message: "fail" } as unknown as import("@apollo/client").ApolloError,
      refresh: vi.fn(),
      hasRole: vi.fn(),
    });
    const { container } = render(<DefaultHeaderLower />);
    expect(container.firstChild?.childNodes.length).toBe(0);
  });

  it("returns null if no user data", () => {
    mockGetCurrentUser.mockReturnValue({
      currentUser: null,
      loading: false,
      error: null,
      refresh: vi.fn(),
      hasRole: vi.fn(),
    });
    const { container } = render(<DefaultHeaderLower />);
    expect(container.firstChild?.childNodes.length).toBe(0);
  });

  it("displays user greeting", () => {
    mockGetCurrentUser.mockReturnValue({
      currentUser: mockUser,
      loading: false,
      error: null,
      refresh: vi.fn(),
      hasRole: vi.fn(),
    });
    render(<DefaultHeaderLower />);
    expect(screen.getByText("Hello John Test")).toBeInTheDocument();
  });

  it("opens and closes the dropdown", () => {
    mockGetCurrentUser.mockReturnValue({
      currentUser: mockUser,
      loading: false,
      error: null,
      refresh: vi.fn(),
      hasRole: vi.fn(),
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
      currentUser: mockUser,
      loading: false,
      error: null,
      refresh: vi.fn(),
      hasRole: vi.fn(),
    });

    render(
      <DemosApolloProvider>
        <DefaultHeaderLower />
      </DemosApolloProvider>
    );
    fireEvent.click(screen.getByText("Create New"));
    fireEvent.click(screen.getByText("Demonstration"));
    expect(screen.queryByText("CreateDemonstrationDialog")).toBeInTheDocument();
  });

  it("opens AmendmentDialog for amendment", () => {
    mockGetCurrentUser.mockReturnValue({
      currentUser: mockUser,
      loading: false,
      error: null,
      refresh: vi.fn(),
      hasRole: vi.fn(),
    });
    render(<DefaultHeaderLower />);
    fireEvent.click(screen.getByText("Create New"));
    fireEvent.click(screen.getByText("Amendment"));
    expect(screen.getByText("AmendmentDialog (add)")).toBeInTheDocument();
  });

  it("opens ExtensionDialog for extension", () => {
    mockGetCurrentUser.mockReturnValue({
      currentUser: mockUser,
      loading: false,
      error: null,
      refresh: vi.fn(),
      hasRole: vi.fn(),
    });
    render(<DefaultHeaderLower />);
    fireEvent.click(screen.getByText("Create New"));
    fireEvent.click(screen.getByText("Extension"));
    expect(screen.getByText("ExtensionDialog (add)")).toBeInTheDocument();
  });
});
