import React from "react";

export const LOGO_TEST_ID = "demos-logo-simplified";
export const LOGO_SRC = "/img/logo-simplified.png";
export const LOGO_ALT =
  "DEMOS Logo with text: DEMOS, Demonstration Evaluation Management & Oversight System";

export const LogoSimplified: React.FC = () => {
  return (
    <a href="/" className="inline-flex items-center h-[40px]">
      <img className="block max-h-full" src={LOGO_SRC} alt={LOGO_ALT} data-testid={LOGO_TEST_ID} />
    </a>
  );
};
