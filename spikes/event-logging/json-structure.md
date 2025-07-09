# Event Logging JSON Structure

We want to capture 4 of the 5 W's with regards to events: "Who", "what", "when", and "where". The question of "Why" is not a particularly feasible question to answer as it's not really a matter-of-fact measurable dimension as the others are. This question is best handled by HCD research, observation, feedback sessions.

1. Who:
  - `userId: ID` - References a user in our users table to answer *who* triggered the event.
  - `withRole: Role` - Since a user's role can change, we might want to log the user's role along
2. What:
  - `eventTypeId: ID` - References a type in the event_type table to answer *what* event occurred.
  - `operationResult: Boolean` - Determines if the operation a user attempted was successful.
3. When:
  - `createdAt: DateTime` - Details when the event happened to answer *when* an event occurred. 
4. Where:
  - `route: String` - The route that the user was at when the event was dispatched, answering the *where* an event occurred.

## Event Types

The types of events that can exist in an app are as follows: These represent when a user attempts an event, not necessarily when an event successfully happens. This list can grow over time but it should not shrink.

LOGIN
LOGOUT

CREATE_DEMONSTRATION
CREATE_AMENDMENT
CREATE_EXTENSION

EDIT_DEMONSTRATION
EDIT_AMENDMENT
EDIT_EXTENSION

UPLOAD_DOCUMENT
DELETE_DOCUMENT

## Event Data

Each event will have a slightly different set of fields dependening on what's appropriate for that event type. Fields that exist for all event types should likely exist at the top-level of the table in order to filter on them efficiently and reduce the size of our arbitrary JSON payload.

## From the ticket, not sure about these fields

IP Address - All users need to be on Zscaler to access the app which sort of undermines the usefulness of collecting this field. also kind of a privacy concern related to PII? Seems to be of limited value, not sure we should capture this

Result - "Success" or "Failure" - Do we want this at the top level for all events or in the JSON? I'm leaning towards top-level for more efficient filtering but it means something different in different contexts. For instance, does a user who tries to login with invalid credentials 