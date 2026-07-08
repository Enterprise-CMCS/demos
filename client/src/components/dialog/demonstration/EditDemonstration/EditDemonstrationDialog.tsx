import React from "react";

import { Spinner } from "components/loading/Spinner";
import { getDateEst } from "util/formatDate";

import {
  DEMONSTRATION_DIALOG_DESCRIPTION_NAME,
  EditDemonstrationFormData,
  getUpdateDemonstrationInput,
} from "./EditDemonstrationForm";
import { EditDemonstrationDialogContent } from "./EditDemonstrationDialogContent";
import {
  EDIT_DEMONSTRATION_DIALOG_QUERY as GET_DEMONSTRATION_BY_ID_QUERY,
  EditDemonstrationDialogQueryData,
  useEditDemonstrationDialogData,
} from "./useEditDemonstrationDialogData";
import { UPDATE_DEMONSTRATION_MUTATION } from "./useUpdateDemonstration";

const getInitialDemonstration = (
  demonstration: EditDemonstrationDialogQueryData["demonstration"]
): EditDemonstrationFormData => ({
  name: demonstration.name,
  description: demonstration.description || "",
  stateId: demonstration.state.id,
  sdgDivision: demonstration.sdgDivision,
  signatureLevel: demonstration.signatureLevel,
  projectOfficerUserId: demonstration.primaryProjectOfficer.id,
  effectiveDate: demonstration.effectiveDate && getDateEst(demonstration.effectiveDate),
  expirationDate: demonstration.expirationDate && getDateEst(demonstration.expirationDate),
});

export {
  DEMONSTRATION_DIALOG_DESCRIPTION_NAME,
  GET_DEMONSTRATION_BY_ID_QUERY,
  UPDATE_DEMONSTRATION_MUTATION,
  getUpdateDemonstrationInput,
};

export const EditDemonstrationDialog = ({ demonstrationId }: { demonstrationId: string }) => {
  const { demonstration, loading, error } = useEditDemonstrationDialogData(demonstrationId);

  if (loading) {
    return <Spinner />;
  }

  if (error || !demonstration) {
    return <div>Error loading demonstration data</div>;
  }

  return (
    <EditDemonstrationDialogContent
      demonstrationId={demonstration.id}
      initialDemonstration={getInitialDemonstration(demonstration)}
      isApproved={demonstration.status === "Approved"}
    />
  );
};
