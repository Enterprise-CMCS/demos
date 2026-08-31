import React from "react";
import { Button } from "components/button";
import { WarningIcon } from "components/icons";

export const REVIEW_RENEWAL_REQUEST_BUTTON_NAME = "button-review-renewal-request";
export const RENEWAL_REQUESTED_NOTICE_NAME = "renewal-requested-notice";

export const RenewalRequestedNotice: React.FC<{
  requesterName: string;
  onReviewRequest: () => void;
}> = ({ requesterName, onReviewRequest }) => {
  return (
    <div
      className="flex items-center gap-2 border border-border-alert border-l-[6px] rounded-sm bg-white px-1 py-1"
      data-testid={RENEWAL_REQUESTED_NOTICE_NAME}
    >
      <span className="shrink-0" aria-hidden="true">
        <WarningIcon width="28" height="28" />
      </span>
      <div className="flex-1 leading-2">
        <p className="text-[15px] font-bold text-text-font">Renewal Requested</p>
        <p className="text-sm text-text-font">
          {requesterName} has requested a renewal on this deliverable.
        </p>
      </div>
      <Button
        type="button"
        size="small"
        name={REVIEW_RENEWAL_REQUEST_BUTTON_NAME}
        onClick={onReviewRequest}
      >
        Review Request
      </Button>
    </div>
  );
};
