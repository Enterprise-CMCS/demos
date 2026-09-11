## Flow of DB Writing

```text
Server: create Pending row + recipients
   ↓
Server: enqueue SQS message containing emailNotificationId
   ↓
Server: mark Queued and store sqsMessageId
   ↓
Lambda: mark Sent or Failed
```

That split is better because:

- The server knows the domain context: action ID, triggering user, entity, recipients, and idempotency key.
- Queue failures are recorded. If the Lambda created the row, there would be no database record when enqueueing itself fails.
- The unique idempotency key can prevent duplicate notifications before SQS receives anything.
- Lambda retries only update the same record instead of creating duplicates.
- The Lambda stays focused on rendering and delivery.

One important detail: the Lambda must receive `emailNotificationId`. Its updates should be conditional so a late `Queued` update cannot overwrite an already-processed `Sent` or `Failed` status.

Longer-term, a transactional outbox would close the small gap between the server’s database insert and SQS send. For this branch, the existing `Pending → Queued → Sent/Failed` approach from `DEMOS-1900-main` is the right pragmatic design.
