import { screen, render } from "@testing-library/react";
import React from "react";
import { COMPLETE_REVIEW_BUTTON, CompleteReviewButton } from "./CompleteReviewButton";
import { Deliverable, DeliverableExtension } from "demos-server";

const mockShowCompleteReviewDeliverableDialog = vi.fn();
vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({
    showCompleteReviewDeliverableDialog: mockShowCompleteReviewDeliverableDialog,
  }),
}));

const mockDeliverable: Pick<Deliverable, "id" | "status"> & {
  extensionRequests: Pick<DeliverableExtension, "status">[];
  stateDocuments: {
    deliverableSubmissionAction: object | null;
  }[];
} = {
  id: "deliverable-1",
  status: "Under CMS Review",
  extensionRequests: [],
  stateDocuments: [{ deliverableSubmissionAction: {} }],
};

describe("CompleteReviewButton", () => {
  const setup = (overrides?: Partial<typeof mockDeliverable>) => {
    const deliverable = { ...mockDeliverable, ...overrides };
    render(<CompleteReviewButton deliverable={deliverable} />);
  };

  it("renders the button with correct label", () => {
    setup();

    const button = screen.getByTestId(COMPLETE_REVIEW_BUTTON.name);
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent(COMPLETE_REVIEW_BUTTON.label);
  });

  it("disables the button when deliverable is not in eligible status", () => {
    setup({ status: "Submitted" });

    const button = screen.getByTestId(COMPLETE_REVIEW_BUTTON.name);
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("title", COMPLETE_REVIEW_BUTTON.ineligibleStatusTooltip);
  });

  it("disables the button when there is an open extension request", () => {
    setup({
      extensionRequests: [{ status: "Requested" }, { status: "Approved" }],
    });

    const button = screen.getByTestId(COMPLETE_REVIEW_BUTTON.name);
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("title", COMPLETE_REVIEW_BUTTON.activeExtensionRequestTooltip);
  });

  it("disables the button when not all documents are submitted", () => {
    setup({
      stateDocuments: [{ deliverableSubmissionAction: {} }, { deliverableSubmissionAction: null }],
    });

    const button = screen.getByTestId(COMPLETE_REVIEW_BUTTON.name);
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("title", COMPLETE_REVIEW_BUTTON.unsubmittedFilesTooltip);
  });

  it("enables the button when deliverable is in eligible status, has no open extension requests, and all documents are submitted", () => {
    setup();

    const button = screen.getByTestId(COMPLETE_REVIEW_BUTTON.name);
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute("title", COMPLETE_REVIEW_BUTTON.enabledTooltip);
  });

  it("opens the complete review dialog when clicked", () => {
    setup();

    const button = screen.getByTestId(COMPLETE_REVIEW_BUTTON.name);
    button.click();

    expect(mockShowCompleteReviewDeliverableDialog).toHaveBeenCalledWith({
      id: mockDeliverable.id,
    });
  });
});
