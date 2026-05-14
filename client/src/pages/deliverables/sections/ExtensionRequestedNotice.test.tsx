import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import {
  EXTENSION_REQUESTED_NOTICE_NAME,
  ExtensionRequestedNotice,
  REVIEW_EXTENSION_REQUEST_BUTTON_NAME,
} from "./ExtensionRequestedNotice";

describe("ExtensionRequestedNotice", () => {
  it("renders the title and requester message", () => {
    render(
      <ExtensionRequestedNotice requesterName="Florida State User" onReviewRequest={vi.fn()} />
    );

    expect(screen.getByTestId(EXTENSION_REQUESTED_NOTICE_NAME)).toBeInTheDocument();
    expect(screen.getByText("Extension Requested")).toBeInTheDocument();
    expect(
      screen.getByText("Florida State User has requested an extension on this deliverable.")
    ).toBeInTheDocument();
  });

  it("invokes onReviewRequest when the button is clicked", async () => {
    const user = userEvent.setup();
    const onReviewRequest = vi.fn();
    render(
      <ExtensionRequestedNotice requesterName="Florida State User" onReviewRequest={onReviewRequest} />
    );

    await user.click(screen.getByTestId(REVIEW_EXTENSION_REQUEST_BUTTON_NAME));

    expect(onReviewRequest).toHaveBeenCalledTimes(1);
  });
});
