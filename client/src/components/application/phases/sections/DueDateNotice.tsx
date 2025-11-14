
import React, { useState } from "react";

import { Notice, NoticeVariant } from "components/notice";
import { useToast } from "components/toast";
import { differenceInCalendarDays } from "date-fns";
import { formatDate } from "util/formatDate";
import { parseInputDate } from "util/parseDate";

export const DueDateNotice = ({
  dueDate,
  phaseComplete,
  shouldPhaseBeAutomaticallyDismissedIfPhaseIsComplete,
  descriptionToAppendDateTo,
} : {
  dueDate: string;
  phaseComplete: boolean;
  shouldPhaseBeAutomaticallyDismissedIfPhaseIsComplete: boolean;
  descriptionToAppendDateTo: string;
}) => {
  const { showError } = useToast();
  const [isNoticeDismissed, setNoticeDismissed] = useState(
    shouldPhaseBeAutomaticallyDismissedIfPhaseIsComplete && phaseComplete === true
  );

  if (dueDate) {
    const noticeDueDateValue = parseInputDate(dueDate);
    if (!noticeDueDateValue) {
      console.error("Error parsing federal end date for completeness notice:", dueDate);
      showError("Error parsing federal end date for completeness notice.");
      return null;
    }

    const noticeDaysValue = differenceInCalendarDays(noticeDueDateValue, new Date());

    // determine notice title/description from days
    const getNoticeTitle = () => {
      const daysLeft = noticeDaysValue;
      if (daysLeft < 0) {
        const daysPastDue = Math.abs(daysLeft);
        return `${daysPastDue} Day${daysPastDue === 1 ? "" : "s"} Past Due`;
      }
      return `${daysLeft} day${daysLeft === 1 ? "" : "s"} left in Federal Comment Period`;
    };

    const formattedNoticeDate = formatDate(noticeDueDateValue);
    const noticeDescription = formattedNoticeDate
      ? `${descriptionToAppendDateTo} ${formattedNoticeDate}`
      : undefined;

    // go from yellow to red at 1 day left.
    const noticeVariant: NoticeVariant = noticeDaysValue <= 1 ? "error" : "warning";
    const shouldRenderNotice = Boolean(!isNoticeDismissed);

    if (shouldRenderNotice) {
      return (
        <Notice
          variant={noticeVariant}
          title={getNoticeTitle()}
          description={noticeDescription}
          onDismiss={() => setNoticeDismissed(true)}
          className="mb-6"
        />
      );
    }
  }
};
