import React from "react";
import { Button } from "components/button";
import { InfoIcon } from "components/icons";

export const START_REVIEW_BUTTON_NAME = "button-start-review";
export const DELIVERABLE_REVIEW_NOTICE_NAME = "deliverable-review-notice";

type PendingReviewNoticeProps = {
  onStartReview: () => void;
  title?: string;
  description?: string;
};

export const PendingReviewNotice: React.FC<PendingReviewNoticeProps> = ({
  onStartReview,
  title = "Submission pending review",
  description = "State User has submitted deliverable(s) for review",
}) => {
  return (
    <div
      className="flex items-center gap-1 border border-brand border-l-[6px] rounded-sm bg-white px-1 py-1"
      data-testid={DELIVERABLE_REVIEW_NOTICE_NAME}
    >
      <span className="shrink-0 text-brand" aria-hidden="true">
        <InfoIcon />
      </span>
      <div className="flex-1 leading-2">
        <p className="text-[15px] font-bold text-text-font">{title}</p>
        <p className="text-sm text-text-font">{description}</p>
      </div>
      <Button type="button" size="small" name={START_REVIEW_BUTTON_NAME} onClick={onStartReview}>
        Start Review
      </Button>
    </div>
  );
};
