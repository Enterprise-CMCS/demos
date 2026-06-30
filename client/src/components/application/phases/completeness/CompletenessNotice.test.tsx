import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TestProvider } from "test-utils/TestProvider";
import { CompletenessNotice } from "./CompletenessNotice";
import { TZDate } from "@date-fns/tz";
import { EST_TIMEZONE } from "util/formatDate";

describe("CompletenessNotice", () => {
  it("renders the banner with correct content and dismisses on click", async () => {
    const today = new TZDate("2026-02-08T00:00:00Z", EST_TIMEZONE);
    vi.setSystemTime(today);

    render(
      <TestProvider>
        <CompletenessNotice completenessReviewDate="2026-02-10" completenessComplete={false} />
      </TestProvider>
    );

    const title = screen.getByText("2 days left");
    const description = screen.getByText(/This Demonstration must be declared complete by/);
    expect(title).toBeInTheDocument();
    expect(description).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /dismiss/i }));

    expect(title).not.toBeInTheDocument();
  });

  it("does not render the banner if completenessReviewDate is missing", () => {
    render(
      <TestProvider>
        <CompletenessNotice completenessReviewDate={undefined} completenessComplete={false} />
      </TestProvider>
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("does not render the banner if phase is complete", () => {
    render(
      <TestProvider>
        <CompletenessNotice completenessReviewDate="2026-02-10" completenessComplete={true} />
      </TestProvider>
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
