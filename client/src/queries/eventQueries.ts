import { gql } from "@apollo/client";

export const LOG_EVENT_MUTATION = gql`
  mutation LogEvent($input: LogEventInput!) {
    logEvent(input: $input) {
      success
      message
    }
  }
`;

export const GET_EVENTS_QUERY = gql`
  query GetEvents {
    events {
      id
      eventType
      logLevel
      route
      createdAt
      eventData
      user {
        id
        fullName
      }
      withRole {
        id
        name
      }
    }
  }
`;
