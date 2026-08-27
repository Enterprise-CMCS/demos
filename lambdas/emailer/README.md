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
  -> Resolve any database-backed template data
  -> Validate the input and arrange React Email content
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

When a user accepts a reference agreement and asks for an emailed copy,
[`getReferenceDownloadUrl`](../../server/src/model/reference/getReferenceDownloadUrl.ts)
inserts the acceptance and calls
[`notifyReferenceAgreementRequested`](../../server/src/model/email/notifyReferenceAgreementRequested.ts).
That producer sends the reference-configuration ID and recipient only. It does
not copy reference names, agreement names, or S3 paths into the queue message.

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
    // Template-specific event data when needed
  };
}
```

The envelope fields describe the event. `payload` contains recipients and any
event data that cannot be resolved from the entity ID.

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
renderEmail(email.emailType, email.payload, { entityId: email.entityId });
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
|   |-- EmailLayout.tsx
|   `-- styles.ts
|-- parts/
|   `-- DeliverableLink.tsx
|-- templates/
|   |-- DeliverableEmail.tsx
|   |-- MultipleDeliverablesEmail.tsx
|   `-- referenceEmails.tsx
|-- helpers.ts
|-- renderEmail.tsx
`-- types.ts
```

- `components` contains overall visual design and styling.
- `parts` contains reusable fragments placed inside templates.
- `templates` validates template-specific payloads and arranges complete emails.
- `helpers.ts` contains stage URL selection, date formatting, and required-value
  validation.
- `renderEmail.tsx` selects templates and produces the final email payload.

### Deliverable templates

`DeliverableEmail.tsx` handles the single-deliverable event variants. It selects
the event-specific message and arranges it with the shared greeting, signature,
deliverable details, action, and applicable due dates.

`MultipleDeliverablesEmail.tsx` is a separate arrangement. It requires at least
two deliverables, requires one shared deliverable type, and renders a link and
due date for each deliverable.

The registry also contains `referenceEmails.tsx`, which can add a terms and
conditions attachment. For that template, [`referenceTerms.ts`](./referenceTerms.ts)
uses `entityId` as the reference-configuration ID and runs this relationship:

```text
reference_configuration
  -> reference
  -> optional reference_agreement
```

The configuration identifies the clicked reference material and its optional
agreement. If an agreement exists, the Lambda reads its `s3_path` from the
database and retrieves that object from `CLEAN_BUCKET`. The queue message and
Lambda package contain no copy of the reference document.

On the references page, a configuration with an agreement opens the acceptance
dialog. A configuration without an agreement bypasses the dialog and downloads
the reference material directly.

## Application URLs

`getDemosAppUrl` in [`emails/helpers.ts`](./emails/helpers.ts) uses `STAGE`:

| Stage | Base URL |
| --- | --- |
| unset or `local` | `https://localhost:3000` |
| `dev`, `test`, or `impl` | `https://${stage}.demos.internal.cms.gov` |
| `prod` | `https://demos.cms.gov` |

An unsupported stage throws `Unsupported email STAGE: <stage>`.

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
3. Add a server producer that supplies `payload.recipients`, the entity ID, and
   only event data that cannot be queried by the Lambda.
4. Add focused rendering tests and producer tests.

The server currently produces `Deliverable Created` and
`Terms And Conditions Requested`. Other registered deliverable event types and
`Multiple Deliverables Created` are renderable but still need server-side
producers.

## Local development

The devcontainer starts Mailpit and exposes its UI at
[http://localhost:8025](http://localhost:8025). LocalStack deploys the emailer
Lambda, connects it to `emailer-queue`, and configures Mailpit as its default SMTP
server. Seeded references and agreements are stored in PostgreSQL, and the
seeder uploads their corresponding objects to `CLEAN_BUCKET`.

From inside the devcontainer, enqueue the legacy test message with:

```sh
.devcontainer/localstack/debug/runemailer.sh
```

The script prints the queue result, Mailpit URL, and the command for following
the local Lambda logs.
