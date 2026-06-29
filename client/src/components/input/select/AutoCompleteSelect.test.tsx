import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { AutoCompleteSelect, AUTOCOMPLETE_SELECT_TEST_ID } from "./AutoCompleteSelect";
import { Option } from "./Select";

const onSelect: (value: string) => void = vi.fn();

const options: Option[] = [
  { label: "Apple", value: "apple" },
  { label: "Banana", value: "banana" },
  { label: "Cherry", value: "cherry" },
];

describe("AutoCompleteSelect", () => {
  it("renders input with placeholder", () => {
    render(
      <AutoCompleteSelect value="" options={options} onSelect={onSelect} placeholder="Pick fruit" />
    );
    expect(screen.getByPlaceholderText("Pick fruit")).toBeInTheDocument();
  });

  it("renders label and required indicator", () => {
    render(
      <AutoCompleteSelect
        value=""
        options={options}
        onSelect={onSelect}
        label="Fruit"
        isRequired
        id="fruit"
      />
    );
    expect(screen.getByLabelText(/fruit/i)).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("renders disabled input", () => {
    render(
      <AutoCompleteSelect
        value=""
        options={options}
        onSelect={onSelect}
        isDisabled
        placeholder="Disabled"
      />
    );
    expect(screen.getByPlaceholderText("Disabled")).toBeDisabled();
  });

  it("opens dropdown on input focus", async () => {
    render(<AutoCompleteSelect value="" options={options} onSelect={onSelect} />);
    const input = screen.getByTestId(AUTOCOMPLETE_SELECT_TEST_ID);
    await userEvent.click(input);
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Banana")).toBeInTheDocument();
  });

  it("filters options as user types", async () => {
    render(<AutoCompleteSelect value="" options={options} onSelect={onSelect} />);
    const input = screen.getByTestId(AUTOCOMPLETE_SELECT_TEST_ID);
    await userEvent.type(input, "Ban");
    expect(screen.getByText("Banana")).toBeInTheDocument();
    expect(screen.queryByText("Apple")).not.toBeInTheDocument();
  });

  it("shows 'No matches found' if nothing matches", async () => {
    render(<AutoCompleteSelect value="" options={options} onSelect={onSelect} />);
    const input = screen.getByTestId(AUTOCOMPLETE_SELECT_TEST_ID);
    await userEvent.type(input, "zzz");
    expect(screen.getByText(/no matches found/i)).toBeInTheDocument();
  });

  it("calls onSelect on option click", async () => {
    render(<AutoCompleteSelect value="" options={options} onSelect={onSelect} />);
    const input = screen.getByTestId(AUTOCOMPLETE_SELECT_TEST_ID);
    await userEvent.click(input);
    await userEvent.click(screen.getByText("Cherry"));
    expect(onSelect).toHaveBeenCalledWith("cherry");
  });

  it("closes the dropdown when reselecting the current value", async () => {
    render(<AutoCompleteSelect value="banana" options={options} onSelect={onSelect} />);
    const input = screen.getByTestId(AUTOCOMPLETE_SELECT_TEST_ID);

    await userEvent.click(input);
    expect(screen.getByText("Apple")).toBeInTheDocument();

    await userEvent.click(screen.getByText("Banana"));

    expect(screen.queryByText("Apple")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Banana")).toBeInTheDocument();
  });

  it("reopens dropdown when clicking the already-focused input after selection", async () => {
    render(<AutoCompleteSelect value="" options={options} onSelect={onSelect} />);
    const input = screen.getByTestId(AUTOCOMPLETE_SELECT_TEST_ID);

    await userEvent.click(input);
    await userEvent.click(screen.getByText("Cherry"));

    expect(screen.queryByText("Apple")).not.toBeInTheDocument();

    await userEvent.click(input);

    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Banana")).toBeInTheDocument();
  });

  it("starts a new search when typing after selection without requiring blur", async () => {
    const user = userEvent.setup();

    render(<AutoCompleteSelect value="" options={options} onSelect={onSelect} />);
    const input = screen.getByTestId(AUTOCOMPLETE_SELECT_TEST_ID);

    await user.click(input);
    await user.click(screen.getByText("Cherry"));

    await user.keyboard("B");

    expect(input).toHaveValue("B");
    expect(screen.getByText("Banana")).toBeInTheDocument();
    expect(screen.queryByText("Apple")).not.toBeInTheDocument();
  });

  it("calls onSelect and closes dropdown on keyboard selection", async () => {
    render(<AutoCompleteSelect value="" options={options} onSelect={onSelect} />);
    const input = screen.getByTestId(AUTOCOMPLETE_SELECT_TEST_ID);
    await userEvent.click(input); // Ensure dropdown is open
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith("apple");
    expect(screen.queryByText("Banana")).not.toBeInTheDocument();
  });

  it("keyboard navigation: ArrowDown/ArrowUp moves highlight", async () => {
    render(<AutoCompleteSelect value="" options={options} onSelect={onSelect} />);
    const input = screen.getByTestId(AUTOCOMPLETE_SELECT_TEST_ID);
    input.focus();
    fireEvent.keyDown(input, { key: "ArrowDown" }); // index 0
    fireEvent.keyDown(input, { key: "ArrowDown" }); // index 1
    fireEvent.keyDown(input, { key: "ArrowUp" }); // index 0
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith("apple");
  });

  it("closes dropdown on Escape", async () => {
    render(<AutoCompleteSelect value="" options={options} onSelect={onSelect} />);
    const input = screen.getByTestId(AUTOCOMPLETE_SELECT_TEST_ID);
    await userEvent.click(input);
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByText("Apple")).not.toBeInTheDocument();
  });

  it("closes dropdown on outside click", async () => {
    render(
      <div>
        <AutoCompleteSelect value="" options={options} onSelect={onSelect} />
        <button>outside</button>
      </div>
    );
    const input = screen.getByTestId(AUTOCOMPLETE_SELECT_TEST_ID);
    await userEvent.click(input);
    expect(screen.getByText("Apple")).toBeInTheDocument();
    await userEvent.click(screen.getByText("outside"));
    expect(screen.queryByText("Apple")).not.toBeInTheDocument();
  });

  it("prefills input with starting value", () => {
    render(<AutoCompleteSelect options={options} onSelect={onSelect} value="banana" />);
    expect(screen.getByDisplayValue("Banana")).toBeInTheDocument();
  });

  describe("noMatchMessage", () => {
    it("shows custom no-match message when provided and filter has text", async () => {
      render(
        <AutoCompleteSelect
          value=""
          options={options}
          onSelect={onSelect}
          noMatchMessage="Entry not found. New tags remain unapproved."
        />
      );
      const input = screen.getByTestId(AUTOCOMPLETE_SELECT_TEST_ID);
      await userEvent.type(input, "zzz");
      expect(screen.getByText("Entry not found. New tags remain unapproved.")).toBeInTheDocument();
    });

    it("shows default 'No matches found' when noMatchMessage is provided but filter is empty", async () => {
      render(
        <AutoCompleteSelect
          value=""
          options={options}
          onSelect={onSelect}
          noMatchMessage="Custom message"
        />
      );
      const input = screen.getByTestId(AUTOCOMPLETE_SELECT_TEST_ID);
      await userEvent.click(input);
      // All options visible when filter is empty, so no "no match" message
      expect(screen.getByText("Apple")).toBeInTheDocument();
    });
  });

  describe("onFilterChange", () => {
    it("calls onFilterChange with filter value and match status as user types", async () => {
      const onFilterChange = vi.fn();
      render(
        <AutoCompleteSelect
          value=""
          options={options}
          onSelect={onSelect}
          onFilterChange={onFilterChange}
        />
      );
      const input = screen.getByTestId(AUTOCOMPLETE_SELECT_TEST_ID);
      await userEvent.type(input, "Ban");

      // Called for each character: "B", "Ba", "Ban"
      expect(onFilterChange).toHaveBeenCalledWith("B", true);
      expect(onFilterChange).toHaveBeenCalledWith("Ba", true);
      expect(onFilterChange).toHaveBeenCalledWith("Ban", true);
    });

    it("reports hasMatches=false when no options match", async () => {
      const onFilterChange = vi.fn();
      render(
        <AutoCompleteSelect
          value=""
          options={options}
          onSelect={onSelect}
          onFilterChange={onFilterChange}
        />
      );
      const input = screen.getByTestId(AUTOCOMPLETE_SELECT_TEST_ID);
      await userEvent.type(input, "zzz");

      expect(onFilterChange).toHaveBeenLastCalledWith("zzz", false);
    });

    it("resets filter state on option select", async () => {
      const onFilterChange = vi.fn();
      render(
        <AutoCompleteSelect
          value=""
          options={options}
          onSelect={onSelect}
          onFilterChange={onFilterChange}
        />
      );
      const input = screen.getByTestId(AUTOCOMPLETE_SELECT_TEST_ID);
      await userEvent.click(input);
      await userEvent.click(screen.getByText("Cherry"));

      expect(onFilterChange).toHaveBeenLastCalledWith("", true);
    });
  });
});
