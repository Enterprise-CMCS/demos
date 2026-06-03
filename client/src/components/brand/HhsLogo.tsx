import React from "react";

export const LOGO_TEST_ID = "hhs-logo";
export const LOGO_SRC = "/img/hhs-logo.svg";
export const LOGO_ALT = "HHS Logo with text: U.S Department of Health & Human Services";

export const HhsLogo: React.FC = () => {
  return (
    <div className="flex items-center">
      <img className="h-[40px]" src={LOGO_SRC} alt={LOGO_ALT} data-testid={LOGO_TEST_ID} />
    </div>
  );
};
