import React from "react";
import { BaseToast } from "./BaseToast";

interface InfoToastProps {
  message: string;
  onDismiss: () => void;
}

export const InfoToast: React.FC<InfoToastProps> = ({
  message,
  onDismiss,
}) => (
  <BaseToast toastType="info" message={message} onDismiss={onDismiss} />
);
