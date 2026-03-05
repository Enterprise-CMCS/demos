import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { AutoCompleteMultiselect } from "./AutoCompleteMultiselect";
import { Option } from "./Select";

const onSelect: (value: string[]) => void = vi.fn();

const options: Option[] = [
  { label: "Apple", value: "apple" },
  { label: "Banana", value: "banana" },
  { label: "Cherry", value: "cherry" },
];

describe("AutoCompleteMultiselect", () => {
  it("renders input with placeholder", () => {
    render(
      <AutoCompleteMultiselect options={options} onSelect={onSelect} placeholder="Pick fruit" />
    );
    expect(screen.getByPlaceholderText("Pick fruit")).toBeInTheDocument();
  });

  it("renders label and required indicator", () => {
    render(
      <AutoCompleteMultiselect
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
      <AutoCompleteMultiselect
        options={options}
        onSelect={onSelect}
        isDisabled
        placeholder="Disabled"
      />
    );
    expect(screen.getByPlaceholderText("Disabled")).toBeDisabled();
  });

  it("opens dropdown on input focus", async () => {
    render(<AutoCompleteMultiselect options={options} onSelect={onSelect} />);
    const input = screen.getByRole("textbox");
    await userEvent.click(input);
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Banana")).toBeInTheDocument();
  });

  it("filters options as user types", async () => {
    render(<AutoCompleteMultiselect options={options} onSelect={onSelect} />);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "Ban");
    expect(screen.getByText("Banana")).toBeInTheDocument();
    expect(screen.queryByText("Apple")).not.toBeInTheDocument();
  });

  it("shows 'No matches found' if nothing matches", async () => {
    render(<AutoCompleteMultiselect options={options} onSelect={onSelect} />);
    const input = screen.getByRole("textbox");
    await userEvent.type(input, "zzz");
    expect(screen.getByText(/no matches found/i)).toBeInTheDocument();
  });

  it("toggles selection on option click", async () => {
    render(<AutoCompleteMultiselect options={options} onSelect={onSelect} />);
    const input = screen.getByRole("textbox");
    await userEvent.click(input);
    await userEvent.click(screen.getByText("Cherry"));
    expect(onSelect).toHaveBeenCalledWith(["cherry"]);
    // Click again to unselect
    await userEvent.click(screen.getByText("Cherry"));
    expect(onSelect).toHaveBeenCalledWith([]);
  });

  it("toggles selection on keyboard selection", async () => {
    render(<AutoCompleteMultiselect options={options} onSelect={onSelect} />);
    const input = screen.getByRole("textbox");
    await userEvent.click(input); // Ensure dropdown is open
    fireEvent.keyDown(input, { key: "ArrowDown" }); // highlight Apple
    fireEvent.keyDown(input, { key: "Enter" }); // select Apple
    expect(onSelect).toHaveBeenCalledWith(["apple"]);
    // Press Enter again to unselect
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith([]);
  });

  it("keyboard navigation: ArrowDown/ArrowUp moves highlight", async () => {
    render(<AutoCompleteMultiselect options={options} onSelect={onSelect} />);
    const input = screen.getByRole("textbox");
    input.focus();
    fireEvent.keyDown(input, { key: "ArrowDown" }); // index 0
    fireEvent.keyDown(input, { key: "ArrowDown" }); // index 1
    fireEvent.keyDown(input, { key: "ArrowUp" }); // index 0
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith(["apple"]);
  });

  it("closes dropdown on Escape", async () => {
    render(<AutoCompleteMultiselect options={options} onSelect={onSelect} />);
    const input = screen.getByRole("textbox");
    await userEvent.click(input);
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByText("Apple")).not.toBeInTheDocument();
  });

  it("closes dropdown on outside click", async () => {
    render(
      <div>
        <AutoCompleteMultiselect options={options} onSelect={onSelect} />
        <button>outside</button>
      </div>
    );
    const input = screen.getByRole("textbox");
    await userEvent.click(input);
    expect(screen.getByText("Apple")).toBeInTheDocument();
    await userEvent.click(screen.getByText("outside"));
    expect(screen.queryByText("Apple")).not.toBeInTheDocument();
  });

  describe("Selected value display", () => {
    it("shows selected labels in the input when dropdown is closed", async () => {
      render(
        <AutoCompleteMultiselect options={options} onSelect={onSelect} placeholder="Pick fruit" />
      );
      const input = screen.getByRole("textbox");

      // Open and select Apple
      await userEvent.click(input);
      await userEvent.click(screen.getByText("Apple"));

      // Close by clicking outside
      await userEvent.click(document.body);

      // Input should display the selected label
      expect(input).toHaveValue("Apple");
    });

    it("shows comma-separated labels for multiple selections when closed", async () => {
      render(
        <AutoCompleteMultiselect options={options} onSelect={onSelect} placeholder="Pick fruit" />
      );
      const input = screen.getByRole("textbox");

      // Open and select Apple then Banana
      await userEvent.click(input);
      await userEvent.click(screen.getByText("Apple"));
      await userEvent.click(screen.getByText("Banana"));

      // Close by clicking outside
      await userEvent.click(document.body);

      expect(input).toHaveValue("Apple, Banana");
    });

    it("shows placeholder when no items are selected and dropdown is closed", async () => {
      render(
        <AutoCompleteMultiselect options={options} onSelect={onSelect} placeholder="Pick fruit" />
      );
      const input = screen.getByRole("textbox");
      expect(input).toHaveValue("");
      expect(input).toHaveAttribute("placeholder", "Pick fruit");
    });

    it("clears the input for search when the dropdown opens", async () => {
      render(
        <AutoCompleteMultiselect options={options} onSelect={onSelect} placeholder="Pick fruit" />
      );
      const input = screen.getByRole("textbox");

      // Select Apple then close
      await userEvent.click(input);
      await userEvent.click(screen.getByText("Apple"));
      await userEvent.click(document.body);
      expect(input).toHaveValue("Apple");

      // Reopen - input should clear so the user can search
      await userEvent.click(input);
      expect(input).toHaveValue("");
      // All options should be visible (no filtering)
      expect(screen.getByText("Banana")).toBeInTheDocument();
      expect(screen.getByText("Cherry")).toBeInTheDocument();
    });
  });
});
