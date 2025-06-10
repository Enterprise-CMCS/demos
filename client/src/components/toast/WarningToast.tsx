import React from "react";
import { BaseToast } from "./BaseToast";

interface WarningToastProps {
  message: string;
  onDismiss: () => void;
}

export const WarningToast: React.FC<WarningToastProps> = ({
  message,
  onDismiss,
}) => (
  <BaseToast toastType="warning" message={message} onDismiss={onDismiss} />
);
