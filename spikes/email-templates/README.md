# Email Template Spike Comparison

This directory contains three versions of the same email-template spike:

- `email-template-engine`: React Email with plain ESM JavaScript and `React.createElement`
- `tsx-react-emailer`: React Email with TypeScript/React component syntax
- `handlebars-email-templ-engine`: Handlebars templates

All three spikes target the same emailer payload shape:

```json
{
  "to": [{ "name": "Dustin Horning", "address": "Dustin.H@globalalliantinc.com" }],
  "subject": "CMS DEMOS Deliverable: Deliverable Created",
  "text": "Plain text body",
  "html": "<p>HTML body</p>"
}
```

This document is not selecting a final implementation. It records what each option means, what dependencies it brings, and how it would fit into a TypeScript server.

## Option 1: React Email With React In The Server

This is the `tsx-react-emailer` spike. It uses React Email components and `@react-email/render` to turn email components into HTML strings. The templates are authored as TypeScript React components.

Example template shape:

```tsx
function DeliverableSubmittedEmail({ deliverableType, link }: Props) {
  return (
    <EmailLayout>
      <Text>
        A {deliverableType} deliverable has been submitted. View it here: {" "}
        <Link href={link}>{link}</Link>.
      </Text>
    </EmailLayout>
  );
}
```

The renderer does this:

```ts
const props = template.getProps(data, context);
const Component = template.Component;
const html = await render(<Component {...props} />);
const text = toPlainText(html);
```

### Dependencies

Runtime dependencies:

- `react`
- `react-dom`
- `@react-email/render`
- `@react-email/components`

Development/type dependencies:

- `@types/react`
- `@types/react-dom`
- existing server TypeScript tooling

Server config changes needed:

- Allow React component files in the server build.
- Add JSX support to `tsconfig.json`, for example `"jsx": "react-jsx"`.
- Include component files in the server compile, for example `"src/**/*.tsx"` if templates use `.tsx`.
- Confirm the existing `tsc` plus `esbuild` server build bundles the React Email dependencies correctly.

### What This Means

Using React Email in the server does not mean moving email logic to the client. React is only being used as a server-side template authoring/rendering library. The server would still own:

- notification event handling
- recipient resolution
- data loading
- template rendering
- queueing the final email payload

### Pros

- Strong fit for a TypeScript server if templates are engineer-owned.
- Template props can be typed.
- The template can own its `getProps()` mapping from a DEMOS data object.
- Shared layout/components are natural: `EmailLayout`, detail rows, buttons, headers, footers.
- React Email renders email-oriented HTML and can derive plain text with `toPlainText()`.
- Good path if the emails grow into branded or component-heavy layouts.

### Cons

- Adds React dependencies to the backend.
- Requires server config changes for React component files.
- Rendered HTML is noisy because React Email outputs email-safe table markup.
- Output can contain React comment boundaries like `<!-- -->`.
- Local install emitted npm deprecation warnings for `@react-email/components` and related component packages, so package/version choice needs confirmation before production.

## Option 2: React Email Without React Syntax

This is the `email-template-engine` spike. It still uses React Email and React at runtime, but templates are authored with plain JavaScript and `React.createElement()` instead of component markup.

Example:

```js
return React.createElement(
  EmailLayout,
  null,
  React.createElement(Text, { style: textStyle }, `Hello ${personGivenName},`)
);
```

### Dependencies

Runtime dependencies are effectively the same as the React Email component version:

- `react`
- `react-dom`
- `@react-email/render`
- `@react-email/components`

It avoids JSX/TSX syntax, but it does not avoid React.

### Pros

- Can run without JSX/TSX compiler support.
- Proves the raw React Email rendering path.
- Still gets React Email rendering and `toPlainText()`.

### Cons

- Much harder to read and maintain.
- Not representative of how a team would normally author React Email templates.
- Still brings React dependencies into the backend.
- If React Email is chosen, this version is mostly useful as a technical proof, not the preferred authoring style.

## Option 3: Handlebars

This is the `handlebars-email-templ-engine` spike. It uses string templates with `{{variable}}` placeholders.

Example template shape:

