import React from "react";

const LOGO_SRC = "/img/logo.svg";
const LOGO_ALT =
  "DEMOS Logo with text: DEMOS, Demonstration Evaluation Management & Oversight System";

export const Logo: React.FC = () => {
  return (
    <a href="/" className="h-[40px]">
      <img height="40px" src={LOGO_SRC} alt={LOGO_ALT} />
    </a>
  );
};
