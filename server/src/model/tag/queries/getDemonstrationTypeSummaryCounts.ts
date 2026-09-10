import { prisma } from "../../../prismaClient";
import type { DemonstrationTypeUsageSummary, TagName, TagStatus } from "../../../types";

export type QueryResult = {
  demonstration_type: TagName;
  status: TagStatus;
  count_tagged_apps_demonstrations: number;
  count_tagged_apps_amendments: number;
  count_tagged_apps_extensions: number;
  count_assigned_demonstrations: number;
  count_assigned_deliverables: number;
};

export async function getDemonstrationTypeSummaryCounts(): Promise<
  DemonstrationTypeUsageSummary[]
> {
  const results = await prisma().$queryRaw<QueryResult[]>`
    WITH demo_types_used AS (
      SELECT
        tag_name_id AS demonstration_type,
        count(*)::int AS count_assigned_demonstrations
      FROM
        demos_app.demonstration_type_tag_assignment
      GROUP BY
        tag_name_id
    ),

    app_tags_used AS (
      SELECT
        ata.tag_name_id AS demonstration_type,
        sum(
          CASE WHEN application_type_id = 'Demonstration' THEN 1 ELSE 0 END
        )::int AS count_tagged_apps_demonstrations,
        sum(
          CASE WHEN application_type_id = 'Amendment' THEN 1 ELSE 0 END
        )::int AS count_tagged_apps_amendments,
        sum(
          CASE WHEN application_type_id = 'Extension' THEN 1 ELSE 0 END
        )::int AS count_tagged_apps_extensions
      FROM
        demos_app.application_tag_assignment AS ata
      INNER JOIN
        demos_app.application AS app
        ON
          ata.application_id = app.id
      GROUP BY
        ata.tag_name_id
    ),

    deliv_demo_types_used AS (
      SELECT
        demonstration_type_tag_name_id AS demonstration_type,
        count(*)::int AS count_assigned_deliverables
      FROM
        demos_app.deliverable_demonstration_type
      GROUP BY
        demonstration_type_tag_name_id
    )

    SELECT
      tag.tag_name_id AS demonstration_type,
      tag.status_id AS status,
      coalesce(app_tags_used.count_tagged_apps_demonstrations, 0)
        AS count_tagged_apps_demonstrations,
      coalesce(app_tags_used.count_tagged_apps_amendments, 0)
        AS count_tagged_apps_amendments,
      coalesce(app_tags_used.count_tagged_apps_extensions, 0)
        AS count_tagged_apps_extensions,
      coalesce(demo_types_used.count_assigned_demonstrations, 0)
        AS count_assigned_demonstrations,
      coalesce(deliv_demo_types_used.count_assigned_deliverables, 0)
        AS count_assigned_deliverables
    FROM
      demos_app.tag
    LEFT JOIN
      app_tags_used
      ON
        tag.tag_name_id = app_tags_used.demonstration_type
    LEFT JOIN
      demo_types_used
      ON
        tag.tag_name_id = demo_types_used.demonstration_type
    LEFT JOIN
      deliv_demo_types_used
      ON
        tag.tag_name_id = deliv_demo_types_used.demonstration_type
    WHERE
      tag.tag_type_id = 'Demonstration Type';`;

  const formatted_results: DemonstrationTypeUsageSummary[] = [];
  for (const result of results) {
    formatted_results.push({
      demonstrationTypeName: result.demonstration_type,
      approvalStatus: result.status,
      countOfTaggedApplications: {
        demonstrations: result.count_tagged_apps_demonstrations,
        amendments: result.count_tagged_apps_amendments,
        renewals: result.count_tagged_apps_extensions,
      },
      countOfAssignedDemonstrations: result.count_assigned_demonstrations,
      countOfAssignedDeliverables: result.count_assigned_deliverables,
    });
  }
  return formatted_results;
}
