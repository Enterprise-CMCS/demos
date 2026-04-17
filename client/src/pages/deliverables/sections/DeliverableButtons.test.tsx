import React from "react";
import { render, screen } from "@testing-library/react";
import { DeliverableButtons, REFERENCES_BUTTON_NAME, REQUEST_EXTENSION_BUTTON_NAME } from "./DeliverableButtons";

describe("DeliverableButtons", () => {
  it("renders the References button", () => {
    render(<DeliverableButtons />);
    expect(screen.getByTestId(REFERENCES_BUTTON_NAME)).toBeInTheDocument();
    expect(screen.getByTestId(REFERENCES_BUTTON_NAME)).toHaveTextContent("References");
  });

  it("renders the Request Extension button", () => {
    render(<DeliverableButtons />);
    expect(screen.getByTestId(REQUEST_EXTENSION_BUTTON_NAME)).toBeInTheDocument();
    expect(screen.getByTestId(REQUEST_EXTENSION_BUTTON_NAME)).toHaveTextContent("Request Extension");
  });
});
