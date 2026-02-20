// actionTooltips.ts
type Action = "Edit" | "Delete" | "Download" | "Remove" | "Manage";

type SelectionRule =
  | { kind: "exactly"; count: number }
  | { kind: "atLeast"; count: number };

export function selectionTooltip(params: {
  action: Action;
  nounSingular: string; // "Document", "Type", "Contact"
  selectedCount: number;
  rule: SelectionRule;
  enabledText?: string; // optional override like "Delete"
}) {
  const { action, nounSingular, selectedCount, rule, enabledText } = params;

  const isValid =
    rule.kind === "exactly"
      ? selectedCount === rule.count
      : selectedCount >= rule.count;

  if (isValid) return enabledText ?? action;

  // "Select a Document to Edit." / "Select a Type to Remove."
  const article = /^[aeiou]/i.test(nounSingular) ? "an" : "a";
  return `Select ${article} ${nounSingular} to ${action}.`;
}

export function enabledDisabledTooltip(params: {
  enabledText: string;       // "Delete Contact", "Manage Contacts"
  disabled: boolean;
  disabledReason?: string;   // "Primary Project Officer cannot be deleted."
}) {
  const { enabledText, disabled, disabledReason } = params;
  return disabled ? (disabledReason ?? enabledText) : enabledText;
}
