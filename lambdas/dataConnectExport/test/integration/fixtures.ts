import type { Client } from "pg";

// Seed data for views.integration.test.ts. It goes through the real constraints and triggers; lookup rows
// (states, statuses, date types, tags, action types) come from the migrations.
//
// What each fixture is for:
// - DEMO.newYork is fully populated: every role, approved and in-progress amendments, a renewal, a value for
//   every application date and document type, clearance notes, and all the named deliverables below.
// - DEMO.texas has only the primary Project Officer the schema requires and no CHIP type tag, so its optional
//   overview fields are '-'. Its child applications are closed, so nothing is "in progress", and it carries
//   the 1,000 bulk deliverables.
// - DEMO.preSubmission has no dates, division or deliverables, so its fields are '-' and its deliverables [].
//   It still has one application: every demonstration is its own application.
// - The deliverables are each described where they are defined, in seedDeliverables().
//
// Some report edge cases cannot exist in the real schema, so they are not seeded: a demonstration without a
// primary Project Officer (constraint trigger), one without its own application row, NULL application
// dates or notes, and deliverables with no parent dates (they need an Approved parent, which has dates).

const id = (value: number) => `00000000-0000-0000-0000-${String(value).padStart(12, "0")}`;

// Hands out consecutive ids, for rows that nothing else refers to.
function idSequence(first: number): () => string {
  let next = first;
  return () => id(next++);
}

// Seeded times are 02:00 UTC, the previous evening in New York, so each expected report date is a day earlier.
const at = (date: string) => `${date}T02:00:00Z`;

// A demonstration's own application row shares its id. The export orders applications and deliverables by id.
export const DEMO = { newYork: id(1), texas: id(2), preSubmission: id(3) } as const;
const APP = {
  amendmentApprovedFirst: id(11), amendmentApprovedSecond: id(12), amendmentActive: id(13), renewalLast: id(14),
  amendmentClosed: id(23), renewalClosed: id(24),
} as const;
const PERSON = {
  patOfficer: id(100), zoeAdditional: id(101), amyAdditional: id(102), pollyDirector: id(103), deePrimary: id(104),
  danaAnalyst: id(105), samPrimary: id(106), sallyContact: id(107), melDirector: id(108),
} as const;
const DOCUMENT = { firstApplicationDocument: 200, generalFile: id(299) } as const;
const DELIVERABLE = {
  acceptedUpdated: id(500), pendingResubmission: id(501), minimal: id(502), resubmissionWithoutSubmission: id(503),
  finalizedNoUpdate: id(504), filedUpdated: id(505), deleted: id(506), noActions: id(507),
} as const;
const EXTENSION = { granted: id(600), pending: id(601), earlierApproved: id(602) } as const;
const WORKBOOK = {
  oldActuals: id(700), middleActuals: id(701), currentActuals: id(702), failedLatest: id(703), unsubmitted: id(704),
  failedPending: id(705),
} as const;
const COMMENT = { latest: id(800), earlier: id(801), beforeApproval: id(802), afterFiling: id(803) } as const;
const FIRST_ACTION = 50000;
const BULK = { count: 1000, firstDeliverable: 10000, firstAction: 20000 } as const;

export const commentText = 'Review, "quoted"\nUnicode: café 雪 😀';
export const longPublicComment = `${commentText} ${"界😀".repeat(17000)}`;
export const longPrivateComment = `${commentText} ${"é😀".repeat(17000)}`;
const cmsUser = "demos-cms-user";
const stateUser = "demos-state-user";
const dueDate = at("2026-02-01");

