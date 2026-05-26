import React from "react";
import { tw } from "tags/tw";

const DEMOS_ADDRESS = "7500 Security Boulevard Baltimore, MD 21244";
const DEMOS_VERSION = "1.0.001";

const linkStyles = tw`text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded`;

const FooterLogo: React.FC = () => (
  <>
    <img src="/img/logo-mini.png" className="ph-1 h-10 w-10" />
    <p className="text-xs">
      A federal government website managed
      <br />
      and paid for by the U.S. Centers for Medicare &<br />
      Medicaid Services.
    </p>
  </>
);

const FooterLinks: React.FC = () => (
  <ul
    className="inline-flex flex-wrap items-center gap-1"
    role="list"
    data-testid="demonstration-attributes-list"
  >
    <li>
      <a href="#" className={linkStyles}>
        References
      </a>
    </li>
    |
    <li>
      <a href="#" className={linkStyles}>
        Contact Us
      </a>
    </li>
    |
    <li>
      <a href="#" className={linkStyles}>
        FAQ
      </a>
    </li>
  </ul>
);

const FooterUpper: React.FC = () => (
  <div className="flex w-full pl-1 pt-1 pb-1 pr-0">
    <div className="w-1/3 text-left flex">
      <FooterLogo />
    </div>
    <div className="w-1/3 text-center">
      <FooterLinks />
    </div>
    <div className="flex w-1/3 justify-end">
      <a className="block">
        <img className="block" height="40px" alt="Logo" src="/img/logo.png" />
      </a>
    </div>
  </div>
);

const FooterLower: React.FC = () => (
  <div className="flex w-full bg-brand text-white p-1">
    <div className="w-1/3" />
    <div className="w-1/3 text-center">DEMOS version {DEMOS_VERSION}</div>
    <div className="w-1/3 text-right">{DEMOS_ADDRESS}</div>
  </div>
);

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t flex flex-col">
      <FooterUpper />
      <FooterLower />
    </footer>
  );
};
