import React from "react";
import { BaseToast } from "./BaseToast";

interface WarningToastProps {
  message: string;
}

export const WarningToast: React.FC<WarningToastProps> = ({
  message,
}) => (
  <BaseToast toastType="warning" message={message}/>
);
