# Email Template Engine Spike

This spike renders a named email template into the same payload shape the existing emailer queue expects:

```json
{
  "to": [{ "name": "Dustin Horning", "address": "Dustin.H@globalalliantinc.com" }],
  "subject": "Dear Admin User, Email functionality is nominal",
  "text": "Plain text body",
  "html": "<p>HTML body</p>"
}
```

## Local Render

```sh
npm run render -- systems-test
npm run render -- deliverable-created
npm run render -- deliverable-submitted
```

Each command writes a queue-ready JSON payload to `renders/completed/`. That directory is ignored by git so local completed renders can be inspected without becoming committed artifacts.

## Usage

```js
import { renderEmail } from "./index.js";

const payload = await renderEmail("deliverable-created", data);
```

The package is ESM-only in this spike.

## Recipient Approach

Templates do not own recipients. Render data provides `recipients.to`, which supports both emailer-compatible recipient forms:

```js
[
  { name: "Dustin Horning", address: "Dustin.H@globalalliantinc.com" }
]
```

Future application code should resolve users, roles, or notification preferences before calling the template renderer. The renderer should receive already-resolved addresses and fail clearly when recipient data is missing or invalid.

## Template Design

Templates are React Email components rendered through `@react-email/render`. Each template module defines:

- `subject`
- `Component`
- `getProps`

`renderEmail()` renders the component to `html`, derives `text` with `toPlainText()`, and returns the emailer queue payload.

Each template owns its own data mapping in `getProps`:

```js
export const deliverableSubmittedTemplate = {
  id: "deliverable-submitted",
  subject: "CMS DEMOS Deliverable: Deliverable Submitted",
  Component: DeliverableSubmittedEmail,
  getProps(data) {
    return {
      demonstrationTitle: read(data, "demonstration.title", "deliverable-submitted"),
      state: read(data, "demonstration.state", "deliverable-submitted"),
      deliverableType: read(data, "deliverable.type", "deliverable-submitted"),
      currentDueDate: read(data, "deliverable.currentDueDate", "deliverable-submitted"),
      link: read(data, "deliverable.link", "deliverable-submitted"),
      deliverableName: read(data, "deliverable.name", "deliverable-submitted"),
    };
  },
}
```

Missing values throw render errors that name the data path, template id, and render part.

## Queue Recommendation

Do not add a second queue for this template engine. The implementation path should be:

```text
template id + render data + resolved recipients -> queue-ready email payload -> existing emailer queue
```

The existing emailer queue should remain responsible for processing, provider retry behavior, logging send attempts, and failure state handling. This spike only produces the valid message payload that queue already knows how to deliver.

## Next Steps

- Move recipient resolution into the application layer that knows the notification event and user roles.
- Add template ids for real DEMOS notification events.
- Store or log a render id alongside queued messages if product support needs traceability from event to email payload.
