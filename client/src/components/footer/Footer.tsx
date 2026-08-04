import { HhsLogo } from "components/brand/HhsLogo";
import { LogoSimplified } from "components/brand/LogoSimplified";
import { DebugOnly } from "components/debug/DebugOnly";
import { getCurrentUser } from "components/user/UserContext";
import React from "react";
import { tw } from "tags/tw";
import { TypedDocumentNode } from "@apollo/client";
import { Reference, TagName } from "demos-server";
import gql from "graphql-tag";

export const DEMOS_ADDRESS = "7500 Security Boulevard Baltimore, MD 21244";
export const CONTACT_US_MAILTO = "mailto:DEMOS_Help@cms.hhs.gov";
export const REFERENCES_PATH = "/references";
export const DEMOS_VIDEOS_LINK =
  "https://app.box.com/folder/405875918185?s=bu3ebr1fi8pral6hlqwrttnw4xpozgn1";

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
  const { currentUser } = getCurrentUser();
  const isCmsOrAdmin =
    currentUser.person.personType === "demos-admin" ||
    currentUser.person.personType === "demos-cms-user";

  return (
    <ul
      className="inline-flex flex-wrap items-center gap-1 text-text-font"
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
      {isCmsOrAdmin && (
        <>
          |
          <li>
            <a href={DEMOS_VIDEOS_LINK} className={linkStyles}>
              DEMOS Orientation Videos
            </a>
          </li>
        </>
      )}
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
    <div className="w-1/3">
      <DebugOnly>git commit: {__GIT_COMMIT__}</DebugOnly>
    </div>
    <div className="w-1/3" />
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
