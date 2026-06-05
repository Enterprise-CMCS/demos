import React from "react";
import { useLazyQuery } from "@apollo/client";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CONTACT_US_MAILTO, DEMOS_ADDRESS, Footer, REFERENCES_PATH } from "./Footer";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDownloadReference } from "hooks/useDownloadReference";
import { MockedProvider } from "@apollo/client/testing";
import { ToastProvider } from "components/toast";

vi.mock("@apollo/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@apollo/client")>();

  return {
    ...actual,
    useLazyQuery: vi.fn(),
  };
});

vi.mock("hooks/useDownloadReference", () => ({
  useDownloadReference: vi.fn(),
}));

type UseLazyQueryTuple = ReturnType<typeof useLazyQuery>;

const fetchFaqReferenceMaterial = vi.fn();
const downloadReference = vi.fn();

const renderWithProviders = () =>
  render(
    <MockedProvider mocks={[]}>
      <ToastProvider>
        <Footer />
      </ToastProvider>
    </MockedProvider>
  );

describe("Footer Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useLazyQuery).mockReturnValue([
      fetchFaqReferenceMaterial,
      {},
    ] as unknown as UseLazyQueryTuple);
    vi.mocked(useDownloadReference).mockReturnValue({
      downloadReference,
      downloadReferenceAgreement: vi.fn(),
    });
  });

  it("renders without crashing", () => {
    const { container } = renderWithProviders();
    expect(container).toBeInTheDocument();
  });

  it("displays the hhs logo", () => {
    renderWithProviders();
    expect(screen.getByTestId("hhs-logo")).toBeInTheDocument();
  });

  it("displays the footer links", () => {
    renderWithProviders();
    expect(screen.getByText(/References/i)).toBeInTheDocument();
    expect(screen.getByText(/Contact Us/i)).toBeInTheDocument();
    expect(screen.getByText(/FAQ/i)).toBeInTheDocument();
  });

  it("links References to the /references page", () => {
    renderWithProviders();

    expect(screen.getByRole("link", { name: /References/i })).toHaveAttribute(
      "href",
      REFERENCES_PATH
    );
  });

  it("links Contact Us to the DEMOS support email", () => {
    renderWithProviders();

    expect(screen.getByRole("link", { name: /Contact Us/i })).toHaveAttribute(
      "href",
      CONTACT_US_MAILTO
    );
  });

  it("downloads the latest FAQ reference when FAQ is clicked", async () => {
    fetchFaqReferenceMaterial.mockResolvedValue({
      data: {
        references: [
          { id: "faq-older", createdAt: new Date("2024-01-01T00:00:00.000Z") },
          { id: "faq-latest", createdAt: new Date("2025-01-01T00:00:00.000Z") },
        ],
      },
    });

    renderWithProviders();

    fireEvent.click(screen.getByRole("button", { name: /FAQ/i }));

    await waitFor(() => expect(fetchFaqReferenceMaterial).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(downloadReference).toHaveBeenCalledWith({
        id: "faq-latest",
        acceptedAgreementId: null,
      })
    );
  });

  it("displays the main logo", () => {
    renderWithProviders();
    expect(screen.getByTestId("demos-logo-simplified")).toBeInTheDocument();
  });

  it("links the DEMOS logo to the root page", () => {
    renderWithProviders();

    expect(screen.getByTestId("demos-logo-simplified").closest("a")).toHaveAttribute("href", "/");
  });

  it("displays the address", () => {
    renderWithProviders();
    expect(screen.getByText(DEMOS_ADDRESS)).toBeInTheDocument();
  });
});
