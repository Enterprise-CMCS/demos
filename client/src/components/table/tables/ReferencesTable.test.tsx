import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { GET_REFERENCES_QUERY, ReferencesTable } from "./ReferencesTable";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import { DialogProvider } from "components/dialog/DialogContext";
import { ToastProvider } from "components/toast";
import { useDownloadReference } from "hooks/useDownloadReference";

const getReferencesQueryMock: MockedResponse[] = [
  {
    request: {
      query: GET_REFERENCES_QUERY,
    },
    result: {
      data: {
        references: [
          {
            id: "ref1",
            name: "Reference Document 1",
            description: "Description for Reference Document 1",
            agreement: {
              id: "agreement1",
              name: "Reference Agreement 1",
              createdAt: "2024-01-01",
            },
            demonstrationTypes: ["Type A", "Type B"],
            updatedAt: "2024-01-01",
          },
          {
            id: "ref2",
            name: "Reference Document 2",
            description: "Description for Reference Document 2",
            agreement: null,
            demonstrationTypes: ["Type C"],
            updatedAt: "2024-01-04",
          },
        ],
      },
    },
  },
];

vi.mock("hooks/useDownloadReference", () => ({
  useDownloadReference: vi.fn(),
}));

describe("ReferencesTable", () => {
  const renderWithProviders = (mocks: MockedResponse[]) => {
    return render(
      <MockedProvider mocks={mocks}>
        <DialogProvider>
          <ToastProvider>
            <ReferencesTable />
          </ToastProvider>
        </DialogProvider>
      </MockedProvider>
    );
  };

  const downloadReference = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDownloadReference).mockReturnValue({
      downloadReference,
      downloadReferenceAgreement: vi.fn(),
    });
  });

  it("renders the table with correct columns", async () => {
    renderWithProviders(getReferencesQueryMock);

    await waitFor(() => {
      expect(screen.getByRole("columnheader", { name: /File Name/ })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: /Demo Type/ })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: /Description/ })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: /Last Updated/ })).toBeInTheDocument();
    });
  });

  it("renders the appropriate data in the table rows", async () => {
    renderWithProviders(getReferencesQueryMock);

    await waitFor(() => {
      expect(screen.getByText("Reference Document 1")).toBeInTheDocument();
      expect(screen.getByText("Description for Reference Document 1")).toBeInTheDocument();
      expect(screen.getByText("Type A, Type B")).toBeInTheDocument();
      expect(screen.getByText("2024-01-01")).toBeInTheDocument();
      expect(screen.getByText("Reference Document 2")).toBeInTheDocument();
      expect(screen.getByText("Description for Reference Document 2")).toBeInTheDocument();
      expect(screen.getByText("Type C")).toBeInTheDocument();
      expect(screen.getByText("2024-01-04")).toBeInTheDocument();
    });
  });

  it("renders a download button for each reference", async () => {
    renderWithProviders(getReferencesQueryMock);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Open ref1 agreement" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Download ref2" })).toBeInTheDocument();
    });
  });

  it("calls downloadReferece when the download button is clicked for a reference without an agreement", async () => {
    renderWithProviders(getReferencesQueryMock);

    await waitFor(() => {
      screen.getByRole("button", { name: "Download ref2" }).click();
      expect(downloadReference).toHaveBeenCalledWith(expect.objectContaining({ id: "ref2" }));
    });
  });

  it("renders an agreement dialog when the download button is clicked for a reference with an agreement", async () => {
    renderWithProviders(getReferencesQueryMock);

    await waitFor(() => {
      screen.getByRole("button", { name: "Open ref1 agreement" }).click();
      expect(screen.getByText("Point and Click Agreement")).toBeInTheDocument();
    });
  });

  it("renders an error message when the query fails", async () => {
    const errorMock: MockedResponse = {
      request: {
        query: GET_REFERENCES_QUERY,
      },
      error: new Error("Failed to fetch references"),
    };

    renderWithProviders([errorMock]);

    expect(await screen.findByText(/Error loading references/)).toBeInTheDocument();
  });

  it("renders a loading message while fetching data", async () => {
    renderWithProviders([]);

    await waitFor(() => {
      expect(screen.getByText(/Loading references/)).toBeInTheDocument();
    });
  });

  it("renders with a keyword search component", async () => {
    renderWithProviders(getReferencesQueryMock);

    expect(await screen.findByPlaceholderText("Search")).toBeInTheDocument();
  });

  it("renders with pagination controls", async () => {
    renderWithProviders(getReferencesQueryMock);

    await waitFor(() => {
      expect(screen.getByText(/Items per page/)).toBeInTheDocument();
    });
  });
});
