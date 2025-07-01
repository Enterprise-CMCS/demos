import { useEffect } from "react";
import { useHeaderConfig } from "components/header/HeaderConfigContext";

export const usePageHeader = (lowerContent: React.ReactNode) => {
  const { setHeaderConfig } = useHeaderConfig();

  useEffect(() => {
    setHeaderConfig({ lowerContent });

    return () => {
      setHeaderConfig({ lowerContent: undefined });
    };
  }, [lowerContent, setHeaderConfig]);
};
