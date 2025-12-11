import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import { DemonstrationsPage } from "./DemonstrationsPage";

const mockUseQuery = vi.fn();

vi.mock("@apollo/client", () => ({
  gql: (literals: TemplateStringsArray, ...placeholders: string[]) =>
    literals.reduce((acc, curr, idx) => acc + curr + (placeholders[idx] || ""), ""),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

const baseData = {
  demonstrations: [
    {
      id: "demo-1",
      name: "Demo One",
      status: "Active",
      state: { id: "CA", name: "California" },
      primaryProjectOfficer: { id: "user-1", fullName: "User One" },
      amendments: [],
      extensions: [],
    },
    {
      id: "demo-2",
      name: "Demo Two",
      status: "Active",
      state: { id: "TX", name: "Texas" },
      primaryProjectOfficer: { id: "user-2", fullName: "User Two" },
      amendments: [],
      extensions: [],
    },
  ],
  people: [{ fullName: "User One" }],
  currentUser: { id: "user-1" },
};

describe("DemonstrationsPage tab persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockUseQuery.mockReturnValue({ data: baseData, loading: false, error: undefined });
  });

  it("defaults to My Demonstrations when no tab is stored", () => {
    render(<DemonstrationsPage />);

    expect(screen.getByTestId("button-my-demonstrations")).toHaveAttribute("aria-selected", "true");
    expect(sessionStorage.getItem("selectedDemonstrationTab")).toBe("my-demonstrations");
  });

  it("uses the stored tab selection", () => {
    sessionStorage.setItem("selectedDemonstrationTab", "demonstrations");

    render(<DemonstrationsPage />);

    expect(screen.getByTestId("button-demonstrations")).toHaveAttribute("aria-selected", "true");
  });

  it("stores tab changes to sessionStorage", () => {
    render(<DemonstrationsPage />);

    fireEvent.click(screen.getByTestId("button-demonstrations"));

    expect(sessionStorage.getItem("selectedDemonstrationTab")).toBe("demonstrations");
  });
});
