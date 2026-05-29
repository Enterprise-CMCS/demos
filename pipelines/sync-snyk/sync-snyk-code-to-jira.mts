declare const process: {
  env: Record<string, string | undefined>;
  argv: string[];
};

declare global {
  interface ImportMeta {
    filename: string;
  }
}

type IssueComparison = {
  open: SnykIssue[];
  close: JiraSearchIssue[];
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

interface SnykRemedy {
  description: string;
  type: string;
}

interface SnykSourceLocation {
  file: string;
  commit_id: string;
}

interface SnykRepresentation {
  sourceLocation: SnykSourceLocation;
}

interface SnykCoordinate {
  remedies: SnykRemedy[];
  representations: SnykRepresentation[];
}

interface SnykRiskScore {
  value: number;
}

interface SnykRisk {
  score: SnykRiskScore;
}

interface SnykIssueAttributes {
  description: string;
  effective_severity_level: string;
  status: string;
  title: string;
  coordinates: SnykCoordinate[];
  risk: SnykRisk;
}

interface SnykIssue {
  id: string;
  attributes: SnykIssueAttributes;
}

const jiraLabel = "snyk-sync";
const jiraBaseUrl = "https://jiraent.cms.gov/rest/api/2";
const jiraProjectKey = "DEMOS";
const jiraDoneTransitionId = 41; // 41 is "Done". The full list of options can be retrieved with a GET to the same endpoint.
const requiredEnvs = ["SNYK_TOKEN", "SNYK_ORG_ID", "JIRA_TOKEN", "JIRA_EPIC"];
const snykApiVersion = "2025-11-05";

export function validateSetup() {
  for (const envName of requiredEnvs) {
    if (!process.env[envName]?.trim()) {
      throw new Error(`${envName} must be set`);
    }
  }
}

async function getSnykCodeIssues(): Promise<SnykIssue[]> {
  const orgId = process.env.SNYK_ORG_ID;
  const url = `https://api.snyk.io/rest/orgs/${orgId}/issues?version=${snykApiVersion}&type=code&status=open&ignored=true`;

  const response = await fetch(url, {
    headers: {
      Authorization: process.env.SNYK_TOKEN!
    }
  });
  const payload = await response.json();

  return payload.data;
}

async function getJiraTickets(): Promise<JiraSearchIssue[]> {
  const response = await fetch(`${jiraBaseUrl}/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.JIRA_TOKEN}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      jql: `project = ${jiraProjectKey} AND labels = ${jiraLabel} AND resolution = Unresolved`,
      fields: ["summary", "customfield_12104", "priority"]
    })
  });

  const payload = await response.json();

  return payload.issues;
}

export function compareIssues(jiraIssues: JiraSearchIssue[], snykIssues: SnykIssue[]): IssueComparison {
  const snykIds = new Set(snykIssues.map((issue) => issue.id));
  const jiraByExternalId = new Map<string, JiraSearchIssue>();

  for (const jiraIssue of jiraIssues) {
    const externalId = getExternalId(jiraIssue);
    if (externalId) {
      jiraByExternalId.set(externalId, jiraIssue);
    }
  }

  const open = snykIssues.filter((snykIssue) => !jiraByExternalId.has(snykIssue.id));

  const close = jiraIssues.filter((jiraIssue) => {
    const externalId = getExternalId(jiraIssue);
    return !externalId || !snykIds.has(externalId);
  });

  return { open, close };
}

function getExternalId(issue: JiraSearchIssue): string | undefined {
  return issue.fields.customfield_12104?.trim();
}

async function createJiraIssue(snykIssue: SnykIssue) {
  try {
    const response = await fetch(`${jiraBaseUrl}/issue`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.JIRA_TOKEN}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        fields: {
          project: { key: jiraProjectKey },
          issuetype: { name: "Story" },
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
    });
    await response.json();
  } catch (err) {
    console.log(err);
  }
}

export function getDueDateByPriority(priority: string, currentDate: Date = new Date()): string {
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

export function createTicketDescription(issue: SnykIssue) {
  const title = issue.attributes.title?.trim() || "Snyk Code Issue";
  const snykDescription = issue.attributes.description?.trim() || "No description provided by Snyk.";
  const riskScore = issue.attributes.risk.score.value;
  const affectedFiles =
    issue.attributes.coordinates
      ?.flatMap((coordinate) => coordinate.representations ?? [])
      .map((representation) => `* ${representation.sourceLocation.file}`)
      .join("\n") || "No files provided";

  const suggestedRemedies =
    issue.attributes.coordinates
      ?.flatMap((coordinate) => coordinate.remedies ?? [])
      .map((remedy) => remedy.description)
      .join("\n\n")
      .trim() || "No suggestions provided";

  // Outline for Jira wiki-style markup body.
  // Expand sections as needed (links, remediation, file paths, CWE, etc.).
  const descriptionLines = [
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
    suggestedRemedies,
    "{code}",
    "h4. Affected files",
    affectedFiles,
  ];

  return descriptionLines.join("\n");
}

export function snykToJiraPriority(snykPriority: string): string {
  switch (snykPriority) {
    case "medium":
      return "Medium";
    case "high":
      return "High";
    default:
      return "Low";
  }
}

async function closeJiraIssue(issue: JiraSearchIssue) {
  try {
    await fetch(`${jiraBaseUrl}/issue/${issue.key}/transitions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.JIRA_TOKEN}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        transition: {
          id: jiraDoneTransitionId
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
    });
  } catch (err) {
    console.error(err);
  }
}

export async function run() {
  validateSetup();

  const jiraIssues = await getJiraTickets();
  const snykIssues = await getSnykCodeIssues();
  const syncPlan = compareIssues(jiraIssues, snykIssues);

  console.log(`${syncPlan.close.length} to close. ${syncPlan.open.length} to open.`);

  syncPlan.open.slice(0, 1).forEach(issue => createJiraIssue(issue));
  syncPlan.close.forEach(issue => closeJiraIssue(issue));
}

if (process.argv[1] === import.meta.filename) {
  await run();
}
