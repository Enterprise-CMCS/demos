import React from "react";
import { LocalDate } from "demos-server";

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EditDemonstrationDialog } from "./EditDemonstrationDialog";
import { getUpdateDemonstrationInput } from "./EditDemonstrationForm";

const useEditDemonstrationDialogDataMock = vi.fn();
const editDemonstrationDialogContentMock = vi.fn();

vi.mock("components/loading/Spinner", () => ({
  Spinner: () => <div data-testid="edit-demonstration-spinner" aria-label="Loading" />,
}));

vi.mock("./useEditDemonstrationDialogData", async () => {
  const actual = await vi.importActual<typeof import("./useEditDemonstrationDialogData")>(
    "./useEditDemonstrationDialogData"
  );

  return {
    ...actual,
    useEditDemonstrationDialogData: (demonstrationId: string) =>
      useEditDemonstrationDialogDataMock(demonstrationId),
  };
});

vi.mock("./EditDemonstrationDialogContent", () => ({
  EditDemonstrationDialogContent: (props: {
    demonstrationId: string;
    initialDemonstration: {
      name: string;
      description: string;
      stateId: string;
      sdgDivision?: string;
      signatureLevel?: string;
      projectOfficerUserId: string;
      effectiveDate?: string;
      expirationDate?: string;
    };
    isApproved: boolean;
  }) => {
    editDemonstrationDialogContentMock(props);
    return <div data-testid="edit-demonstration-dialog-content" />;
  },
}));

describe("EditDemonstrationDialog", () => {
  const TEST_DEMO_ID = "1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a spinner while loading demonstration data", () => {
    useEditDemonstrationDialogDataMock.mockReturnValue({
      loading: true,
      error: undefined,
      demonstration: undefined,
    });

    render(<EditDemonstrationDialog demonstrationId={TEST_DEMO_ID} />);

    expect(screen.getByTestId("edit-demonstration-spinner")).toBeInTheDocument();
  });

  it("shows an error state when the query returns an error", () => {
    useEditDemonstrationDialogDataMock.mockReturnValue({
      loading: false,
      error: new Error("Failed to fetch demonstration"),
      demonstration: undefined,
    });

    render(<EditDemonstrationDialog demonstrationId={TEST_DEMO_ID} />);

    expect(screen.getByText("Error loading demonstration data")).toBeInTheDocument();
  });

  it("shows an error state when no demonstration is returned", () => {
    useEditDemonstrationDialogDataMock.mockReturnValue({
      loading: false,
      error: undefined,
      demonstration: undefined,
    });

    render(<EditDemonstrationDialog demonstrationId={TEST_DEMO_ID} />);

    expect(screen.getByText("Error loading demonstration data")).toBeInTheDocument();
  });

  it("renders the content component", () => {
    useEditDemonstrationDialogDataMock.mockReturnValue({
      loading: false,
      error: undefined,
      demonstration: {
        id: TEST_DEMO_ID,
        name: "Test Demonstration",
        description: "Test demonstration description",
        sdgDivision: "Division of System Reform Demonstrations",
        signatureLevel: "OA",
        status: "Approved",
        state: {
          id: "AL",
        },
        primaryProjectOfficer: {
          id: "test-officer-id",
        },
        effectiveDate: "2024-06-01T12:00:00.000Z",
        expirationDate: "2025-06-01T12:00:00.000Z",
      },
    });

    render(<EditDemonstrationDialog demonstrationId={TEST_DEMO_ID} />);

    expect(screen.getByTestId("edit-demonstration-dialog-content")).toBeInTheDocument();
  });

  it("passes mapped demonstration data to the content component", () => {
    useEditDemonstrationDialogDataMock.mockReturnValue({
      loading: false,
      error: undefined,
      demonstration: {
        id: TEST_DEMO_ID,
        name: "Test Demonstration",
        description: "Test demonstration description",
        sdgDivision: "Division of System Reform Demonstrations",
        signatureLevel: "OA",
        status: "Approved",
        state: {
          id: "AL",
        },
        primaryProjectOfficer: {
          id: "test-officer-id",
        },
        effectiveDate: "2024-06-01T12:00:00.000Z",
        expirationDate: "2025-06-01T12:00:00.000Z",
      },
    });

    render(<EditDemonstrationDialog demonstrationId={TEST_DEMO_ID} />);

    expect(useEditDemonstrationDialogDataMock).toHaveBeenCalledWith(TEST_DEMO_ID);
    expect(editDemonstrationDialogContentMock).toHaveBeenCalledWith({
      demonstrationId: TEST_DEMO_ID,
      initialDemonstration: {
        name: "Test Demonstration",
        description: "Test demonstration description",
        stateId: "AL",
        sdgDivision: "Division of System Reform Demonstrations",
        signatureLevel: "OA",
        projectOfficerUserId: "test-officer-id",
        effectiveDate: "2024-06-01",
        expirationDate: "2025-06-01",
      },
      isApproved: true,
    });
  });
});

describe("getUpdateDemonstrationInput", () => {
  const asLocalDate = (value: string) => value as LocalDate;

  const BASE_DEMONSTRATION = {
    name: "My Demo",
    description: "A description",
    stateId: "AL",
    projectOfficerUserId: "officer-1",
    effectiveDate: undefined,
    expirationDate: undefined,
  };

  it("maps name, stateId, and projectOfficerId as-is", () => {
    const result = getUpdateDemonstrationInput(BASE_DEMONSTRATION);
    expect(result.name).toBe("My Demo");
    expect(result.projectOfficerUserId).toBe("officer-1");
  });

  it("passes through effectiveDate and expirationDate as-is", () => {
    const result = getUpdateDemonstrationInput({
      ...BASE_DEMONSTRATION,
      effectiveDate: asLocalDate("2024-06-01"),
      expirationDate: asLocalDate("2025-06-01"),
    });
    expect(result.effectiveDate).toBe("2024-06-01");
    expect(result.expirationDate).toBe("2025-06-01");
  });

  it("passes null for effectiveDate and expirationDate when empty", () => {
    const result = getUpdateDemonstrationInput({
      ...BASE_DEMONSTRATION,
      effectiveDate: undefined,
      expirationDate: undefined,
    });
    expect(result.effectiveDate).toBeNull();
    expect(result.expirationDate).toBeNull();
  });

  it("passes null for sdgDivision when not provided", () => {
    const result = getUpdateDemonstrationInput(BASE_DEMONSTRATION);
    expect(result.sdgDivision).toBeNull();
  });

  it("trims whitespace from description", () => {
    const result = getUpdateDemonstrationInput({
      ...BASE_DEMONSTRATION,
      description: "  trimmed  ",
    });
    expect(result.description).toBe("trimmed");
  });

  it("sets description to empty string when blank", () => {
    const result = getUpdateDemonstrationInput({ ...BASE_DEMONSTRATION, description: "   " });
    expect(result.description).toBe("");
  });
});
