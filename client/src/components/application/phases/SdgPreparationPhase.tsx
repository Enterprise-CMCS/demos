import React from "react";
import { tw } from "tags/tw";

import { Button, SecondaryButton } from "components/button";

const STYLES = {
  pane: tw`bg-white p-8`,
  grid: tw`relative grid grid-cols-2 gap-10`,
  divider: tw`pointer-events-none absolute left-1/2 top-0 h-full border-l border-border-subtle`,
  title: tw`text-xl font-semibold mb-1`,
  helper: tw`text-sm text-text-placeholder mb-1`,
  header: tw`min-h-[88px]`,
  actions: tw`flex justify-end mt-2 gap-2`,
};

export const SdgPreparationPhase = () => {
  const SdgWorkplanSection = () => (
    <div aria-labelledby="sdg-workplan-title">
      <div className={STYLES.header}>
        <h4 id="sdg-workplan-title" className={STYLES.title}>
          SDG WORKPLAN
        </h4>
        <p className={STYLES.helper}>
          Ensure the expected approval date is reasonable based on required reviews and the
          complexity of the application
        </p>
      </div>
      <div className="flex flex-col gap-8 mt-2 text-sm text-text-placeholder">
        <label className="block text-sm font-bold mb-1">
          <span className="text-text-warn mr-1">*</span>
          Expected Approval Date
        </label>
        <input
          type="date"
          name="expected-approval-date"
          data-testid="datepicker-expected-approval-date"
          className="w-full border border-border-fields px-1 py-1 text-sm rounded"
          aria-required={true}
          placeholder="Expected Approval Date"
        />
        {/* <DatePicker
          className="w-1/2"
          slotProps={{
            textField: {
              placeholder: "Expected Approval Date",
              name: "expected-approval-date",
            },
          }}
          required
          name="expected-approval-date"
        >
          Expected Approval Date
        </DatePicker> */}
      </div>
    </div>
  );

  const InternalReviewsSection = () => (
    <div aria-labelledby="sdg-reviews-title">
      <div className={STYLES.header}>
        <h4 id="sdg-reviews-title" className={STYLES.title}>
          INTERNAL REVIEWS
        </h4>
        <p className={STYLES.helper}>Record the occurrence of the key review meetings</p>
      </div>
      <div className="flex flex-col gap-8 mt-2 text-sm text-text-placeholder">
        <label className="block text-sm font-bold mb-1">
          <span className="text-text-warn mr-1">*</span>
          SME Initial Review Date
        </label>
        <input
          name="sme-initial-review-date"
          data-testid="datepicker-sme-initial-review-date"
          type="date"
          className="w-full border border-border-fields px-1 py-1 text-sm rounded"
          aria-required={true}
          placeholder="SME Initial Review Date"
        />
        {/* <DatePicker
          className="w-1/2"
          slotProps={{
            textField: {
              placeholder: "SME Initial Review Date",
              name: "sme-initial-review-date",
            },
          }}
          required
          name="sme-initial-review-date"
        >
          SME Initial Review Date
        </DatePicker> */}
        <label className="block text-sm font-bold mb-1">
          <span className="text-text-warn mr-1">*</span>
          FRT Initial Meeting Date
        </label>
        <input
          name="frt-initial-meeting-date"
          data-testid="datepicker-frt-intial-meeting-date"
          type="date"
          className="w-full border border-border-fields px-1 py-1 text-sm rounded"
          aria-required={true}
          placeholder="FRT Initial Meeting Date"
        />
        {/* <DatePicker
          className="w-1/2"
          slotProps={{
            textField: {
              placeholder: "FRT Initial Meeting Date",
              name: "frt-initial-meeting-date",
            },
          }}
          required
          name="frt-intial-meeting-date"
        >
          FRT Initial Meeting Date
        </DatePicker> */}
        <label className="block text-sm font-bold mb-1">
          <span className="text-text-warn mr-1">*</span>
          BNPMT Initial Meeting Date
        </label>
        <input
          name="bnpmt-intial-meeting-date"
          data-testid="datepicker-bnpmt-intial-meeting-date"
          type="date"
          className="w-full border border-border-fields px-1 py-1 text-sm rounded"
          aria-required={true}
          placeholder="BNPMT Initial Meeting Date"
        />
        {/* <DatePicker
          className="w-1/2"
          slotProps={{
            textField: {
              placeholder: "BNPMT Initial Meeting Date",
              name: "bnpmt-intial-meeting-date",
            },
          }}
          required
          name="bnpmt-intial-meeting-date"
        >
          BNPMT Initial Meeting Date
        </DatePicker> */}
      </div>

      <div className={STYLES.actions}>
        <SecondaryButton
          onClick={() => {
            console.log("Save For Later Clicked");
          }}
          size="large"
          name="sdg-save-for-later"
        >
          Save For Later
        </SecondaryButton>
        <Button
          onClick={() => {
            console.log("Finish Clicked");
          }}
          size="large"
          name="sdg-finish"
          disabled
        >
          Finish
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <h3 className="text-brand text-[22px] font-bold tracking-wide mb-1">SDG PREPARATION</h3>
      <p className="text-sm text-text-placeholder mb-4">
        Plan and conduct internal and preparation tasks
      </p>

      <section className={STYLES.pane}>
        <div className={STYLES.grid}>
          <span aria-hidden className={STYLES.divider} />
          <SdgWorkplanSection />
          <InternalReviewsSection />
        </div>
      </section>
    </div>
  );
};
