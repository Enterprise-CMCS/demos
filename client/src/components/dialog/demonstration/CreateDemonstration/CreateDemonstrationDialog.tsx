import React from "react";

import { getCurrentUser } from "components/user/UserContext";
import { CreateDemonstrationFormData } from "./CreateDemonstrationForm";
import { CreateDemonstrationDialogContent } from "./CreateDemonstrationDialogContent";

export const CreateDemonstrationDialog = () => {
  const userContext = getCurrentUser();
  const initialDemonstration: CreateDemonstrationFormData = {
    name: "",
    description: "",
    stateId: "",
    sdgDivision: undefined,
    projectOfficerUserId: userContext.currentUser.id,
  };

  return <CreateDemonstrationDialogContent initialDemonstration={initialDemonstration} />;
};
