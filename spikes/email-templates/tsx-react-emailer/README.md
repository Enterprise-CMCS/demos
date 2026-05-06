# TSX React Emailer Spike

This spike renders React Email TSX templates into the same queue-ready payload shape as the other email-template spikes:

```json
{
  "to": [{ "name": "Dustin Horning", "address": "Dustin.H@globalalliantinc.com" }],
  "subject": "CMS DEMOS Deliverable: Deliverable Created",
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

Each command writes a queue-ready JSON payload to `renders/completed/`.

## HTML Preview

```sh
npm run preview -- renders/completed/systems-test-2026-05-06T12-00-00-000Z.json
```

The preview command writes the render payload's `html` field to `renders/previews/<render-name>.html`.

## Template Design

Each template is one TSX file in `src/templates/`. The file owns:

- `subject`
- `Component`
- `getProps`

This keeps the React Email spike close to production ergonomics without adding a bundler or app framework. The only runtime wrapper is `tsx`.