const dateTypes = [
  "Concept Start Date", "Concept Paper Submitted Date", "Concept Skipped Date", "Concept Completion Date",
  "Application Intake Start Date", "State Application Submitted Date", "Completeness Review Due Date",
  "Application Intake Completion Date", "Completeness Start Date", "State Application Deemed Complete",
  "Completeness Completion Date", "Federal Comment Period Start Date", "Federal Comment Period End Date",
  "SDG Preparation Start Date", "Internal Expected Approval Date", "State Requested Approval Date",
  "SME Initial Review Date", "FRT Initial Meeting Date", "BNPMT Initial Meeting Date",
  "SDG Preparation Completion Date", "Review Start Date", "OGD Approval to Share with SMEs",
  "Draft Approval Package to Prep", "DDME Approval Received", "State Concurrence",
  "BN PMT Approval to Send to OMB", "Draft Approval Package Shared", "Receive OMB Concurrence",
  "Receive OGC Legal Clearance", "Package Sent for COMMs Clearance", "COMMs Clearance Received",
  "Submit Approval Package to OSORA", "OSORA R1 Comments Due", "OSORA R2 Comments Due",
  "CMS (OSORA) Clearance End", "Review Completion Date", "Approval Package Start Date",
  "Approval Package Completion Date", "Approval Summary Start Date",
  "Application Details Marked Complete Date", "Application Demonstration Types Marked Complete Date",
  "Approval Summary Completion Date", "Application Approval Date",
];

const documentTypes = [
  "Federal Comment Internal Analysis Document", "Final Budget Neutrality Formulation Workbook", "Q&A",
  "Special Terms & Conditions", "Formal OMB Policy Concurrence Email", "Approval Letter", "Signed Decision Memo",
];

// Inserts rows with named columns and fills the Prisma-managed updated_at where the table has one.
async function insert(client: Client, table: string, rows: readonly Record<string, unknown>[]): Promise<void> {
  const stamped = await client.query(`SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'demos_app' AND table_name = $1 AND column_name = 'updated_at'`, [table]);
  const values = stamped.rowCount ? rows.map((row) => ({ updated_at: "2026-01-01T00:00:00Z", ...row })) : rows;
  const columns = Object.keys(values[0]);
  const tuples = values.map((_, row) => `(${columns.map((_, column) => `$${row * columns.length + column + 1}`).join(", ")})`);
  await client.query(`INSERT INTO demos_app.${table} (${columns.join(", ")}) VALUES ${tuples.join(", ")}`,
    values.flatMap((row) => columns.map((column) => row[column])));
}

export async function seed(client: Client): Promise<void> {
  // Explicit Medicaid/CHIP ids are only accepted in migration mode; otherwise a trigger generates them.
  await client.query("SET LOCAL demos_app.migration_mode = 'on'");
  await seedPeople(client);
  await seedDemonstrations(client);
  await seedApplications(client);
  await seedDeliverables(client);
  await seedBulkDeliverables(client);
}

const people = [
  { id: PERSON.patOfficer, first: "Pat", last: "Officer", type: cmsUser },
  { id: PERSON.zoeAdditional, first: "Zoe", last: "Additional", type: cmsUser },
  { id: PERSON.amyAdditional, first: "Amy", last: "Additional", type: cmsUser },
  { id: PERSON.pollyDirector, first: "Polly", last: "Director", type: cmsUser },
  { id: PERSON.deePrimary, first: "Dee", last: "Primary", type: cmsUser },
  { id: PERSON.danaAnalyst, first: "Dana", last: "Analyst", type: cmsUser },
  { id: PERSON.samPrimary, first: "Sam", last: "Primary", type: stateUser },
  { id: PERSON.sallyContact, first: "Sally", last: "Contact", type: stateUser },
  { id: PERSON.melDirector, first: "Mel", last: "Director", type: cmsUser },
];

async function seedPeople(client: Client): Promise<void> {
  await insert(client, "person", people.map((person) => ({
    id: person.id, person_type_id: person.type, email: `${person.first}.${person.last}@example.com`.toLowerCase(),
    first_name: person.first, last_name: person.last,
  })));
  await insert(client, "users", people.map((person) => ({
    id: person.id, person_type_id: person.type, cognito_subject: person.id, username: person.first.toLowerCase(),
    is_migrated_from_pmda: false, has_logged_in: true,
  })));
  // CMS users get every state from a trigger; state users only their own.
  await insert(client, "person_state", [
    { person_id: PERSON.samPrimary, state_id: "NY" }, { person_id: PERSON.sallyContact, state_id: "NY" },
  ]);
}

