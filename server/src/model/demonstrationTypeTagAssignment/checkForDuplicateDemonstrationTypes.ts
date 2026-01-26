import { SetDemonstrationTypesInput } from "../../types";
import { findDuplicates } from "../../validationUtilities";

export function checkForDuplicateDemonstrationTypes(input: SetDemonstrationTypesInput): void {
  const inputDemonstrationTypes = input.demonstrationTypes.map(
    (demonstrationType) => demonstrationType.demonstrationTypeName
  );
  const duplicates = findDuplicates(inputDemonstrationTypes);
  if (duplicates.length > 0) {
    throw new Error(
      `The input contained the same demonstrationTypeName more than once for ` +
        `these demonstrationTypeNames: ${duplicates.join(", ")}.`
    );
  }
}
