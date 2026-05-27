import React from "react";
import logoSimplifiedSrc from "../../assets/images/logo-simplified.png";

export const LOGO_TEST_ID = "demos-logo-simplified";
export const LOGO_SRC = logoSimplifiedSrc;
export const LOGO_ALT =
  "DEMOS Logo with text: DEMOS, Demonstration Evaluation Management & Oversight System";

export const LogoSimplified: React.FC = () => {
  return (
    <a href="/" className="block h-10 w-[111px] shrink-0" aria-label="DEMOS home">
      <img
        className="block h-10 w-[111px] object-contain"
        src={LOGO_SRC}
        alt=""
        data-testid={LOGO_TEST_ID}
      />
    </a>
  );
};
