import React from "react";
import { render, screen } from "@testing-library/react";
import { CommentBox } from "./CommentBox";

describe("CommentBox", () => {
  it("renders without crashing", () => {
    render(<CommentBox />);
    expect(screen.getByText(/comment box/i)).toBeInTheDocument();
  });
});
