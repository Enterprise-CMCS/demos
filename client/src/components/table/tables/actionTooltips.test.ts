import { selectionTooltip, enabledDisabledTooltip } from "./actionTooltips";

describe("actionTooltips", () => {
  describe("selectionTooltip", () => {
    describe("exactly rule", () => {
      it("returns action when selection count matches exactly rule", () => {
        expect(selectionTooltip({
          action: "Edit",
          nounSingular: "Document",
          selectedCount: 1,
          rule: { kind: "exactly", count: 1 },
        })).toBe("Edit");
      });

      it("returns enabledText when provided and selection is valid", () => {
        expect(selectionTooltip({
          action: "Delete",
          nounSingular: "Contact",
          selectedCount: 1,
          rule: { kind: "exactly", count: 1 },
          enabledText: "Delete Contact",
        })).toBe("Delete Contact");
      });

      it("returns selection prompt when count is too low", () => {
        expect(selectionTooltip({
          action: "Edit",
          nounSingular: "Document",
          selectedCount: 0,
          rule: { kind: "exactly", count: 1 },
        })).toBe("Select a Document to Edit.");
      });

      it("returns selection prompt when count is too high", () => {
        expect(selectionTooltip({
          action: "Edit",
          nounSingular: "Type",
          selectedCount: 2,
          rule: { kind: "exactly", count: 1 },
        })).toBe("Select a Type to Edit.");
      });

      it("handles exactly 0 count correctly", () => {
        expect(selectionTooltip({
          action: "Download",
          nounSingular: "Report",
          selectedCount: 0,
          rule: { kind: "exactly", count: 0 },
        })).toBe("Download");
      });

      it("handles exactly multiple count correctly", () => {
        expect(selectionTooltip({
          action: "Manage",
          nounSingular: "Contact",
          selectedCount: 3,
          rule: { kind: "exactly", count: 3 },
        })).toBe("Manage");
      });
    });

    describe("atLeast rule", () => {
      it("returns action when selection count meets atLeast rule exactly", () => {
        expect(selectionTooltip({
          action: "Delete",
          nounSingular: "Document",
          selectedCount: 1,
          rule: { kind: "atLeast", count: 1 },
        })).toBe("Delete");
      });

      it("returns action when selection count exceeds atLeast rule", () => {
        expect(selectionTooltip({
          action: "Remove",
          nounSingular: "Type",
          selectedCount: 5,
          rule: { kind: "atLeast", count: 1 },
        })).toBe("Remove");
      });

      it("returns enabledText when provided and selection is valid", () => {
        expect(selectionTooltip({
          action: "Delete",
          nounSingular: "Contact",
          selectedCount: 3,
          rule: { kind: "atLeast", count: 1 },
          enabledText: "Delete Selected",
        })).toBe("Delete Selected");
      });

      it("returns selection prompt when count is below minimum", () => {
        expect(selectionTooltip({
          action: "Delete",
          nounSingular: "Document",
          selectedCount: 0,
          rule: { kind: "atLeast", count: 1 },
        })).toBe("Select a Document to Delete.");
      });

      it("handles atLeast 0 correctly (always valid)", () => {
        expect(selectionTooltip({
          action: "Download",
          nounSingular: "Record",
          selectedCount: 0,
          rule: { kind: "atLeast", count: 0 },
        })).toBe("Download");
      });

      it("handles higher atLeast threshold correctly", () => {
        expect(selectionTooltip({
          action: "Manage",
          nounSingular: "Account",
          selectedCount: 1,
          rule: { kind: "atLeast", count: 2 },
        })).toBe("Select an Account to Manage.");
      });
    });

    describe("article selection (a vs an)", () => {
      it('uses "a" for consonant-starting nouns', () => {
        expect(selectionTooltip({
          action: "Edit",
          nounSingular: "Document",
          selectedCount: 0,
          rule: { kind: "exactly", count: 1 },
        })).toBe("Select a Document to Edit.");
      });

      it('uses "an" for vowel-starting nouns', () => {
        expect(selectionTooltip({
          action: "Edit",
          nounSingular: "Account",
          selectedCount: 0,
          rule: { kind: "exactly", count: 1 },
        })).toBe("Select an Account to Edit.");
      });

      it('uses "an" for vowel-starting nouns (case insensitive)', () => {
        expect(selectionTooltip({
          action: "Remove",
          nounSingular: "Item",
          selectedCount: 0,
          rule: { kind: "atLeast", count: 1 },
        })).toBe("Select an Item to Remove.");
      });

      it("handles all vowels correctly", () => {
        ["Account", "Event", "Item", "Order", "Update"].forEach(noun => {
          const result = selectionTooltip({
            action: "Edit",
            nounSingular: noun,
            selectedCount: 0,
            rule: { kind: "exactly", count: 1 },
          });
          expect(result).toBe(`Select an ${noun} to Edit.`);
        });
      });
    });

    describe("edge cases", () => {
      it("handles empty string noun", () => {
        expect(selectionTooltip({
          action: "Edit",
          nounSingular: "",
          selectedCount: 0,
          rule: { kind: "exactly", count: 1 },
        })).toBe("Select a  to Edit.");
      });

      it("handles special characters in noun", () => {
        expect(selectionTooltip({
          action: "Download",
          nounSingular: "PDF-File",
          selectedCount: 0,
          rule: { kind: "exactly", count: 1 },
        })).toBe("Select a PDF-File to Download.");
      });

      it("handles very large counts", () => {
        expect(selectionTooltip({
          action: "Edit",
          nounSingular: "Record",
          selectedCount: 1000000,
          rule: { kind: "atLeast", count: 1 },
        })).toBe("Edit");
      });
    });
  });

  describe("enabledDisabledTooltip", () => {
    describe("enabled state", () => {
      it("returns enabledText when not disabled", () => {
        expect(enabledDisabledTooltip({
          enabledText: "Delete Contact",
          disabled: false,
        })).toBe("Delete Contact");
      });

      it("returns enabledText when not disabled, ignoring disabledReason", () => {
        expect(enabledDisabledTooltip({
          enabledText: "Edit Document",
          disabled: false,
          disabledReason: "This should be ignored",
        })).toBe("Edit Document");
      });
    });

    describe("disabled state", () => {
      it("returns disabledReason when provided", () => {
        expect(enabledDisabledTooltip({
          enabledText: "Delete Contact",
          disabled: true,
          disabledReason: "Primary Project Officer cannot be deleted.",
        })).toBe("Primary Project Officer cannot be deleted.");
      });

      it("returns enabledText when disabled but no disabledReason provided", () => {
        expect(enabledDisabledTooltip({
          enabledText: "Delete Contact",
          disabled: true,
        })).toBe("Delete Contact");
      });

      it("returns enabledText when disabled and disabledReason is undefined", () => {
        expect(enabledDisabledTooltip({
          enabledText: "Edit Type",
          disabled: true,
          disabledReason: undefined,
        })).toBe("Edit Type");
      });

      it("returns empty string when disabled and disabledReason is empty string", () => {
        expect(enabledDisabledTooltip({
          enabledText: "Save",
          disabled: true,
          disabledReason: "",
        })).toBe("");
      });
    });

    describe("edge cases", () => {
      it("handles empty enabledText", () => {
        expect(enabledDisabledTooltip({
          enabledText: "",
          disabled: false,
        })).toBe("");
      });

      it("handles empty enabledText when disabled with reason", () => {
        expect(enabledDisabledTooltip({
          enabledText: "",
          disabled: true,
          disabledReason: "Cannot perform action",
        })).toBe("Cannot perform action");
      });

      it("handles long text strings", () => {
        const longEnabledText = "This is a very long enabled text that might be used for complex actions";
        const longDisabledReason = "This is a very long disabled reason explaining why the action cannot be performed right now";

        expect(enabledDisabledTooltip({
          enabledText: longEnabledText,
          disabled: false,
        })).toBe(longEnabledText);

        expect(enabledDisabledTooltip({
          enabledText: longEnabledText,
          disabled: true,
          disabledReason: longDisabledReason,
        })).toBe(longDisabledReason);
      });
    });
  });

  describe("real-world usage scenarios", () => {
    describe("Document table scenarios", () => {
      it("generates correct tooltip for document edit (no selection)", () => {
        expect(selectionTooltip({
          action: "Edit",
          nounSingular: "Document",
          selectedCount: 0,
          rule: { kind: "exactly", count: 1 },
        })).toBe("Select a Document to Edit.");
      });

      it("generates correct tooltip for document edit (valid selection)", () => {
        expect(selectionTooltip({
          action: "Edit",
          nounSingular: "Document",
          selectedCount: 1,
          rule: { kind: "exactly", count: 1 },
        })).toBe("Edit");
      });

      it("generates correct tooltip for document delete (multiple valid)", () => {
        expect(selectionTooltip({
          action: "Delete",
          nounSingular: "Document",
          selectedCount: 3,
          rule: { kind: "atLeast", count: 1 },
        })).toBe("Delete");
      });
    });

    describe("Contact table scenarios", () => {
      it("generates tooltip for enabled contact delete", () => {
        expect(enabledDisabledTooltip({
          enabledText: "Delete Contact",
          disabled: false,
        })).toBe("Delete Contact");
      });

      it("generates tooltip for disabled Primary PO delete", () => {
        expect(enabledDisabledTooltip({
          enabledText: "Delete Contact",
          disabled: true,
          disabledReason: "Assign another Primary Project Officer to Delete",
        })).toBe("Assign another Primary Project Officer to Delete");
      });
    });

    describe("Type table scenarios", () => {
      it("generates correct tooltip for type removal (business rule)", () => {
        expect(enabledDisabledTooltip({
          enabledText: "Remove",
          disabled: true,
          disabledReason: "Approved demonstration requires at least one Type",
        })).toBe("Approved demonstration requires at least one Type");
      });
    });
  });
});
