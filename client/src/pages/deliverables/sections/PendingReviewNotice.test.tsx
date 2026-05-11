import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import {
  DELIVERABLE_REVIEW_NOTICE_NAME,
  PendingReviewNotice,
  START_REVIEW_BUTTON_NAME,
} from "./PendingReviewNotice";

describe("PendingReviewNotice", () => {
  it("renders the title and submitter-specific message", () => {
    render(<PendingReviewNotice submitterName="Jane Doe" onStartReview={vi.fn()} />);

    expect(screen.getByTestId(DELIVERABLE_REVIEW_NOTICE_NAME)).toBeInTheDocument();
    expect(screen.getByText("Submission pending review")).toBeInTheDocument();
    expect(
      screen.getByText("Jane Doe has submitted deliverable(s) for review")
    ).toBeInTheDocument();
  });

  it("invokes onStartReview when the button is clicked", async () => {
    const user = userEvent.setup();
    const onStartReview = vi.fn();
    render(<PendingReviewNotice submitterName="Jane Doe" onStartReview={onStartReview} />);

    await user.click(screen.getByTestId(START_REVIEW_BUTTON_NAME));

    expect(onStartReview).toHaveBeenCalledTimes(1);
  });

  it("disables the Start Review button when isSubmitting is true", () => {
    render(
      <PendingReviewNotice submitterName="Jane Doe" onStartReview={vi.fn()} isSubmitting />
    );

    expect(screen.getByTestId(START_REVIEW_BUTTON_NAME)).toBeDisabled();
  });
});
