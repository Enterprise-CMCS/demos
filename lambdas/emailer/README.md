# DEMOS Emailer

The emailer accepts messages from SQS, renders realtime template requests with
React Email, applies the recipient allowlist, and sends the resulting message
through SMTP.

## Flow

```text
Server action
  -> Build an email envelope and create a Pending notification
  -> Mark it Queued, send JSON to SQS, and save the message ID in one DB transaction
  -> Emailer Lambda parses one SQS message
  -> Select a template by emailType
  -> Validate the payload and arrange React Email content
  -> Render HTML and plain text
  -> Apply the non-production recipient allowlist
  -> Send through Nodemailer
```

### 1. Produce the message

For deliverable creation, the server calls
[`notifyDeliverableCreated`](../../server/src/model/email/notifyDeliverableCreated.ts)
after the deliverable transaction completes. The producer loads and deduplicates
recipients, then sends a message through
[`enqueueEmail`](../../server/src/services/emailQueue.ts).

Submission, completion, manual due-date changes, extension requests and decisions,
resubmission requests, and public comments use
[`notifyDeliverableEvent`](../../server/src/model/email/notifyDeliverableEvent.ts)
after their transactions complete.

Realtime messages have this shape:

```ts
{
  emailNotificationId: string;
  emailType: string;
  entityType?: string;
  entityId?: string;
  idempotencyKey?: string;
  triggeredBy?: {
    type: string;
    id: string;
  };
  payload: {
    recipients: {
      to: EmailRecipient[];
      cc?: EmailRecipient[];
      bcc?: EmailRecipient[];
    };
    // Template-specific data
  };
}
```

The envelope fields describe the event. Only `payload` is passed to the selected
template. A notification starts as `Pending`; `enqueueEmail` marks it `Queued`
before publishing and saves the returned SQS message ID without another status
transition.

### 2. Transport the message

The server uses `EMAILER_QUEUE_URL` when CDK supplies it. Local execution can
resolve `EMAILER_QUEUE_NAME`, which defaults to `emailer-queue`.

Set `DISABLE_EMAIL_NOTIFICATIONS=true` to skip sending messages to SQS. The
server seed script sets this automatically, and no notification record is
created for seeded deliverables.

[`deployment/stacks/api.ts`](../../deployment/stacks/api.ts) connects the queue
to the emailer Lambda with a batch size of one. A failed invocation is retried;
after five receives, SQS moves the message to the emailer dead-letter queue.

### 3. Render a realtime message

[`index.ts`](./index.ts) recognizes a realtime envelope by its `emailType` and
`payload`, then calls:

```ts
renderEmail(email.emailType, email.payload);
```

Legacy messages that already contain `to`, `subject`, and `text` bypass template
rendering and continue through delivery validation.

[`emails/renderEmail.tsx`](./emails/renderEmail.tsx) owns the template registry,
recipient validation, and final React Email rendering. Each template returns:

```ts
{
  subject: string;
  content: ReactElement;
}
```

`renderEmail` converts `content` into HTML and plain text and combines it with
the normalized recipients.

### 4. Deliver the message

The Lambda validates the rendered email, checks every recipient against the
non-production allowlist, and sends it with Nodemailer. Production disables the
allowlist through deployment configuration.

The Lambda changes only notifications currently marked `Queued` to `Sent` or
`Failed`.

## Template structure

```text
emails/
|-- components/
|   |-- DeliverableEmailLayout.tsx
|   |-- DeliverableLink.tsx
|   |-- EmailLayout.tsx
|   `-- styles.ts
|-- templates/
|   |-- DeliverableAcceptedEmail.tsx
|   |-- DeliverableApprovedEmail.tsx
|   |-- DeliverableCreatedEmail.tsx
|   |-- DeliverableDueDateUpdatedEmail.tsx
|   |-- DeliverableReceivedAndFiledEmail.tsx
|   |-- DeliverableSubmittedEmail.tsx
|   |-- ExtensionDecisionMadeEmail.tsx
|   |-- ExtensionRequestedEmail.tsx
|   |-- MultipleDeliverablesCreatedEmail.tsx
|   |-- PublicCommentAddedEmail.tsx
|   `-- ResubmissionRequestedEmail.tsx
|-- helpers.ts
|-- renderEmail.tsx
`-- types.ts
```

- `components` contains overall visual design and typed layouts.
- Each file in `templates` validates the fields required by one email type and
  arranges its complete email.
- `helpers.ts` contains application URL selection, date formatting, and required-value
  validation.
- `renderEmail.tsx` selects templates and produces the final email payload.

### Deliverable templates

`renderEmail.tsx` selects one concrete template. The selected template keeps
its input as `unknown` until it has validated the objects and strings it uses.
`DeliverableEmailLayout.tsx` only renders required, typed values and contains
no email-type branches or payload validation.

`MultipleDeliverablesCreatedEmail.tsx` requires at least two deliverables,
requires one shared deliverable type, and renders a link and due date for each
deliverable.

## Application URLs

Deployment passes `DEMOS_APP_URL` to the Lambda from the canonical
`cloudfrontHost` configuration. This supports standard and ephemeral
environments without rebuilding hostnames in the emailer. LocalStack uses
`https://localhost:3000`; `getDemosAppUrl` uses the same value when the variable
is unset during local development.

