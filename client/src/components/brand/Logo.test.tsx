import React from "react";
import { render, screen } from "@testing-library/react";
import { Logo, LOGO_SRC, LOGO_TEST_ID } from "./Logo";

describe("Logo", () => {
  it("renders the logo image with an accessible home link", () => {
    render(<Logo />);
    const logoImage = screen.getByTestId(LOGO_TEST_ID) as HTMLImageElement;
    expect(logoImage).toBeInTheDocument();
    expect(logoImage.src).toContain(LOGO_SRC);
    expect(logoImage.alt).toBe("");
    expect(screen.getByRole("link", { name: /demos home/i })).toBeInTheDocument();
  });
});
