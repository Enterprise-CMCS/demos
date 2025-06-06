import React from "react";
import { BaseToast } from "./BaseToast";

interface SuccessToastProps {
  message: string;
}

export const SuccessToast: React.FC<SuccessToastProps> = ({
  message,
}) => (
  <BaseToast toastType="success" message={message}/>
);
