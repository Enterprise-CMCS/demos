import { HhsLogo } from "components/brand/HhsLogo";
import { LogoSimplified } from "components/brand/LogoSimplified";
import { useToast } from "components/toast";
import React from "react";
import { tw } from "tags/tw";
import { useDownloadFaq } from "./useDownloadFaq";

const DEMOS_ADDRESS = "7500 Security Boulevard Baltimore, MD 21244";
const DEMOS_VERSION = "1.0.001";

const linkStyles = tw`text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded`;

const FooterLinks: React.FC = () => {
  const { showError } = useToast();
  const { downloadFaq } = useDownloadFaq();

  const handleFaqClick = async () => {
    try {
      await downloadFaq();
    } catch {
      showError("Unable to download the FAQ right now. Please try again.");
    }
  };

  return (
    <ul
      className="inline-flex flex-wrap items-center gap-1 text-gray-400"
      role="list"
      data-testid="demonstration-attributes-list"
    >
      <li>
        <a href="references" className={linkStyles}>
          References
        </a>
      </li>
      |
      <li>
        <a href="mailto:DEMOS_Help@cms.hhs.gov" className={linkStyles}>
          Contact Us
        </a>
      </li>
      |
      <li>
        <button type="button" onClick={handleFaqClick} className={linkStyles}>
          FAQ
        </button>
      </li>
    </ul>
  );
};

const FooterUpper: React.FC = () => (
  <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-8 px-12 py-6">
    <div className="justify-self-start text-left">
      <HhsLogo />
    </div>
    <div className="justify-self-center text-center">
      <FooterLinks />
    </div>
    <div className="justify-self-end">
      <LogoSimplified />
    </div>
  </div>
);

const FooterLower: React.FC = () => (
  <div className="flex w-full items-center bg-brand px-4 py-1 text-white">
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
