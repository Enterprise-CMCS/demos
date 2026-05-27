import "@testing-library/jest-dom";

import React from "react";

import { ToastProvider } from "components/toast/ToastContext";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

import { AddDocumentToDeliverableDialog } from "./AddDocumentToDeliverableDialog";

const mockMutationFn = vi.fn();
const mockRefetchQueries = vi.fn();

beforeEach(() => {
  vi.mock("@apollo/client", async () => {
    const actual = await vi.importActual("@apollo/client");
    return {
      ...actual,
      useMutation: () => [mockMutationFn, { loading: false }],
      useLazyQuery: () => [vi.fn(), { loading: false }],
      useApolloClient: () => ({
        refetchQueries: mockRefetchQueries,
      }),
    };
  });
});

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

const renderDialog = (isCmsFile: boolean) =>
  render(
    <ToastProvider>
      <AddDocumentToDeliverableDialog
        onClose={vi.fn()}
        deliverableId="deliverable-1"
        applicationId="demo-1"
        isCmsFile={isCmsFile}
        documentTypeSubset={isCmsFile ? undefined : ["General File"]}
      />
    </ToastProvider>
  );

describe("AddDocumentToDeliverableDialog", () => {
  it("renders with the Upload Document title and the drop zone", () => {
    renderDialog(false);

    expect(screen.getByRole("heading", { name: "Upload Document" })).toBeInTheDocument();
    expect(screen.getByTestId("input-file")).toBeInTheDocument();
  });

  it("renders the File Type field on the State files variant", () => {
    renderDialog(false);

    expect(screen.getByTestId("input-autocomplete-select")).toBeInTheDocument();
  });

  it("hides the File Type field on the CMS files variant", () => {
    renderDialog(true);

    expect(screen.queryByTestId("input-autocomplete-select")).not.toBeInTheDocument();
  });
});
