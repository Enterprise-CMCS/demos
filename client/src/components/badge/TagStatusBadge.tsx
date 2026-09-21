import React from "react";
import { tw } from "tags/tw";
import type { TagStatus } from "demos-server";

// The server calls it "Unapproved"; the Type/Tag admin views display it as "Pending".
export const TAG_STATUS_LABELS: Record<TagStatus, string> = {
  Approved: "Approved",
  Unapproved: "Pending",
};

const BASE_STYLES = tw`inline-flex items-center rounded px-1 py-0.5 text-sm font-semibold
  whitespace-nowrap`;

const STATUS_STYLES: Record<TagStatus, string> = {
  Approved: tw`bg-success-lightest text-success-darkest`,
  Unapproved: tw`bg-info-light text-info-dark`,
};

export const TagStatusBadge = ({ approvalStatus }: { approvalStatus: TagStatus }) => (
  <span className={`${BASE_STYLES} ${STATUS_STYLES[approvalStatus]}`}>
    {TAG_STATUS_LABELS[approvalStatus]}
  </span>
);
