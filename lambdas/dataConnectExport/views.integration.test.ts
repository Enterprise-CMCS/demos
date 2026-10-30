import type { Client, QueryResult } from "pg";
import { to as copyTo } from "pg-copy-streams";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { applicationDetailsReportQueries } from "../../server/src/onDemandReports/configs/applicationDetailsReportQueries";
import { deliverableStatusReportQueries } from "../../server/src/onDemandReports/configs/deliverableStatusReportQueries";
import { demonstrationOverviewReportQueries } from "../../server/src/onDemandReports/configs/demonstrationOverviewReportQueries";
import { demonstrationTypesReportQueries } from "../../server/src/onDemandReports/configs/demonstrationTypesReportQueries";
import { quoteIdentifier } from "./parquet/typeMap";
import { type DisposableDemosSchema, openDisposableDemosSchema } from "./test/integration/database";
import { commentText, DEMO, longPrivateComment, longPublicComment, seed } from "./test/integration/fixtures";
import type { ExportViewDefinition } from "./types";
import { EXPORT_VIEWS } from "./views";

// Opt in with a dedicated, disposable local database named dataconnect_*_test.
// Never reuse an application database: setup refuses an existing demos_app schema.
const databaseUrl = process.env.DATACONNECT_TEST_DATABASE_URL;
const integration = databaseUrl ? describe : describe.skip;

type ReportRow = Record<string, unknown>;
type Collection = "applications" | "deliverables" | "demonstration_types";
type ExportRow = ReportRow & {
  demonstration_id: string;
  demonstration_title: string;
  demonstration_number: string;
} & Record<Collection, ReportRow[]>;
type Demo = keyof typeof DEMO;

const view: ExportViewDefinition = EXPORT_VIEWS.demonstration_reporting;
// The row order lives in the outer COPY query (writer.ts), so apply it the same way here.
const orderedQuery = `SELECT * FROM (${view.query}) AS export_view ORDER BY ${view.orderBy.map(quoteIdentifier).join(", ")}`;

