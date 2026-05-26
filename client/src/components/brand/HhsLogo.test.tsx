import React from "react";
import { render, screen } from "@testing-library/react";
import { HhsLogo } from "./HhsLogo";

describe("HhsLogo", () => {
  it("renders the hhs logo image with correct src and alt attributes", () => {
    render(<HhsLogo />);
    const logoImage = screen.getByTestId("hhs-logo") as HTMLImageElement;
    expect(logoImage).toBeInTheDocument();
    expect(logoImage.src).toContain("/img/hhs-logo.webp");
    expect(logoImage.alt).toBe("HHS Logo with text: Department of Health & Human Services, USA");
  });
});
