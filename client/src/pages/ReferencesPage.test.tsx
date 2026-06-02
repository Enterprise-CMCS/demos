import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { ReferencesPage } from "./ReferencesPage";

describe("ReferencesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = () => render(<ReferencesPage />);

  it("renders the page with title", () => {
    setup();

    expect(screen.getByText("References")).toBeInTheDocument();
  });

  it("renders the references table", async () => {
    setup();

    expect(await screen.findByRole("table")).toBeInTheDocument();
  });
});
