// Shared utility functions for dialog form data transformation
export const createFormDataWithDates = <T extends Record<string, unknown>>(
  baseData: T,
  effectiveDate?: string,
  expirationDate?: string
): T & { effectiveDate?: Date; expirationDate?: Date } => ({
    ...baseData,
    ...(effectiveDate && { effectiveDate: new Date(effectiveDate) }),
    ...(expirationDate && { expirationDate: new Date(expirationDate) }),
  });

export const createSuccessMessages = (addMessage: string, editMessage: string) => ({
  add: addMessage,
  edit: editMessage,
});
