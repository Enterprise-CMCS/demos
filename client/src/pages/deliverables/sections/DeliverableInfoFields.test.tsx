import React from "react";

import { render, screen } from "@testing-library/react";
import { MOCK_DELIVERABLE_1 } from "mock-data/deliverableMocks";
import { DeliverableInfoFields } from "./DeliverableInfoFields";

describe("DeliverableInfoFields", () => {
  it("renders the deliverable type", () => {
    render(<DeliverableInfoFields deliverable={MOCK_DELIVERABLE_1} />);
    expect(screen.getByTestId("deliverable-Deliverable Type")).toHaveTextContent(
      MOCK_DELIVERABLE_1.deliverableType
    );
  });

  it("renders the due date", () => {
    render(<DeliverableInfoFields deliverable={MOCK_DELIVERABLE_1} />);
    expect(screen.getByTestId("deliverable-Due Date")).toBeInTheDocument();
  });

  it("renders the status", () => {
    render(<DeliverableInfoFields deliverable={MOCK_DELIVERABLE_1} />);
    expect(screen.getByTestId("deliverable-Status")).toHaveTextContent(MOCK_DELIVERABLE_1.status);
  });

  it("renders the temporary submission date", () => {
    render(<DeliverableInfoFields deliverable={MOCK_DELIVERABLE_1} />);
    expect(screen.getByTestId("deliverable-Submission Date")).toHaveTextContent("01/05/2026");
  });
});
