import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReferenceAgreementDialog } from "./ReferenceAgreementDialog";
import { DialogProvider } from "../DialogContext";
import { useDownloadReference } from "hooks/useDownloadReference";
import { useSubmitReferenceAgreement } from "hooks/useSubmitReferenceAgreement";
import { ToastContainer } from "components/toast";
import { ToastProvider } from "components/toast";
import { Reference, ReferenceAgreement } from "demos-server";

vi.mock("hooks/useDownloadReference", () => ({
  useDownloadReference: vi.fn(),
}));

vi.mock("hooks/useSubmitReferenceAgreement", () => ({ useSubmitReferenceAgreement: vi.fn() }));

describe("ReferenceAgreementDialog", () => {
  const downloadReference = vi.fn();
  const submitReferenceAgreement = vi.fn();
  const downloadReferenceAgreement = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSubmitReferenceAgreement).mockReturnValue(submitReferenceAgreement);
    submitReferenceAgreement.mockResolvedValue({
      downloadUrl: "download",
      emailRequestStatus: "NOT_REQUESTED",
    });
    downloadReference.mockResolvedValue("https://example.com/reference");
    vi.mocked(useDownloadReference).mockReturnValue({
      downloadReference,
      downloadReferenceAgreement,
    });
  });
  it("renders the dialog with instructions, document download button, checkbox, and action buttons", () => {
    const mockReference: Pick<Reference, "id"> & {
      agreement: Pick<ReferenceAgreement, "id" | "name" | "createdAt">;
    } = {
      id: "reference-123",
      agreement: {
        id: "agreement-456",
        name: "Agreement abc",
        createdAt: new Date("2024-01-01"),
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
        'View the demonstration type and then accept and download the technical specifications of the National Stewards Terms and Conditions "Point and Click" Agreement below'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "button-download-reference" })).toBeInTheDocument();
    expect(screen.getByTestId("checkbox-accept-terms")).toBeInTheDocument();
    expect(screen.getByTestId("checkbox-email-agreement")).not.toBeChecked();
  });

  it("enables the download button only when the terms are accepted", () => {
    const mockReference: Pick<Reference, "id"> & {
      agreement: Pick<ReferenceAgreement, "id" | "name" | "createdAt">;
    } = {
      id: "reference-123",
      agreement: {
        id: "agreement-456",
        name: "Agreement abc",
        createdAt: new Date("2024-01-01"),
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
    screen.getByTestId("checkbox-accept-terms").click();
    expect(downloadButton).toBeEnabled();
  });

  it("calls the submission mutation with correct parameters when download button is clicked", () => {
    const mockReference: Pick<Reference, "id"> & {
      agreement: Pick<ReferenceAgreement, "id" | "name" | "createdAt">;
    } = {
      id: "reference-123",
      agreement: {
        id: "agreement-456",
        name: "Agreement abc",
        createdAt: new Date("2024-01-01"),
      },
    };

    render(
      <DialogProvider>
        <ToastProvider>
          <ReferenceAgreementDialog reference={mockReference} />
        </ToastProvider>
      </DialogProvider>
    );

    screen.getByTestId("checkbox-accept-terms").click();
    screen.getByRole("button", { name: "button-download-reference" }).click();

    expect(submitReferenceAgreement).toHaveBeenCalledWith({
      id: "reference-123",
      acceptedAgreementId: "agreement-456",
      emailRequested: false,
    });
  });

  it("shows a spinner while an accepted reference download is being prepared", async () => {
    const user = userEvent.setup();
    submitReferenceAgreement.mockReturnValueOnce(new Promise(() => {}));
    const mockReference: Pick<Reference, "id"> & {
      agreement: Pick<ReferenceAgreement, "id" | "name" | "createdAt">;
    } = {
      id: "reference-123",
      agreement: {
        id: "agreement-456",
        name: "Agreement abc",
        createdAt: new Date("2024-01-01"),
      },
    };

    render(
      <DialogProvider>
        <ToastProvider>
          <ReferenceAgreementDialog reference={mockReference} />
        </ToastProvider>
      </DialogProvider>
    );

    await user.click(screen.getByTestId("checkbox-accept-terms"));
    const downloadButton = screen.getByRole("button", { name: "button-download-reference" });
    await user.click(downloadButton);

    expect(downloadButton).toBeDisabled();
    expect(within(downloadButton).getByRole("img", { name: "Loading" })).toBeInTheDocument();
  });
  it.each([
    ["QUEUED", null],
    [
      "FAILED",
      "Your agreement was accepted, but we couldn't queue the terms and conditions email.",
    ],
    ["DISABLED", "Your agreement was accepted, but email notifications are currently disabled."],
  ])("submits email opt-in and handles %s", async (status, warning) => {
    const user = userEvent.setup();
    submitReferenceAgreement.mockResolvedValue({
      downloadUrl: "download",
      emailRequestStatus: status,
    });
    render(
      <ToastProvider>
        <DialogProvider>
          <ReferenceAgreementDialog
            reference={{
              id: "reference-123",
              agreement: { id: "agreement-456", name: "Terms", createdAt: new Date("2024-01-01") },
            }}
          />
        </DialogProvider>
        <ToastContainer />
      </ToastProvider>
    );
    await user.click(screen.getByTestId("checkbox-email-agreement"));
    expect(screen.getByRole("button", { name: "button-download-reference" })).toBeDisabled();
    await user.click(screen.getByTestId("checkbox-accept-terms"));
    await user.click(screen.getByRole("button", { name: "button-download-reference" }));
    expect(submitReferenceAgreement).toHaveBeenCalledWith({
      id: "reference-123",
      acceptedAgreementId: "agreement-456",
      emailRequested: true,
    });
    if (warning) expect(await screen.findByText(warning)).toBeInTheDocument();
  });
});
