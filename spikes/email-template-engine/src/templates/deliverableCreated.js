const deliverableCreatedTemplate = {
  id: "deliverable-created",
  subject: "CMS DEMOS Deliverable: Deliverable Created",
  text: `Hello,

You have been assigned a new <Deliverable Type> deliverable for your Demonstration, due <Due Date>. View this deliverable and any required next steps in the DEMOS system: <Link>.

Thank you,

DEMOS Notifications



Demonstration: <Demonstration Title>

State: <State>

Deliverable type: <Deliverable Type>

Deliverable: <Deliverable Name>

Action: Deliverable Created

Current due date: <Current Due Date>`,
  html: `<p>Hello,</p>
<p>You have been assigned a new <Deliverable Type> deliverable for your Demonstration, due <Due Date>. View this deliverable and any required next steps in the DEMOS system: <a href="<Link>"><Link></a>.</p>
<p>Thank you,</p>
<p>DEMOS Notifications</p>
<p><strong>Demonstration:</strong> <Demonstration Title></p>
<p><strong>State:</strong> <State></p>
<p><strong>Deliverable type:</strong> <Deliverable Type></p>
<p><strong>Deliverable:</strong> <Deliverable Name></p>
<p><strong>Action:</strong> Deliverable Created</p>
<p><strong>Current due date:</strong> <Current Due Date></p>`,
};

module.exports = {
  deliverableCreatedTemplate,
};
