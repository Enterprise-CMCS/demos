import dotenv from "dotenv";
import { Pool } from "pg";
import { getLocalDatabaseUrl } from "../localDatabaseGuard.js";

const dotenvResult = dotenv.config({ path: new URL("./.env", import.meta.url), quiet: true });

if (dotenvResult.error) {
  throw new Error(
    "Could not load scripts/createApprovedDemoAPI/.env. " +
      "Create it from scripts/createApprovedDemoAPI/.env.example before running create:demo."
  );
}

function assertRequiredEnvVar(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(
      `Missing required environment variable ${name} in scripts/createApprovedDemoAPI/.env.`
    );
  }
}

assertRequiredEnvVar("UPLOAD_BUCKET");
assertRequiredEnvVar("CLEAN_BUCKET");
assertRequiredEnvVar("DELETED_BUCKET");
assertRequiredEnvVar("S3_ENDPOINT_LOCAL");
assertRequiredEnvVar("APPROVED_DEMO_GRAPHQL_ENDPOINT");

if (
  !process.env.APPROVED_DEMO_GRAPHQL_COOKIE?.trim() &&
  !process.env.APPROVED_DEMO_ID_TOKEN?.trim()
) {
  throw new Error(
    "Set APPROVED_DEMO_GRAPHQL_COOKIE or APPROVED_DEMO_ID_TOKEN in scripts/createApprovedDemoAPI/.env for API authentication."
  );
}

const {
  APPROVAL_PACKAGE_PHASE_DOCUMENTS,
  COMPLETED_PHASE_STATUS_ID,
  SEED_CONFIG,
} = await import("./config.js");

const databaseUrl = getLocalDatabaseUrl(SEED_CONFIG.fallbackDatabaseUrl);
process.env.DATABASE_URL = databaseUrl;

function toMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function assertSafeSqlIdentifier(identifier, label) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(`Invalid ${label} SQL identifier: ${identifier}`);
  }
}

function resolveSchemaFromDatabaseUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("schema") ?? "public";
  } catch (error) {
    throw new Error(`Invalid DATABASE_URL: ${toMessage(error)}`);
  }
}

function makeDatabaseAdapter() {
  const schema = resolveSchemaFromDatabaseUrl(databaseUrl);
  assertSafeSqlIdentifier(schema, "schema");
  const schemaPrefix = `"${schema}"`;

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: false,
  });

  return {
    async getProjectOfficerStates(projectOfficerUserId) {
      const result = await pool.query(
        `
          SELECT s.id, s.name
          FROM ${schemaPrefix}.state s
          INNER JOIN ${schemaPrefix}.person_state ps ON ps.state_id = s.id
          WHERE ps.person_id = $1
          ORDER BY s.id ASC
        `,
        [projectOfficerUserId]
      );

      return result.rows.map((row) => ({ id: row.id, name: row.name }));
    },

    async completeFederalComment(applicationId) {
      const result = await pool.query(
        `
          UPDATE ${schemaPrefix}.application_phase
          SET phase_status_id = $2
          WHERE application_id = $1 AND phase_id = 'Federal Comment'
          RETURNING phase_status_id
        `,
        [applicationId, COMPLETED_PHASE_STATUS_ID]
      );

      if (!result.rows[0]) {
        throw new Error(
          `Could not update Federal Comment phase for application ${applicationId}.`
        );
      }

      return { phaseStatusId: result.rows[0].phase_status_id };
    },

    async disconnect() {
      await pool.end();
    },
  };
}

const { createApprovedDemo } = await import("./workflow.js");
const db = makeDatabaseAdapter();

async function step(label, action) {
  try {
    return await action();
  } catch (error) {
    throw new Error(`${label} failed: ${toMessage(error)}`, { cause: error });
  }
}

