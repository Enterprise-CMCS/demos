import React from "react";
import { render, screen } from "@testing-library/react";

import { DemonstrationDetailHeader } from "./DemonstrationDetailHeader";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("pages/DemonstrationDetail/BaseDemonstrationHeader", () => ({
  BaseDemonstrationHeader: ({ demonstrationId }: { demonstrationId: string }) => (
    <div data-testid="mock-base-demonstration-header">Mock Header of demo: {demonstrationId}</div>
  ),
}));

const renderWithRouter = (demonstrationId: string = "test-demo-id") => {
  return render(
    <MemoryRouter initialEntries={[`/demonstrations/${demonstrationId}`]}>
      <Routes>
        <Route path="/demonstrations/:demonstrationId" element={<DemonstrationDetailHeader />} />
      </Routes>
    </MemoryRouter>
  );
};

describe("DeliverableDetailHeader", () => {
  it("renders the BaseDemonstrationHeader with the demonstration id from params", async () => {
    renderWithRouter();
    const header = await screen.findByTestId("mock-base-demonstration-header");
    expect(header).toBeInTheDocument();
    expect(header).toHaveTextContent("Mock Header of demo: test-demo-id");
  });
});
