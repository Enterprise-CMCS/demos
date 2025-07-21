// src/components/DefaultHeaderLower.test.tsx
import React from "react";

import { vi } from "vitest";

import { useQuery } from "@apollo/client";
import {
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import { DefaultHeaderLower } from "./DefaultHeaderLower";

// Mock Apollo
vi.mock("@apollo/client", async () => {
  const actual = await vi.importActual<typeof import("@apollo/client")>("@apollo/client");
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

// Stub modals
vi.mock("components/modal/DemonstrationModal", () => ({
  DemonstrationModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="create-modal">
      DemonstrationModal
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));
vi.mock("components/modal/AddDocumentModal", () => ({
  AddDocumentModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="add-document-modal">
      AddDocumentModal
      <button onClick={onClose}>CloseDoc</button>
    </div>
  ),
}));

// Mock Toast Context
vi.mock("components/toast", () => ({
  useToast: () => ({ showSuccess: vi.fn() }),
}));

describe("DefaultHeaderLower", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("renders empty bar when no userId is passed", () => {
    (useQuery as unknown as import("vitest").Mock).mockReturnValue({});
    const { container } = render(<DefaultHeaderLower />);
    expect(container.firstChild?.childNodes.length).toBe(0);
  });

  it("shows loading state", () => {
    (useQuery as unknown as import("vitest").Mock).mockReturnValue({
      loading: true,
      error: null,
      data: null,
    });
    render(<DefaultHeaderLower userId={1} />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows error message", () => {
    (useQuery as unknown as import("vitest").Mock).mockReturnValue({
      loading: false,
      error: { message: "fail" },
      data: null,
    });
    render(<DefaultHeaderLower userId={2} />);
    expect(screen.getByText("Error: fail")).toBeInTheDocument();
  });

  it("returns null if no user data", () => {
    (useQuery as unknown as import("vitest").Mock).mockReturnValue({
      loading: false,
      error: null,
      data: { user: null },
    });
    const { container } = render(<DefaultHeaderLower userId={3} />);
    expect(container.firstChild).toBeNull();
  });

  it("displays user greeting", () => {
    (useQuery as unknown as import("vitest").Mock).mockReturnValue({
      loading: false,
      error: null,
      data: { user: { fullName: "John Test" } },
    });
    render(<DefaultHeaderLower userId={4} />);
    expect(screen.getByText("Hello John Test")).toBeInTheDocument();
  });

  it("opens and closes the dropdown", () => {
    (useQuery as unknown as import("vitest").Mock).mockReturnValue({
      loading: false,
      error: null,
      data: { user: { fullName: "X" } },
    });
    render(<DefaultHeaderLower userId={5} />);
    const button = screen.getByText("Create New");
    fireEvent.click(button);
    expect(screen.getByText("Demonstration")).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Demonstration")).not.toBeInTheDocument();
  });

  it("opens DemonstrationModal", () => {
    (useQuery as unknown as import("vitest").Mock).mockReturnValue({
      loading: false,
      error: null,
      data: { user: { fullName: "X" } },
    });
    render(<DefaultHeaderLower userId={6} />);
    fireEvent.click(screen.getByText("Create New"));
    fireEvent.click(screen.getByText("Demonstration"));
    expect(screen.getByTestId("create-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Close"));
    expect(screen.queryByTestId("create-modal")).not.toBeInTheDocument();
  });

  it("opens AddDocumentModal", () => {
    (useQuery as unknown as import("vitest").Mock).mockReturnValue({
      loading: false,
      error: null,
      data: { user: { fullName: "X" } },
    });
    render(<DefaultHeaderLower userId={7} />);
    fireEvent.click(screen.getByText("Create New"));
    fireEvent.click(screen.getByText("Add New Document"));
    expect(screen.getByTestId("add-document-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByText("CloseDoc"));
    expect(screen.queryByTestId("add-document-modal")).not.toBeInTheDocument();
  });

  it("handles Extension clicks without opening modal", () => {
    (useQuery as unknown as import("vitest").Mock).mockReturnValue({
      loading: false,
      error: null,
      data: { user: { fullName: "X" } },
    });
    render(<DefaultHeaderLower userId={8} />);

    fireEvent.click(screen.getByText("Create New")); // reopen dropdown
    fireEvent.click(screen.getByText("Extension"));
    expect(screen.queryByTestId("create-modal")).toBeNull();
    expect(screen.queryByTestId("add-document-modal")).toBeNull();
  });
});
