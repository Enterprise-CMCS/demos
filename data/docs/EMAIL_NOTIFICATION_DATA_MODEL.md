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
    |-- exactly one entity link:
    |     deliverable_action
    |     public_comment
    |     application
    |     reference_configuration
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

  deliverable_action_id          nullable
  public_comment_id              nullable
  application_id                 nullable
  reference_configuration_id     nullable

  triggered_by_user_id           required for realtime notifications
  status_id                      defaults to Pending
  payload                        JSONB snapshot
  sqs_message_id                 nullable
  last_error                     nullable
  created_at
  updated_at
```

Exactly one entity-link ID must be populated. `entity_type` must identify that
same kind of entity. A deliverable notification links to either a deliverable
action or a public comment; that source row provides its deliverable. The
reference download workflow links to the `reference_configuration` requested
by the API. That configuration provides the reference and its optional
agreement. The foreign keys use `ON DELETE RESTRICT`, so a linked row cannot be
deleted while a current notification references it.

## Example records

IDs are shortened in these examples for readability.

### Deliverable action email

```text
id:                       notification-001
email_type_id:            Deliverable Created
entity_type:              deliverable
application_id:           NULL
reference_configuration_id: NULL
deliverable_action_id:    action-501
public_comment_id:        NULL
triggered_by_user_id:     user-201
status_id:                Pending
```

`action-501` is the authoritative source of the deliverable relationship, so
the notification does not duplicate `deliverable_id`.

### Public comment email

```text
id:                       notification-002
email_type_id:            Public Comment Added
entity_type:              deliverable
deliverable_action_id:    NULL
public_comment_id:        comment-601
triggered_by_user_id:     user-202
status_id:                Pending
```

Each public comment has its own natural identifier, so two comments on the same
deliverable can produce two notifications. The comment row is the authoritative
source of the deliverable relationship.

### Application email

```text
id:                       notification-003
email_type_id:            Application Status Updated
entity_type:              application
application_id:           application-301
reference_configuration_id: NULL
deliverable_action_id:    NULL
public_comment_id:        NULL
triggered_by_user_id:     user-203
status_id:                Pending
```

### Reference download email

```text
id:                         notification-004
email_type_id:              Terms And Conditions Requested
entity_type:                reference
application_id:             NULL
reference_configuration_id: configuration-401
deliverable_action_id:      NULL
public_comment_id:          NULL
triggered_by_user_id:       user-204
status_id:                  Pending
```

`configuration-401` identifies the exact reference configuration requested by
the API. Its `reference_id` is required, while its `reference_agreement_id` may
be null.

## Database enforcement

The database rejects a notification when:

- No entity-link ID is populated or more than one is populated.
- `entity_type` does not match the populated entity-link ID.
- The `(email_type_id, entity_type)` pair is not configured.
- `Public Comment Added` does not reference a public comment.
- Any other email type references a public comment.
- A linked entity, triggering user, recipient, type, or status FK is invalid.
- The same person appears twice for one notification.

## Repeated notifications

There is no notification-level idempotency key or unique constraint. The same
email type may be recorded more than once for any linked entity, action, or
comment. If a future workflow requires deduplication, it can introduce a key
based on that workflow's concrete event or occurrence.

## Recipients

`email_notification_recipient` is designed to retain the recipient information
selected for a notification. Each row contains:

```text
email_notification_id
person_id
created_at
```

Together, `email_notification_id` and `person_id` form the primary key, so the
same person cannot appear twice for one notification. Every recipient is
traceable to exactly one DEMOS person. The recipient's address is available
from `person.email`; external recipients use a `non-user-contact` person record.
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

Entity types are limited to `deliverable`, `application`, and `reference`. The
`email_notification_type_entity_type` table defines which email types are
permitted for each entity type. Adding a new pairing is a database configuration
change rather than an unchecked application value.

| Entity type       | Allowed email types                                                                                                                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `deliverable`     | Deliverable Created, Deliverable Submitted, Deliverable Accepted, Deliverable Approved, Deliverable Received and Filed, Deliverable Due Date Updated, Extension Requested, Extension Decision Made, Resubmission Requested, Public Comment Added |
| `application`     | Application Status Updated, Terms And Conditions Requested                                                                                                                                                                                       |
| `reference`       | Terms And Conditions Requested                                                                                                                                                                                                                   |

## Current scope

- Notifications are realtime and user-triggered.
- `triggered_by_user_id` is therefore `NOT NULL`.
- Scheduled, digest, and system-triggered provenance are not modeled here.
- The schema records delivery state but does not implement queue or SMTP logic.
