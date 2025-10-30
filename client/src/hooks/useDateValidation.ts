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
    // Only validate if we have complete, valid dates (YYYY-MM-DD format)
    const isCompleteDate = /^\d{4}-\d{2}-\d{2}$/.test(expirationDate);

    if (effectiveDate && isCompleteDate && expirationDate < effectiveDate) {
      setExpirationError("Expiration Date cannot be before Effective Date.");
      return;
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
