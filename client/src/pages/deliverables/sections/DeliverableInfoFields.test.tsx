import React from "react";

import { render, screen } from "@testing-library/react";
import { MOCK_DELIVERABLE_1 } from "mock-data/deliverableMocks";
import { DeliverableInfoFields } from "./DeliverableInfoFields";

describe("DeliverableInfoFields", () => {
  it("renders the deliverable type", () => {
    render(<DeliverableInfoFields deliverable={MOCK_DELIVERABLE_1} />);
    expect(screen.getByTestId("deliverable-Deliverable Type")).toHaveTextContent(MOCK_DELIVERABLE_1.deliverableType);
  });

  it("renders the due date", () => {
    render(<DeliverableInfoFields deliverable={MOCK_DELIVERABLE_1} />);
    expect(screen.getByTestId("deliverable-Due Date")).toBeInTheDocument();
  });

  it("renders the status", () => {
    render(<DeliverableInfoFields deliverable={MOCK_DELIVERABLE_1} />);
    expect(screen.getByTestId("deliverable-Status")).toHaveTextContent(MOCK_DELIVERABLE_1.status);
  });

  it("renders the submission date placeholder", () => {
    render(<DeliverableInfoFields deliverable={MOCK_DELIVERABLE_1} />);
    expect(screen.getByTestId("deliverable-Submission Date")).toHaveTextContent("—");
  });

  it("computes and renders the number of resubmissions requested", () => {
    render(<DeliverableInfoFields deliverable={MOCK_DELIVERABLE_1} showAdditionalDetailsToggle showAdditionalDetails />);
    expect(screen.getByTestId("deliverable-Resubmissions Requested")).toHaveTextContent("1");
  });

  it("renders Extension as N/A when there are no extensions", () => {
    render(
      <DeliverableInfoFields
        deliverable={MOCK_DELIVERABLE_1}
        showAdditionalDetailsToggle
        showAdditionalDetails
      />
    );
    expect(screen.getByTestId("deliverable-Extension")).toHaveTextContent("N/A");
  });

  it("renders Extension status from the most recent extension", () => {
    const deliverable = {
      ...MOCK_DELIVERABLE_1,
      deliverableExtensions: [
        { id: "ext-old", status: "Approved" as const, createdAt: new Date("2026-01-01") },
        { id: "ext-new", status: "Requested" as const, createdAt: new Date("2026-03-01") },
      ],
    };
    render(
      <DeliverableInfoFields
        deliverable={deliverable}
        showAdditionalDetailsToggle
        showAdditionalDetails
      />
    );
    expect(screen.getByTestId("deliverable-Extension")).toHaveTextContent("Requested");
  });
});
