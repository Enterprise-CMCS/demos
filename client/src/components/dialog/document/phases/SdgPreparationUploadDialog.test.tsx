import React from "react";

import { TestProvider } from "test-utils/TestProvider";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SdgPreparationUploadDialog } from "./SdgPreparationUploadDialog";
import { DIALOG_CANCEL_BUTTON_NAME } from "components/dialog/BaseDialog";

const DEFAULT_PROPS = {
  onClose: vi.fn(),
  applicationId: "test-application-id",
};

function setup(props = {}) {
  const finalProps = { ...DEFAULT_PROPS, ...props };
  return render(
    <TestProvider>
      <SdgPreparationUploadDialog {...finalProps} />
    </TestProvider>
  );
}

describe("SdgPreparationUploadDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the dialog title and upload controls", () => {
    setup();
    expect(screen.getByText("Add Draft Document")).toBeInTheDocument();
    expect(screen.getByText("Drop file(s) to upload")).toBeInTheDocument();
    expect(screen.getByTestId(DIALOG_CANCEL_BUTTON_NAME)).toBeInTheDocument();
  });

  it("defaults document type to 'General File'", () => {
    setup();
    expect(screen.getByDisplayValue("General File")).toBeInTheDocument();
  });

  it("only offers 'General File' as a document type", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByTestId("input-autocomplete-select"));
    expect(screen.queryByText("Federal Comment Internal Analysis Document")).not.toBeInTheDocument();
    expect(screen.queryByText("Approval Letter")).not.toBeInTheDocument();
    expect(screen.queryByText("Pre-Submission")).not.toBeInTheDocument();
  });
});
