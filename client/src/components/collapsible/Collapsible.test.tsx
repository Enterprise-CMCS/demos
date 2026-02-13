import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import userEvent from "@testing-library/user-event";

import { Collapsible } from "./Collapsible";

describe("Collapsible", () => {
  it("renders with title", () => {
    render(
      <Collapsible title="Test Title">
        <div>Test Content</div>
      </Collapsible>
    );

    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("starts in collapsed state (children not visible)", () => {
    render(
      <Collapsible title="Test Title">
        <div>Hidden Content</div>
      </Collapsible>
    );

    expect(screen.queryByText("Hidden Content")).not.toBeInTheDocument();
  });

  it("expands and shows children when title is clicked", async () => {
    const user = userEvent.setup();

    render(
      <Collapsible title="Click to Expand">
        <div>Now Visible</div>
      </Collapsible>
    );

    const title = screen.getByText("Click to Expand");

    // Verify initially collapsed
    expect(screen.queryByText("Now Visible")).not.toBeInTheDocument();

    // Click to expand
    await user.click(title);

    // Verify now visible
    expect(screen.getByText("Now Visible")).toBeInTheDocument();
  });

  it("collapses and hides children when title is clicked again", async () => {
    const user = userEvent.setup();

    render(
      <Collapsible title="Toggle Me">
        <div>Toggleable Content</div>
      </Collapsible>
    );

    const title = screen.getByText("Toggle Me");

    // Expand
    await user.click(title);
    expect(screen.getByText("Toggleable Content")).toBeInTheDocument();

    // Collapse
    await user.click(title);
    expect(screen.queryByText("Toggleable Content")).not.toBeInTheDocument();
  });

  it("handles multiple toggle interactions", async () => {
    const user = userEvent.setup();

    render(
      <Collapsible title="Multi Toggle">
        <div>Content</div>
      </Collapsible>
    );

    const title = screen.getByText("Multi Toggle");

    // First expand
    await user.click(title);
    expect(screen.getByText("Content")).toBeInTheDocument();

    // Collapse
    await user.click(title);
    expect(screen.queryByText("Content")).not.toBeInTheDocument();

    // Expand again
    await user.click(title);
    expect(screen.getByText("Content")).toBeInTheDocument();

    // Collapse again
    await user.click(title);
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("renders complex children correctly when expanded", async () => {
    const user = userEvent.setup();

    render(
      <Collapsible title="Complex Content">
        <div>
          <h3>Heading</h3>
          <p>Paragraph text</p>
          <button>Action Button</button>
        </div>
      </Collapsible>
    );

    const title = screen.getByText("Complex Content");
    await user.click(title);

    expect(screen.getByText("Heading")).toBeInTheDocument();
    expect(screen.getByText("Paragraph text")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Action Button" })).toBeInTheDocument();
  });

  it("applies cursor-pointer class to clickable title", () => {
    const { container } = render(
      <Collapsible title="Clickable Title">
        <div>Content</div>
      </Collapsible>
    );

    const titleElement = container.querySelector(".cursor-pointer");
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveTextContent("Clickable Title");
  });

  it("applies border and padding styles to container", () => {
    const { container } = render(
      <Collapsible title="Styled Container">
        <div>Content</div>
      </Collapsible>
    );

    const containerDiv = container.firstChild;
    expect(containerDiv).toHaveClass("border-2", "p-1", "h-fit");
  });
});
