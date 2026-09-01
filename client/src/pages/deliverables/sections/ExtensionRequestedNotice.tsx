import React from "react";
import { Button } from "components/button";
import { WarningIcon } from "components/icons";

export const REVIEW_EXTENSION_REQUEST_BUTTON_NAME = "button-review-extension-request";
export const EXTENSION_REQUESTED_NOTICE_NAME = "extension-requested-notice";

export const ExtensionRequestedNotice: React.FC<{
  requesterName: string;
  onReviewRequest: () => void;
}> = ({ requesterName, onReviewRequest }) => {
  return (
    <div
      className="flex items-center gap-2 border border-border-alert border-l-[6px] rounded-sm bg-white px-1 py-1"
      data-testid={EXTENSION_REQUESTED_NOTICE_NAME}
    >
      <span className="shrink-0" aria-hidden="true">
        <WarningIcon width="28" height="28" />
      </span>
      <div className="flex-1 leading-2">
        <p className="text-[15px] font-bold text-text-font">Extension Requested</p>
        <p className="text-sm text-text-font">
          {requesterName} has requested an extension on this deliverable.
        </p>
      </div>
      <Button
        type="button"
        size="small"
        name={REVIEW_EXTENSION_REQUEST_BUTTON_NAME}
        onClick={onReviewRequest}
      >
        Review Request
      </Button>
    </div>
  );
};
