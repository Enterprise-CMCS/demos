import React from "react";
import hhsLogoSrc from "../../assets/images/hhs-logo.webp";

export const LOGO_TEST_ID = "hhs-logo";
export const LOGO_SRC = hhsLogoSrc;
export const LOGO_ALT = "HHS Logo with text: Department of Health & Human Services, USA";

export const HhsLogo: React.FC = () => {
  return (
    <div className="flex w-[30rem] items-center gap-3">
      <span className="sr-only">{LOGO_ALT}</span>
      <img
        className="block h-12 w-12 shrink-0 object-contain"
        src={LOGO_SRC}
        alt=""
        aria-hidden="true"
        data-testid={LOGO_TEST_ID}
      />
      <p className="w-[24rem] text-xs font-semibold">
        A federal government website managed and paid for by the U.S. Centers for Medicare &
        Medicaid Services.
      </p>
    </div>
  );
};
