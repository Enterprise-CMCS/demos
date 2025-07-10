# Event Logging Design

We want to capture the 5 W's with regards to events: "Who", "what", "when", "where", and "why". We can try to answer "Why" by including things like the stacktrace that led to the event being called or logging the component that triggered it though is not the same sort of "why" that might be handled by HCD research, observation, feedback sessions which looks at user intention.

1. Who:
  + `userId: ID` - References a user in our users table to answer *who* triggered the event.
  + `withRole: Role` - Since a user's role can change, we might want to log the user's role at the time of dispatching the event
2. What:
  + `eventTypeId: ID` - References a type in the event_type table to answer *what* event occurred.
3. When:
  + `createdAt: DateTime` - Details when the event happened to answer *when* an event occurred. 
4. Where:
  + `route: String` - The route that the user was at when the event was dispatched, answering the *where* an event occurred.
5. Why:
  + `stacktrace: String` - History of how the call happened (How difficult / easy is it to get this?)
  + `component: String` - would be helpful debug info


## Event Data

Each event will have a slightly different set of fields dependening on what's appropriate for that event type. Fields that exist for all event types should likely exist at the top-level of the table in order to filter on them efficiently and reduce the size of our arbitrary JSON payload. See the [Event Types](./event-types.md) document for more information on this.

## B/E & F/E Integration

[TODO: Half the info comes from the FE and half comes from the BE - determine the best way to handle this in prisma / GQL]

### IP Address
For PROD: users won't have to be on Zscaler to access so this information could be useful
### Result Logging
"Success" or "Failure" - Do we want this at the top level for all events or in the JSON? I'm leaning towards top-level for more efficient filtering but it means something different in different contexts. For instance, does a user who tries to login with invalid credentials get an event logged here? What's the use of this?

This is a bit odd to log, we need to conditionally log for every event type in this case since the frontend will be doing the logging:

So here `doMyOperation` would have to be able to throw synchronously to even work which is a bit of a sacrifice.

We could also do classic `.then()` & `.catch()` chaining to implement this. Our operation would need to throw something though and then we have to handle the other fallout from that.  

```
// Try to do my operation
try {
  logEvent(OPERATION_ATTEMPTED)
  await doOperation()
  logEvent(OPERATION_SUCCEEDED)
}

// Ohh no that failed
finally {
  logEvent(OPERATION_FAILED)
}
```

It almost seems like we'd be served best by multiple event types here to capture success and failure for different operations. (`MY_OPERATION_SUCCEEDED`, `MY_OPERATION_FAILED`, `MY_OPERATION_ATTEMPTED`)

With the team we sort of determined this latter approach might be best

## TODO:

- Stacktrace inclusion Difficulty, how about component?
- B/E & F/E interaction, 
- sessionId / AppVersion?
- DataDog, how can we use this?
