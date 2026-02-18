export type DocumentAction = "edit" | "delete";

export function getDocumentActionTooltip(action: DocumentAction, selectedCount: number): string {
  if (action === "edit") {
    if (selectedCount === 0) return "Select a Document to Edit.";
    if (selectedCount === 1) return "Edit";
    return "Select a Document to Edit"; // More than 1 selected
  }

  // delete
  if (selectedCount === 0) return "Select a Document to Delete.";
  return "Delete";
}

export function canRunDocumentAction(action: DocumentAction, selectedCount: number): boolean {
  if (action === "edit") return selectedCount === 1;
  return selectedCount >= 1;
}