// Each role has a primary person; the non-primary officers are the report's "Project Officers".
const roles = [
  { person: PERSON.patOfficer, role: "Project Officer", primary: true },
  { person: PERSON.zoeAdditional, role: "Project Officer", primary: false },
  { person: PERSON.amyAdditional, role: "Project Officer", primary: false },
  { person: PERSON.pollyDirector, role: "Policy Technical Director", primary: true },
  { person: PERSON.deePrimary, role: "DDME Analyst", primary: true },
  { person: PERSON.danaAnalyst, role: "DDME Analyst", primary: false },
  { person: PERSON.samPrimary, role: "State Point of Contact", primary: true },
  { person: PERSON.sallyContact, role: "State Point of Contact", primary: false },
  { person: PERSON.melDirector, role: "Monitoring & Evaluation Technical Director", primary: true },
];

async function seedDemonstrations(client: Client): Promise<void> {
  // Deliberately inserted in reverse id order, so the export must sort rather than rely on physical order.
  const demonstrations = [
    // Unapproved, so it has no effective/expiration dates or SDG division.
    { id: DEMO.preSubmission, number: 3, state: "TX", status: "Pre-Submission", division: null, effective: null, expiration: null,
      roles: roles.slice(0, 1) },
    { id: DEMO.texas, number: 2, state: "TX", status: "Approved", division: "Division of Eligibility and Coverage Demonstrations",
      effective: at("2026-04-01"), expiration: at("2028-04-01"), roles: roles.slice(0, 1) },
    { id: DEMO.newYork, number: 1, state: "NY", status: "Approved", division: "Division of System Reform Demonstrations",
      effective: at("2026-01-01"), expiration: at("2027-01-01"), roles },
  ];
  for (const demo of demonstrations) {
    await insert(client, "application", [{ id: demo.id, application_type_id: "Demonstration" }]);
    await insert(client, "demonstration", [{
      id: demo.id, application_type_id: "Demonstration", name: `Demo ${demo.number}`, medicaid_id: `M-${demo.number}`,
      chip_id: `C-${demo.number}`, state_id: demo.state, status_id: demo.status, status_updated_at: at("2026-01-01"),
      current_phase_id: "Concept", sdg_division_id: demo.division, signature_level_id: "OA",
      effective_date: demo.effective, expiration_date: demo.expiration,
    }]);
  }

  // The report shows a CHIP id only when the demonstration has the CHIP type, which only New York has.
  const tags = [
    { demo: DEMO.newYork, tag: "Tribal", effective: at("2026-03-01"), expiration: at("2027-03-01") },
    { demo: DEMO.newYork, tag: "Substance Use Disorder (SUD)", effective: at("2026-02-01"), expiration: at("2027-02-01") },
    { demo: DEMO.newYork, tag: "Children's Health Insurance Program (CHIP)", effective: at("2026-01-01"), expiration: at("2027-01-01") },
    { demo: DEMO.texas, tag: "Dental", effective: at("2026-07-01"), expiration: at("2027-07-01") },
    { demo: DEMO.preSubmission, tag: "HIV", effective: at("2026-09-01"), expiration: at("2027-09-01") },
  ];
  await insert(client, "demonstration_type_tag_assignment", tags.map((tag) => ({
    demonstration_id: tag.demo, tag_name_id: tag.tag, tag_type_id: "Demonstration Type",
    effective_date: tag.effective, expiration_date: tag.expiration,
  })));

  for (const demo of demonstrations) {
    await insert(client, "demonstration_role_assignment", demo.roles.map((assignment) => ({
      person_id: assignment.person, demonstration_id: demo.id, role_id: assignment.role, state_id: demo.state,
      person_type_id: people.find((person) => person.id === assignment.person)!.type, grant_level_id: "Demonstration",
    })));
    await insert(client, "primary_demonstration_role_assignment", demo.roles.filter((assignment) => assignment.primary)
      .map((assignment) => ({ person_id: assignment.person, demonstration_id: demo.id, role_id: assignment.role })));
  }
}

