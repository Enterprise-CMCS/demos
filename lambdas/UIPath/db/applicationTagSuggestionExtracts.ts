import type { PoolClient } from "pg";

const DEMOS_SCHEMA = "demos_app";

const SELECT_TAG_SUGGESTION_FIELD_LIMITS_SQL = `select id from ${DEMOS_SCHEMA}.application_tag_suggestion_extract_field_limit`;
const INSERT_TAG_SUGGESTION_EXTRACT_SQL = `insert into ${DEMOS_SCHEMA}.application_tag_suggestion_extract
  (uipath_value_id, application_id, field_id, value, start_page_no, end_page_no, updated_at)
 values
  ($1, $2, $3, $4, $5, $6, now())
 on conflict (uipath_value_id, application_id, value) do nothing`;

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

function getPageNumber(token: unknown): number | null {
  if (!token || typeof token !== "object" || !("Page" in token)) {
    return null;
  }

  const page = (token as { Page: unknown }).Page;
  return typeof page === "number" && Number.isInteger(page) ? page : null;
}

function getTokenPageRange(value: PersistedUiPathValue): { startPageNo: number; endPageNo: number } {
  const pages = value.tokenList.map(getPageNumber).filter((page): page is number => page !== null);

  if (!pages.length) {
    throw new ApplicationTagSuggestionExtractError(
      `Cannot create application tag suggestion extract for UiPath value ${value.id}: token_list must include numeric Page values.`
    );
  }

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

  let transactionStarted = false;

  try {
    await client.query("BEGIN");
    transactionStarted = true;

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
    if (transactionStarted) {
      await client.query("ROLLBACK");
    }

    if (error instanceof ApplicationTagSuggestionExtractError) {
      throw error;
    }

    throw new ApplicationTagSuggestionExtractError(
      "Failed to create application tag suggestion extracts from UiPath values.",
      error,
    );
  }
}
