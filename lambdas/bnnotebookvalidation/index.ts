import { SQSEvent, Context } from "aws-lambda";

const PROCESS_BN_NOTEBOOK_VALIDATION_MUTATION = `
  mutation ProcessBudgetNeutralityNotebookValidation($documentId: ID!) {
    processBudgetNeutralityNotebookValidation(documentId: $documentId)
  }
`;

const graphqlEndpoint = process.env.GRAPHQL_ENDPOINT;
const graphqlAuthToken = process.env.GRAPHQL_AUTH_TOKEN;

interface QueueMessage {
  documentId: string;
}

interface Results {
  processedRecords: number;
}

export function parseQueueMessage(body: string): QueueMessage {
  const parsed = JSON.parse(body);
  if (!parsed.documentId || typeof parsed.documentId !== "string") {
    throw new Error("Queue message is missing required 'documentId' string.");
  }
  return parsed as QueueMessage;
}

export async function processBudgetNeutralityNotebookValidation(documentId: string): Promise<void> {
  if (!graphqlEndpoint) {
    throw new Error("GRAPHQL_ENDPOINT environment variable is required.");
  }

  const response = await fetch(graphqlEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(graphqlAuthToken ? { Authorization: `Bearer ${graphqlAuthToken}` } : {}),
    },
    body: JSON.stringify({
      query: PROCESS_BN_NOTEBOOK_VALIDATION_MUTATION,
      variables: {
        documentId,
      },
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(`BN Notebook validation request failed with status ${response.status}.`);
  }

  if (payload.errors?.length > 0) {
    throw new Error(`BN Notebook validation mutation failed: ${payload.errors[0].message}`);
  }

  if (!payload.data?.processBudgetNeutralityNotebookValidation) {
    throw new Error(`BN Notebook validation mutation returned false for document ${documentId}.`);
  }
}

export const handler = async (event: SQSEvent, context: Context) =>
  {
    console.info("Processing BN notebook validation event", {
      requestId: context.awsRequestId,
      records: event.Records.length,
    });

    const results: Results = {
      processedRecords: 0,
    };

    for (const record of event.Records) {
      const message = parseQueueMessage(record.body);
      await processBudgetNeutralityNotebookValidation(message.documentId);
      console.info("Processed BN notebook validation request.", { documentId: message.documentId });
      results.processedRecords++;
    }

    console.info("All records processed successfully.", { results });

    return {
      statusCode: 200,
      body: `Processed ${results.processedRecords} records.`,
    };
  };
