import React from "react";
import { render, screen } from "@testing-library/react";
import { ReferenceAgreementDialog } from "./ReferenceAgreementDialog";
import { DialogProvider } from "../DialogContext";
import { useDownloadReference } from "hooks/useDownloadReference";
import { Reference, ReferenceAgreement } from "components/table/tables/ReferencesTable";
import { ToastProvider } from "components/toast";

vi.mock("hooks/useDownloadReference", () => ({
  useDownloadReference: vi.fn(),
}));

describe("ReferenceAgreementDialog", () => {
  const downloadReference = vi.fn();
  const downloadReferenceAgreement = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDownloadReference).mockReturnValue({
      downloadReference,
      downloadReferenceAgreement,
    });
  });
  it("renders the dialog with instructions, document download button, checkbox, and action buttons", () => {
    const mockReference: Pick<Reference, "id"> & { agreement: ReferenceAgreement } = {
      id: "reference-123",
      agreement: {
        id: "agreement-456",
        name: "Agreement abc",
        createdAt: "2024-01-01",
      },
    };

    render(
      <DialogProvider>
        <ToastProvider>
          <ReferenceAgreementDialog reference={mockReference} />
        </ToastProvider>
      </DialogProvider>
    );

    expect(screen.getByText("Point and Click Agreement")).toBeInTheDocument();
    expect(
      screen.getByText(
        'Void the demonstration type and then accept and download the technical specifications of the National Stewards Terms and Conditions "Point and Click" Agreement below'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "button-download-reference" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "I accept the terms" })).toBeInTheDocument();
  });

  it("enables the download button only when the terms are accepted", () => {
    const mockReference: Pick<Reference, "id"> & { agreement: ReferenceAgreement } = {
      id: "reference-123",
      agreement: {
        id: "agreement-456",
        name: "Agreement abc",
        createdAt: "2024-01-01",
      },
    };

    render(
      <DialogProvider>
        <ToastProvider>
          <ReferenceAgreementDialog reference={mockReference} />
        </ToastProvider>
      </DialogProvider>
    );

    const downloadButton = screen.getByRole("button", { name: "button-download-reference" });

    expect(downloadButton).toBeDisabled();
    screen.getByRole("checkbox", { name: "I accept the terms" }).click();
    expect(downloadButton).toBeEnabled();
  });

  it("calls the downloadReference function with correct parameters when download button is clicked", () => {
    const mockReference: Pick<Reference, "id"> & { agreement: ReferenceAgreement } = {
      id: "reference-123",
      agreement: {
        id: "agreement-456",
        name: "Agreement abc",
        createdAt: "2024-01-01",
      },
    };

    render(
      <DialogProvider>
        <ToastProvider>
          <ReferenceAgreementDialog reference={mockReference} />
        </ToastProvider>
      </DialogProvider>
    );

    screen.getByRole("checkbox", { name: "I accept the terms" }).click();
    screen.getByRole("button", { name: "button-download-reference" }).click();

    expect(downloadReference).toHaveBeenCalledWith({
      id: "reference-123",
      acceptedAgreementId: "agreement-456",
    });
  });
});
