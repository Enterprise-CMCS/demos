import React from "react";

export const LOGO_TEST_ID = "hhs-logo";
export const LOGO_SRC = "/img/hhs-logo.webp";
export const LOGO_ALT = "HHS Logo with text: Department of Health & Human Services, USA";

export const HhsLogo: React.FC = () => {
  return (
    <div className="flex items-center">
      <img className="px-1 w-16" src={LOGO_SRC} alt={LOGO_ALT} data-testid={LOGO_TEST_ID} />
      <p className="text-xs font-semibold w-[60%]">
        A federal government website managed and paid for by the U.S. Centers for Medicare &
        Medicaid Services.
      </p>
    </div>
  );
};
