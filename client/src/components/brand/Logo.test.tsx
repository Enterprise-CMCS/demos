import React from "react";
import { render, screen } from "@testing-library/react";
import { Logo, LOGO_ALT, LOGO_SRC, LOGO_TEST_ID } from "./Logo";

describe("Logo", () => {
  it("renders the logo image with correct src and alt attributes", () => {
    render(<Logo />);
    const logoImage = screen.getByTestId(LOGO_TEST_ID) as HTMLImageElement;
    expect(logoImage).toBeInTheDocument();
    expect(logoImage.src).toContain(LOGO_SRC);
    expect(logoImage.alt).toBe(LOGO_ALT);
  });
});
