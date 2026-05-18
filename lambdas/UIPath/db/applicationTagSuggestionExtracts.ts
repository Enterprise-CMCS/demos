import type { PoolClient } from "pg";

const DEMOS_SCHEMA = "demos_app";

const SELECT_TAG_SUGGESTION_FIELD_LIMITS_SQL = `select id from ${DEMOS_SCHEMA}.application_tag_suggestion_extract_field_limit`;
const INSERT_TAG_SUGGESTION_EXTRACT_SQL = `insert into ${DEMOS_SCHEMA}.application_tag_suggestion_extract
  (uipath_value_id, application_id, field_id, value, start_page_no, end_page_no, updated_at)
 values
  ($1, $2, $3, $4, $5, $6, now())
 on conflict (uipath_value_id, application_id, value) do nothing`;
// the on conflict prevents multiple identical "uipath_value_id, application_id, value" combination.
// There are safeguards earlier in this code too. But this can stand on it's if needed and not product replicates.
export type PersistedUiPathValue = {
  id: string;
  applicationId: string;
  fieldId: string;
  value: string;
  tokenList: unknown[];
};

export class ApplicationTagSuggestionExtractError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "ApplicationTagSuggestionExtractError";
  }
}

function getPageNumber(value: PersistedUiPathValue, token: unknown): number {
  if (!token || typeof token !== "object" || !("Page" in token)) {
    throw new ApplicationTagSuggestionExtractError(
      `Cannot create application tag suggestion extract for UiPath value ${value.id}: token_list must include numeric Page values.`
    );
  }

  const page = (token as { Page: unknown }).Page;
  if (typeof page !== "number" || !Number.isInteger(page)) {
    throw new ApplicationTagSuggestionExtractError(
      `Cannot create application tag suggestion extract for UiPath value ${value.id}: token_list must include numeric Page values.`
    );
  }

  return page;
}

function getTokenPageRange(value: PersistedUiPathValue): { startPageNo: number; endPageNo: number } {
  if (!value.tokenList.length) {
    throw new ApplicationTagSuggestionExtractError(
      `Cannot create application tag suggestion extract for UiPath value ${value.id}: token_list must include numeric Page values.`
    );
  }

  const pages = value.tokenList.map((token) => getPageNumber(value, token));

  return {
    startPageNo: Math.min(...pages) + 1,
    endPageNo: Math.max(...pages) + 1,
  };
}

export async function persistApplicationTagSuggestionExtracts(
  client: PoolClient,
  uiPathValues: PersistedUiPathValue[],
): Promise<void> {
  if (!uiPathValues.length) return;

  try {
    await client.query("BEGIN");

    const fieldLimits = await client.query<{ id: string }>(SELECT_TAG_SUGGESTION_FIELD_LIMITS_SQL);
    const allowedFieldIds = new Set(fieldLimits.rows.map((row) => row.id));
    const suggestionValues = uiPathValues.filter((value) => allowedFieldIds.has(value.fieldId));

    for (const value of suggestionValues) {
      const { startPageNo, endPageNo } = getTokenPageRange(value);

      await client.query(INSERT_TAG_SUGGESTION_EXTRACT_SQL, [
        value.id,
        value.applicationId,
        value.fieldId,
        value.value,
        startPageNo,
        endPageNo,
      ]);
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");

    if (error instanceof ApplicationTagSuggestionExtractError) {
      throw error;
    }

    throw new ApplicationTagSuggestionExtractError(
      "Failed to create application tag suggestion extracts from UiPath values.",
      error,
    );
  }
}
