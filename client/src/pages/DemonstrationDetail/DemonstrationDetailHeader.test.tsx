import React from "react";
import { render, screen } from "@testing-library/react";

import { DemonstrationDetailHeader } from "./DemonstrationDetailHeader";
import { useParams } from "react-router-dom";

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useParams: vi.fn(),
  };
});

vi.mock("pages/DemonstrationDetail/BaseDemonstrationHeader", () => ({
  BaseDemonstrationHeader: ({ demonstrationId }: { demonstrationId: string }) => (
    <div data-testid="mock-base-demonstration-header">Mock Header of demo: {demonstrationId}</div>
  ),
}));

describe("DemonstrationDetailHeader", () => {
  beforeEach(() => {
    vi.mocked(useParams).mockReturnValue({ demonstrationId: "test-demo-id" });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the BaseDemonstrationHeader with the demonstration id from params", async () => {
    render(<DemonstrationDetailHeader />);
    const header = await screen.findByTestId("mock-base-demonstration-header");
    expect(header).toBeInTheDocument();
    expect(header).toHaveTextContent("Mock Header of demo: test-demo-id");
  });

  it("throws an error when demonstrationId param is missing", () => {
    vi.mocked(useParams).mockReturnValue({});

    expect(() => {
      render(<DemonstrationDetailHeader />);
    }).toThrow(
      "DemonstrationDetailHeader must be rendered within a route with :demonstrationId param"
    );
  });
});
