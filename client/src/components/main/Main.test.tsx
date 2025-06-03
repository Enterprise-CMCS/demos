import React from "react";
import { render } from "@testing-library/react";
import { Main } from "./Main";
import { describe, it, expect } from "vitest";

describe("Main Component", () => {
  it("renders without crashing", () => {
    const { container } = render(<Main>Hello world!</Main>);
    expect(container).toBeInTheDocument();
  });
});
