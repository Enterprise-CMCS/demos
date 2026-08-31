import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import {
  RENEWAL_REQUESTED_NOTICE_NAME,
  RenewalRequestedNotice,
  REVIEW_RENEWAL_REQUEST_BUTTON_NAME,
} from "./RenewalRequestedNotice";

describe("RenewalRequestedNotice", () => {
  it("renders the title and requester message", () => {
    render(<RenewalRequestedNotice requesterName="Florida State User" onReviewRequest={vi.fn()} />);

    expect(screen.getByTestId(RENEWAL_REQUESTED_NOTICE_NAME)).toBeInTheDocument();
    expect(screen.getByText("Renewal Requested")).toBeInTheDocument();
    expect(
      screen.getByText("Florida State User has requested a renewal on this deliverable.")
    ).toBeInTheDocument();
  });

  it("invokes onReviewRequest when the button is clicked", async () => {
    const user = userEvent.setup();
    const onReviewRequest = vi.fn();
    render(
      <RenewalRequestedNotice
        requesterName="Florida State User"
        onReviewRequest={onReviewRequest}
      />
    );

    await user.click(screen.getByTestId(REVIEW_RENEWAL_REQUEST_BUTTON_NAME));

    expect(onReviewRequest).toHaveBeenCalledTimes(1);
  });
});
