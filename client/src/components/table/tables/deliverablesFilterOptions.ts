import type { Option } from "components/input/select/Select";

// Duplicated Filter options

export const toUniqueSortedOptions = (values: string[]): Option[] =>
  Array.from(new Set(values))
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ label: value, value }));

type DeliverableFilterOptionSource = {
  demonstration: {
    name: string;
  };
  cmsOwner: {
    person: {
      fullName: string;
    };
  };
};

export const getDeliverableFilterOptions = (deliverables: DeliverableFilterOptionSource[]) => ({
  demonstrationNameOptions: toUniqueSortedOptions(
    deliverables.map((deliverable) => deliverable.demonstration.name)
  ),
  cmsOwnerOptions: toUniqueSortedOptions(
    deliverables.map((deliverable) => deliverable.cmsOwner.person.fullName)
  ),
});
