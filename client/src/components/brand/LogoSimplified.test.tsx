import React from "react";
import { render, screen } from "@testing-library/react";
import { LogoSimplified } from "./LogoSimplified";

describe("LogoSimplified", () => {
  it("renders the simplified logo image with correct src and alt attributes", () => {
    render(<LogoSimplified />);
    const logoImage = screen.getByTestId("demos-logo-simplified") as HTMLImageElement;
    expect(logoImage).toBeInTheDocument();
    expect(logoImage.src).toContain("/img/logo-simplified.png");
    expect(logoImage.alt).toBe(
      "DEMOS Logo with text: DEMOS, Demonstration Evaluation Management & Oversight System"
    );
  });
});