```ts
export const deliverableSubmittedTemplate = {
  id: "deliverable-submitted",
  subject: "CMS DEMOS Deliverable: Deliverable Submitted",
  text: "A {{deliverableType}} deliverable has been submitted...",
  html: "<p>A {{deliverableType}} deliverable has been submitted...</p>",
  getViewModel(data) {
    return {
      deliverableType: data.deliverable.type,
      link: data.deliverable.link,
    };
  },
};
```

### Dependencies

Runtime dependencies:

- `handlebars`

Development/type dependencies:

- existing server TypeScript tooling
- possibly `@types/handlebars` only if needed, depending on package typing behavior

Server config changes needed:

- Minimal if templates stay in `.ts` files.
- No React dependency.
- No JSX setting required.

### Can Handlebars Use Typed Objects?

Yes. Handlebars does not prevent us from using TypeScript.

The template string itself is not deeply type-checked by TypeScript, but the data mapping can be typed. A server caller can pass a deliverable/event object into the renderer, and the template can own a typed `getViewModel()` function that extracts the values needed by the Handlebars template.

Example:

```ts
type DeliverableEmailInput = {
  deliverable: {
    type: string;
    name: string;
    currentDueDate: string;
    link: string;
  };
  demonstration: {
    title: string;
    state: string;
  };
};

type DeliverableSubmittedViewModel = {
  deliverableType: string;
  deliverableName: string;
  currentDueDate: string;
  link: string;
  demonstrationTitle: string;
  state: string;
};

export const deliverableSubmittedTemplate: TemplateDefinition<
  DeliverableEmailInput,
  DeliverableSubmittedViewModel
> = {
  id: "deliverable-submitted",
  subject: "CMS DEMOS Deliverable: Deliverable Submitted",
  text: "A {{deliverableType}} deliverable has been submitted...",
  html: "<p>A {{deliverableType}} deliverable has been submitted...</p>",
  getViewModel(data) {
    return {
      deliverableType: data.deliverable.type,
      deliverableName: data.deliverable.name,
      currentDueDate: data.deliverable.currentDueDate,
      link: data.deliverable.link,
      demonstrationTitle: data.demonstration.title,
      state: data.demonstration.state,
    };
  },
};
```

So the same high-level pattern is possible:

```text
DEMOS data object -> typed getViewModel() -> Handlebars render -> emailer payload
```

The tradeoff is that TypeScript validates `getViewModel()`, but it does not automatically prove that every `{{placeholder}}` in the template exists in the view model. Handlebars `strict: true` catches missing placeholders at render time.

### Pros

- Smallest runtime footprint.
- No React in the backend.
- No JSX/TSX server config changes.
- Compact, readable HTML output.
- Good fit for mostly-text transactional emails.
- Can still use TypeScript for input objects and view-model mapping.
- Templates can move toward external editable files later if needed.
- Handlebars escaping and `strict: true` give useful safety.

### Cons

- Text and HTML templates are maintained separately.
- TypeScript does not fully type-check placeholders inside template strings.
- Shared layout/components require partials/helpers instead of React components.
- We own more of the email-safe HTML structure.
- Complex conditionals/helpers can become harder to reason about over time.

## Practical Differences Seen In The Spikes

### Output

Handlebars output is short and readable:

```html
<p>Hello Dustin,</p>
<p>This email template system works.</p>
```

React Email output is production-style email HTML:

```html
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" ...>
<table role="presentation">...</table>
```

That React Email output is expected, but it is harder to inspect in JSON render artifacts.

### Template Ergonomics

Handlebars is closer to editing a message:

```hbs
Current due date: {{currentDueDate}}
```

React Email component syntax is closer to building a typed server-side UI component:

```tsx
<Text>Current due date: {currentDueDate}</Text>
```

Both approaches can let the template own the mapping from a DEMOS object into email-specific values:

```ts
getPropsOrViewModel(data: DeliverableEmailInput) {
  return {
    deliverableType: data.deliverable.type,
    currentDueDate: data.deliverable.currentDueDate,
    link: data.deliverable.link,
  };
}
```

### Plain Text

Handlebars keeps `text` explicit. This is repetitive, but predictable.

React Email can derive `text` from the HTML with `toPlainText()`. This removes duplication, but the plain text output depends on how the HTML renders.

## Integration Shape In The Server

Regardless of library, the server-side flow should look like this:

```text
mutation/action happens
-> server loads the required DEMOS data
-> server resolves recipients
-> server renders { subject, text, html }
-> server enqueues { to, subject, text, html } to the existing emailer queue
```

Email rendering should stay in the server, not the client. The client should only trigger mutations. The server has the domain data, recipient rules, and SQS access.

## Lessons Learned From The Server POC

The React Email POC was small to integrate into the existing server because the server already has the right execution model:

```text
server event data -> renderEmail(templateId, data) -> existing emailer queue payload
```

The renderer returns the exact payload the emailer already accepts:

```ts
{
  to: [{ name: "CMS Owner", address: "cms.owner@example.com" }],
  subject: "CMS DEMOS Deliverable: Deliverable Created",
  text: "Plain text body",
  html: "<html>...</html>",
}
```

That means the email-template layer does not need its own queue. The existing emailer queue should remain the delivery boundary. The template system only needs to produce queue-ready JSON.

### What Worked

- The server can render React Email templates locally and during build.
- The existing TypeScript server can own the template input types and data mapping.
- Templates can accept a normal DEMOS object, then pull out the values they need inside `getProps()`.
- `@react-email/render` can create HTML, and `toPlainText()` can create the text body.
- Local JSON renders are useful for inspection and for proving the emailer payload contract before wiring to SQS.
- Keeping local renders under `server/rendered-emails/` works well as a dev artifact, and that directory should stay gitignored.

### Issues We Hit

- React Email in the server requires React runtime dependencies: `react`, `react-dom`, `@react-email/render`, and `@react-email/components`.
- If templates use React component syntax, server TypeScript config needs JSX enabled and must include template component files.
- The local machine and Docker/container environments can disagree on native packages like `esbuild`. If `tsx` reports a platform mismatch, `npm rebuild esbuild` fixes the local install.
- Avoid importing guessed shared types into dev fixtures. Either export the real input type from the template module or keep the local fixture type explicit.
- The React Email `<Preview>` component can add hidden preheader characters to rendered HTML. That is normal email behavior, but for this POC we skipped it because the JSON blob is easier to inspect without it.
- Rendered React Email HTML is intentionally noisy because it is email-client-safe markup. The JSON payload is correct, but the HTML string is not meant to be pleasant to read inline.

### Overhead
Not a lot of runtime overhead for this use case, but it does add noticeable dependency/build overhead.

The real cost is:

- react and react-dom become backend runtime dependencies.
- @react-email/render and @react-email/components add more package surface.
- Server TypeScript needs JSX support if templates are .tsx.
The server bundle gets larger.
- Devs now need to understand that React is being used as a server-side email rendering library, not as frontend code.

Runtime-wise, rendering one transactional email is cheap. The server would take a typed object, render HTML/text, and send the existing emailer queue payload. That is not heavy unless we are rendering a huge volume synchronously in a hot request path.

### Takeaway

For 9 templates, React Email is reasonable if we value typed templates, reusable layout components, and keeping the object parsing inside the template. The overhead is acceptable, but not zero.

If we want the smallest backend footprint and simplest dependency story, Handlebars wins. If we want stronger TypeScript ergonomics and component reuse, React Email wins.

### Simple Integration Path

The production integration can stay narrow:

1. Put email templates in the server near the notification/domain code.
2. Keep a small template registry keyed by ids like `deliverable-created` and `deliverable-submitted`.
3. Have each template define its subject, recipient resolver, and typed `getProps()` mapping.
4. On a deliverable event, load the deliverable, demonstration, link, and recipient data the template needs.
5. Call `renderEmail(templateId, data)`.
6. Send the returned `{ to, subject, text, html }` to the existing emailer queue.
7. Log the template id, recipient count, target entity id, queue message id, and render/send failures.

For the next real implementation step, the main work is not rendering. The main work is deciding where recipient rules live for each notification event and making sure the event handler loads the right object graph before calling the renderer.

## References

- React Email render utility: https://react.email/docs/utilities/render
- React Email overview/components: https://react.email/docs
- Handlebars expressions and escaping: https://handlebarsjs.com/guide/expressions
- Handlebars compile options, including `strict` and `noEscape`: https://handlebarsjs.com/api-reference/compilation.html
