# Full LocalStack Local Development Setup

This setup runs the normal local app while backing AWS-style dependencies with LocalStack. Use this when you want the frontend, GraphQL server, database, S3 buckets, queues, and local Lambda workers available together.

## What Runs

The devcontainer starts these services:

- `app`: the development shell where you run server and client commands.
- `db`: PostgreSQL with the `demos` database.
- `localstack`: LocalStack on port `4566`.
- `kafka-mock`: a local Kafka container.
- `mailpit`: local SMTP capture with a web inbox at http://localhost:8025.

The LocalStack bootstrap creates:

- Secrets: `database-secret`, `demos-local/uipath`. <!-- pragma: allowlist secret -->
- Buckets: `upload-bucket`, `clean-bucket`, `infected-bucket`, `deleted-bucket`, `uipath-documents`.
- Queues: `fileprocess-queue`, `infected-file-expiration-queue`, `uipath-queue`, `budget-neutrality-queue`, `emailer-queue`, plus DLQs.
- Lambdas: `fileprocess`, `deleteinfectedfile`, `uipath`, `budgetneutrality`, `emailer`.
- EventBridge rule: `s3-upload-to-guardduty`.

## Start The Devcontainer

From the repository root:

```zsh
devcontainer up --workspace-folder .
devcontainer exec --workspace-folder . /bin/zsh
```

You can also open the repo in VSCode and reopen it in the devcontainer when prompted.

Inside the devcontainer, LocalStack is `http://localstack:4566`. From your host machine, it is `http://localhost:4566`.

Mailpit is the default local email destination. Its SMTP service is available to the emailer Lambda at `mailpit:1025`; only its web inbox is exposed to the host. Messages are not persisted when the Mailpit container is recreated.

## Bootstrap LocalStack

The devcontainer runs the full LocalStack bootstrap on start through `.devcontainer/devcontainer.json`.

To rerun it manually:

```zsh
bash /workspaces/demos/.devcontainer/localstack/setup_localstack.sh
```

The setup script rebuilds and redeploys the local Lambda packages. It also recreates some local resources, including S3 buckets, so expect local test files in those buckets to be removed.

Quick health checks:

```zsh
curl -sf http://localstack:4566/_localstack/health
aws --endpoint-url=http://localstack:4566 --region us-east-1 s3 ls
aws --endpoint-url=http://localstack:4566 --region us-east-1 sqs list-queues
aws --endpoint-url=http://localstack:4566 --region us-east-1 lambda list-functions
```

## Run The App

Start the server from inside the devcontainer:

```zsh
cd /workspaces/demos/server
[ -f .env ] || cp .env.example .env
npm ci
npm run seed:reset
npm run dev
```

`server/.env.example` points the server at the devcontainer database and LocalStack buckets. `npm run seed:reset` rebuilds the local schema and loads fake data. Run it on first setup, after schema changes, or when you want a fresh database.

In a second devcontainer terminal, start the client:

```zsh
cd /workspaces/demos/client
npm ci
npm run dev
```

Open http://localhost:3000 and use the normal development sign-in flow. Do not use `npm run dev:mocks` for this setup, since mock mode bypasses the server and does not exercise the LocalStack resources.

## Browser Uploads

The server signs local S3 URLs using `http://localstack:4566`. For browser-based uploads from your host machine, make sure `localstack` resolves on the host:

```text
127.0.0.1 localstack
```

Add that line to the host machine's `/etc/hosts` file. CLI commands run inside the devcontainer do not need this host entry.

## Redeploy Individual Lambdas

After changing Lambda code, rerun only the matching setup script:

```zsh
bash /workspaces/demos/.devcontainer/localstack/setup/setup_fileprocess_lambda.sh
bash /workspaces/demos/.devcontainer/localstack/setup/setup_deleteinfectedfile_lambda.sh
bash /workspaces/demos/.devcontainer/localstack/setup/setup_budgetneutrality_lambda.sh
bash /workspaces/demos/.devcontainer/localstack/setup/setup_uipath_lambda.sh
bash /workspaces/demos/.devcontainer/localstack/setup/setup_emailer_lambda.sh
```

