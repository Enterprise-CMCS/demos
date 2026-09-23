import "@testing-library/jest-dom";

import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { useMutation } from "@apollo/client";

import { DEMONSTRATION_DETAIL_QUERY } from "pages/DemonstrationDetail/DemonstrationDetail";
import {
  EditApplicationDocumentDialog,
  EditDeliverableCmsDocumentDialog,
  EditDeliverableStateDocumentDialog,
  UPDATE_DOCUMENT_QUERY,
  UPDATE_DELIVERABLE_CMS_DOCUMENT_QUERY,
  UPDATE_DELIVERABLE_STATE_DOCUMENT_QUERY,
} from "./EditDocumentDialog";
import { EditDocumentDialogView } from "./EditDocumentDialogView";

vi.mock("./EditDocumentDialogView", () => ({
  EditDocumentDialogView: vi.fn().mockReturnValue(null),
}));

vi.mock("@apollo/client", async () => {
  const actual = await vi.importActual("@apollo/client");
  return {
    ...actual,
    useMutation: vi.fn(),
  };
});

const existingDocument = {
  id: "doc-1",
  name: "Existing Document",
  description: "Existing description",
};
const updatedInput = { name: "Updated Document", description: "Updated description" };

afterEach(() => {
  vi.clearAllMocks();
});

describe("EditApplicationDocumentDialog", () => {
  it("uses the update document mutation, forwards its state, and submits through it", () => {
    const trigger = vi.fn();
    const loading = true;
    vi.mocked(useMutation).mockReturnValueOnce([trigger, { loading }] as never);

    render(<EditApplicationDocumentDialog document={existingDocument} />);

    expect(useMutation).toHaveBeenCalledWith(UPDATE_DOCUMENT_QUERY);
    expect(vi.mocked(EditDocumentDialogView).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        document: existingDocument,
        saving: loading,
        onSubmit: expect.any(Function),
      })
    );

    const { onSubmit } = vi.mocked(EditDocumentDialogView).mock.calls[0][0];
    onSubmit(updatedInput);

    expect(trigger).toHaveBeenCalledWith({
      variables: { id: existingDocument.id, input: updatedInput },
      refetchQueries: [DEMONSTRATION_DETAIL_QUERY],
    });
  });
});

describe("EditDeliverableCmsDocumentDialog", () => {
  it("uses the update deliverable CMS document mutation, forwards its state, and submits through it", () => {
    const trigger = vi.fn();
    const loading = true;
    vi.mocked(useMutation).mockReturnValueOnce([trigger, { loading }] as never);

    render(<EditDeliverableCmsDocumentDialog document={existingDocument} />);

    expect(useMutation).toHaveBeenCalledWith(UPDATE_DELIVERABLE_CMS_DOCUMENT_QUERY);
    expect(vi.mocked(EditDocumentDialogView).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        document: existingDocument,
        saving: loading,
        onSubmit: expect.any(Function),
      })
    );

    const { onSubmit } = vi.mocked(EditDocumentDialogView).mock.calls[0][0];
    onSubmit(updatedInput);

    expect(trigger).toHaveBeenCalledWith({
      variables: { id: existingDocument.id, input: updatedInput },
      refetchQueries: [DEMONSTRATION_DETAIL_QUERY],
    });
  });
});

describe("EditDeliverableStateDocumentDialog", () => {
  it("uses the update deliverable state document mutation, forwards its state, and submits through it", () => {
    const trigger = vi.fn();
    const loading = true;
    vi.mocked(useMutation).mockReturnValueOnce([trigger, { loading }] as never);

    render(<EditDeliverableStateDocumentDialog document={existingDocument} />);

    expect(useMutation).toHaveBeenCalledWith(UPDATE_DELIVERABLE_STATE_DOCUMENT_QUERY);
    expect(vi.mocked(EditDocumentDialogView).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        document: existingDocument,
        saving: loading,
        onSubmit: expect.any(Function),
      })
    );

    const { onSubmit } = vi.mocked(EditDocumentDialogView).mock.calls[0][0];
    onSubmit(updatedInput);

    expect(trigger).toHaveBeenCalledWith({
      variables: { id: existingDocument.id, input: updatedInput },
      refetchQueries: [DEMONSTRATION_DETAIL_QUERY],
    });
  });
});
