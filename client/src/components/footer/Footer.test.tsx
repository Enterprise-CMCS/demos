import React from "react";
import { useLazyQuery } from "@apollo/client";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  CONTACT_US_MAILTO,
  DEMOS_ADDRESS,
  DEMOS_VIDEOS_LINK,
  Footer,
  REFERENCES_PATH,
} from "./Footer";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDownloadReference } from "hooks/useDownloadReference";
import { TestProvider } from "test-utils/TestProvider";
import { developmentMockUser, MockUser } from "mock-data/userMocks";

vi.mock("@apollo/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@apollo/client")>();

  return {
    ...actual,
    useLazyQuery: vi.fn(),
  };
});

vi.mock("hooks/useDownloadReference", async (importOriginal) => {
  const actual = await importOriginal<typeof import("hooks/useDownloadReference")>();
  return {
    ...actual,
    useDownloadReference: vi.fn(),
  };
});

vi.mock("config/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("config/env")>();
  return {
    ...actual,
    isLocalDevelopment: vi.fn(),
  };
});

type UseLazyQueryTuple = ReturnType<typeof useLazyQuery>;

const fetchFaqReferenceMaterial = vi.fn();
const downloadReference = vi.fn();

const cmsUser: MockUser = {
  ...developmentMockUser,
  person: { ...developmentMockUser.person, personType: "demos-cms-user" },
};

const adminUser: MockUser = {
  ...developmentMockUser,
  person: { ...developmentMockUser.person, personType: "demos-admin" },
};

const stateUser: MockUser = {
  ...developmentMockUser,
  person: { ...developmentMockUser.person, personType: "demos-state-user" },
};

const renderWithProviders = (currentUser: MockUser = cmsUser) =>
  render(
    <TestProvider currentUser={currentUser} mocks={[]}>
      <Footer />
    </TestProvider>
  );

describe("Footer Component", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(useLazyQuery).mockReturnValue([
      fetchFaqReferenceMaterial,
      {},
    ] as unknown as UseLazyQueryTuple);
    vi.mocked(useDownloadReference).mockReturnValue({
      downloadReference,
      downloadReferenceAgreement: vi.fn(),
    });
    const { isLocalDevelopment } = await import("config/env");
    vi.mocked(isLocalDevelopment).mockReturnValue(false);
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

  describe("DEMOS Orientation Videos link", () => {
    it("is visible for CMS users", () => {
      renderWithProviders(cmsUser);
      expect(screen.getByRole("link", { name: /DEMOS Orientation Videos/i })).toBeInTheDocument();
    });

    it("is visible for admin users", () => {
      renderWithProviders(adminUser);
      expect(screen.getByRole("link", { name: /DEMOS Orientation Videos/i })).toBeInTheDocument();
    });

    it("is not visible for state users", () => {
      renderWithProviders(stateUser);
      expect(
        screen.queryByRole("link", { name: /DEMOS Orientation Videos/i })
      ).not.toBeInTheDocument();
    });

    it("points to box.com", () => {
      renderWithProviders(cmsUser);
      expect(screen.getByRole("link", { name: /DEMOS Orientation Videos/i })).toHaveAttribute(
        "href",
        DEMOS_VIDEOS_LINK
      );
      expect(DEMOS_VIDEOS_LINK).toContain("box.com");
    });
  });

  it("displays the git commit hash in local development", async () => {
    vi.stubGlobal("__GIT_COMMIT__", "abc1234");
    const { isLocalDevelopment } = await import("config/env");
    vi.mocked(isLocalDevelopment).mockReturnValue(true);

    renderWithProviders();

    expect(screen.getByText(/commit: abc1234/i)).toBeInTheDocument();
  });

  it("hides the git commit hash outside of local development", async () => {
    vi.stubGlobal("__GIT_COMMIT__", "abc1234");
    const { isLocalDevelopment } = await import("config/env");
    vi.mocked(isLocalDevelopment).mockReturnValue(false);

    renderWithProviders();

    expect(screen.queryByText(/commit:/i)).not.toBeInTheDocument();
  });
});
