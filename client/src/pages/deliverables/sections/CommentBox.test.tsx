import React from "react";
import { render, screen } from "@testing-library/react";
import { COMMENT_BOX_NAME, CommentBox } from "./CommentBox";

describe("CommentBox", () => {
  it("renders without crashing", () => {
    render(<CommentBox />);
    expect(screen.getByTestId(COMMENT_BOX_NAME)).toBeInTheDocument();
  });
});
