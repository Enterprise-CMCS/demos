import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TestProvider } from "test-utils/TestProvider";
import { VerifyCompleteSection } from "./VerifyCompleteSection";
import {
  COMPLETENESS_DECLARE_INCOMPLETE_BUTTON_NAME,
  COMPLETENESS_FINISH_BUTTON_NAME,
  COMPLETENESS_PHASE_STEP_TWO_DESCRIPTION,
  FEDERAL_COMMENT_END_DATEPICKER_NAME,
  FEDERAL_COMMENT_START_DATEPICKER_NAME,
  STATE_DEEMED_COMPLETE_DATEPICKER_NAME,
} from "./CompletenessPhase";

describe("VerifyCompleteSection", () => {
  const defaultProps = {
    stateDeemedComplete: "",
    federalStartDate: "",
    federalEndDate: "",
    completenessComplete: false,
    finishIsEnabled: false,
    onDateChange: vi.fn(),
    onDeclareIncomplete: vi.fn(),
    onFinish: vi.fn(),
  };

  const setup = (props: Partial<typeof defaultProps> = {}) => {
    render(
      <TestProvider>
        <VerifyCompleteSection {...defaultProps} {...props} />
      </TestProvider>
    );
  };

  it("renders section title and description", () => {
    setup();
    expect(screen.getByText("Step 2 - Verify/Complete")).toBeInTheDocument();
    expect(screen.getByTestId(COMPLETENESS_PHASE_STEP_TWO_DESCRIPTION.testId)).toHaveTextContent(
      COMPLETENESS_PHASE_STEP_TWO_DESCRIPTION.text
    );
  });

  it("renders date picker for State Application Deemed Complete", () => {
    setup();
    const dateInput = screen.getByTestId(STATE_DEEMED_COMPLETE_DATEPICKER_NAME);
    expect(dateInput).toBeInTheDocument();
    expect(dateInput).toHaveAttribute("type", "date");
  });

  it("renders disabled date pickers for Federal Comment Period", () => {
    setup();
    expect(screen.getByTestId(FEDERAL_COMMENT_START_DATEPICKER_NAME)).toBeDisabled();
    expect(screen.getByTestId(FEDERAL_COMMENT_END_DATEPICKER_NAME)).toBeDisabled();
  });

  it("disables Declare Incomplete button when completenessComplete is true", () => {
    setup({ completenessComplete: true });
    expect(screen.getByTestId(COMPLETENESS_DECLARE_INCOMPLETE_BUTTON_NAME)).toBeDisabled();
  });

  it("disables Finish button when finishIsEnabled is false", () => {
    setup({ finishIsEnabled: false });
    expect(screen.getByTestId(COMPLETENESS_FINISH_BUTTON_NAME)).toBeDisabled();
  });

  it("enables Finish button when finishIsEnabled is true", () => {
    setup({ finishIsEnabled: true });
    expect(screen.getByTestId(COMPLETENESS_FINISH_BUTTON_NAME)).toBeEnabled();
  });
});
