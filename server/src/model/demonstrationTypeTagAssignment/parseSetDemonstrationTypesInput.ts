import { ParsedSetDemonstrationTypesInput } from ".";
import { SetDemonstrationTypesInput } from "../../types";
import { parseAndValidateEffectiveAndExpirationDates } from "../applicationDate";

export function parseSetDemonstrationTypesInput(
  input: SetDemonstrationTypesInput
): ParsedSetDemonstrationTypesInput {
  const parsedInput: ParsedSetDemonstrationTypesInput = {
    demonstrationId: input.demonstrationId,
    demonstrationTypesToUpsert: [],
    demonstrationTypesToDelete: [],
  };
  for (const demonstrationType of input.demonstrationTypes) {
    if (demonstrationType.demonstrationTypeDates === null) {
      parsedInput.demonstrationTypesToDelete.push(demonstrationType.demonstrationTypeName);
    } else {
      const parsedDateResult = parseAndValidateEffectiveAndExpirationDates({
        effectivePlainDate: demonstrationType.demonstrationTypeDates.effectivePlainDate,
        expirationPlainDate: demonstrationType.demonstrationTypeDates.expirationPlainDate,
      });
      parsedInput.demonstrationTypesToUpsert.push({
        demonstrationTypeName: demonstrationType.demonstrationTypeName,
        demonstrationTypeDates: {
          effectiveDate: parsedDateResult.effectiveDate,
          expirationDate: parsedDateResult.expirationDate,
        },
      });
    }
  }

  return parsedInput;
}