// Values the report comparison can't pin down on its own: '-' handling, Renewal labels, New York dates (a day
// before the seeded UTC dates), ordering and which rows are dropped. Each collection lists every row the export
// should contain, keyed by its title and in export order, with the fields to check. fixtures.ts explains each row.
const expected: Record<Demo, {
  overview: ReportRow;
  applications: Record<string, ReportRow>;
  deliverables?: Record<string, ReportRow>;
  demonstration_types: Record<string, ReportRow>;
}> = {
  newYork: {
    overview: {
      status_update_date: "12/31/2025", application_approval_date: "02/11/2026",
      project_officers: "Amy Additional, Zoe Additional", approved_amendment_applications: 2,
      renewal_in_progress: "Yes", amendment_in_progress: "Yes",
    },
    applications: {
      "Demo 1": {
        concept_start_date: "12/31/2025", effective_date: "12/31/2025", expiration_date: "12/31/2026",
        federal_comment_internal_analysis_document_submitted_date: "06/30/2026",
        signed_decision_memo_uploaded_date: "07/06/2026",
        comms_clearance_notes: "Zulu clearance: contact Pat Officer",
        osora_clearance_notes: "OSORA approved; internal contact details",
      },
      "Amendment approved first": { effective_date: "06/30/2026" },
      "Amendment approved second": {
        concept_start_date: "-", concept_skipped_date: "03/14/2026", concept_paper_submitted_date: "-", comms_clearance_notes: "-",
      },
      "Amendment active": {},
      "Renewal last": { application_type: "Renewal" },
    },
    // "No actions" and "Deleted delivery" are seeded but must be dropped.
    deliverables: {
      "Accepted updated": {
        effective_date: "12/31/2025", expiration_date: "12/31/2026", due_date: "01/31/2026", submission_date: "01/08/2026",
        demonstration_types: "Children's Health Insurance Program (CHIP), Substance Use Disorder (SUD)",
        cms_owner: "Zoe Additional", ddme_analyst: "Dee Primary", extension_request_pending: "No",
        total_extensions_requested: 1, total_resubmissions_requested: 2, resubmission_due_date: "-",
        resubmission_request_comments: "-", last_deliverable_action: "Accepted Deliverable",
        last_deliverable_action_date: "01/10/2026", updated_post_acceptance: "Yes", deliverable_reviewer: "Dana Analyst",
        deliverable_review_date: "01/09/2026", budget_neutrality_variance: "-42.125", actuals: "Current actuals",
      },
      "Pending resubmission": {
        extension_request_pending: "Yes", extension_date_requested: "02/28/2026", reason_for_extension: "Technical Difficulties",
        extension_request_comments: commentText, total_extensions_requested: 2, total_resubmissions_requested: 2,
        resubmission_due_date: "03/05/2026", resubmission_request_comments: commentText,
        last_deliverable_action: "Requested Resubmission", updated_post_acceptance: "No", budget_neutrality_variance: "-",
        actuals: "-",
      },
      "Minimal delivery": {
        submission_date: "-", demonstration_types: "-", total_extensions_requested: 0, total_resubmissions_requested: 0,
        public_comments: "-", private_comments: "-", deliverable_reviewer: "-", deliverable_review_date: "-",
      },
      "Resubmission without submission": {
        submission_date: "-", total_resubmissions_requested: 1, resubmission_due_date: "-", resubmission_request_comments: "-",
      },
      "Finalized no update": { updated_post_acceptance: "No" },
      "Filed updated": { updated_post_acceptance: "Yes" },
    },
    demonstration_types: {
      "Children's Health Insurance Program (CHIP)": {
        chip_id: "C-1", demonstration_type_effective_date: "12/31/2025", demonstration_type_expiration_date: "12/31/2026",
        status_update_date: "12/31/2025", application_approval_date: "02/11/2026", primary_state_poc: "Sam Primary",
      },
      "Substance Use Disorder (SUD)": { chip_id: "C-1" },
      "Tribal": { chip_id: "C-1" },
    },
  },
  texas: {
    overview: {
      chip_id: "-", effective_date: "03/31/2026", expiration_date: "03/31/2028", application_approval_date: "-",
      project_officers: "-", primary_policy_tech_director: "-", approved_amendment_applications: 0,
      renewal_in_progress: "No", amendment_in_progress: "No",
    },
    applications: {
      "Demo 2": { concept_start_date: "-", approval_letter_uploaded_date: "-", osora_clearance_notes: "-", signature_level: "OA" },
      "Amendment closed": { signature_level: "-" },
      "Renewal closed": {},
    },
    // The 1,000 bulk deliverables are checked in the cardinality test.
    demonstration_types: {
      "Dental": {
        chip_id: "-", demonstration_effective_date: "03/31/2026", demonstration_expiration_date: "03/31/2028",
        primary_state_poc: "-", application_approval_date: "-",
        demonstration_type_effective_date: "06/30/2026", demonstration_type_expiration_date: "06/30/2027",
      },
    },
  },
  preSubmission: {
    overview: { effective_date: "-", expiration_date: "-", sdg_division: "-" },
    // A demonstration is always its own application, so only the other collections can be empty.
    applications: { "Demo 3": { effective_date: "-", expiration_date: "-", sdg_division: "-" } },
    deliverables: {},
    demonstration_types: {
      "HIV": {
        demonstration_effective_date: "-", demonstration_expiration_date: "-",
        demonstration_type_effective_date: "08/31/2026", demonstration_type_expiration_date: "08/31/2027",
      },
    },
  },
};
const demos = Object.keys(DEMO) as Demo[];

// Expanding a demonstration's collection must reproduce the report's rows for it, with the declared field order.
// Both sides are sorted by sortKey; expectRows checks the export's own order.
function expectCollectionMatchesReport(actual: ExportRow[], report: ReportRow[], collection: Collection, sortKey: string): void {
  const columns = view.collectionSchemas![collection].columns.map((column) => column.name);
  const sorted = (rows: ReportRow[]) => [...rows].sort((a, b) => String(a[sortKey]).localeCompare(String(b[sortKey])));
  for (const demo of actual) {
    const matching = report.filter((row) => row.demonstration_number === demo.demonstration_number);
    expect(sorted(demo[collection])).toEqual(sorted(matching));
    for (const row of demo[collection]) expect(Object.keys(row)).toEqual(columns);
  }
}

// The collection must hold exactly the expected rows, in that order, each with the listed field values.
function expectRows(rows: ReportRow[], key: string, expectedRows: Record<string, ReportRow>): void {
  expect(rows.map((row) => row[key])).toEqual(Object.keys(expectedRows));
  for (const row of rows) expect(row).toMatchObject(expectedRows[String(row[key])]);
}

