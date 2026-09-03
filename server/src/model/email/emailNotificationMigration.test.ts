import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL(
    "../migrations/20260831141849_add_email_notification_tracking/migration.sql",
    import.meta.url,
  ),
  "utf8",
);

describe("email notification migration", () => {
  it("requires exactly one typed entity and keeps entity_type consistent", () => {
    expect(migration).toContain(
      'CHECK (num_nonnulls("deliverable_id", "application_id", "reference_id", "reference_agreement_id") = 1)',
    );
    expect(migration).toContain(
      `WHEN 'deliverable' THEN "deliverable_id" IS NOT NULL`,
    );
    expect(migration).toContain(
      `WHEN 'application' THEN "application_id" IS NOT NULL`,
    );
    expect(migration).toContain(
      `WHEN 'reference' THEN "reference_id" IS NOT NULL`,
    );
    expect(migration).toContain(
      `WHEN 'reference_agreement' THEN "reference_agreement_id" IS NOT NULL`,
    );
  });

  it.each([
    ["deliverable_id", "deliverable"],
    ["application_id", "application"],
    ["reference_id", "reference"],
    ["reference_agreement_id", "reference_agreement"],
  ])("links %s to %s", (column, table) => {
    expect(migration).toContain(
      `FOREIGN KEY ("${column}") REFERENCES "${table}"("id")`,
    );
  });

  it("validates email type and entity type as one configured pair", () => {
    expect(migration).toContain(
      'FOREIGN KEY ("email_type_id", "entity_type") REFERENCES "email_notification_type_entity_type"("email_type_id", "entity_type_id")',
    );
  });

  it.each([
    ["action", "deliverable_action_id"],
    ["comment", "public_comment_id"],
    ["agreement", "reference_agreement_id"],
  ])("uses factual columns for %s duplicate protection", (name, column) => {
    expect(migration).toContain(
      `CREATE UNIQUE INDEX "email_notification_${name}_email_type_key" ON "email_notification"("email_type_id", "${column}") WHERE "${column}" IS NOT NULL`,
    );
  });

  it.each(["application", "reference"])(
    "allows repeated notifications for the same %s",
    (entity) => {
      expect(migration).not.toContain(
        `CREATE UNIQUE INDEX "email_notification_${entity}_email_type_key"`,
      );
    },
  );

  it("binds deliverable provenance to the same deliverable", () => {
    expect(migration).toContain(
      'FOREIGN KEY ("deliverable_action_id", "deliverable_id") REFERENCES "deliverable_action"("id", "deliverable_id")',
    );
    expect(migration).toContain(
      'FOREIGN KEY ("public_comment_id", "deliverable_id") REFERENCES "public_comment"("id", "deliverable_id")',
    );
    expect(migration).toContain(
      'CHECK (\n    ("email_type_id" = \'Public Comment Added\') = ("public_comment_id" IS NOT NULL)',
    );
  });

  it("stores one lowercase email address instead of a normalized copy", () => {
    expect(migration).toContain(
      '"email_address" <> \'\' AND "email_address" = lower(trim("email_address"))',
    );
    expect(migration).toContain(
      'ON "email_notification_recipient"("email_notification_id", "email_address")',
    );
    expect(migration).not.toContain("idempotency_key");
    expect(migration).not.toContain("normalized_email");
  });
});
