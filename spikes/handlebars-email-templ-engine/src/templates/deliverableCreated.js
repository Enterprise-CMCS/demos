import { read } from "../read.js";

const templateId = "deliverable-created";

export const deliverableCreatedTemplate = {
  id: templateId,
  subject: "CMS DEMOS Deliverable: Deliverable Created",
  text: `Hello,

You have been assigned a new {{deliverableType}} deliverable for your Demonstration, due {{dueDate}}. View this deliverable and any required next steps in the DEMOS system: {{link}}.

Thank you,

DEMOS Notifications



Demonstration: {{demonstrationTitle}}

State: {{state}}

Deliverable type: {{deliverableType}}

Deliverable: {{deliverableName}}

Action: Deliverable Created

Current due date: {{currentDueDate}}`,
  html: `<p>Hello,</p>
<p>You have been assigned a new {{deliverableType}} deliverable for your Demonstration, due {{dueDate}}. View this deliverable and any required next steps in the DEMOS system: <a href="{{link}}">{{link}}</a>.</p>
<p>Thank you,</p>
<p>DEMOS Notifications</p>
<p>Demonstration: {{demonstrationTitle}}</p>
<p>State: {{state}}</p>
<p>Deliverable type: {{deliverableType}}</p>
<p>Deliverable: {{deliverableName}}</p>
<p>Action: Deliverable Created</p>
<p>Current due date: {{currentDueDate}}</p>`,
  getViewModel(data) {
    return {
      demonstrationTitle: read(data, "demonstration.title", templateId),
      state: read(data, "demonstration.state", templateId),
      deliverableType: read(data, "deliverable.type", templateId),
      dueDate: read(data, "deliverable.dueDate", templateId),
      currentDueDate: read(data, "deliverable.currentDueDate", templateId),
      link: read(data, "deliverable.link", templateId),
      deliverableName: read(data, "deliverable.name", templateId),
    };
  },
};
