import React, { useMemo, useState } from "react";

import { Notice, NoticeVariant } from "components/notice/Notice";
import { formatDateForDisplay } from "util/formatDate";
import { differenceInCalendarDays, parseISO } from "date-fns";

export const CompletenessNotice = ({
  completenessReviewDate,
  completenessComplete,
}: {
  completenessReviewDate?: string;
  completenessComplete: boolean;
}) => {
  const [isNoticeDismissed, setNoticeDismissed] = useState(
    !(completenessReviewDate && !completenessComplete)
  );

  const noticeContent = useMemo(() => {
    if (!completenessReviewDate) return null;
    const noticeDueDateValue = parseISO(completenessReviewDate ?? "");
    const daysLeft = differenceInCalendarDays(noticeDueDateValue, new Date());
    if (daysLeft > 1) {
      return {
        title: `${daysLeft} days left`,
        description: `This Demonstration must be declared complete by ${formatDateForDisplay(noticeDueDateValue)}`,
        variant: "warning" as NoticeVariant,
      };
    }
    if (daysLeft === 1) {
      return {
        title: "1 day left in Completion Period",
        description: `This Demonstration must be declared complete by ${formatDateForDisplay(noticeDueDateValue)}`,
        variant: "error" as NoticeVariant,
      };
    } else {
      return {
        title: `${Math.abs(daysLeft)} days past due`,
        description: `This Demonstration completeness was due on ${formatDateForDisplay(noticeDueDateValue)}`,
        variant: "error" as NoticeVariant,
      };
    }
  }, [completenessReviewDate]);

  if (isNoticeDismissed || !noticeContent) return null;

  return (
    <Notice
      title={noticeContent.title}
      description={noticeContent.description}
      variant={noticeContent.variant}
      onDismiss={() => setNoticeDismissed(true)}
    />
  );
};
