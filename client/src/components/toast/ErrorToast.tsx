import React from "react";
import { BaseToast } from "./BaseToast";

interface ErrorToastProps {
  message: string;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({
  message,
}) => (
  <BaseToast toastType="error" message={message}/>
);
