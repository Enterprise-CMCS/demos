import React from "react";
import logoSrc from "../../assets/images/logo.svg";

export const LOGO_TEST_ID = "demos-logo";
export const LOGO_SRC = logoSrc;
export const LOGO_ALT =
  "DEMOS Logo with text: 1115, DEMOS, Demonstration Evaluation Management & Oversight System";

export const Logo: React.FC = () => {
  return (
    <a href="/" className="block h-10" aria-label="DEMOS home">
      <img className="block h-10 w-auto" src={LOGO_SRC} alt="" data-testid={LOGO_TEST_ID} />
    </a>
  );
};
