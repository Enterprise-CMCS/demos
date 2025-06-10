import React from "react";
import { BaseToast } from "./BaseToast";

interface ErrorToastProps {
  message: string;
  onDismiss: () => void;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({
  message,
  onDismiss,
}) => (
  <BaseToast toastType="error" message={message} onDismiss={onDismiss} />
);
