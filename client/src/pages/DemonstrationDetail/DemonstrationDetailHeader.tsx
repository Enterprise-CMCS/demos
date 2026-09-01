import React from "react";
import { BaseDemonstrationHeader } from "pages/DemonstrationDetail/BaseDemonstrationHeader";
import { useParams } from "react-router-dom";

export const DemonstrationDetailHeader = () => {
  const params = useParams<{ demonstrationId: string }>();
  if (!params.demonstrationId) {
    return "Error: Missing demonstration ID";
  }

  return <BaseDemonstrationHeader demonstrationId={params.demonstrationId} />;
};
