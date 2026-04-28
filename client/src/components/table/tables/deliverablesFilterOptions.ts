import type { Option } from "components/input/select/Select";
import type { PersonType } from "demos-server";

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

const CMS_OWNER_PERSON_TYPES: PersonType[] = ["demos-admin", "demos-cms-user"];

type DeliverableFilterPersonSource = {
  fullName: string;
  personType: PersonType;
};

export const getCmsOwnerOptions = (
  deliverables: DeliverableFilterOptionSource[],
  people?: DeliverableFilterPersonSource[]
) => {
  const cmsOwnerNames = people
    ? people
        .filter((person) => CMS_OWNER_PERSON_TYPES.includes(person.personType))
        .map((person) => person.fullName)
    : deliverables.map((deliverable) => deliverable.cmsOwner.person.fullName);

  return toUniqueSortedOptions(cmsOwnerNames);
};

export const getDeliverableFilterOptions = (
  deliverables: DeliverableFilterOptionSource[],
  people?: DeliverableFilterPersonSource[]
) => ({
  demonstrationNameOptions: toUniqueSortedOptions(
    deliverables.map((deliverable) => deliverable.demonstration.name)
  ),
  cmsOwnerOptions: getCmsOwnerOptions(deliverables, people),
});