function makeApprovedDemoApi() {
  const buildHeaders = () => {
    const headers = {
      "content-type": "application/json",
    };

    if (SEED_CONFIG.graphqlCookieHeader?.trim()) {
      headers.cookie = SEED_CONFIG.graphqlCookieHeader.trim();
    }
    if (SEED_CONFIG.graphqlIdToken?.trim()) {
      const token = SEED_CONFIG.graphqlIdToken.trim();
      headers.cookie = headers.cookie ? `${headers.cookie}; id_token=${token}` : `id_token=${token}`;
    }

    return headers;
  };

  const gql = async (query, variables = {}) => {
    const response = await fetch(SEED_CONFIG.graphqlEndpoint, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ query, variables }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.errors?.length) {
      const details = payload?.errors?.map((error) => error.message).join("; ");
      throw new Error(
        `GraphQL request failed (${response.status}). ${details ?? "No error details returned."}`
      );
    }

    return payload.data;
  };

  return {
    getProjectOfficerStates: (projectOfficerUserId) =>
      db.getProjectOfficerStates(projectOfficerUserId),

    createDemonstration: async (input) => {
      const data = await gql(
        `mutation CreateDemonstration($input: CreateDemonstrationInput!) {
          createDemonstration(input: $input) {
            id
          }
        }`,
        { input }
      );
      return data.createDemonstration;
    },

    updateDemonstration: async (id, input) => {
      const data = await gql(
        `mutation UpdateDemonstration($id: ID!, $input: UpdateDemonstrationInput!) {
          updateDemonstration(id: $id, input: $input) {
            id
          }
        }`,
        { id, input }
      );
      return data.updateDemonstration;
    },

    setDemonstrationTypes: async (input) => {
      const data = await gql(
        `mutation SetDemonstrationTypes($input: SetDemonstrationTypesInput!) {
          setDemonstrationTypes(input: $input) {
            id
          }
        }`,
        { input }
      );
      return data.setDemonstrationTypes;
    },

    setApplicationDates: async (input) => {
      const data = await gql(
        `mutation SetApplicationDates($input: SetApplicationDatesInput!) {
          setApplicationDates(input: $input) {
            ... on Demonstration {
              id
            }
            ... on Amendment {
              id
            }
            ... on Extension {
              id
            }
          }
        }`,
        { input }
      );
      return data.setApplicationDates;
    },

    completePhase: async (input) => {
      const data = await gql(
        `mutation CompletePhase($input: CompletePhaseInput!) {
          completePhase(input: $input) {
            ... on Demonstration {
              id
            }
            ... on Amendment {
              id
            }
            ... on Extension {
              id
            }
          }
        }`,
        { input }
      );
      return data.completePhase;
    },

    completeFederalComment: (applicationId) =>
      db.completeFederalComment(applicationId),

    uploadDocumentToPhase: async (input) => {
      const data = await gql(
        `mutation UploadDocumentToPhase($input: UploadDocumentToPhaseInput!) {
          uploadDocumentToPhase(input: $input) {
            id
            presignedUploadUrl
          }
        }`,
        { input }
      );

      return data.uploadDocumentToPhase;
    },

    documentExists: async (documentId) => {
      const data = await gql(
        `query DocumentExists($documentId: ID!) {
          documentExists(documentId: $documentId)
        }`,
        { documentId }
      );
      return data.documentExists;
    },

    getDemonstration: async (id) => {
      const data = await gql(
        `query DemonstrationForScript($id: ID!) {
          demonstration(id: $id) {
            id
            name
            status
            currentPhaseName
            sdgDivision
            state {
              id
              name
            }
            documents {
              id
            }
            demonstrationTypes {
              demonstrationTypeName
            }
          }
        }`,
        { id }
      );
      return data.demonstration;
    },
  };
}

try {
  await createApprovedDemo({
    step,
    api: makeApprovedDemoApi(),
    approvalPackagePhaseDocuments: APPROVAL_PACKAGE_PHASE_DOCUMENTS,
  });
} finally {
  await db.disconnect();
}
