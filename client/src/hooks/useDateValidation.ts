import { useState } from "react";

export const useDateValidation = () => {
  const [expirationError, setExpirationError] = useState("");

  const handleEffectiveDateChange = (
    effectiveDate: string,
    expirationDate: string,
    setEffectiveDate: (date: string) => void,
    setExpirationDate: (date: string) => void
  ) => {
    setEffectiveDate(effectiveDate);
    if (expirationDate && expirationDate < effectiveDate) {
      setExpirationDate("");
    }
  };

  const handleExpirationDateChange = (
    expirationDate: string,
    effectiveDate: string,
    setExpirationDate: (date: string) => void
  ) => {
    if (effectiveDate && expirationDate < effectiveDate) {
      setExpirationError("Expiration Date cannot be before Effective Date.");
    } else {
      setExpirationError("");
      setExpirationDate(expirationDate);
    }
  };

  return {
    expirationError,
    setExpirationError,
    handleEffectiveDateChange,
    handleExpirationDateChange,
  };
};