## Logging

[`emailLogContext.ts`](./emailLogContext.ts) identifies realtime envelopes and
builds reusable structured log metadata:

- `emailType`
- `entityType`
- `entityId`
- `idempotencyKey`
- `triggeredBy`

Creating the context does not emit a log. `index.ts` adds it to the
`log only: email not in allowlist` and `message sent` records.

[`log.ts`](./log.ts) creates a Pino logger with service name `emailer`. Lambda
stdout is captured by CloudWatch; local terminal output is formatted with
`pino-pretty` when a TTY is available. Logged recipient addresses are redacted.

## Adding a template

1. Add a renderer under `emails/templates` that returns `EmailTemplateResult`.
2. Register the exact `emailType` string in `emails/renderEmail.tsx`.
3. Add a server producer that supplies `payload.recipients` and the required
   template data.
4. Add focused rendering tests and producer tests.

## Realtime deliverable emails

All recipients below are BCC recipients, deduplicated by email address. State POCs
are State Points of Contact assigned to the demonstration. CMS contacts are assigned
Project Officers, DDME Analysts, Policy Technical Directors, and Monitoring &
Evaluation Technical Directors.

| Email type | Trigger | Recipients |
| --- | --- | --- |
| Deliverable Created | Deliverable creation | All State POCs |
| Deliverable Submitted | Deliverable submission | CMS owner + all CMS contacts |
| Deliverable Due Date Updated | Manual due-date change; unchanged dates do not notify | All State POCs |
| Extension Requested | Extension request | CMS owner + all CMS contacts |
| Extension Decision Made | Extension approved or denied | All State POCs |
| Resubmission Requested | Resubmission request | All State POCs |
| Deliverable Accepted | Completion with Accepted status | All State POCs |
| Deliverable Approved | Completion with Approved status | All State POCs |
| Deliverable Received and Filed | Completion with Received and Filed status | All State POCs |
| Deliverable Comment | Public comment added to an Accepted, Approved, or Received and Filed deliverable | CMS owner + all demonstration contacts |

Producers run after the corresponding transaction completes and use
[`enqueueAndTrackRealtimeEmail`](../../server/src/model/email/emailNotification.ts)
to create the notification and queue it. Deliverable actions populate
`email_notification.deliverable_action_id`; comments populate `public_comment_id`
instead, without creating a deliverable action. Each new action or comment has its
own source record. Producer failures are logged without rolling back the saved action
or comment.

Extension approvals and resubmission requests send their dedicated emails, even when
they change the due date; they do not also send `Deliverable Due Date Updated`.

`Deliverable Comment` is the registered email type and database value. Its renderer
remains `PublicCommentAddedEmail.tsx`, with subject
`CMS DEMOS Deliverable: New Comment` and a link to view the deliverable and full
comment thread. Comments on other statuses do not generate a notification.

`Multiple Deliverables Created` has a registered template but no server producer yet.
Scheduled deliverable reminders are not part of these realtime triggers.

## Local development

The devcontainer starts Mailpit and exposes its UI at
[http://localhost:8025](http://localhost:8025). LocalStack deploys the emailer
Lambda, connects it to `emailer-queue`, and configures Mailpit as its default SMTP
server.

From inside the devcontainer, enqueue the legacy test message with:

```sh
.devcontainer/localstack/debug/runemailer.sh
```

The script prints the queue result, Mailpit URL, and the command for following
the local Lambda logs.

### Application notifications

Application emails use the same tracked queue, renderer, BCC delivery, allowlist, and
notification status updates as deliverable emails:

- `Application Status Updated`: sent after completing a phase, skipping Concept, or
  declaring Completeness incomplete, when the application's status actually changes.

Status-change emails BCC CMS-role contacts and Admin contacts assigned to the parent demonstration.
The payload includes the demonstration, application type, status, and event date;
Amendment and Extension emails also include their application title and direct link.
Tracking uses the affected application's ID in `application_id`, with `entity_type`
set to `application` for all three application types. For a demonstration, this is
the demonstration ID; for an amendment or extension, it is that application's own ID.
The application type comes from the linked Application record and is included in
the queued payload for rendering.

### Accepted reference agreements

`submitReferenceAgreement` records acceptance and, when explicitly opted in, queues
`Terms And Conditions Requested` with entity type `reference` and the accepted
`referenceConfigurationId`. Its payload contains the registered recipient,
`reference.name`, and `agreement: { id, name, s3Path }` captured at submission.
The worker retrieves that agreement from `CLEAN_BUCKET` and attaches it to the
email. Retrieval or SMTP failures record `Failed` and `lastError` and follow the
existing SQS retry policy. Queuing failures return a warning status while keeping
the reference download available.

Deploy the emailer with clean-bucket read access before deploying the new API and
frontend. For local testing, use `LOCAL_EMAIL_MODE=mailpit` with
`.devcontainer/localstack/setup/setup_emailer_lambda.sh`; inspect captured mail at
`http://localhost:8025`. No database migration is needed.
