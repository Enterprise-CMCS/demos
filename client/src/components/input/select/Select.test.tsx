import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Select, Option } from "./Select";

const options: Option[] = [
  { label: "Alpha", value: "alpha" },
  { label: "Beta", value: "beta" },
  { label: "Gamma", value: "gamma" },
];

describe("Select", () => {
  it("renders label and options", () => {
    render(
      <Select
        value=""
        options={options}
        label="Test Label"
        placeholder="Choose one"
        onChange={() => {}}
        id="test-select"
      />
    );
    expect(screen.getByLabelText("Test Label")).toBeInTheDocument();
    expect(screen.getByText("Choose one")).toBeInTheDocument();
    options.forEach((opt) => {
      expect(screen.getByText(opt.label)).toBeInTheDocument();
    });
  });

  it("calls onSelect when an option is chosen", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    render(
      <Select
        value=""
        options={options}
        placeholder="Choose one"
        onChange={handleSelect}
        id="test-select"
      />
    );
    await user.selectOptions(screen.getByRole("combobox"), "beta");
    expect(handleSelect).toHaveBeenCalledWith("beta");
  });

  it("shows the selected value", () => {
    render(<Select options={options} value="gamma" onChange={() => {}} id="test-select" />);
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("gamma");
  });

  it("allows clearing selection by choosing the placeholder", async () => {
    const user = userEvent.setup();
    let selected = "alpha";
    render(
      <Select
        options={options}
        value={selected}
        onChange={(val) => {
          selected = val;
        }}
        placeholder="Choose one"
        id="test-select"
      />
    );
    await user.selectOptions(screen.getByRole("combobox"), "");
    // Simulate controlled value update
    render(
      <Select
        options={options}
        value={selected}
        onChange={() => {}}
        placeholder="Choose one"
        id="test-select"
      />
    );
    // Use getAllByRole and check the last select rendered
    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
    expect(selects[selects.length - 1].value).toBe("");
  });

  it("disables the select when isDisabled is true", () => {
    render(<Select value="" options={options} isDisabled onChange={() => {}} id="test-select" />);
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("requires the select when isRequired is true", () => {
    render(<Select value="" options={options} isRequired onChange={() => {}} id="test-select" />);
    expect(screen.getByRole("combobox")).toBeRequired();
  });
});
