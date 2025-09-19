// Function is used to address optional GQL fields that cannot be null
export function checkOptionalNotNullFields<T>(optionalFields: Array<keyof T>, input: T) {
  const failedFieldList = [];
  for (const field of optionalFields) {
    const value = input[field];
    if (value === null) {
      failedFieldList.push(String(field));
    }
  }
  if (failedFieldList.length > 0) {
    const errorLines = [];
    for (const field of failedFieldList) {
      errorLines.push(`Field (${field}) may not be set to null if it is provided.`);
    }
    const errorMessage: string = errorLines.join(", ");
    throw new Error(errorMessage);
  } else {
    return null;
  }
}
