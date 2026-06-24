import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { SelectDemonstration, SELECT_DEMONSTRATION_QUERY } from "./SelectDemonstration";
import userEvent from "@testing-library/user-event";
import { Option } from "./Select";

// Mock the AutoCompleteSelect component
vi.mock("./AutoCompleteSelect", () => ({
  AutoCompleteSelect: vi.fn(
    ({ label, options, onSelect, placeholder, isRequired, isDisabled, value }) => {
      return (
        <div data-testid="auto-complete-select">
          <label>{label}</label>
          {isRequired && <span>*</span>}
          <select
            data-testid="select-demonstration"
            onChange={(e) => onSelect(e.target.value)}
            disabled={isDisabled}
            value={value}
          >
            <option value="">{placeholder}</option>
            {options.map((opt: Option) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    }
  ),
}));

describe("SelectDemonstration", () => {
  const mockOnSelect = vi.fn();

  const mockDemonstrations = [
    { id: "demo-1", name: "Demo One", status: "Approved" },
    { id: "demo-2", name: "Demo Two", status: "Pre-Submission" },
    { id: "demo-3", name: "Demo Three", status: "Approved" },
  ];

  const successMock = [
    {
      request: {
        query: SELECT_DEMONSTRATION_QUERY,
      },
      result: {
        data: {
          demonstrations: mockDemonstrations,
        },
      },
    },
  ];

  const errorMock = [
    {
      request: {
        query: SELECT_DEMONSTRATION_QUERY,
      },
      error: new Error("Network error"),
    },
  ];

  const emptyMock = [
    {
      request: {
        query: SELECT_DEMONSTRATION_QUERY,
      },
      result: {
        data: {
          demonstrations: [],
        },
      },
    },
  ];

  const noApprovedMock = [
    {
      request: {
        query: SELECT_DEMONSTRATION_QUERY,
      },
      result: {
        data: {
          demonstrations: [
            { id: "demo-1", name: "Demo One", status: "Pre-Submission" },
            { id: "demo-2", name: "Demo Two", status: "Under Review" },
          ],
        },
      },
    },
  ];

  it("shows loading state initially", () => {
    render(
      <MockedProvider mocks={successMock}>
        <SelectDemonstration value="" onSelect={mockOnSelect} />
      </MockedProvider>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders AutoCompleteSelect with demonstrations after loading", async () => {
    render(
      <MockedProvider mocks={successMock}>
        <SelectDemonstration value="" onSelect={mockOnSelect} />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByTestId("auto-complete-select")).toBeInTheDocument();
    expect(screen.getByText("Demonstration")).toBeInTheDocument();
  });

  it("passes approved demonstrations to AutoCompleteSelect", async () => {
    render(
      <MockedProvider mocks={successMock}>
        <SelectDemonstration value="" onSelect={mockOnSelect} />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Demo One")).toBeInTheDocument();
    expect(screen.getByText("Demo Three")).toBeInTheDocument();
    expect(screen.queryByText("Demo Two")).not.toBeInTheDocument();
  });

  it("calls onSelect when a demonstration is selected", async () => {
    const user = userEvent.setup();

    render(
      <MockedProvider mocks={successMock}>
        <SelectDemonstration value="" onSelect={mockOnSelect} />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    const select = screen.getByTestId("select-demonstration");
    await user.selectOptions(select, "demo-3");

    expect(mockOnSelect).toHaveBeenCalledWith("demo-3");
  });

  it("shows error message when query fails", async () => {
    render(
      <MockedProvider mocks={errorMock}>
        <SelectDemonstration value="" onSelect={mockOnSelect} />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Error retrieving list of demonstrations.")).toBeInTheDocument();
    });
  });

  it("shows no approved demonstrations message when list is empty", async () => {
    render(
      <MockedProvider mocks={emptyMock}>
        <SelectDemonstration value="" onSelect={mockOnSelect} />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("No approved demonstrations found.")).toBeInTheDocument();
    });
  });

  it("shows no approved demonstrations message when no approved demonstrations exist", async () => {
    render(
      <MockedProvider mocks={noApprovedMock} addTypename={false}>
        <SelectDemonstration value="" onSelect={mockOnSelect} />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("No approved demonstrations found.")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("select-demonstration")).not.toBeInTheDocument();
  });

  it("passes isRequired prop to AutoCompleteSelect", async () => {
    render(
      <MockedProvider mocks={successMock}>
        <SelectDemonstration value="" onSelect={mockOnSelect} isRequired />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("passes isDisabled prop to AutoCompleteSelect", async () => {
    render(
      <MockedProvider mocks={successMock}>
        <SelectDemonstration value="" onSelect={mockOnSelect} isDisabled />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    const select = screen.getByTestId("select-demonstration");
    expect(select).toBeDisabled();
  });

  it("passes value prop to AutoCompleteSelect", async () => {
    render(
      <MockedProvider mocks={successMock}>
        <SelectDemonstration onSelect={mockOnSelect} value="demo-3" />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    const select = screen.getByTestId("select-demonstration") as HTMLSelectElement;
    expect(select.value).toBe("demo-3");
  });

  it("renders with correct placeholder text", async () => {
    render(
      <MockedProvider mocks={successMock}>
        <SelectDemonstration value="" onSelect={mockOnSelect} />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Select demonstration…")).toBeInTheDocument();
  });
});
