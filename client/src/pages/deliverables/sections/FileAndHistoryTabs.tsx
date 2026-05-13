import React from "react";

import { HorizontalSectionTabs, Tab } from "layout/Tabs";

import { CmsFilesTab } from "./CmsFilesTab";
import type { DeliverableDetailsManagementDeliverable } from "../DeliverableDetailsManagementPage";
import { HistoryTab, type DeliverableHistoryRow } from "./HistoryTab";
import { StateFilesTab } from "./StateFilesTab";
import { Button } from "components/button/Button";
import { useDialog } from "components/dialog/DialogContext";
import { canCompleteReview } from "components/dialog/deliverable";
import { getCurrentUser } from "components/user/UserContext";
import { DeliverableStatus, PersonType } from "demos-server";

type DeliverableActionRow = DeliverableDetailsManagementDeliverable["deliverableActions"][number];

const toHistoryRow = (action: DeliverableActionRow): DeliverableHistoryRow => ({
  id: action.id,
  event: action.actionType,
  date: new Date(action.actionTimestamp),
  user: action.userFullName,
  details: action.details,
});

export const FILE_AND_HISTORY_TABS_NAME = "file-and-history-tabs";
export const FILE_AND_HISTORY_ACTIONS_NAME = "file-and-history-actions";

export const RESUBMISSION_DISABLED_STATUSES: ReadonlySet<DeliverableStatus> =
  new Set(["Upcoming", "Past Due", "Accepted", "Approved", "Received and Filed"]);

export const isResubmissionDisabled = (status: DeliverableStatus): boolean =>
  RESUBMISSION_DISABLED_STATUSES.has(status);

const COMPLETE_REVIEW_PERSON_TYPES: ReadonlySet<PersonType> = new Set([
  "demos-admin",
  "demos-cms-user",
]);

const TABS = {
  STATE_FILES: "state_files",
  CMS_FILES: "cms_files",
  HISTORY: "history",
};

const buildTabLabel = (label: string, count: number) => (count > 0 ? `${label} (${count})` : label);

export const FileAndHistoryTabs: React.FC<{
  deliverable: DeliverableDetailsManagementDeliverable;
}> = ({ deliverable }) => {
  const stateFiles = deliverable.stateDocuments;
  const cmsFiles = deliverable.cmsDocuments;
  const historyRows: DeliverableHistoryRow[] = deliverable.deliverableActions.map(toHistoryRow);

  const { showRequestResubmissionDeliverableDialog, showCompleteReviewDeliverableDialog } =
    useDialog();
  const { currentUser } = getCurrentUser();
  const userPersonType = currentUser?.person.personType;
  const isCompleteReviewAllowedForUser =
    !!userPersonType && COMPLETE_REVIEW_PERSON_TYPES.has(userPersonType);
  const isCompleteReviewDisabled =
    !isCompleteReviewAllowedForUser ||
    !canCompleteReview(deliverable.status, deliverable.extensionRequests);

  const handleRequestResubmission = () => {
    showRequestResubmissionDeliverableDialog({
      id: deliverable.id,
      dueDate: deliverable.dueDate,
    });
  };

  const handleCompleteReview = () => {
    showCompleteReviewDeliverableDialog({ id: deliverable.id });
  };

  return (
    <div data-testid={FILE_AND_HISTORY_TABS_NAME}>
      <HorizontalSectionTabs defaultValue={TABS.STATE_FILES} variant="bordered">
        <Tab label={buildTabLabel("State Files", stateFiles.length)} value={TABS.STATE_FILES}>
          <StateFilesTab files={stateFiles} />
        </Tab>
        <Tab label={buildTabLabel("CMS Files", cmsFiles.length)} value={TABS.CMS_FILES}>
          <CmsFilesTab files={cmsFiles} />
        </Tab>
        <Tab label="History" value={TABS.HISTORY}>
          <HistoryTab rows={historyRows} />
        </Tab>
      </HorizontalSectionTabs>
      <div data-testid={FILE_AND_HISTORY_ACTIONS_NAME} className="flex justify-end mt-2 gap-2">
        <Button
          onClick={handleRequestResubmission}
          size="large"
          name="button-actions-request-resubmission"
          disabled={isResubmissionDisabled(deliverable.status)}
        >
          Request Re-submission
        </Button>
        <Button
          disabled={true}
          onClick={() => {}}
          size="large"
          name="button-actions-submit-deliverable"
        >
          Submit Deliverable
        </Button>
        <Button
          disabled={isCompleteReviewDisabled}
          onClick={handleCompleteReview}
          size="large"
          name="button-actions-complete-review"
        >
          Complete Review
        </Button>
      </div>
    </div>
  );
};
