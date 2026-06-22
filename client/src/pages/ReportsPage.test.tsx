import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { ReportsPage } from "./ReportsPage";

const mockShowError = vi.fn();

vi.mock("@apollo/client/react/hooks/useMutation", () => ({
  useMutation: vi.fn(() => [vi.fn(), {}]),
}));

vi.mock("components/toast", () => ({
  useToast: () => ({
    showError: mockShowError,
  }),
}));

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
