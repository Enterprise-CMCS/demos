import React from "react";
import { BaseDemonstrationHeader } from "pages/DemonstrationDetail/BaseDemonstrationHeader";
import { useParams } from "react-router-dom";

export const DemonstrationDetailHeader = () => {
  const params = useParams<{ demonstrationId: string }>();

  if (!params.demonstrationId) {
    throw new Error(
      "DemonstrationDetailHeader must be rendered within a route with :demonstrationId param"
    );
  }

  return <BaseDemonstrationHeader demonstrationId={params.demonstrationId} />;
};
