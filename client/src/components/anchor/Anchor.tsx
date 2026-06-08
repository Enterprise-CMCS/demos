import React from "react";
import { tw } from "tags/tw";

const CLASSES = tw`
text-action
hover:underline
focus:outline-none
focus:ring-2
focus:ring-action-focus
rounded
`;

interface AnchorProps {
  name: string;
  href: string;
  children: React.ReactNode;
}

export const Anchor: React.FC<AnchorProps> = ({ name, href, children }) => (
  <a data-testid={name} href={href} className={CLASSES}>
    {children}
  </a>
);
