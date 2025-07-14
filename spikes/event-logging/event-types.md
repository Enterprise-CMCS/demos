# Event Types

Event type refers to the types of events that a user can initiate on the frontend. Events are logged when a user attempts an event, not necessarily when an event successfully happens. The list of possible event types will grow over time but it should not shrink.

## Event Types JSON fields

Using the `event_data` field of our `event` model we want to log some data related to certain events that may not be applicable for all event types. Since we're currently in the beginning of the app development there's less of a clear idea what we want to log here - the decision to use JSON is to accomodate changes to these over time and thus the exact list of the fields in this event_data is subject to change.

That being said, a precursory list of the fields we might want is below:

### Authentication Events

**LOGIN**
- `login_method`: "email", "sso", "oauth", etc.

**LOGOUT** 
- `session_duration_seconds`: How long the session lasted
- `logout_method`: "manual", "timeout", "forced", etc.

### Creation Events

**CREATE_DEMONSTRATION**
- `demonstration_id`: ID of the created demonstration
- `demonstration_type`: Type/category of demonstration

**CREATE_AMENDMENT**
- `amendment_id`: ID of the created amendment
- `parent_demonstration_id`: ID of the demonstration being amended

**CREATE_EXTENSION**
- `extension_id`: ID of the created extension
- `parent_demonstration_id`: ID of the demonstration being extended

### Edit Events

**EDIT_DEMONSTRATION**
- `demonstration_id`: ID of the demonstration being edited
- `fields_changed`: Array of field names that were modified
**EDIT_AMENDMENT**
- `amendment_id`: ID of the amendment being edited
- `fields_changed`: Array of field names that were modified
**EDIT_EXTENSION**
- `extension_id`: ID of the extension being edited
- `fields_changed`: Array of field names that were modified

### Document Events

**UPLOAD_DOCUMENT**
- `document_id`: ID of the uploaded document *(Backend: Return from file storage service/Prisma create)*
- `associated_entity_id`: ID of demonstration/amendment/extension *(Frontend: Current entity context)*

**DELETE_DOCUMENT**
- `document_id`: ID of the deleted document *(Frontend: Document list item ID)*
- `associated_entity_id`: ID of demonstration/amendment/extension *(Backend: Query document relations before deletion)*