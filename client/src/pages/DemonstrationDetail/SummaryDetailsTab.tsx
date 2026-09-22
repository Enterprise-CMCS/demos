import React from "react";

import { IconButton } from "components/button";
import { EditIcon } from "components/icons";
import { TabHeader } from "components/table/TabHeader";
import { SummaryDetailsTable } from "components/table/tables/SummaryDetailsTable";
import { useDialog } from "components/dialog/DialogContext";
import { getCurrentUser, isReadonly } from "components/user/UserContext";

export const SummaryDetailsTab: React.FC<{ demonstrationId: string }> = ({ demonstrationId }) => {
  const { currentUser } = getCurrentUser();
  const { showEditDemonstrationDialog } = useDialog();
  return (
    <>
      <TabHeader title="Summary Details">
        {!isReadonly(currentUser) && (
          <IconButton
            icon={<EditIcon />}
            name="button-edit-details"
            size="small"
            onClick={() => showEditDemonstrationDialog(demonstrationId)}
          >
            Edit Details
          </IconButton>
        )}
      </TabHeader>

      <SummaryDetailsTable demonstrationId={demonstrationId} />
    </>
  );
};
