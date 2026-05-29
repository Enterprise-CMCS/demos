declare const process: {
  env: Record<string, string | undefined>;
};

interface JiraSearchIssueFields {
  summary: string;
  customfield_12104: string; // External ID
  customfield_10100: string; // Epic Link
  duedate: string;
}

interface JiraSearchIssue {
  id: string;
  key: string;
  fields: JiraSearchIssueFields;
}

interface SnykIssueAttributesCoordinatesRemedies {
  description: string;
  type: string 
}

interface SnykIssueAttributesCoordinatesRepresentationsSourceLocation {
  file: string;
  commit_id: string;
}

interface SnykIssueAttributesCoordinatesRepresentations {
  sourceLocation: SnykIssueAttributesCoordinatesRepresentationsSourceLocation;
}

interface SnykIssueAttributesCoordinates {
  remedies: SnykIssueAttributesCoordinatesRemedies[];
  representations: SnykIssueAttributesCoordinatesRepresentations[];
}

interface SnykIssueAttributesRiskScore {
  value: number
}

interface SnykIssueAttributesRisk {
  score: SnykIssueAttributesRiskScore;
}

interface SnykIssueAttributes {
  description: string;
  effective_severity_level: string;
  status: string;
  title: string;
  coordinates: SnykIssueAttributesCoordinates[];
  risk: SnykIssueAttributesRisk;
}

interface SnykIssue {
  id: string
  attributes: SnykIssueAttributes
}

const jiraLabel = "snyk-sync"

function validateSetup() {
  const requiredEnvs = ["SNYK_TOKEN", "SNYK_ORG_ID", "JIRA_TOKEN", "JIRA_EPIC"]

  for (const envName of requiredEnvs) {
    if (!process.env[envName]?.trim()) {
      throw new Error(`${envName} must be set`)
    }
  }
}

async function getSnykCodeIssues(): Promise<SnykIssue[]> {

  const orgId = process.env.SNYK_ORG_ID

  const response = await fetch(`https://api.snyk.io/rest/orgs/${orgId}/issues?version=2025-11-05&type=code&status=open&ignored=false`, {
    headers: {
      Authorization: process.env.SNYK_TOKEN!
    }
  })
  const body = await response.json()

  return body.data
}

async function getJiraTickets(): Promise<JiraSearchIssue[]> {
  const response = await fetch(`https://jiraent.cms.gov/rest/api/2/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.JIRA_TOKEN}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({jql: `project = DEMOS AND labels = ${jiraLabel} AND resolution = Unresolved`, fields: ["summary", "customfield_12104", "priority"]})
  })

  const body = await response.json()

  return body.issues
}

function compareIssues(jiraIssues: JiraSearchIssue[], snykIssues: SnykIssue[]): {open: SnykIssue[], close: JiraSearchIssue[]} {

  const snykIds = new Set(snykIssues.map((issue) => issue.id));
  const jiraByExternalId = new Map<string, JiraSearchIssue>();

  for (const jiraIssue of jiraIssues) {
    const externalId = jiraIssue.fields.customfield_12104?.trim();
    if (externalId) {
      jiraByExternalId.set(externalId, jiraIssue);
    }
  }

  const open = snykIssues.filter((snykIssue) => !jiraByExternalId.has(snykIssue.id));

  const close = jiraIssues.filter((jiraIssue) => {
    const externalId = jiraIssue.fields.customfield_12104?.trim();
    return !externalId || !snykIds.has(externalId);
  });

  return { open, close };

}

async function createJiraIssue(snykIssue: SnykIssue) {
  try {
  const response = await fetch(`https://jiraent.cms.gov/rest/api/2/issue`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.JIRA_TOKEN}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      fields: {
        project: {key: "DEMOS"},
        issuetype: {name: "Story"},
        priority: {
          name: snykToJiraPriority(snykIssue.attributes.effective_severity_level)
        },
        summary: `Snyk Code Finding: ${snykIssue.attributes.title}`,
        description: createTicketDescription(snykIssue),
        labels: [jiraLabel],
        customfield_12104: snykIssue.id,
        customfield_10100: process.env.JIRA_EPIC,
        duedate: getDueDateByPriority(snykIssue.attributes.effective_severity_level)
      }
    })
  })
  const body = await response.json()
} catch (err) {
  console.log(err)
}
}

function getDueDateByPriority(priority: string, currentDate: Date = new Date()): string {
  const normalized = priority.trim().toLowerCase();

  const daysToAdd =
    normalized === "high" ? 30 :
    normalized === "medium" ? 90 :
    365; // low (and fallback)

  const due = new Date(currentDate);
  due.setDate(due.getDate() + daysToAdd);

  const year = due.getFullYear();
  const month = String(due.getMonth() + 1).padStart(2, "0");
  const day = String(due.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createTicketDescription(issue: SnykIssue) {
  const title = issue.attributes.title?.trim() || "Snyk Code Issue";
  const snykDescription = issue.attributes.description?.trim() || "No description provided by Snyk.";
  const riskScore = issue.attributes.risk.score.value
  const details =
    issue.attributes.coordinates
      ?.flatMap((coordinate) => coordinate.representations ?? [])
      .map((representation) => `* ${representation.sourceLocation.file}`)
      .join("\n") || "No files provided";

  const remedies =
    issue.attributes.coordinates
      ?.flatMap((coordinate) => coordinate.remedies ?? [])
      .map((remedy) => remedy.description)
      .join("\n\n")
      .trim() || "No suggestions provided";

  // Outline for Jira wiki-style markup body.
  // Expand sections as needed (links, remediation, file paths, CWE, etc.).
  const body = [
    "----",
    "*This issue was generated automatically based on findings in Snyk Code*",
    "Do not mark this ticket as 'Done' manually. The automation pipeline will close it once the finding is resolved or ignored in Snyk.", 
    `Do not edit the 'External ID' or remove the '${jiraLabel}' label. All other edits/comments are welcome.`,
    "----",
    "h2. Snyk Code Finding",
    "",
    `*Title:* ${title}`,
    `Risk Score: ${riskScore}/1000`,
    "",
    "h3. Description",
    snykDescription,
    "h3. Suggestions from Snyk",
    "{code}",
    remedies,
    "{code}",
    "h4. Affected files",
    details,
  ];

  return body.join("\n");
}

async function run() {
  validateSetup()
  const jiraIssues = await getJiraTickets()
  const snykIssues = await getSnykCodeIssues()
  const next = compareIssues(jiraIssues, snykIssues)

  console.log(`${next.close.length} to close. ${next.open.length} to open.`)
  
  console.log("dry run, not opening or closing any tickets.")

  // next.open.forEach(issue => createJiraIssue(issue))
  // next.close.forEach(issue => closeJiraIssue(issue))
  // createJiraIssue(next.open[1])

}

function snykToJiraPriority(snykPriority: string): string {
  switch (snykPriority) {
    case "medium":
      return "Medium"
    case "high":
      return "High"
    default:
      return "Low"
  }
}

async function closeJiraIssue(issue: JiraSearchIssue) {
try {
  const response = await fetch(`https://jiraent.cms.gov/rest/api/2/issue/${issue.key}/transitions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.JIRA_TOKEN}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      transition: {
        id: 41 // 41 is "Done". The full list of options can be retrieved with a GET to the same endpoint
      },
      fields: {
        resolution: {
          name: "Done"
        }
      },
      update: {
        comment: [
          {
            add: {
              body: "Closing this ticket because the Snyk finding is no longer reported."
            }
          }
        ]
      }
    })
  })
} catch (err) {
  console.error(err)
}
}

await run();
