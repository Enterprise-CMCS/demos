import React from "react";
import { render, screen } from "@testing-library/react";
import { Logo } from "./Logo";

describe("Logo", () => {
  it("renders the logo image with correct src and alt attributes", () => {
    render(<Logo />);
    const logoImage = screen.getByAltText(
      "DEMOS Logo with text: DEMOS, Demonstration Evaluation Management & Oversight System"
    ) as HTMLImageElement;
    expect(logoImage).toBeInTheDocument();
    expect(logoImage.src).toContain("/img/logo.svg");
  });
});
