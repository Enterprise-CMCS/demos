# Email Notification Data Model

This document describes the database portion of realtime email notification
tracking introduced by DEMOS-1847. Email rendering, queueing, and delivery are
outside this PR.

The complete schema is available in the [DEMOS data model](./DEMOS_Data_Model.mmd).

## Relationship overview

```text
email_notification_type
          |
          | allowed combination
          v
email_notification_type_entity_type ---> email_notification_entity_type
          |
          | validates (email_type_id, entity_type)
          v
email_notification
    |-- exactly one owner:
    |     deliverable
    |     application
    |     reference
    |     reference_agreement
    |
    |-- deliverable provenance:
    |     exactly one deliverable_action or public_comment
    |
    |-- triggered_by_user_id ---> users
    |-- status_id -------------> email_notification_status
    |-- recipient rows --------> email_notification_recipient ---> person
    `-- changes ---------------> email_notification_history
```

## Core notification record

`email_notification` stores one logical email notification and its delivery
state.

```text
email_notification
  id
  email_type_id
  entity_type

  deliverable_id                 nullable
  application_id                 nullable
  reference_id                   nullable
  reference_agreement_id         nullable

  deliverable_action_id          nullable
  public_comment_id              nullable

  triggered_by_user_id           required for realtime notifications
  status_id                      defaults to Pending
  payload                        JSONB snapshot
  sqs_message_id                 nullable
  last_error                     nullable
  created_at
  updated_at
```

Exactly one owner ID must be populated. `entity_type` must identify that same
owner. The foreign keys use `ON DELETE RESTRICT`, so an owner or provenance row
cannot be deleted while a current notification references it.

## Example records

IDs are shortened in these examples for readability.

### Deliverable action email

```text
id:                       notification-001
email_type_id:            Deliverable Created
entity_type:              deliverable
deliverable_id:           deliverable-101
application_id:           NULL
reference_id:             NULL
reference_agreement_id:   NULL
deliverable_action_id:    action-501
public_comment_id:        NULL
triggered_by_user_id:     user-201
status_id:                Pending
```

The composite foreign key `(deliverable_action_id, deliverable_id)` guarantees
that `action-501` belongs to `deliverable-101`.

### Public comment email

```text
id:                       notification-002
email_type_id:            Public Comment Added
entity_type:              deliverable
deliverable_id:           deliverable-101
deliverable_action_id:    NULL
public_comment_id:        comment-601
triggered_by_user_id:     user-202
status_id:                Pending
```

Each public comment has its own natural identifier, so two comments on the same
deliverable can produce two notifications. The composite foreign key verifies
that the comment belongs to the selected deliverable.

### Application email

```text
id:                       notification-003
email_type_id:            Application Status Updated
entity_type:              application
deliverable_id:           NULL
application_id:           application-301
reference_id:             NULL
reference_agreement_id:   NULL
deliverable_action_id:    NULL
public_comment_id:        NULL
triggered_by_user_id:     user-203
status_id:                Pending
```

Non-deliverable notifications cannot contain deliverable action or public
comment provenance.

## Database enforcement

The database rejects a notification when:

- No owner ID is populated or more than one owner ID is populated.
- `entity_type` does not match the populated owner ID.
- The `(email_type_id, entity_type)` pair is not configured.
- A deliverable notification has neither or both provenance IDs.
- A non-deliverable notification contains deliverable provenance.
- `Public Comment Added` does not reference a public comment.
- Any other email type references a public comment.
- An owner, action, comment, triggering user, recipient, type, or status FK is
  invalid.
- A recipient address is empty, padded with whitespace, or not lowercase.
- The same lowercase email address appears twice for one notification.

## Idempotency

Idempotency uses factual columns rather than a composed string. Partial unique
indexes prevent duplicate logical notifications:

| Notification source | Unique columns                          |
| ------------------- | --------------------------------------- |
| Deliverable action  | `email_type_id, deliverable_action_id`  |
| Public comment      | `email_type_id, public_comment_id`      |
| Reference agreement | `email_type_id, reference_agreement_id` |

For example, retrying `Deliverable Created` for the same deliverable action is
rejected, while `Public Comment Added` for two different comment IDs is allowed.

Applications and references intentionally have no notification-level unique
constraint. Every valid event or user request can create another notification
for the same entity and email type. The reference-agreement index currently
permits one notification of a given type per agreement. Recurring or scheduled
occurrences are intentionally outside this realtime-only model.

## Recipients

`email_notification_recipient` is designed to retain the recipient information
selected for a notification. Each row contains:

```text
email_notification_id
person_id
email_address
created_at
```

The address is stored lowercase and must be unique within the notification.
`person_id` remains required so every recipient is traceable to a DEMOS person.
The database permits a notification to have zero recipient rows; selecting and
requiring recipients belongs to the producer workflow.

## Status and history

The supported statuses are:

```text
Pending -> Queued -> Sent
   |          |
   v          v
 Failed     Failed
```

The lookup table constrains the available status values. Transition ordering is
managed by the delivery workflow and is not enforced by a database transition
table in this PR.

`email_notification_history` receives an audit row after every insert, update,
or delete of an email notification. It preserves the notification data along
with the revision operation and modification timestamp.

## Static configuration

Entity types are limited to `deliverable`, `application`, `reference`, and
`reference_agreement`. The `email_notification_type_entity_type` table defines
which email types are permitted for each entity type. Adding a new pairing is a
database configuration change rather than an unchecked application value.

| Entity type           | Allowed email types                                                                                                                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `deliverable`         | Deliverable Created, Deliverable Submitted, Deliverable Accepted, Deliverable Approved, Deliverable Received and Filed, Deliverable Due Date Updated, Extension Requested, Extension Decision Made, Resubmission Requested, Public Comment Added |
| `application`         | Application Status Updated, Terms And Conditions Requested                                                                                                                                                                                       |
| `reference`           | Terms And Conditions Requested                                                                                                                                                                                                                   |
| `reference_agreement` | Terms And Conditions Requested                                                                                                                                                                                                                   |

## Current scope

- Notifications are realtime and user-triggered.
- `triggered_by_user_id` is therefore `NOT NULL`.
- Scheduled, digest, and system-triggered provenance are not modeled here.
- The schema records delivery state but does not implement queue or SMTP logic.
