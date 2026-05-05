# Handlebars Email Template Engine Spike

This spike renders Handlebars templates into the same queue-ready payload shape as the React Email spike:

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
npm run preview -- renders/completed/systems-test-2026-05-05T19-00-00-000Z.json
```

The preview command writes the render payload's `html` field to `renders/previews/<render-name>.html`.

## Template Design

Each template is one file in `src/templates/`. The file owns:

- `subject`
- `text`
- `html`
- `getViewModel`

The renderer compiles each template part with Handlebars `strict: true`, so missing view-model fields fail instead of silently rendering blank output.
