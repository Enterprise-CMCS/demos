import React from "react";
import { tw } from "tags/tw";

const BASE_BADGE_STYLES = tw`px-3 py-1 rounded`;
const COMPLETE_BADGE_STYLES = tw`bg-success text-white`;
const INCOMPLETE_BADGE_STYLES = tw`bg-warn-light text-black`;
const FONT_STYLES = tw`text-medium font-bold`;

export const CompletenessBadge = ({ isComplete }: { isComplete: boolean }) => (
  <div
    className={`${BASE_BADGE_STYLES} ${isComplete ? COMPLETE_BADGE_STYLES : INCOMPLETE_BADGE_STYLES}`}
  >
    <span className={FONT_STYLES}>{isComplete ? "Complete" : "Incomplete"}</span>
  </div>
);
