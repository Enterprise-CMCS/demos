# Event Logging Design

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


## Event Data

Each event will have a slightly different set of fields dependening on what's appropriate for that event type. Fields that exist for all event types should likely exist at the top-level of the table in order to filter on them efficiently and reduce the size of our arbitrary JSON payload. See the [Event Types](./event-types.md) document for more information on this.

## From the ticket, not sure about these fields

### IP Address
All users need to be on Zscaler to access the app which sort of undermines the usefulness of collecting this field. also kind of a privacy concern related to PII? Seems to be of limited value, not sure we should capture this. This is also odd since we don't want to 

### Result
"Success" or "Failure" - Do we want this at the top level for all events or in the JSON? I'm leaning towards top-level for more efficient filtering but it means something different in different contexts. For instance, does a user who tries to login with invalid credentials get an event logged here? What's the use of this?

This is a bit odd to log, we need to conditionally log for every event type in this case since the frontend will be doing the logging:

So here `doMyOperation` would have to be able to throw synchronously to even work which is a bit of a sacrifice.

We could also do classic `.then()` & `.catch()` chaining to implement this. Our operation would need to throw something though and then we have to handle the other fallout from that.  

```
// Try to do my operation
try {
  await doMyOperation()
  logEvent(eventType="MY_OPERATION", data={success: true})
}

// Ohh no that failed
finally {
  logEvent(eventType="MY_OPERATION", data={success: false})
}
```

It almost seems like we'd be served best by multiple event types here to capture success and failure for different operations. (`MY_OPERATION_SUCCEEDED`, `MY_OPERATION_FAILED`, `MY_OPERATION_ATTEMPTED`)