async function seedApplications(client: Client): Promise<void> {
  // New York has two approved amendments, an active one and an on-hold renewal ("in progress"); Texas's are closed.
  // Extensions must be exported as "Renewal".
  const children = [
    { id: APP.renewalLast, type: "Extension", demo: DEMO.newYork, name: "Renewal last", status: "On-hold",
      signature: null, effective: null },
    { id: APP.amendmentActive, type: "Amendment", demo: DEMO.newYork, name: "Amendment active", status: "Under Review",
      signature: null, effective: null, clearance: "COMMs" },
    { id: APP.amendmentApprovedSecond, type: "Amendment", demo: DEMO.newYork, name: "Amendment approved second",
      status: "Approved", signature: "OA", effective: at("2026-08-01") },
    { id: APP.amendmentApprovedFirst, type: "Amendment", demo: DEMO.newYork, name: "Amendment approved first",
      status: "Approved", signature: "OCD", effective: at("2026-07-01") },
    { id: APP.renewalClosed, type: "Extension", demo: DEMO.texas, name: "Renewal closed", status: "Approved",
      signature: "OA", effective: at("2027-01-01") },
    // No signature level, so the export shows '-'.
    { id: APP.amendmentClosed, type: "Amendment", demo: DEMO.texas, name: "Amendment closed", status: "Withdrawn",
      signature: null, effective: null },
  ];
  for (const child of children) {
    await insert(client, "application", [{ id: child.id, application_type_id: child.type }]);
    await insert(client, child.type === "Extension" ? "extension" : "amendment", [{
      id: child.id, application_type_id: child.type, demonstration_id: child.demo, demonstration_status_id: "Approved",
      name: child.name, status_id: child.status, current_phase_id: "Concept", clearance_level_id: child.clearance ?? "CMS (OSORA)",
      signature_level_id: child.signature, effective_date: child.effective,
    }]);
  }

  // New applications get today's Concept Start Date from a trigger; replace them with fixed values.
  await client.query("DELETE FROM demos_app.application_date");
  // Every known date has an independent value so a mis-mapped column fails parity: the nth date type is
  // day n of 2026 (rolling past January), an hour later for the amendment.
  await insert(client, "application_date", [DEMO.newYork, APP.amendmentApprovedFirst].flatMap((application) =>
    dateTypes.map((dateType, index) => ({
      application_id: application, date_type_id: dateType,
      date_value: new Date(Date.UTC(2026, 0, index + 1, application === APP.amendmentApprovedFirst ? 3 : 2)).toISOString(),
    }))));
  // A partial set of dates is distinct from an application with no dates.
  await insert(client, "application_date", [
    { application_id: APP.amendmentApprovedSecond, date_type_id: "Concept Skipped Date", date_value: at("2026-03-15") },
  ]);
  // Neither an extra lookup date nor an irrelevant document/note should add output fields.
  await insert(client, "date_type", [{ id: "Unexported Date" }]);
  await insert(client, "application_date", [
    { application_id: DEMO.newYork, date_type_id: "Unexported Date", date_value: at("2026-01-01") },
  ]);
  const applicationDocument = (documentId: string, type: string, created: string) => ({
    id: documentId, name: `Document ${documentId}`, s3_path: `fixture/${documentId}`, owner_user_id: PERSON.zoeAdditional,
    document_type_id: type, application_id: DEMO.newYork, created_at: created,
  });
  // Each document type has an old upload and a newer one on July (n + 1); the report shows the newest.
  const nextDocument = idSequence(DOCUMENT.firstApplicationDocument);
  await insert(client, "document", [
    ...documentTypes.flatMap((type, index) => [
      applicationDocument(nextDocument(), type, "2025-01-01T12:00:00Z"),
      applicationDocument(nextDocument(), type, at(`2026-07-${String(index + 1).padStart(2, "0")}`)),
    ]),
    applicationDocument(DOCUMENT.generalFile, "General File", "2030-01-01T00:00:00Z"),
  ]);
  // Only the COMMs and CMS (OSORA) clearance notes are exported.
  await insert(client, "application_note", [
    { application_id: DEMO.newYork, note_type_id: "COMMs Clearance", content: "Zulu clearance: contact Pat Officer" },
    { application_id: DEMO.newYork, note_type_id: "CMS (OSORA) Clearance", content: "OSORA approved; internal contact details" },
    { application_id: DEMO.newYork, note_type_id: "PO and OGD", content: "Must not appear" },
    { application_id: APP.amendmentApprovedSecond, note_type_id: "OGC and OMB", content: "Must not appear either" },
  ]);
}

type ActionStep = { on: string; type: string; from: string; to: string; note?: string; user?: string; newDueDate?: string };
type ExtensionStep = { extension: string; status: "Requested" | "Approved" };
type DeliverableAction = { id: string; deliverable: string; step: ActionStep; due?: string };

