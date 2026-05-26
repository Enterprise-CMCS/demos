import React from "react";
import { render, screen } from "@testing-library/react";
import { HhsLogo, LOGO_ALT, LOGO_SRC, LOGO_TEST_ID } from "./HhsLogo";

describe("HhsLogo", () => {
  it("renders the hhs logo image with correct src and alt attributes", () => {
    render(<HhsLogo />);
    const logoImage = screen.getByTestId(LOGO_TEST_ID) as HTMLImageElement;
    expect(logoImage).toBeInTheDocument();
    expect(logoImage.src).toContain(LOGO_SRC);
    expect(logoImage.alt).toBe(LOGO_ALT);
  });
});
