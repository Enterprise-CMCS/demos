import React from "react";

export const LOGO_TEST_ID = "demos-logo";
export const LOGO_SRC = "/img/logo.svg";
export const LOGO_ALT =
  "DEMOS Logo with text: 1115, DEMOS, Demonstration Evaluation Management & Oversight System";

export const Logo: React.FC = () => {
  return (
    <a href="/" className="h-[40px]">
      <img height="40px" src={LOGO_SRC} alt={LOGO_ALT} data-testid={LOGO_TEST_ID} />
    </a>
  );
};