const created = (on: string): ActionStep => ({ on, type: "Created Deliverable Slot", from: "Upcoming", to: "Upcoming" });
const submitted = (on: string): ActionStep => ({ on, type: "Submitted Deliverable", from: "Upcoming", to: "Submitted" });
const review = (on: string, reviewer: string): ActionStep =>
  ({ on, type: "Started Review", from: "Submitted", to: "Under CMS Review", user: reviewer });
const resubmission = (on: string, newDueDate: string, note: string, from = "Under CMS Review"): ActionStep =>
  ({ on, type: "Requested Resubmission", from, to: "Upcoming", note, newDueDate });
const extensionRequest = (on: string, note: string): ActionStep =>
  ({ on, type: "Requested Extension", from: "Upcoming", to: "Upcoming", note });
const extensionApproval = (on: string): ActionStep => ({ on, type: "Approved Extension Request", from: "Upcoming", to: "Upcoming" });
const finalized = (on: string, type: string, to: string): ActionStep => ({ on, type, from: "Under CMS Review", to });

// Inserts actions in the given order. The flag columns come from deliverable_action_type, as the app does.
async function insertActions(client: Client, actions: readonly DeliverableAction[]): Promise<void> {
  const types = await client.query(`SELECT id, due_date_change_allowed, should_have_note, should_have_user_id,
      extension_id_optional
    FROM demos_app.deliverable_action_type WHERE id = ANY($1)`, [[...new Set(actions.map(({ step }) => step.type))]]);
  const flagsByType = new Map(types.rows.map(({ id: type, ...flags }) => [type, flags] as const));
  await insert(client, "deliverable_action", actions.map(({ id: actionId, deliverable, step, due = dueDate }) => {
    const flags = flagsByType.get(step.type);
    if (!flags) throw new Error(`Unknown deliverable action type: ${step.type}`);
    return {
      id: actionId, action_timestamp: at(step.on), deliverable_id: deliverable, action_type_id: step.type,
      old_status_id: step.from, new_status_id: step.to, note: step.note ?? null, ...flags,
      old_due_date: due, new_due_date: step.newDueDate ? at(step.newDueDate) : due,
      user_id: flags.should_have_user_id ? step.user ?? PERSON.zoeAdditional : null,
    };
  }));
}

const deliverableRow = (deliverable: { id: string; name: string; status: string; demo?: string; type?: string;
  owner?: string; due?: string }) => ({
  id: deliverable.id, deliverable_type_id: deliverable.type ?? "Quarterly Budget Neutrality Report", name: deliverable.name,
  demonstration_id: deliverable.demo ?? DEMO.newYork, demonstration_status_id: "Approved", status_id: deliverable.status,
  cms_owner_user_id: deliverable.owner ?? PERSON.zoeAdditional, cms_owner_person_type_id: cmsUser,
  due_date: deliverable.due ?? dueDate, due_date_type_id: "Normal", expected_to_be_submitted: true,
});

