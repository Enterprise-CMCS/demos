import { gql } from "@apollo/client";

export const LOG_EVENT_MUTATION = gql`
  mutation LogEvent($input: LogEventInput!) {
    logEvent(input: $input) {
      id
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
        person {
          fullName
        }
      }
      role
      application {
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
    }
  }
`;
