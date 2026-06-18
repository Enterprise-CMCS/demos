import React from "react";
import { gql, useMutation } from "@apollo/client";

import { HorizontalSectionTabs, Tab } from "layout/Tabs";

import { CmsFilesTab } from "./CmsFilesTab";
import {
  DELIVERABLE_DETAILS_QUERY,
  type DeliverableDetailsManagementDeliverable,
} from "../DeliverableDetailsManagementPage";
import type { DeliverableFileRow } from "./DeliverableFileTypes";
import { HistoryTab, type DeliverableHistoryRow } from "./HistoryTab";
import { STATE_FILES_SUBMIT_BUTTON_NAME, StateFilesTab } from "./StateFilesTab";
import { Button } from "components/button/Button";
import { useDialog } from "components/dialog/DialogContext";
import { canCompleteReview, isDeliverableEditable } from "components/dialog/deliverable";
import { useToast } from "components/toast";
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

export const SUBMIT_DELIVERABLE_MUTATION = gql`
  mutation SubmitDeliverable($id: ID!) {
    submitDeliverable(id: $id) {
      id
      status
    }
  }
`;

export const RESUBMISSION_DISABLED_STATUSES: ReadonlySet<DeliverableStatus> = new Set([
  "Upcoming",
  "Past Due",
  "Accepted",
  "Approved",
  "Received and Filed",
]);

export const isResubmissionDisabled = (status: DeliverableStatus): boolean =>
  RESUBMISSION_DISABLED_STATUSES.has(status);

export const FILE_DELETION_ALLOWED_STATUSES: ReadonlySet<DeliverableStatus> = new Set([
  "Upcoming",
  "Past Due",
]);

export const isFileDeletionLocked = (status: DeliverableStatus): boolean =>
  !FILE_DELETION_ALLOWED_STATUSES.has(status);

const CMS_STAFF_PERSON_TYPES: ReadonlySet<PersonType> = new Set(["demos-admin", "demos-cms-user"]);

const STATE_FILE_MANAGER_PERSON_TYPES: ReadonlySet<PersonType> = new Set([
  ...CMS_STAFF_PERSON_TYPES,
  "demos-state-user",
]);

const TABS = {
  STATE_FILES: "state_files",
  CMS_FILES: "cms_files",
  HISTORY: "history",
};

const buildTabLabel = (label: string, count: number) => (count > 0 ? `${label} (${count})` : label);

const fileRowToDialogFields = (file: DeliverableFileRow) => ({
  id: file.id,
  name: file.name,
  description: file.description ?? "",
  documentType: file.documentType,
  file: null,
});