async function seedDeliverables(client: Client): Promise<void> {
  // All New York. Each history is chronological: triggers copy the active extension onto each new action and
  // block finalizing while one is still Requested.
  const deliverables: { id: string; name: string; status: string; history: readonly (ActionStep | ExtensionStep)[] }[] = [
    // Dropped: a deliverable with no actions at all.
    { id: DELIVERABLE.noActions, name: "No actions", status: "Upcoming", history: [] },
    // Dropped: deleted deliverables are not reported.
    { id: DELIVERABLE.deleted, name: "Deleted delivery", status: "Deleted", history: [
      created("2026-01-01"), { on: "2026-01-02", type: "Deleted Deliverable", from: "Upcoming", to: "Deleted" },
    ] },
    // Received and filed, then commented on: "updated post acceptance" is Yes.
    { id: DELIVERABLE.filedUpdated, name: "Filed updated", status: "Received and Filed", history: [
      submitted("2026-01-01"), review("2026-01-02", PERSON.patOfficer),
      finalized("2026-01-09", "Received and Filed Deliverable", "Received and Filed"),
    ] },
    // Approved, with a comment only from before approval: "updated post acceptance" is No.
    { id: DELIVERABLE.finalizedNoUpdate, name: "Finalized no update", status: "Approved", history: [
      submitted("2026-01-01"), review("2026-01-02", PERSON.patOfficer), finalized("2026-01-09", "Approved Deliverable", "Approved"),
    ] },
    // A resubmission request without any submission: counted, but no submission or resubmission due date.
    { id: DELIVERABLE.resubmissionWithoutSubmission, name: "Resubmission without submission", status: "Upcoming", history: [
      resubmission("2026-01-01", "2026-03-01", "Never submitted", "Submitted"),
    ] },
    // Only a Created action: every derived field is '-' or 0.
    { id: DELIVERABLE.minimal, name: "Minimal delivery", status: "Upcoming", history: [created("2026-01-01")] },
    // An approved extension, then one still pending; two open resubmission requests, where the latest wins.
    // Its only submission has a failed workbook, so there is no budget neutrality data.
    { id: DELIVERABLE.pendingResubmission, name: "Pending resubmission", status: "Upcoming", history: [
      { extension: EXTENSION.earlierApproved, status: "Requested" }, extensionRequest("2026-01-01", "Old extension"),
      extensionApproval("2026-01-02"), { extension: EXTENSION.earlierApproved, status: "Approved" },
      { extension: EXTENSION.pending, status: "Requested" }, extensionRequest("2026-01-03", commentText),
      submitted("2026-01-04"),
      resubmission("2026-01-05", "2026-03-05", "Older pending request", "Submitted"),
      resubmission("2026-01-06", "2026-03-06", commentText, "Submitted"),
    ] },
    // The full lifecycle: a granted extension, two resolved resubmissions, three submissions with workbooks
    // (the newest successful one wins), two demonstration types, and comments over the 32,000-character limit,
    // one of them after acceptance.
    { id: DELIVERABLE.acceptedUpdated, name: "Accepted updated", status: "Accepted", history: [
      submitted("2026-01-01"), review("2026-01-02", PERSON.patOfficer),
      resubmission("2026-01-03", "2026-03-03", "Earlier resubmission"),
      { extension: EXTENSION.granted, status: "Requested" }, extensionRequest("2026-01-04", "Granted extension"),
      extensionApproval("2026-01-05"), { extension: EXTENSION.granted, status: "Approved" },
      submitted("2026-01-06"), review("2026-01-07", PERSON.danaAnalyst),
      resubmission("2026-01-08", "2026-03-08", "Resolved resubmission"),
      submitted("2026-01-09"), review("2026-01-10", PERSON.danaAnalyst),
      finalized("2026-01-11", "Accepted Deliverable", "Accepted"),
    ] },
  ];
  await insert(client, "deliverable", deliverables.map(deliverableRow));
  await insert(client, "deliverable_demonstration_type", ["Substance Use Disorder (SUD)", "Children's Health Insurance Program (CHIP)"]
    .map((tag) => ({ deliverable_id: DELIVERABLE.acceptedUpdated, demonstration_id: DEMO.newYork, demonstration_type_tag_name_id: tag })));

  const nextAction = idSequence(FIRST_ACTION);
  // Submitted Deliverable action ids per deliverable, oldest first, for linking workbooks below.
  const submissions = new Map<string, string[]>();
  for (const { id: deliverable, history } of deliverables) {
    for (const step of history) {
      if (!("extension" in step)) {
        const actionId = nextAction();
        await insertActions(client, [{ id: actionId, deliverable, step }]);
        if (step.type === "Submitted Deliverable") submissions.set(deliverable, [...submissions.get(deliverable) ?? [], actionId]);
      } else if (step.status === "Requested") {
        await insert(client, "deliverable_extension", [{
          id: step.extension, deliverable_id: deliverable, status_id: "Requested",
          reason_code_id: "Technical Difficulties", original_date_requested: at("2026-03-01"),
        }]);
      } else {
        await client.query("UPDATE demos_app.deliverable_extension SET status_id = 'Approved', final_date_granted = $2 WHERE id = $1",
          [step.extension, at("2026-03-01")]);
      }
    }
  }

  // Workbooks are linked to Submitted Deliverable actions. The newest successful one wins; failed and
  // unsubmitted ones are ignored.
  const [firstSubmission, secondSubmission, lastSubmission] = submissions.get(DELIVERABLE.acceptedUpdated)!;
  const [pendingSubmission] = submissions.get(DELIVERABLE.pendingResubmission)!;
  const workbooks = [
    { id: WORKBOOK.oldActuals, deliverable: DELIVERABLE.acceptedUpdated, submission: firstSubmission,
      status: "Succeeded", variance: 999, actuals: "Old actuals" },
    { id: WORKBOOK.middleActuals, deliverable: DELIVERABLE.acceptedUpdated, submission: secondSubmission,
      status: "Succeeded", variance: 123, actuals: "Middle actuals" },
    { id: WORKBOOK.currentActuals, deliverable: DELIVERABLE.acceptedUpdated, submission: lastSubmission,
      status: "Succeeded", variance: -42.125, actuals: "Current actuals" },
    { id: WORKBOOK.failedLatest, deliverable: DELIVERABLE.acceptedUpdated, submission: lastSubmission,
      status: "Failed", variance: 999999, actuals: "Failed" },
    { id: WORKBOOK.failedPending, deliverable: DELIVERABLE.pendingResubmission, submission: pendingSubmission,
      status: "Failed", variance: null, actuals: null },
    { id: WORKBOOK.unsubmitted, deliverable: DELIVERABLE.pendingResubmission, submission: null,
      status: "Succeeded", variance: 999999, actuals: "Unsubmitted" },
  ];
  for (const workbook of workbooks) {
    await insert(client, "document", [{
      id: workbook.id, name: `Workbook ${workbook.id}`, s3_path: `fixture/${workbook.id}`, owner_user_id: PERSON.zoeAdditional,
      document_type_id: "BN Workbook", application_id: DEMO.newYork, deliverable_id: workbook.deliverable,
      deliverable_type_id: "Quarterly Budget Neutrality Report", deliverable_is_cms_attached_file: false,
      deliverable_submission_action_id: workbook.submission,
      deliverable_submission_action_type_id: workbook.submission ? "Submitted Deliverable" : null, created_at: at("2026-04-01"),
    }]);
    await insert(client, "budget_neutrality_workbook", [{
      id: workbook.id, document_type_id: "BN Workbook", validation_status_id: workbook.status, validation_data: "{}",
      net_variance_total: workbook.variance, actuals: workbook.actuals,
    }]);
  }

  for (const table of ["public_comment", "private_comment"] as const) {
    // Inserted newest first; the report sorts by timestamp, prefixes author/date, then truncates the aggregate.
    const author = table === "private_comment" ? { author_person_type_id: cmsUser } : {};
    await insert(client, table, [
      { id: COMMENT.latest, deliverable_id: DELIVERABLE.acceptedUpdated, author_user_id: PERSON.zoeAdditional, ...author,
        created_at: at("2026-01-12"), content: table === "public_comment" ? longPublicComment : longPrivateComment },
      { id: COMMENT.earlier, deliverable_id: DELIVERABLE.acceptedUpdated, author_user_id: PERSON.amyAdditional, ...author,
        created_at: at("2026-01-08"), content: commentText },
    ]);
  }
  await insert(client, "public_comment", [
    { id: COMMENT.beforeApproval, deliverable_id: DELIVERABLE.finalizedNoUpdate, author_user_id: PERSON.patOfficer,
      created_at: at("2026-01-08"), content: "Before approval" },
    { id: COMMENT.afterFiling, deliverable_id: DELIVERABLE.filedUpdated, author_user_id: PERSON.patOfficer,
      created_at: at("2026-01-10"), content: "After filing" },
  ]);
}

// 1,000 Texas deliverables with one Created action each: a large collection next to the other collections.
// Inserted in reverse id order, so the export must sort rather than rely on physical order.
async function seedBulkDeliverables(client: Client): Promise<void> {
  const offsets = Array.from({ length: BULK.count }, (_, index) => BULK.count - 1 - index);
  await insert(client, "deliverable", offsets.map((offset) => deliverableRow({
    id: id(BULK.firstDeliverable + offset), name: `Bulk ${BULK.firstDeliverable + offset}`, status: "Upcoming",
    demo: DEMO.texas, type: "Monitoring Report", owner: PERSON.patOfficer, due: at("2026-01-01"),
  })));
  await insertActions(client, offsets.map((offset) => ({
    id: id(BULK.firstAction + offset), deliverable: id(BULK.firstDeliverable + offset), due: at("2026-01-01"),
    step: { ...created("2026-01-01"), user: PERSON.patOfficer },
  })));
}
