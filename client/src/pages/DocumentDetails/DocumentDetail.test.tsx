import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import {
  DocumentDetail,
  DocumentDetailPage,
  ApplicationLink,
  DOCUMENT_DETAIL_QUERY,
} from "./DocumentDetail";

// Mock DocumentPreview component
vi.mock("./DocumentPreview", () => ({
  DocumentPreview: ({ filename }: { filename: string; presignedDownloadUrl: string }) => (
    <div data-testid="document-preview">Preview: {filename}</div>
  ),
}));

const mockDocument = {
  id: "doc-123",
  name: "test-document.pdf",
  createdAt: "2026-02-10T10:00:00Z",
  presignedDownloadUrl: "https://example.com/presigned-url",
  application: {
    __typename: "Demonstration" as const,
    id: "demo-123",
    name: "Test Demonstration",
  },
  owner: {
    id: "user-123",
    person: {
      id: "person-123",
      fullName: "John Doe",
    },
  },
};

const DocumentDetailMock = {
  request: {
    query: DOCUMENT_DETAIL_QUERY,
    variables: { id: "doc-123" },
  },
  result: {
    data: {
      document: mockDocument,
    },
  },
};

const DocumentDetailErrorMock = {
  request: {
    query: DOCUMENT_DETAIL_QUERY,
    variables: { id: "doc-error" },
  },
  error: new Error("Network error occurred"),
};

const DocumentDetailNotFoundMock = {
  request: {
    query: DOCUMENT_DETAIL_QUERY,
    variables: { id: "doc-notfound" },
  },
  result: {
    data: {
      document: null,
    },
  },
};

describe("ApplicationLink", () => {
  it("renders link for Demonstration", () => {
    const application = {
      __typename: "Demonstration" as const,
      id: "demo-123",
      name: "Test Demo",
    };

    render(<ApplicationLink application={application} />);

    const link = screen.getByRole("link");
    expect(link).toHaveTextContent("Test Demo");
    expect(link).toHaveAttribute("href", "/demonstrations/demo-123");
  });

  it("renders link for Amendment with demonstration context", () => {
    const application = {
      __typename: "Amendment" as const,
      id: "amend-123",
      name: "Amendment A",
      demonstration: {
        id: "demo-456",
        name: "Parent Demo",
        __typename: "Demonstration" as const,
      },
    };

    render(<ApplicationLink application={application} />);

    const link = screen.getByRole("link");
    expect(link).toHaveTextContent("Parent Demo - Amendment: Amendment A");
    expect(link).toHaveAttribute("href", "/demonstrations/demo-456?amendment=amend-123");
  });

  it("renders link for Extension with demonstration context", () => {
    const application = {
      __typename: "Extension" as const,
      id: "ext-123",
      name: "Extension X",
      demonstration: {
        id: "demo-789",
        name: "Main Demo",
        __typename: "Demonstration" as const,
      },
    };

    render(<ApplicationLink application={application} />);

    const link = screen.getByRole("link");
    expect(link).toHaveTextContent("Main Demo - Extension: Extension X");
    expect(link).toHaveAttribute("href", "/demonstrations/demo-789?extension=ext-123");
  });
});

describe("DocumentDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderDocumentDetail = (documentId: string, mocks: MockedResponse[] = []) => {
    return render(
      <MockedProvider mocks={mocks}>
        <DocumentDetail documentId={documentId} />
      </MockedProvider>
    );
  };

  it("displays loading state", async () => {
    renderDocumentDetail("doc-123");

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("displays error state", async () => {
    renderDocumentDetail("doc-error", [DocumentDetailErrorMock]);

    await waitFor(() => {
      expect(screen.getByText("Error: Network error occurred")).toBeInTheDocument();
    });
  });

  it("displays document not found when document is null", async () => {
    renderDocumentDetail("doc-notfound", [DocumentDetailNotFoundMock]);

    await waitFor(() => {
      expect(screen.getByText("Document not found.")).toBeInTheDocument();
    });
  });

  it("renders document details successfully", async () => {
    renderDocumentDetail("doc-123", [DocumentDetailMock]);

    await waitFor(() => {
      expect(screen.getByText("test-document.pdf")).toBeInTheDocument();
    });

    expect(screen.getByText("Test Demonstration")).toBeInTheDocument();
    expect(screen.getByText(/Uploader:/)).toBeInTheDocument();
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    expect(screen.getByText(/Uploaded on:/)).toBeInTheDocument();
    expect(screen.getByText(/02\/10\/2026/)).toBeInTheDocument();
    expect(screen.getByTestId("document-preview")).toBeInTheDocument();
  });

  it("passes correct props to DocumentPreview", async () => {
    renderDocumentDetail("doc-123", [DocumentDetailMock]);

    await waitFor(() => {
      const preview = screen.getByTestId("document-preview");
      expect(preview).toHaveTextContent("Preview: test-document.pdf");
    });
  });

  it("renders ApplicationLink with correct application data", async () => {
    renderDocumentDetail("doc-123", [DocumentDetailMock]);

    await waitFor(() => {
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/demonstrations/demo-123");
      expect(link).toHaveTextContent("Test Demonstration");
    });
  });
});

describe("DocumentDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (initialEntry = "/document/doc-123") => {
    return render(
      <MockedProvider mocks={[DocumentDetailMock]}>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/document/:id" element={<DocumentDetailPage />} />
          </Routes>
        </MemoryRouter>
      </MockedProvider>
    );
  };

  it("displays error when no document ID in params", () => {
    render(
      <MockedProvider mocks={[]}>
        <MemoryRouter initialEntries={["/document/"]}>
          <Routes>
            <Route path="/document/" element={<DocumentDetailPage />} />
          </Routes>
        </MemoryRouter>
      </MockedProvider>
    );

    expect(screen.getByText("Document ID is required.")).toBeInTheDocument();
  });

  it("renders DocumentDetail with ID from params", async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("test-document.pdf")).toBeInTheDocument();
    });
  });

  it("renders with correct layout classes", () => {
    const { container } = renderWithRouter();

    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass("h-screen", "flex", "flex-col");
  });
});
