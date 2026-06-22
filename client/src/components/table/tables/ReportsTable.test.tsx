import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useMutation } from "@apollo/client/react/hooks/useMutation";

import { useTriggerDownload } from "hooks/useTriggerDownload";

import { ReportsTable, AVAILABLE_REPORT_TYPES } from "components/table/tables/ReportsTable";

vi.mock("@apollo/client/react/hooks/useMutation");
vi.mock("hooks/useTriggerDownload");

describe("ReportsTable", () => {
  const mockGenerateReport = vi.fn();
  const mockTriggerDownload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useMutation).mockReturnValue([
      mockGenerateReport,
      {} as never,
    ]);

    vi.mocked(useTriggerDownload).mockReturnValue({
      triggerDownload: mockTriggerDownload,
    });

    vi.mock("components/toast", () => ({
      useToast: () => ({
        showError: vi.fn(),
      }),
    }));
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

  it("calls generateOnDemandReport and triggers download", async () => {
    const user = userEvent.setup();

    const mockTriggerDownload = vi.fn();
    const mockGenerateReport = vi.fn().mockResolvedValue({
      data: {
        generateOnDemandReport: "https://example.com/report.xlsx",
      },
    });

    vi.mocked(useTriggerDownload).mockReturnValue({
      triggerDownload: mockTriggerDownload,
    });

    vi.mocked(useMutation).mockReturnValue([
      mockGenerateReport,
      {} as never,
    ]);

    setup();

    const button = await screen.findByRole("button", {
      name: `Download ${AVAILABLE_REPORT_TYPES[0]}`,
    });

    await user.click(button);

    expect(mockGenerateReport).toHaveBeenCalledWith({
      variables: {
        reportType: AVAILABLE_REPORT_TYPES[0],
      },
    });

    expect(mockTriggerDownload).toHaveBeenCalledWith(
      "https://example.com/report.xlsx"
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
