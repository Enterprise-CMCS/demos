import { useEffect } from "react";

import { useDemonstration } from "./useDemonstration";

export const useDemonstrationOptions = () => {
  const { getAllDemonstrations } = useDemonstration();

  // Fetch demonstrations for dropdown
  useEffect(() => {
    getAllDemonstrations.trigger();
  }, [getAllDemonstrations.trigger]);

  // Convert demonstrations to options format for the dropdown
  const demoOptions =
    getAllDemonstrations.data?.map((demo) => ({
      label: demo.name,
      value: demo.id,
    })) || [];

  return {
    demoOptions,
    loading: getAllDemonstrations.loading,
    error: getAllDemonstrations.error,
  };
};
