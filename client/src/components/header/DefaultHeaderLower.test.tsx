import React from "react";
import { vi, Mock } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DefaultHeaderLower } from "./DefaultHeaderLower";
import { getCurrentUser } from "components/user/UserContext";

vi.mock("components/modal/document/DocumentModal", () => ({
  AddDocumentModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="add-document-modal">
      AddDocumentModal
      <button onClick={onClose}>CloseDoc</button>
    </div>
  ),
}));

vi.mock("components/modal/DemonstrationModal", () => ({
  DemonstrationModal: () => <div>DemonstrationModal</div>,
}));

vi.mock("components/modal/CreateNewModal", () => ({
  CreateNewModal: ({ mode, onClose }: { mode: string; onClose: () => void }) => (
    <div data-testid={`modal-${mode}`}>
      CreateNewModal ({mode})<button onClick={onClose}>Close</button>
    </div>
  ),
}));

vi.mock("components/user/UserContext", () => {
  return {
    getCurrentUser: vi.fn(),
  };
});

describe("DefaultHeaderLower", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("shows loading state", () => {
    (getCurrentUser as unknown as Mock).mockReturnValue({
      currentUser: null,
      loading: true,
      error: undefined,
    });

    render(<DefaultHeaderLower />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it("renders minimal bar on error", () => {
    (getCurrentUser as unknown as vi.Mock).mockReturnValue({
      currentUser: null,
      loading: false,
      error: { message: "fail" },
    });

    const { container } = render(<DefaultHeaderLower />);
    expect(screen.queryByText(/Hello/i)).not.toBeInTheDocument();
    expect(container.firstChild).toBeTruthy();
  });

  it("renders minimal bar when no user", () => {
    (getCurrentUser as unknown as vi.Mock).mockReturnValue({
      currentUser: null,
      loading: false,
      error: undefined,
    });

    const { container } = render(<DefaultHeaderLower />);
    expect(screen.queryByText(/Hello/i)).not.toBeInTheDocument();
    expect(container.firstChild).toBeTruthy();
  });

  it("displays user greeting", () => {
    (getCurrentUser as unknown as vi.Mock).mockReturnValue({
      currentUser: {
        id: "1",
        email: "john@test.com",
        displayName: "John Test",
        roles: [],
      },
      loading: false,
      error: undefined,
    });

    render(<DefaultHeaderLower />);
    expect(screen.getByText("Hello John Test")).toBeInTheDocument();
    expect(screen.getByText("Welcome to DEMOS!")).toBeInTheDocument();
  });

  it("opens and closes the dropdown", () => {
    (getCurrentUser as unknown as vi.Mock).mockReturnValue({
      currentUser: { id: "1", email: "x@test.com", displayName: "X", roles: [] },
      loading: false,
      error: undefined,
    });

    render(<DefaultHeaderLower />);
    fireEvent.click(screen.getByText("Create New"));
    expect(screen.getByText("Demonstration")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Demonstration")).not.toBeInTheDocument();
  });

  it("opens DemonstrationModal when clicked", () => {
    (getCurrentUser as unknown as vi.Mock).mockReturnValue({
      currentUser: { id: "1", email: "x@test.com", displayName: "X", roles: [] },
      loading: false,
      error: undefined,
    });

    render(<DefaultHeaderLower />);
    fireEvent.click(screen.getByText("Create New"));
    fireEvent.click(screen.getByText("Demonstration"));
    expect(screen.getByText("DemonstrationModal")).toBeInTheDocument();
  });

  it("opens AddDocumentModal and closes it", () => {
    (getCurrentUser as unknown as vi.Mock).mockReturnValue({
      currentUser: { id: "1", email: "x@test.com", displayName: "X", roles: [] },
      loading: false,
      error: undefined,
    });

    render(<DefaultHeaderLower />);
    fireEvent.click(screen.getByText("Create New"));
    fireEvent.click(screen.getByText("Add New Document"));
    expect(screen.getByTestId("add-document-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByText("CloseDoc"));
    expect(screen.queryByTestId("add-document-modal")).not.toBeInTheDocument();
  });

  it("opens CreateNewModal for amendment", () => {
    (getCurrentUser as unknown as vi.Mock).mockReturnValue({
      currentUser: { id: "1", email: "x@test.com", displayName: "X", roles: [] },
      loading: false,
      error: undefined,
    });

    render(<DefaultHeaderLower />);
    fireEvent.click(screen.getByText("Create New"));
    fireEvent.click(screen.getByText("Amendment"));
    expect(screen.getByTestId("modal-amendment")).toBeInTheDocument();
  });

  it("opens CreateNewModal for extension", () => {
    (getCurrentUser as unknown as vi.Mock).mockReturnValue({
      currentUser: { id: "1", email: "x@test.com", displayName: "X", roles: [] },
      loading: false,
      error: undefined,
    });

    render(<DefaultHeaderLower />);
    fireEvent.click(screen.getByText("Create New"));
    fireEvent.click(screen.getByText("Extension"));
    expect(screen.getByTestId("modal-extension")).toBeInTheDocument();
  });
});
