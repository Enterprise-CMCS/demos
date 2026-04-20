import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { COLLAPSE_COMMENTS_BUTTON_NAME, COMMENT_BOX_NAME, COMMENT_BOX_TEXT_AREA_NAME, CommentBox } from "./CommentBox";

describe("CommentBox", () => {
  it("renders without crashing", () => {
    render(<CommentBox />);
    expect(screen.getByTestId(COMMENT_BOX_NAME)).toBeInTheDocument();
  });

  it("shows the full comment box by default", () => {
    render(<CommentBox />);
    expect(screen.getByTestId(COMMENT_BOX_TEXT_AREA_NAME)).toBeInTheDocument();
    expect(screen.getByText("Comment History")).toBeInTheDocument();
  });

  it("collapses to a single icon button when the collapse button is clicked", async () => {
    render(<CommentBox />);

    await userEvent.click(screen.getByTestId(COLLAPSE_COMMENTS_BUTTON_NAME));

    expect(screen.queryByTestId(COMMENT_BOX_TEXT_AREA_NAME)).not.toBeInTheDocument();
    expect(screen.queryByText("Comment History")).not.toBeInTheDocument();
    expect(screen.getByTestId(COMMENT_BOX_NAME)).toBeInTheDocument();
  });

  it("expands back when the collapsed icon button is clicked", async () => {
    render(<CommentBox />);

    await userEvent.click(screen.getByTestId(COLLAPSE_COMMENTS_BUTTON_NAME));
    await userEvent.click(screen.getByTestId(COMMENT_BOX_NAME));

    expect(screen.getByTestId(COMMENT_BOX_TEXT_AREA_NAME)).toBeInTheDocument();
    expect(screen.getByText("Comment History")).toBeInTheDocument();
  });

  it("still renders the testid in collapsed state", async () => {
    render(<CommentBox />);

    await userEvent.click(screen.getByTestId(COLLAPSE_COMMENTS_BUTTON_NAME));

    expect(screen.getByTestId(COMMENT_BOX_NAME)).toBeInTheDocument();
  });
});
