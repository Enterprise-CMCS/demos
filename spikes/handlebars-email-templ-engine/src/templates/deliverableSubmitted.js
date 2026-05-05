import { read } from "../read.js";

const templateId = "deliverable-submitted";

export const deliverableSubmittedTemplate = {
  id: templateId,
  subject: "CMS DEMOS Deliverable: Deliverable Submitted",
  text: `Hello,

A {{deliverableType}} deliverable has been submitted for your Demonstration. View this deliverable and any required next steps in the DEMOS system: {{link}}.

Thank you,

DEMOS Notifications



Demonstration: {{demonstrationTitle}}

State: {{state}}

Deliverable type: {{deliverableType}}

Deliverable: {{deliverableName}}

Action: Deliverable Submitted

Current due date: {{currentDueDate}}`,
  html: `<p>Hello,</p>
<p>A {{deliverableType}} deliverable has been submitted for your Demonstration. View this deliverable and any required next steps in the DEMOS system: <a href="{{link}}">{{link}}</a>.</p>
<p>Thank you,</p>
<p>DEMOS Notifications</p>
<p>Demonstration: {{demonstrationTitle}}</p>
<p>State: {{state}}</p>
<p>Deliverable type: {{deliverableType}}</p>
<p>Deliverable: {{deliverableName}}</p>
<p>Action: Deliverable Submitted</p>
<p>Current due date: {{currentDueDate}}</p>`,
  getViewModel(data) {
    return {
      demonstrationTitle: read(data, "demonstration.title", templateId),
      state: read(data, "demonstration.state", templateId),
      deliverableType: read(data, "deliverable.type", templateId),
      currentDueDate: read(data, "deliverable.currentDueDate", templateId),
      link: read(data, "deliverable.link", templateId),
      deliverableName: read(data, "deliverable.name", templateId),
    };
  },
};
