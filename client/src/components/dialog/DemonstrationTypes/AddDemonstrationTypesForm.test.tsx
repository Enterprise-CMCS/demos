import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AddDemonstrationTypesForm } from "./AddDemonstrationTypesForm";

// Only mock the SelectDemonstrationTypeTag since it depends on external queries
vi.mock("components/input/select/SelectTag/SelectDemonstrationTypeTag", () => ({
  SelectDemonstrationTypeTag: ({
    value,
    onSelect,
    filter,
    isRequired,
  }: {
    value: string;
    onSelect: (value: string) => void;
    filter?: (tag: string) => boolean;
    isRequired?: boolean;
  }) => (
    <div>
      <label htmlFor="demo-type-select">Demonstration Type{isRequired && <span>*</span>}</label>
      <select
        id="demo-type-select"
        value={value}
        onChange={(e) => onSelect(e.target.value)}
        data-testid="select-demonstration-type"
      >
        <option value="">Select...</option>
        {["Type A", "Type B", "Type C"]
          .filter((tag) => !filter || filter(tag))
          .map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
      </select>
    </div>
  ),
}));

describe("AddDemonstrationTypesForm", () => {
  const mockAddDemonstrationType = vi.fn();
  const existingTags: string[] = ["Type A"];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all form fields", () => {
    render(
      <AddDemonstrationTypesForm
        existingTags={existingTags}
        addDemonstrationType={mockAddDemonstrationType}
      />
    );

    expect(screen.getByTestId("select-demonstration-type")).toBeInTheDocument();
    expect(screen.getByLabelText(/effective date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/expiration date/i)).toBeInTheDocument();
    expect(screen.getByTestId("button-add-demonstration-type")).toBeInTheDocument();
  });

  it("has add button disabled initially", () => {
    render(
      <AddDemonstrationTypesForm
        existingTags={existingTags}
        addDemonstrationType={mockAddDemonstrationType}
      />
    );

    expect(screen.getByTestId("button-add-demonstration-type")).toBeDisabled();
  });

  it("filters out existing demonstration types from select options", () => {
    render(
      <AddDemonstrationTypesForm
        existingTags={existingTags}
        addDemonstrationType={mockAddDemonstrationType}
      />
    );

    const select = screen.getByTestId("select-demonstration-type");
    const options = Array.from(select.querySelectorAll("option")).map((opt) => opt.value);

    expect(options).not.toContain("Type A"); // Existing type filtered out
    expect(options).toContain("Type B");
    expect(options).toContain("Type C");
  });

  it("enables add button when all fields are filled", async () => {
    const user = userEvent.setup();
    render(
      <AddDemonstrationTypesForm
        existingTags={existingTags}
        addDemonstrationType={mockAddDemonstrationType}
      />
    );

    const addButton = screen.getByTestId("button-add-demonstration-type");
    expect(addButton).toBeDisabled();

    // Fill all fields
    await user.selectOptions(screen.getByTestId("select-demonstration-type"), "Type B");
    await user.type(screen.getByLabelText(/effective date/i), "2024-01-15");
    await user.type(screen.getByLabelText(/expiration date/i), "2024-12-31");

    expect(addButton).toBeEnabled();
  });

  it("calls addDemonstrationType with form data when submitted", async () => {
    const user = userEvent.setup();
    render(
      <AddDemonstrationTypesForm
        existingTags={existingTags}
        addDemonstrationType={mockAddDemonstrationType}
      />
    );

    // Fill form
    await user.selectOptions(screen.getByTestId("select-demonstration-type"), "Type B");
    await user.type(screen.getByLabelText(/effective date/i), "2024-01-15");
    await user.type(screen.getByLabelText(/expiration date/i), "2024-12-31");

    // Submit
    await user.click(screen.getByTestId("button-add-demonstration-type"));

    expect(mockAddDemonstrationType).toHaveBeenCalledWith({
      tag: "Type B",
      effectiveDate: "2024-01-15",
      expirationDate: "2024-12-31",
    });
    expect(mockAddDemonstrationType).toHaveBeenCalledTimes(1);
  });

  it("resets tag field after submission", async () => {
    const user = userEvent.setup();
    render(
      <AddDemonstrationTypesForm
        existingTags={existingTags}
        addDemonstrationType={mockAddDemonstrationType}
      />
    );

    const select = screen.getByTestId("select-demonstration-type");

    // Fill and submit form
    await user.selectOptions(select, "Type B");
    await user.type(screen.getByLabelText(/effective date/i), "2024-01-15");
    await user.type(screen.getByLabelText(/expiration date/i), "2024-12-31");
    await user.click(screen.getByRole("button", { name: /button-add-demonstration-type/i }));

    // Tag should be reset
    expect(select).toHaveValue("");
  });

  it("disables button after submission until new tag is selected", async () => {
    const user = userEvent.setup();
    render(
      <AddDemonstrationTypesForm
        existingTags={existingTags}
        addDemonstrationType={mockAddDemonstrationType}
      />
    );

    const addButton = screen.getByRole("button", { name: /button-add-demonstration-type/i });

    // Fill and submit form
    await user.selectOptions(screen.getByTestId("select-demonstration-type"), "Type B");
    await user.type(screen.getByLabelText(/effective date/i), "2024-01-15");
    await user.type(screen.getByLabelText(/expiration date/i), "2024-12-31");
    await user.click(addButton);

    // Button should be disabled again (tag was reset)
    expect(addButton).toBeDisabled();
  });
});