export const FileAndHistoryTabs: React.FC<{
  deliverable: DeliverableDetailsManagementDeliverable;
}> = ({ deliverable }) => {
  const {
    showRequestResubmissionDeliverableDialog,
    showCompleteReviewDeliverableDialog,
    showAddDeliverableFileDialog,
    showEditDocumentDialog,
    showRemoveDocumentDialog,
  } = useDialog();
  const { currentUser } = getCurrentUser();
  const { showSuccess, showError } = useToast();
  const [submitDeliverableTrigger, { loading: submitLoading }] = useMutation(
    SUBMIT_DELIVERABLE_MUTATION
  );

  const stateFiles = deliverable.stateDocuments;
  const cmsFiles = deliverable.cmsDocuments;
  const historyRows: DeliverableHistoryRow[] = deliverable.deliverableActions.map(toHistoryRow);
  const isFinalized = !isDeliverableEditable(deliverable.status);
  const isDeleteLocked = isFileDeletionLocked(deliverable.status);
  const refetchAfterFileChange = [DELIVERABLE_DETAILS_QUERY];

  const userPersonType = currentUser.person.personType;
  const isCmsStaffUser = CMS_STAFF_PERSON_TYPES.has(userPersonType);
  const isCompleteReviewDisabled =
    !isCmsStaffUser || !canCompleteReview(deliverable.status, deliverable.extensionRequests);
  const canManageStateFiles = STATE_FILE_MANAGER_PERSON_TYPES.has(userPersonType);
  const canManageCmsFiles = isCmsStaffUser;

  const handleRequestResubmission = () => {
    showRequestResubmissionDeliverableDialog({
      id: deliverable.id,
      dueDate: deliverable.dueDate,
    });
  };

  const handleCompleteReview = () => {
    showCompleteReviewDeliverableDialog({ id: deliverable.id });
  };

  const handleAddStateFile = () => {
    showAddDeliverableFileDialog({
      deliverableId: deliverable.id,
      applicationId: deliverable.demonstration.id,
      isCmsFile: false,
      documentTypeSubset: deliverable.allowedDocumentTypes,
      refetchQueries: ["GetDeliverableDetails"],
    });
  };

  const handleAddCmsFile = () => {
    showAddDeliverableFileDialog({
      deliverableId: deliverable.id,
      applicationId: deliverable.demonstration.id,
      isCmsFile: true,
      documentTypeSubset: deliverable.allowedDocumentTypes,
      refetchQueries: ["GetDeliverableDetails"],
    });
  };

  const handleEditFile = (file: DeliverableFileRow) => {
    showEditDocumentDialog(fileRowToDialogFields(file), refetchAfterFileChange);
  };

  const handleDeleteFiles = (fileIds: string[]) => {
    showRemoveDocumentDialog(fileIds, { refetchQueries: refetchAfterFileChange });
  };

  const handleSubmitDeliverable = async () => {
    try {
      await submitDeliverableTrigger({
        variables: { id: deliverable.id },
        refetchQueries: refetchAfterFileChange,
        awaitRefetchQueries: true,
      });
      showSuccess("Deliverable submitted.");
    } catch (mutationError) {
      console.error(mutationError);
      showError("Unable to submit deliverable.");
    }
  };

  const isSubmitDisabled = isFinalized || stateFiles.length === 0 || submitLoading;

  return (
    <div data-testid={FILE_AND_HISTORY_TABS_NAME}>
      <HorizontalSectionTabs defaultValue={TABS.STATE_FILES} variant="bordered">
        <Tab label={buildTabLabel("State Files", stateFiles.length)} value={TABS.STATE_FILES}>
          <StateFilesTab
            files={stateFiles}
            disabled={isFinalized || !canManageStateFiles}
            deleteDisabled={isDeleteLocked}
            onAdd={canManageStateFiles ? handleAddStateFile : undefined}
            onEdit={canManageStateFiles ? handleEditFile : undefined}
            onDelete={canManageStateFiles ? handleDeleteFiles : undefined}
          />
        </Tab>
        <Tab label={buildTabLabel("CMS Files", cmsFiles.length)} value={TABS.CMS_FILES}>
          <CmsFilesTab
            files={cmsFiles}
            disabled={isFinalized || !canManageCmsFiles}
            deleteDisabled={isDeleteLocked}
            showActions={canManageCmsFiles}
            onAdd={canManageCmsFiles ? handleAddCmsFile : undefined}
            onEdit={canManageCmsFiles ? handleEditFile : undefined}
            onDelete={canManageCmsFiles ? handleDeleteFiles : undefined}
          />
        </Tab>
        <Tab label="History" value={TABS.HISTORY}>
          <HistoryTab rows={historyRows} />
        </Tab>
      </HorizontalSectionTabs>
      <div data-testid={FILE_AND_HISTORY_ACTIONS_NAME} className="flex justify-end mt-2 gap-2">
        {isCmsStaffUser ? (
          <Button
            onClick={handleRequestResubmission}
            size="large"
            name="button-actions-request-resubmission"
            disabled={isResubmissionDisabled(deliverable.status)}
          >
            Request Re-submission
          </Button>
        ) : null}
        <Button
          disabled={isSubmitDisabled}
          onClick={handleSubmitDeliverable}
          size="large"
          name={STATE_FILES_SUBMIT_BUTTON_NAME}
        >
          Submit Deliverable
        </Button>
        {isCmsStaffUser ? (
          <Button
            disabled={isCompleteReviewDisabled}
            onClick={handleCompleteReview}
            size="large"
            name="button-actions-complete-review"
          >
            Complete Review
          </Button>
        ) : null}
      </div>
    </div>
  );
};
