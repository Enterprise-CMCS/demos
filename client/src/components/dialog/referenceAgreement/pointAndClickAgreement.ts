import type { ReferenceAgreement } from "demos-server";

const POINT_AND_CLICK_AGREEMENT_TEMPLATE_ID =
  "national-measure-stewards-terms-and-conditions";
const POINT_AND_CLICK_AGREEMENT_NAME =
  "National Measure Stewards Terms and Conditions";
const POINT_AND_CLICK_AGREEMENT_FILE_NAME = "point-click-agreement.pdf";

export const POINT_AND_CLICK_AGREEMENT = {
  id: POINT_AND_CLICK_AGREEMENT_TEMPLATE_ID,
  name: POINT_AND_CLICK_AGREEMENT_NAME,
  createdAt: new Date("2026-08-17T00:00:00.000Z"),
  fileName: POINT_AND_CLICK_AGREEMENT_FILE_NAME,
  url: "/reference-agreements/point-click-agreement.pdf",
} satisfies Pick<ReferenceAgreement, "id" | "name" | "createdAt"> & {
  fileName: string;
  url: string;
};
