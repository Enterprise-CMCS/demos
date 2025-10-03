import { SetBundleDateInput } from "demos-server";
import { formatDateAsIsoString } from "util/formatDate";

export const getQueryForSetBundleDate = (setBundleDateInput: SetBundleDateInput): string => {
  const isoDateString = formatDateAsIsoString(setBundleDateInput.dateValue);
  return `
    mutation SetBundleDate {
      setBundleDate(input: {
        bundleId: "${setBundleDateInput.bundleId}",
        dateType: ${setBundleDateInput.dateType},
        dateValue: "${isoDateString}"
      })
    }
  `;
};
