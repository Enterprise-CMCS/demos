import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Select, Option } from "./Select";
import { getSelectOptionLabels, selectOption } from "test-utils/select";

const options: Option[] = [
  { label: "Alpha", value: "alpha" },
  { label: "Beta", value: "beta" },
  { label: "Gamma", value: "gamma" },
];

describe("Select", () => {
  it("renders label and options", async () => {
    const user = userEvent.setup();
    render(
      <Select
        options={options}
        label="Test Label"
        placeholder="Choose one"
        onSelect={() => {}}
        id="test-select"
      />
    );
    const select = screen.getByLabelText("Test Label");
    expect(select).toHaveTextContent("Choose one");
    expect(await getSelectOptionLabels(user, select)).toEqual([
      "Choose one",
      "Alpha",
      "Beta",
      "Gamma",
    ]);
  });

  it("keeps the option list closed until the select is clicked", async () => {
    const user = userEvent.setup();
    render(<Select options={options} onSelect={() => {}} id="test-select" />);
    const select = screen.getByRole("combobox");
    expect(select).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await user.click(select);
    expect(select).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("renders the option list below the select instead of over it", async () => {
    const user = userEvent.setup();
    render(<Select options={options} onSelect={() => {}} id="test-select" />);
    const select = screen.getByRole("combobox");
    await user.click(select);
    const listbox = screen.getByRole("listbox");
    expect(select.compareDocumentPosition(listbox) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(listbox).toHaveClass("absolute", "w-full", "mt-0.5");
  });

  it("calls onSelect when an option is chosen", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    render(
      <Select
        options={options}
        placeholder="Choose one"
        onSelect={handleSelect}
        id="test-select"
      />
    );
    await selectOption(user, screen.getByRole("combobox"), "Beta");
    expect(handleSelect).toHaveBeenCalledWith("beta");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("keeps the option test ids", async () => {
    const user = userEvent.setup();
    render(<Select options={options} onSelect={() => {}} id="test-select" />);
    await user.click(screen.getByTestId("test-select"));
    expect(screen.getByTestId("test-select-option-empty")).toBeInTheDocument();
    expect(screen.getByTestId("test-select-option-beta")).toHaveTextContent("Beta");
  });

  it("shows the selected value", async () => {
    const user = userEvent.setup();
    render(<Select options={options} value="gamma" onSelect={() => {}} id="test-select" />);
    const select = screen.getByRole("combobox");
    expect(select).toHaveTextContent("Gamma");

    await user.click(select);
    expect(within(screen.getByRole("listbox")).getByRole("option", { selected: true })).toHaveTextContent(
      "Gamma"
    );
  });

  it("allows clearing selection by choosing the placeholder", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    render(
      <Select
        options={options}
        value="alpha"
        onSelect={handleSelect}
        placeholder="Choose one"
        id="test-select"
      />
    );
    await selectOption(user, screen.getByRole("combobox"), "Choose one");
    expect(handleSelect).toHaveBeenCalledWith("");
  });

  it("supports choosing an option with the keyboard", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    render(<Select options={options} onSelect={handleSelect} id="test-select" />);
    screen.getByRole("combobox").focus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(handleSelect).toHaveBeenCalledWith("beta");
  });

  it("jumps to an option by its first letter", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    render(<Select options={options} onSelect={handleSelect} id="test-select" />);
    screen.getByRole("combobox").focus();

    await user.keyboard("g{Enter}");
    expect(handleSelect).toHaveBeenCalledWith("gamma");
  });

  it("closes the option list on Escape without selecting", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    render(<Select options={options} onSelect={handleSelect} id="test-select" />);
    await user.click(screen.getByRole("combobox"));

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(handleSelect).not.toHaveBeenCalled();
  });

  it("closes the option list when focus leaves the select", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Select options={options} onSelect={() => {}} id="test-select" />
        <button type="button">Elsewhere</button>
      </>
    );
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("button", { name: "Elsewhere" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("disables the select when isDisabled is true", async () => {
    const user = userEvent.setup();
    render(
      <Select
        options={options}
        isDisabled
        onSelect={() => {}}
        id="test-select"
      />
    );
    const select = screen.getByRole("combobox");
    expect(select).toBeDisabled();
    await user.click(select);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("requires the select when isRequired is true", () => {
    render(
      <Select
        options={options}
        isRequired
        onSelect={() => {}}
        id="test-select"
      />
    );
    expect(screen.getByRole("combobox")).toBeRequired();
  });

  it("points aria-activedescendant at the highlighted option", async () => {
    const user = userEvent.setup();
    render(<Select options={options} onSelect={() => {}} id="test-select" />);
    const select = screen.getByRole("combobox");
    expect(select).not.toHaveAttribute("aria-activedescendant");

    select.focus();
    await user.keyboard("{ArrowDown}{ArrowDown}");
    const activeOptionId = select.getAttribute("aria-activedescendant");
    expect(document.getElementById(activeOptionId!)).toHaveTextContent("Alpha");

    await user.keyboard("{End}");
    expect(document.getElementById(select.getAttribute("aria-activedescendant")!)).toHaveTextContent(
      "Gamma"
    );
  });

  it("labels the option list with the select's label", async () => {
    const user = userEvent.setup();
    render(<Select options={options} label="Test Label" onSelect={() => {}} id="test-select" />);
    await user.click(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox")).toHaveAccessibleName("Test Label");
  });

  it("links the validation message to the select", () => {
    render(
      <Select
        options={options}
        validationMessage="Selection is required"
        onSelect={() => {}}
        id="test-select"
      />
    );
    const select = screen.getByRole("combobox");
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(select).toHaveAccessibleDescription("Selection is required");
  });

  it("generates unique ids when no id is passed", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Select options={options} label="First" onSelect={() => {}} />
        <Select options={options} label="Second" onSelect={() => {}} />
      </>
    );
    const [first, second] = screen.getAllByRole("combobox");
    expect(first.id).not.toEqual(second.id);
    expect(screen.getByLabelText("First")).toBe(first);

    await user.click(first);
    expect(screen.getByRole("listbox")).toHaveAttribute("id", first.getAttribute("aria-controls"));
  });
});
