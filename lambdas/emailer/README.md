# DEMOS Emailer

The emailer accepts messages from SQS, renders realtime template requests with
React Email, applies the recipient allowlist, and sends the resulting message
through SMTP.

## Flow

```text
Server action
  -> Build an email envelope and recipients
  -> Send JSON to the emailer SQS queue
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

Realtime messages have this shape:

```ts
{
  emailNotificationId?: string;
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
template.

### 2. Transport the message

The server uses `EMAILER_QUEUE_URL` when CDK supplies it. Local execution can
resolve `EMAILER_QUEUE_NAME`, which defaults to `emailer-queue`.

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

If `emailNotificationId` is present, rendering and SMTP failures are recorded as
`Failed`, and successful SMTP delivery is recorded as `Sent`.

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

The server currently produces `Deliverable Created`. Other registered
deliverable event types and `Multiple Deliverables Created` are renderable but
still need server-side producers.

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