Rerun the full setup script when queue, bucket, secret, or EventBridge wiring changes.

## Useful LocalStack Commands

List bucket contents:

```zsh
bash /workspaces/demos/.devcontainer/localstack/debug/list-buckets.sh
```

Upload a file directly to the upload bucket:

```zsh
aws --endpoint-url=http://localstack:4566 --region us-east-1 s3 cp ./test.pdf s3://upload-bucket/test.pdf
```

Tail Lambda logs:

```zsh
aws --endpoint-url=http://localstack:4566 --region us-east-1 logs tail /aws/lambda/fileprocess --since 10m --follow
aws --endpoint-url=http://localstack:4566 --region us-east-1 logs tail /aws/lambda/deleteinfectedfile --since 10m --follow
aws --endpoint-url=http://localstack:4566 --region us-east-1 logs tail /aws/lambda/budgetneutrality --since 10m --follow
aws --endpoint-url=http://localstack:4566 --region us-east-1 logs tail /aws/lambda/uipath --since 10m --follow
aws --endpoint-url=http://localstack:4566 --region us-east-1 logs tail /aws/lambda/emailer --since 10m --follow
```

Simulate infected-file lifecycle cleanup:

```zsh
bash /workspaces/demos/.devcontainer/localstack/debug/delete-infected-file.sh <object-key>
```

Trigger the Budget Neutrality queue manually:

```zsh
QUEUE_URL=$(aws --endpoint-url=http://localstack:4566 --region us-east-1 sqs get-queue-url --queue-name budget-neutrality-queue --query QueueUrl --output text)
aws --endpoint-url=http://localstack:4566 --region us-east-1 sqs send-message --queue-url "$QUEUE_URL" --message-body '{"documentId":"doc-1","documentTypeId":"BN Workbook"}'
```

Trigger the emailer queue manually:

```zsh
bash /workspaces/demos/.devcontainer/localstack/debug/runemailer.sh
```

The default command sends to `mailpit-test@example.test`. Open http://localhost:8025 to inspect the rendered message. Set `LOCAL_EMAIL` to use a different captured recipient; Mailpit does not deliver messages externally.

To test the CMS SMTP relay instead, explicitly select relay mode and provide the only allowed recipient:

```zsh
export LOCAL_EMAIL_MODE=relay
export LOCAL_EMAIL=your.name@example.com
bash /workspaces/demos/.devcontainer/localstack/setup/setup_emailer_lambda.sh
bash /workspaces/demos/.devcontainer/localstack/debug/runemailer.sh
```

Relay mode defaults to `smtp.cloud.internal.cms.gov:587`. Override it with `LOCAL_EMAIL_HOST`, `LOCAL_EMAIL_PORT`, or `LOCAL_EMAIL_FROM` when needed. Rerun the emailer setup script after changing modes or SMTP settings.

## Optional GraphQL Lambda/API Gateway

The normal frontend development flow uses the local Node server on port `4000`. If you specifically need to test the packaged GraphQL Lambda behind LocalStack API Gateway, deploy it separately:

```zsh
cd /workspaces/demos/server/localstack
./localstack.sh
```

The script prints an API Gateway URL like:

```text
http://localhost:4566/_aws/execute-api/<api-id>/local
```

Use that URL for Lambda/API Gateway checks from the host. From inside the devcontainer, replace `localhost` with `localstack`.

## Troubleshooting

- `DATABASE_URL must be set`: create `server/.env` from `server/.env.example`.
- Browser upload cannot reach `http://localstack:4566`: add `127.0.0.1 localstack` to the host `/etc/hosts`.
- Lambda code changed but behavior did not: rerun the specific Lambda setup script.
- Mailpit inbox is unavailable: restart or rebuild the devcontainer and verify http://localhost:8025 loads.
- Emailer cannot resolve `mailpit`: rebuild the devcontainer so LocalStack receives the Compose network configuration.
- Buckets, queues, or event wiring look stale: rerun `bash /workspaces/demos/.devcontainer/localstack/setup_localstack.sh`.
- LocalStack health check fails: restart the devcontainer so the `localstack` service is recreated.