integration("demonstration_reporting PostgreSQL parity", () => {
  let schema: DisposableDemosSchema | undefined;
  let client: Client;
  // The export query's result, run once in a read-only snapshot; the tests compare it with the reports.
  let exported: QueryResult<ExportRow>;
  const exportedDemo = (demo: Demo) => exported.rows.find((row) => row.demonstration_id === DEMO[demo])!;

  beforeAll(async () => {
    schema = await openDisposableDemosSchema(databaseUrl!, seed);
    client = schema.client;
    // The original report needs a writable temp-table setup, unlike the export.
    await client.query(applicationDetailsReportQueries[0]);
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    try {
      exported = await client.query<ExportRow>(orderedQuery);
    } finally {
      await client.query("ROLLBACK");
    }
  }, 60000);

  beforeEach(async () => {
    await client.query("BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
  });

  afterEach(async () => {
    if (client) await client.query("ROLLBACK");
  });

  afterAll(async () => {
    await schema?.close();
  });

  it("matches the overview report", async () => {
    const original = await client.query(demonstrationOverviewReportQueries[0]);
    expect(exported.rows.map((row) => row.demonstration_id)).toEqual(demos.map((demo) => DEMO[demo]));
    expect(exported.fields.map((field) => field.name)).toEqual(view.schema.columns.map((column) => column.name));
    expect(exported.rows.map(({ demonstration_id, applications, deliverables, demonstration_types, ...overview }) => overview))
      .toEqual(original.rows.sort((a, b) => a.demonstration_title.localeCompare(b.demonstration_title)));
    for (const demo of demos) expect(exportedDemo(demo)).toMatchObject(expected[demo].overview);
  });

  it("matches the application details report", async () => {
    const original = (await client.query(applicationDetailsReportQueries[1])).rows;
    expectCollectionMatchesReport(exported.rows, original, "applications", "application_title");
    for (const demo of demos) {
      expectRows(exportedDemo(demo).applications, "application_title", expected[demo].applications);
    }
  });

  it("matches the deliverable status report", async () => {
    const original = (await client.query(deliverableStatusReportQueries[0])).rows;
    expectCollectionMatchesReport(exported.rows, original, "deliverables", "deliverable_name");
    for (const demo of demos) {
      const deliverables = expected[demo].deliverables;
      if (deliverables) expectRows(exportedDemo(demo).deliverables, "deliverable_name", deliverables);
    }
    // Comments are aggregated oldest first as "author:date:comment", then cut to 32,000 characters (not UTF-16 units).
    const accepted = exportedDemo("newYork").deliverables[0];
    for (const [field, longComment] of [["public_comments", longPublicComment], ["private_comments", longPrivateComment]] as const) {
      const aggregated = `Amy Additional:01/07/2026:${commentText}\r\nZoe Additional:01/11/2026:${longComment}`;
      expect(accepted[field]).toBe([...aggregated].slice(0, 32000).join(""));
      expect([...String(accepted[field])]).toHaveLength(32000);
    }
  });

  it("matches the demonstration types report", async () => {
    const original = (await client.query(demonstrationTypesReportQueries[0])).rows;
    expectCollectionMatchesReport(exported.rows, original, "demonstration_types", "demonstration_type");
    for (const demo of demos) {
      expectRows(exportedDemo(demo).demonstration_types, "demonstration_type", expected[demo].demonstration_types);
    }
  });

  it("keeps each collection independent at mixed and high cardinalities", async () => {
    expect(exported.rows.map((row) => [row.applications.length, row.deliverables.length, row.demonstration_types.length]))
      .toEqual([[5, 6, 3], [3, 1000, 1], [1, 0, 1]]);
    const bulk = exportedDemo("texas").deliverables;
    expect(bulk.map((delivery) => delivery.deliverable_name)).toEqual(
      Array.from({ length: 1000 }, (_, index) => `Bulk ${10000 + index}`)
    );
    expect(bulk.every((delivery) => delivery.effective_date === "03/31/2026" && delivery.expiration_date === "03/31/2028")).toBe(true);
    expect(bulk[0]).toMatchObject({ due_date: "12/31/2025", last_deliverable_action_date: "12/31/2025", ddme_analyst: "-" });
    // A second run returns the same rows in the same order.
    expect((await client.query<ExportRow>(orderedQuery)).rows).toEqual(exported.rows);
  });

  it("is usable as a COPY subquery in the same read-only snapshot", async () => {
    expect((await client.query("SHOW transaction_read_only")).rows[0].transaction_read_only).toBe("on");
    // The real exporter wraps the select; this catches a trailing semicolon or DDL.
    const result = await client.query(`SELECT count(*)::int AS count FROM (${view.query}) AS exported`);
    expect(result.rows).toEqual([{ count: 3 }]);
    const stream = client.query(copyTo(`COPY (${orderedQuery}) TO STDOUT WITH (FORMAT CSV, HEADER true)`));
    // Decode once: chunk boundaries can split multi-byte UTF-8 characters.
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    const header = Buffer.concat(chunks).toString("utf8").split("\n", 1)[0];
    expect(header.split(",")).toEqual(view.schema.columns.map((column) => column.name));
  });
});
