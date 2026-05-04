import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TestProvider } from "test-utils/TestProvider";
import { CommentBoxTabs } from "./CommentBoxTabs";

const setup = (setCommentVisibility = vi.fn()) => {
  render(
    <TestProvider>
      <CommentBoxTabs setCommentVisibility={setCommentVisibility} />
    </TestProvider>
  );
  return { setCommentVisibility };
};

describe("CommentBoxTabs", () => {
  it("renders the Public and Private tabs", () => {
    setup();
    expect(screen.getByTestId("button-public")).toBeInTheDocument();
    expect(screen.getByTestId("button-private")).toBeInTheDocument();
  });

  it("has the Public tab selected by default", () => {
    setup();
    expect(screen.getByTestId("button-public")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("button-private")).toHaveAttribute("aria-selected", "false");
  });

  it("shows the public tab content by default", () => {
    setup();
    expect(screen.getByText("These comments wil be visible to the State")).toBeInTheDocument();
  });

  it("calls setCommentVisibility with 'private' when the Private tab is clicked", async () => {
    const { setCommentVisibility } = setup();
    await userEvent.click(screen.getByTestId("button-private"));
    expect(setCommentVisibility).toHaveBeenCalledWith("private");
  });

  it("calls setCommentVisibility with 'public' when switching back to the Public tab", async () => {
    const { setCommentVisibility } = setup();
    await userEvent.click(screen.getByTestId("button-private"));
    await userEvent.click(screen.getByTestId("button-public"));
    expect(setCommentVisibility).toHaveBeenLastCalledWith("public");
  });
});
