import React from "react";

export const LOGO_TEST_ID = "demos-logo";
export const LOGO_SRC = "/img/logo.svg";
export const LOGO_ALT =
  "DEMOS Logo with text: 1115, DEMOS, Demonstration Evaluation Management & Oversight System";

export const Logo: React.FC = () => {
  return (
    <a href="/" className="inline-flex h-full items-center">
      <img className="block max-h-full" src={LOGO_SRC} alt={LOGO_ALT} data-testid={LOGO_TEST_ID} />
    </a>
  );
};
