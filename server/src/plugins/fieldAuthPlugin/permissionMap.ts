import { Permission } from "../../types";

export const PERMISSION_MAP: Record<Permission, Record<string, string[]>> = {
  "Resolve Demonstration": {
    Demonstration: [
      "id",
      "name",
      "description",
      "effectiveDate",
      "expirationDate",
      "sdgDivision",
      "signatureLevel",
      "state",
      "createdAt",
      "updatedAt",
      "primaryProjectOfficer",
    ],
  },
  "Resolve Demonstration Application Workflow": {
    Demonstration: [
      "status",
      "currentPhaseName",
      "phases",
      "clearanceLevel",
      "tags",
      "demonstrationTypes",
    ],
  },
  "Resolve Demonstration Documents": {
    Demonstration: ["documents"],
  },
  "Resolve Demonstration Contacts": {
    Demonstration: ["roles"],
  },
  "Resolve Demonstration Modifications": {
    Demonstration: ["amendments", "extensions"],
  },
  "Resolve Modification": {
    Amendment: [
      "id",
      "name",
      "description",
      "effectiveDate",
      "createdAt",
      "updatedAt",
      "signatureLevel",
    ],
    Extension: [
      "id",
      "name",
      "description",
      "effectiveDate",
      "createdAt",
      "updatedAt",
      "signatureLevel",
    ],
  },
  "Resolve Modification Demonstration": {
    Amendment: ["demonstration"],
    Extension: ["demonstration"],
  },
  "Resolve Modification Application Workflow": {
    Amendment: ["status", "currentPhaseName", "phases", "clearanceLevel", "tags"],
    Extension: ["status", "currentPhaseName", "phases", "clearanceLevel", "tags"],
  },
  "Resolve Modification Documents": {
    Amendment: ["documents"],
    Extension: ["documents"],
  },
  "Resolve ApplicationDate": {
    ApplicationDate: ["dateType", "dateValue", "createdAt", "updatedAt"],
  },
  "Resolve ApplicationNote": {
    ApplicationNote: ["noteType", "content", "createdAt", "updatedAt"],
  },
  "Resolve ApplicationPhase": {
    ApplicationPhase: [
      "phaseName",
      "phaseStatus",
      "phaseDates",
      "phaseNotes",
      "createdAt",
      "updatedAt",
    ],
  },
  "Resolve ApplicationPhase Documents": {
    ApplicationPhase: ["documents"],
  },
  "Resolve DemonstrationRoleAssignment": {
    DemonstrationRoleAssignment: ["person", "role", "isPrimary"],
  },
  "Resolve DemonstrationRoleAssignment Demonstration": {
    DemonstrationRoleAssignment: ["demonstration"],
  },
  "Resolve DemonstrationTypeAssignment": {
    DemonstrationTypeAssignment: [
      "demonstrationTypeName",
      "effectiveDate",
      "expirationDate",
      "approvalStatus",
      "status",
      "createdAt",
      "updatedAt",
    ],
  },
  "Resolve Document": {
    Document: ["id", "name", "description", "documentType", "createdAt", "updatedAt"],
  },
  "Download Document": {
    Document: ["s3Path", "presignedDownloadUrl"],
  },
  "Resolve Document Application": {
    Document: ["application"],
  },
  "Resolve Document Application Workflow": {
    Document: ["phaseName"],
  },
  "Resolve Document Owner": {
    Document: ["owner"],
  },
  "Resolve Upload Document Response": {
    UploadDocumentResponse: ["documentId", "presignedURL"],
  },
  "Resolve Event": {
    Event: [
      "id",
      "role",
      "user",
      "application",
      "eventType",
      "logLevel",
      "route",
      "createdAt",
      "eventData",
    ],
  },
  "Resolve Person": {
    Person: [
      "id",
      "personType",
      "email",
      "firstName",
      "lastName",
      "fullName",
      "createdAt",
      "updatedAt",
      "states",
    ],
  },
  "Resolve Person Roles": {
    Person: ["roles"],
  },
  "Resolve State": {
    State: ["id", "name"],
  },
  "Resolve State Demonstrations": {
    State: ["demonstrations"],
  },
  "Resolve Tag": {
    Tag: ["tagName", "approvalStatus"],
  },
  "Resolve User": {
    User: ["id", "cognitoSubject", "username", "createdAt", "updatedAt"],
  },
  "Resolve User Person": {
    User: ["person"],
  },
  "Resolve User Documents": {
    User: ["ownedDocuments"],
  },
  "Resolve User Events": {
    User: ["events"],
  },
  "Query States": {
    Query: ["states", "state"],
  },
  "Query People": {
    Query: ["people", "person", "searchPeople"],
  },
  "Query Current User": {
    Query: ["currentUser"],
  },
  "Query Modifications": {
    Query: ["amendments", "amendment", "extensions", "extension"],
  },
  "Query Demonstrations": {
    Query: ["demonstrations", "demonstration"],
  },
  "Query Documents": {
    Query: ["documentExists", "document"],
  },
  "Query Events": {
    Query: ["events", "eventsByApplication"],
  },
  "Query Tag Options": {
    Query: ["applicationTagOptions", "demonstrationTypeOptions"],
  },
  "Mutate Modifications": {
    Mutation: [
      "createAmendment",
      "updateAmendment",
      "deleteAmendment",
      "createExtension",
      "updateExtension",
      "deleteExtension",
    ],
  },
  "Mutate Application Workflow": {
    Mutation: [
      "setApplicationClearanceLevel",
      "setApplicationDate",
      "setApplicationDates",
      "setApplicationNotes",
      "completePhase",
      "skipConceptPhase",
      "declareCompletenessPhaseIncomplete",
      "setApplicationTags",
    ],
  },
  "Mutate Demonstrations": {
    Mutation: ["createDemonstration", "updateDemonstration", "deleteDemonstration"],
  },
  "Mutate Demonstration Contacts": {
    Mutation: ["setDemonstrationRole", "setDemonstrationRoles", "unsetDemonstrationRoles"],
  },
  "Mutate Demonstration Types": {
    Mutation: ["setDemonstrationTypes"],
  },
  "Mutate Documents": {
    Mutation: ["uploadDocument", "updateDocument", "deleteDocument", "deleteDocuments"],
  },
  "Trigger UIPath": {
    Mutation: ["triggerUiPath"],
  },
  "Log Events": {
    Mutation: ["logEvent"],
  },
};
