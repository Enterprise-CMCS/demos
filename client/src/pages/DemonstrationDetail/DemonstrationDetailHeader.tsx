import React from "react";
import { DemonstrationHeader } from "pages/DemonstrationDetail/DemonstrationHeader";
import { useParams } from "react-router-dom";

export const DemonstrationDetailHeader = () => {
  const params = useParams<{ demonstrationId: string }>();

  if (!params.demonstrationId) {
    throw new Error(
      "DemonstrationDetailHeader must be rendered within a route with :demonstrationId param"
    );
  }

  return <DemonstrationHeader demonstrationId={params.demonstrationId} />;
};
