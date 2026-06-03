import { HhsLogo } from "components/brand/HhsLogo";
import { LogoSimplified } from "components/brand/LogoSimplified";
import { useToast } from "components/toast";
import React from "react";
import { tw } from "tags/tw";
import { TypedDocumentNode, useLazyQuery } from "@apollo/client";
import { Reference, TagName } from "demos-server";
import gql from "graphql-tag";
import { FAQ_REFERENCE_TAG } from "demos-server-constants";
import { useDownloadReference } from "hooks/useDownloadReference";

export const DEMOS_ADDRESS = "7500 Security Boulevard Baltimore, MD 21244";
export const CONTACT_US_MAILTO = "mailto:DEMOS_Help@cms.hhs.gov";
export const REFERENCES_PATH = "/references";

const linkStyles = tw`text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded cursor-pointer`;

export const GET_FAQ_REFERENCES_QUERY: TypedDocumentNode<
  {
    references: Pick<Reference, "id" | "createdAt">[];
  },
  {
    withTag: TagName;
  }
> = gql`
  query GetReferences($withTag: TagName) {
    references(withTag: $withTag) {
      id
      createdAt
    }
  }
`;

const FooterLinks: React.FC = () => {
  const { showError } = useToast();
  const { downloadReference } = useDownloadReference();

  const [getFaqReferenceMaterial] = useLazyQuery(GET_FAQ_REFERENCES_QUERY, {
    variables: { withTag: FAQ_REFERENCE_TAG },
  });

  const handleFaqClick = async () => {
    try {
      const { data } = await getFaqReferenceMaterial();
      const faqReferences = data?.references;
      if (!faqReferences || faqReferences.length === 0) {
        showError("No FAQ reference material found.");
        throw new Error("No FAQ reference material found.");
      }
      const latestFaqReference = faqReferences.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      )[0];

      await downloadReference({ id: latestFaqReference.id, acceptedAgreementId: null });
    } catch {
      showError("Unable to download the FAQ.");
    }
  };

  return (
    <ul
      className="inline-flex flex-wrap items-center gap-1 text-gray-400"
      role="list"
      data-testid="demonstration-attributes-list"
    >
      <li>
        <a href={REFERENCES_PATH} className={linkStyles}>
          References
        </a>
      </li>
      |
      <li>
        <a href={CONTACT_US_MAILTO} className={linkStyles}>
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
  <div className="flex w-full items-center px-2 py-1">
    <div className="flex w-1/3 items-center text-left">
      <HhsLogo />
    </div>
    <div className="flex w-1/3 items-center justify-center text-center">
      <FooterLinks />
    </div>
    <div className="flex w-1/3 items-center justify-end">
      <LogoSimplified />
    </div>
  </div>
);

const FooterLower: React.FC = () => (
  <div className="flex w-full bg-brand text-white p-1">
    <div className="w-1/3" />
    <div className="w-1/3"/>
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
