import React from "react";
import { render, screen } from "@testing-library/react";
import { LOGO_ALT, LOGO_SRC, LOGO_TEST_ID, LogoSimplified } from "./LogoSimplified";

describe("LogoSimplified", () => {
  it("renders the simplified logo image with correct src and alt attributes", () => {
    render(<LogoSimplified />);
    const logoImage = screen.getByTestId(LOGO_TEST_ID) as HTMLImageElement;
    expect(logoImage).toBeInTheDocument();
    expect(logoImage.src).toContain(LOGO_SRC);
    expect(logoImage.alt).toBe(LOGO_ALT);
  });
});
