import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { ReportsPage } from "./ReportsPage";

describe("ReportsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = () => render(<ReportsPage />);

  it("renders the page with title", () => {
    setup();

    expect(screen.getByText("Reports")).toBeInTheDocument();
  });

  it("renders the reports table", async () => {
    setup();

    expect(await screen.findByRole("table")).toBeInTheDocument();
  });
});
