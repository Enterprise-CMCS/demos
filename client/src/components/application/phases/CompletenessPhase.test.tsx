import React from "react";

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as env from "config/env";
import { CompletenessPhase } from "./CompletenessPhase";
import { TestProvider } from "test-utils/TestProvider";

const renderWithContext = (ui: React.ReactNode) => {
  return render(<TestProvider>{ui}</TestProvider>);
};

beforeEach(() => {
  vi.spyOn(env, "isLocalDevelopment").mockReturnValue(true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CompletenessPhase", () => {
  it("disables Finish until requirements are met", () => {
    renderWithContext(<CompletenessPhase />);

    const finishButton = screen.getByRole("button", { name: /finish/i });
    expect(finishButton).toBeDisabled();
  });

  it("opens the declare incomplete dialog when requested", () => {
    renderWithContext(<CompletenessPhase />);

    fireEvent.click(screen.getByTestId("declare-incomplete"));

    expect(screen.getByRole("dialog")).toHaveTextContent("Declare Incomplete");
  });
});
