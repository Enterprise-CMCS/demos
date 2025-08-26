import React from "react";
import { BaseToast } from "./BaseToast";

interface SuccessToastProps {
  message: string;
  onDismiss: () => void;
}

export const SuccessToast: React.FC<SuccessToastProps> = ({
  message,
  onDismiss,
}) => (
  <BaseToast toastType="success" message={message} onDismiss={onDismiss} />
);
