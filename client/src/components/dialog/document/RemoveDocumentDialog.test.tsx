import "@testing-library/jest-dom";

import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { useMutation } from "@apollo/client";

import { DEMONSTRATION_DETAIL_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";
import { GET_WORKFLOW_DEMONSTRATION_QUERY } from "components/application/demonstration/DemonstrationWorkflow";
import {
  RemoveApplicationDocumentsDialog,
  RemoveDeliverableCmsDocumentsDialog,
  RemoveDeliverableStateDocumentsDialog,
  DELETE_DOCUMENTS_QUERY,
  DELETE_DELIVERABLE_CMS_DOCUMENTS_QUERY,
  DELETE_DELIVERABLE_STATE_DOCUMENTS_QUERY,
} from "./RemoveDocumentDialog";
import { RemoveDocumentDialogView } from "./RemoveDocumentDialogView";

vi.mock("./RemoveDocumentDialogView", () => ({
  RemoveDocumentDialogView: vi.fn().mockReturnValue(null),
}));

vi.mock("@apollo/client", async () => {
  const actual = await vi.importActual("@apollo/client");
  return {
    ...actual,
    useMutation: vi.fn(),
  };
});

const documentIds = ["doc-1", "doc-2"];
const onClose = vi.fn();
const refetchQueries = [DEMONSTRATION_DETAIL_QUERY, GET_WORKFLOW_DEMONSTRATION_QUERY];

afterEach(() => {
  vi.clearAllMocks();
});

describe("RemoveApplicationDocumentsDialog", () => {
  it("uses the delete documents mutation, forwards its props, and confirms through it", () => {
    const trigger = vi.fn();
    vi.mocked(useMutation).mockReturnValueOnce([trigger] as never);

    render(<RemoveApplicationDocumentsDialog documentIds={documentIds} onClose={onClose} />);

    expect(useMutation).toHaveBeenCalledWith(DELETE_DOCUMENTS_QUERY);
    expect(vi.mocked(RemoveDocumentDialogView).mock.calls[0][0]).toEqual(
      expect.objectContaining({ documentIds, onClose, onConfirm: expect.any(Function) })
    );

    const { onConfirm } = vi.mocked(RemoveDocumentDialogView).mock.calls[0][0];
    onConfirm(documentIds);

    expect(trigger).toHaveBeenCalledWith({
      variables: { ids: documentIds },
      refetchQueries,
    });
  });
});

describe("RemoveDeliverableCmsDocumentsDialog", () => {
  it("uses the delete deliverable CMS documents mutation, forwards its props, and confirms through it", () => {
    const trigger = vi.fn();
    vi.mocked(useMutation).mockReturnValueOnce([trigger] as never);

    render(<RemoveDeliverableCmsDocumentsDialog documentIds={documentIds} onClose={onClose} />);

    expect(useMutation).toHaveBeenCalledWith(DELETE_DELIVERABLE_CMS_DOCUMENTS_QUERY);
    expect(vi.mocked(RemoveDocumentDialogView).mock.calls[0][0]).toEqual(
      expect.objectContaining({ documentIds, onClose, onConfirm: expect.any(Function) })
    );

    const { onConfirm } = vi.mocked(RemoveDocumentDialogView).mock.calls[0][0];
    onConfirm(documentIds);

    expect(trigger).toHaveBeenCalledWith({
      variables: { ids: documentIds },
      refetchQueries,
    });
  });
});

describe("RemoveDeliverableStateDocumentsDialog", () => {
  it("uses the delete deliverable state documents mutation, forwards its props, and confirms through it", () => {
    const trigger = vi.fn();
    vi.mocked(useMutation).mockReturnValueOnce([trigger] as never);

    render(<RemoveDeliverableStateDocumentsDialog documentIds={documentIds} onClose={onClose} />);

    expect(useMutation).toHaveBeenCalledWith(DELETE_DELIVERABLE_STATE_DOCUMENTS_QUERY);
    expect(vi.mocked(RemoveDocumentDialogView).mock.calls[0][0]).toEqual(
      expect.objectContaining({ documentIds, onClose, onConfirm: expect.any(Function) })
    );

    const { onConfirm } = vi.mocked(RemoveDocumentDialogView).mock.calls[0][0];
    onConfirm(documentIds);

    expect(trigger).toHaveBeenCalledWith({
      variables: { ids: documentIds },
      refetchQueries,
    });
  });
});
