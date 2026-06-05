import { useApolloClient, gql, TypedDocumentNode } from "@apollo/client";
import { useCallback, useEffect, useRef } from "react";

import { WorkflowApplicationType } from "components/application";
import { TagName, UploadDocumentToPhaseInput } from "demos-server";

export const UIPATH_SUGGESTION_POLL_INTERVAL_MS = 5_000;
export const UIPATH_SUGGESTION_POLL_TIMEOUT_MS = 120_000;

const LOG_PREFIX = "[UiPathSuggestionPolling]";

type SuggestionQueryVariables = {
  id: string;
};

type SuggestionQueryResult = {
  demonstration?: {
    __typename: "Demonstration";
    id: string;
    suggestedApplicationTags: TagName[];
  };
  amendment?: {
    __typename: "Amendment";
    id: string;
    suggestedApplicationTags: TagName[];
  };
  extension?: {
    __typename: "Extension";
    id: string;
    suggestedApplicationTags: TagName[];
  };
};

export const GET_DEMONSTRATION_APPLICATION_TAG_SUGGESTIONS_QUERY: TypedDocumentNode<
  SuggestionQueryResult,
  SuggestionQueryVariables
> = gql`
  query GetDemonstrationApplicationTagSuggestions($id: ID!) {
    demonstration(id: $id) {
      __typename
      id
      suggestedApplicationTags
    }
  }
`;

export const GET_AMENDMENT_APPLICATION_TAG_SUGGESTIONS_QUERY: TypedDocumentNode<
  SuggestionQueryResult,
  SuggestionQueryVariables
> = gql`
  query GetAmendmentApplicationTagSuggestions($id: ID!) {
    amendment(id: $id) {
      __typename
      id
      suggestedApplicationTags
    }
  }
`;

export const GET_EXTENSION_APPLICATION_TAG_SUGGESTIONS_QUERY: TypedDocumentNode<
  SuggestionQueryResult,
  SuggestionQueryVariables
> = gql`
  query GetExtensionApplicationTagSuggestions($id: ID!) {
    extension(id: $id) {
      __typename
      id
      suggestedApplicationTags
    }
  }
`;

function getSuggestionQuery(workflowApplicationType: WorkflowApplicationType) {
  switch (workflowApplicationType) {
    case "demonstration":
      return GET_DEMONSTRATION_APPLICATION_TAG_SUGGESTIONS_QUERY;
    case "amendment":
      return GET_AMENDMENT_APPLICATION_TAG_SUGGESTIONS_QUERY;
    case "extension":
      return GET_EXTENSION_APPLICATION_TAG_SUGGESTIONS_QUERY;
  }
}

export function useUiPathSuggestionPolling({
  applicationId,
  workflowApplicationType,
}: {
  applicationId: string;
  workflowApplicationType: WorkflowApplicationType;
}) {
  const client = useApolloClient();
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const clearPollingTimers = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const pollForSuggestions = useCallback(async () => {
    console.log(LOG_PREFIX, "refetch", { applicationId, workflowApplicationType });

    try {
      await client.query({
        query: getSuggestionQuery(workflowApplicationType),
        variables: { id: applicationId },
        fetchPolicy: "network-only",
      });
    } catch (error) {
      console.error(LOG_PREFIX, "refetch failed", error);
    }
  }, [applicationId, client, workflowApplicationType]);

  const startPolling = useCallback(() => {
    const isRestarting = intervalRef.current !== null || timeoutRef.current !== null;
    clearPollingTimers();

    console.log(LOG_PREFIX, isRestarting ? "restarted" : "started", {
      applicationId,
      workflowApplicationType,
    });

    void pollForSuggestions();
    intervalRef.current = window.setInterval(
      pollForSuggestions,
      UIPATH_SUGGESTION_POLL_INTERVAL_MS
    );
    timeoutRef.current = window.setTimeout(() => {
      clearPollingTimers();
      console.log(LOG_PREFIX, "stopped", { applicationId, workflowApplicationType });
    }, UIPATH_SUGGESTION_POLL_TIMEOUT_MS);
  }, [applicationId, clearPollingTimers, pollForSuggestions, workflowApplicationType]);

  const startPollingForStateApplicationUpload = useCallback(
    (payload?: UploadDocumentToPhaseInput) => {
      if (payload?.documentType !== "State Application") return;

      startPolling();
    },
    [startPolling]
  );

  useEffect(() => {
    return clearPollingTimers;
  }, [clearPollingTimers]);

  return { startPolling, startPollingForStateApplicationUpload };
}
