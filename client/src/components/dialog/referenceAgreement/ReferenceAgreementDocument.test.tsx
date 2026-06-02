import React from "react";
import { ReferenceAgreement } from "components/table/tables/ReferencesTable";
import { fireEvent, render, screen } from "@testing-library/react";
import { ReferenceAgreementDocument } from "./ReferenceAgreementDocument";
import { useDownloadReference } from "hooks/useDownloadReference";
describe("ReferenceAgreementDocument", () => {
  vi.mock("hooks/useDownloadReference", () => ({
    useDownloadReference: vi.fn(),
  }));

  const mockAgreement: ReferenceAgreement = {
    id: "agreement-456",
    name: "Agreement abc",
    createdAt: "2024-01-01",
  };
  const downloadReferenceAgreement = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDownloadReference).mockReturnValue({
      downloadReferenceAgreement,
      downloadReference: vi.fn(),
    });
  });

  it("renders the agreement document with correct information", () => {
    render(<ReferenceAgreementDocument agreement={mockAgreement} />);

    expect(screen.getByText(mockAgreement.name)).toBeInTheDocument();
    expect(screen.getByText(mockAgreement.createdAt)).toBeInTheDocument();
  });

  it("calls downloadReferenceAgreement when the document is clicked", () => {
    render(<ReferenceAgreementDocument agreement={mockAgreement} />);
    fireEvent.click(screen.getByRole("button"));
    expect(downloadReferenceAgreement).toHaveBeenCalledWith({ id: mockAgreement.id });
  });
});
