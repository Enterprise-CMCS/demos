import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DialogProvider, useDialog } from "./DialogContext";

const MockDialog = ({ onClose }: { onClose: () => void }) => (
  <div data-testid="mock-dialog">
    Mock Dialog
    <button data-testid="close-btn" onClick={onClose}>
      Close
    </button>
  </div>
);

// Patch DialogContext to use MockDialog for testing
vi.mock("./demonstration/CreateDemonstrationDialog", () => ({
  CreateDemonstrationDialog: ({ onClose }: { onClose: () => void }) => (
    <MockDialog onClose={onClose} />
  ),
}));
vi.mock("./demonstration", () => ({
  EditDemonstrationDialog: ({
    demonstrationId,
    onClose,
  }: {
    demonstrationId: string;
    onClose: () => void;
  }) => (
    <div data-testid="edit-dialog">
      Edit Dialog {demonstrationId}
      <button data-testid="close-edit-btn" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));
vi.mock("./AmendmentDialog", () => ({
  AmendmentDialog: ({
    demonstrationId,
    mode,
    onClose,
  }: {
    demonstrationId?: string;
    mode: string;
    onClose: () => void;
  }) => (
    <div data-testid="amendment-dialog">
      Amendment Dialog {demonstrationId} {mode}
      <button data-testid="close-amendment-btn" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));
vi.mock("./ExtensionDialog", () => ({
  ExtensionDialog: ({
    demonstrationId,
    mode,
    onClose,
  }: {
    demonstrationId?: string;
    mode: string;
    onClose: () => void;
  }) => (
    <div data-testid="extension-dialog">
      Extension Dialog {demonstrationId} {mode}
      <button data-testid="close-extension-btn" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

const TestConsumer: React.FC = () => {
  const {
    showCreateDemonstrationDialog,
    showEditDemonstrationDialog,
    showCreateAmendmentDialog,
    showCreateExtensionDialog,
  } = useDialog();

  return (
    <div>
      <button data-testid="open-create-btn" onClick={showCreateDemonstrationDialog}>
        Open Create Dialog
      </button>
      <button data-testid="open-edit-btn" onClick={() => showEditDemonstrationDialog("demo-id")}>
        Open Edit Dialog
      </button>
      <button data-testid="open-amendment-btn" onClick={() => showCreateAmendmentDialog("demo-id")}>
        Open Amendment Dialog
      </button>
      <button data-testid="open-extension-btn" onClick={() => showCreateExtensionDialog("demo-id")}>
        Open Extension Dialog
      </button>
    </div>
  );
};

describe("DialogContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children", () => {
    render(
      <DialogProvider>
        <div data-testid="child">Child Content</div>
      </DialogProvider>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("shows and hides CreateDemonstrationDialog via context", async () => {
    render(
      <DialogProvider>
        <TestConsumer />
      </DialogProvider>
    );
    const user = userEvent.setup();

    expect(screen.queryByTestId("mock-dialog")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("open-create-btn"));
    expect(screen.getByTestId("mock-dialog")).toBeInTheDocument();

    await user.click(screen.getByTestId("close-btn"));
    expect(screen.queryByTestId("mock-dialog")).not.toBeInTheDocument();
  });

  it("shows and hides EditDemonstrationDialog via context", async () => {
    render(
      <DialogProvider>
        <TestConsumer />
      </DialogProvider>
    );
    const user = userEvent.setup();

    expect(screen.queryByTestId("edit-dialog")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("open-edit-btn"));
    expect(screen.getByTestId("edit-dialog")).toBeInTheDocument();

    await user.click(screen.getByTestId("close-edit-btn"));
    expect(screen.queryByTestId("edit-dialog")).not.toBeInTheDocument();
  });

  it("shows and hides AmendmentDialog via context", async () => {
    render(
      <DialogProvider>
        <TestConsumer />
      </DialogProvider>
    );
    const user = userEvent.setup();

    expect(screen.queryByTestId("amendment-dialog")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("open-amendment-btn"));
    expect(screen.getByTestId("amendment-dialog")).toBeInTheDocument();

    await user.click(screen.getByTestId("close-amendment-btn"));
    expect(screen.queryByTestId("amendment-dialog")).not.toBeInTheDocument();
  });

  it("shows and hides ExtensionDialog via context", async () => {
    render(
      <DialogProvider>
        <TestConsumer />
      </DialogProvider>
    );
    const user = userEvent.setup();

    expect(screen.queryByTestId("extension-dialog")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("open-extension-btn"));
    expect(screen.getByTestId("extension-dialog")).toBeInTheDocument();

    await user.click(screen.getByTestId("close-extension-btn"));
    expect(screen.queryByTestId("extension-dialog")).not.toBeInTheDocument();
  });
});
