import React from "react";
import { SetApplicationNotesInput } from "demos-server";
import { SecondaryButton } from "components/button";

export const IncrementerButtons: React.FC<{
  demonstrationId: string;
  poAndOdgNoteContent?: string;
  setIncrementCount: React.Dispatch<React.SetStateAction<number>>;
  mutate: (input: SetApplicationNotesInput) => void;
}> = ({ demonstrationId, poAndOdgNoteContent, setIncrementCount, mutate }) => {
  const RAPID_INCREMENT_AMOUNT = 10;

  const incrementNoteContent = async (incrementAmount: number) => {
    const currentContentValue = poAndOdgNoteContent ? parseInt(poAndOdgNoteContent) : 0;
    for (let i = currentContentValue; i < currentContentValue + incrementAmount; i++) {
      await mutate({
        applicationId: demonstrationId,
        applicationNotes: [{ noteType: "PO and OGD", content: `${i + 1}` }],
      });
    }
    setIncrementCount((prev) => prev + incrementAmount);
  };

  const resetNoteContent = async () => {
    await mutate({
      applicationId: demonstrationId,
      applicationNotes: [{ noteType: "PO and OGD", content: "0" }],
    });
    setIncrementCount(0);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <div className="flex gap-3">
          <SecondaryButton size="large" name="button-reset-note-content" onClick={resetNoteContent}>
            Reset note content
          </SecondaryButton>
          <SecondaryButton
            size="large"
            name="button-increment-note-content"
            onClick={() => incrementNoteContent(1)}
          >
            Increment note
          </SecondaryButton>
          <SecondaryButton
            size="large"
            name="button-rapidly-increment-note-content"
            onClick={() => incrementNoteContent(RAPID_INCREMENT_AMOUNT)}
          >
            Rapidly increment note by: {RAPID_INCREMENT_AMOUNT}
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
};
