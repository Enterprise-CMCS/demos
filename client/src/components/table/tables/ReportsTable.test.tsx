import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ReportsTable, AVAILABLE_REPORT_TYPES } from "components/table/tables/ReportsTable";

describe("ReportsTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = () => render(<ReportsTable />);

  it("renders the table", async () => {
    setup();

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
  });

  it("renders all report types", async () => {
    setup();

    for (const type of AVAILABLE_REPORT_TYPES) {
      expect(await screen.findByText(type)).toBeInTheDocument();
    }
  });

  it("renders a download button for each report type", async () => {
    setup();

    for (const type of AVAILABLE_REPORT_TYPES) {
      expect(
        await screen.findByRole("button", { name: `Download ${type}` })
      ).toBeInTheDocument();
    }
  });

  it("calls console.info with correct message when clicking download", async () => {
    const user = userEvent.setup();
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});

    setup();

    const targetType = AVAILABLE_REPORT_TYPES[0];

    const button = await screen.findByRole("button", {
      name: `Download ${targetType}`,
    });

    await user.click(button);

    expect(spy).toHaveBeenCalledWith(
      `Download action for report with id: ${targetType}`
    );
  });

  it("renders exactly one download button per row", async () => {
    setup();

    const buttons = await screen.findAllByRole("button", {
      name: /Download/i,
    });

    expect(buttons).toHaveLength(AVAILABLE_REPORT_TYPES.length);
  });
});
