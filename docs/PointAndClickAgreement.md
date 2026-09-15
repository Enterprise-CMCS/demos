# Point and Click Agreement — Implementation Rundown

This document describes agreement acceptance, optional email delivery, and notification tracking for reference materials.

## What the user can do

The References table supports downloading reference material. When a reference requires an agreement, the Point and Click Agreement dialog displays the associated agreement and requires the user to check **I accept the terms** before downloading.

The dialog includes a second, optional checkbox:

> Receive an email with the Accepted 'Point and Click Agreement'

Both checkboxes start unchecked. Selecting the email option does not replace acceptance. Each checkbox has an 8px gap before its label. While the request is processing, the Download button is disabled and shows a spinner.

**The browser downloads the reference material. The email attaches the accepted agreement.** The reference material is named in the email body but is not attached.

## API and acceptance flow

The dialog and direct reference downloads use `useDownloadReference`, which calls the existing GraphQL query:

```graphql
referenceDownloadUrl(
  id: ID!
  acceptedAgreementId: ID
  emailRequested: Boolean! = false
): String!
```

The query still returns a presigned URL string for the reference material. The only API addition is the optional email request flag; existing callers can omit it.

1. `id` identifies the reference configuration, which connects a reference to its agreement.
2. The existing validation and acceptance flow runs unchanged. When an agreement is accepted, it records the reference ID, agreement ID, authenticated user ID, and acceptance timestamp in `reference_agreement_acceptance`.
3. After the acceptance transaction commits, the server requests an email only when an agreement was accepted and the user selected the email checkbox (`emailRequested: true`).
4. The frontend starts the reference download and closes the dialog. References without an agreement continue through the same existing download flow without requesting an email.

No separate submission mutation, result type, or frontend email status was added. Existing loading and acceptance behavior is preserved.

## Recipient, agreement, and notification tracking

The server resolves the recipient from the person record associated with `context.user.id`. The frontend does not provide a recipient address or S3 location.

Using the validated agreement ID, the server loads the agreement name and `s3Path`. It sends the following metadata through SQS to the emailer:

- Registered recipient email address.
- Reference material name.
- Agreement ID, name, and S3 path.

The notification uses the existing database relationships:

| Field | Value |
| --- | --- |
| `emailTypeId` | `Terms And Conditions Requested` |
| `entityType` | `reference` |
| `referenceConfigurationId` | The submitted configuration ID |
| Recipient `personId` | The authenticated user's person ID |

No database migration was added. Each explicit opted-in submission requests an email; there is no new deduplication mechanism.

## Email content and attachment

**Subject:** CMS DEMOS: National Measure Stewards Terms and Conditions

```text
Hello,

At your request, we are attaching the National Measure Stewards Terms and Conditions for <Reference Material File> to which you have agreed.

Thank you,
DEMOS Notifications

Reference Material File Name: <Reference Material File>

Associated Terms and Conditions: <Attached Agreement File Name>
```

The emailer renders HTML and plain text. It retrieves the agreement directly from `CLEAN_BUCKET` with the S3 SDK (`GetObjectCommand`), using the captured agreement S3 path, then passes its bytes, filename, and content type to Nodemailer. Agreement email delivery does not use a presigned URL, and the SQS message does not contain the file bytes. Where applicable, it adds an extension derived from the S3 content type and uses that attachment filename in the email body.

The worker uses the captured agreement information rather than looking up whichever configuration is active when the queue message is processed. Attachment retrieval failures stop delivery; it does not send an email with the attachment omitted.

## Error handling and delivery tracking

Email preparation or queue errors are logged without blocking the reference download. There is no email-specific warning or delivery-status UI. The shared notification helper retains its existing developer switch for disabling notifications; this feature adds no special handling for it.

Once a notification record exists, the existing queue and worker tracking records `Pending`, `Queued`, and `Sent` or `Failed`, with `lastError` for failures. S3 and SMTP exceptions follow the existing SQS retry behavior. If an external call consumes the Lambda timeout, the worker cannot record `Failed` before SQS retries the message. The recipient allowlist still applies.

`Sent` records a successful SMTP send; it does not confirm inbox receipt. Later worker failures are tracked server-side and do not update the closed dialog.

## Deployment and validation

The emailer has clean-bucket configuration and IAM read permission, plus the S3 and MIME dependencies needed for attachments. Because the deployed emailer runs in a VPC with restricted outbound traffic, its security groups must also allow HTTPS egress to the regional S3 prefix list (or provide an equivalent S3 network path); IAM permission alone is insufficient. Local setup supplies `CLEAN_BUCKET` and supports Mailpit delivery. Deploy the emailer support before the API/frontend changes.

Focused tests cover checkbox selection and propagation, the existing acceptance and loading behavior, registered recipient and configuration selection, no email without acceptance and opt-in, queue failure logging, attachment content, exact email copy, and SMTP failure tracking.

Local verification exercises the reference download query through LocalStack and Mailpit, checking the returned reference URL, recorded acceptance, agreement attachment, and notification delivery status.

## Main implementation files

- [Agreement dialog](../client/src/components/dialog/referenceAgreement/ReferenceAgreementDialog.tsx)
- [Reference download hook](../client/src/hooks/useDownloadReference.tsx)
- [Existing reference download resolver](../server/src/model/reference/getReferenceDownloadUrl.ts)
- [Tracked notification helper](../server/src/model/email/emailNotification.ts)
- [Agreement attachment loader](../lambdas/emailer/agreementAttachment.ts)
- [Email template](../lambdas/emailer/emails/templates/TermsAndConditionsRequestedEmail.tsx)
- [Emailer and rollout notes](../lambdas/emailer/README.md)
