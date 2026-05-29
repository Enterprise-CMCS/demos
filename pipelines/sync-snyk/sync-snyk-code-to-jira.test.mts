/// <reference path="./sync-snyk-code-to-jira.test.d.ts" />

import * as assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import {
  compareIssues,
  createTicketDescription,
  getDueDateByPriority,
  run,
  snykToJiraPriority,
  validateSetup
} from "./sync-snyk-code-to-jira.mts";

type CapturedRequest = {
  url: string;
  options: RequestInit & {
    body?: string;
    headers?: Record<string, string>;
  };
};

type SnykCoordinateFixture = {
  remedies: Array<{
    description: string;
    type: string;
  }>;
  representations: Array<{
    sourceLocation: {
      file: string;
      commit_id: string;
    };
  }>;
};

type SnykIssueFixture = {
  id: string;
  attributes: {
    description: string;
    effective_severity_level: string;
    status: string;
    title: string;
    coordinates: SnykCoordinateFixture[];
    risk: {
      score: {
        value: number;
      };
    };
  };
};

type SnykIssueOverrides = {
  coordinates?: SnykCoordinateFixture[];
  description?: string;
  id?: string;
  riskScore?: number;
  severity?: string;
  title?: string;
};

type JiraIssueFixture = {
  id: string;
  key: string;
  fields: {
    summary: string;
    customfield_12104: string;
    customfield_10100: string;
    duedate: string;
  };
};

type JiraCreateIssueBody = {
  fields: Record<string, unknown> & {
    duedate: string;
  };
};

type JsonResponseOptions = {
  ok?: boolean;
  status?: number;
  statusText?: string;
};

const managedEnvNames = ["SNYK_TOKEN", "SNYK_ORG_ID", "JIRA_TOKEN", "JIRA_EPIC"] as const;
type ManagedEnvName = typeof managedEnvNames[number];

const originalEnv = Object.fromEntries(
  managedEnvNames.map((name) => [name, process.env[name]])
) as Record<ManagedEnvName, string | undefined>;
const originalFetch = globalThis.fetch;
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

afterEach(() => {
  for (const name of managedEnvNames) {
    const originalValue = originalEnv[name];
    if (originalValue === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = originalValue;
    }
  }

  globalThis.fetch = originalFetch;
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

test("validateSetup requires all expected environment variables", () => {
  for (const name of managedEnvNames) {
    delete process.env[name];
  }

  assert.throws(() => validateSetup(), /SNYK_TOKEN must be set/);

  process.env.SNYK_TOKEN = "snyk-token";
  process.env.SNYK_ORG_ID = "org-1";
  process.env.JIRA_TOKEN = "jira-token";
  process.env.JIRA_EPIC = " ";

  assert.throws(() => validateSetup(), /JIRA_EPIC must be set/);

  process.env.JIRA_EPIC = "DEMO-EPIC";

  assert.doesNotThrow(() => validateSetup());
});

test("compareIssues opens new Snyk findings and closes unresolved Jira tickets missing from Snyk", () => {
  const snykIssues = [
    snykIssue({ id: "snyk-existing" }),
    snykIssue({ id: "snyk-new" })
  ];
  const jiraIssues = [
    jiraIssue("DEMOS-1", " snyk-existing "),
    jiraIssue("DEMOS-2", "snyk-resolved"),
    jiraIssue("DEMOS-3", "")
  ];

  const comparison = compareIssues(jiraIssues, snykIssues);

  assert.deepEqual(comparison.open.map((issue) => issue.id), ["snyk-new"]);
  assert.deepEqual(comparison.close.map((issue) => issue.key), ["DEMOS-2", "DEMOS-3"]);
});

test("snykToJiraPriority preserves the Jira priority mapping", () => {
  assert.equal(snykToJiraPriority("high"), "High");
  assert.equal(snykToJiraPriority("medium"), "Medium");
  assert.equal(snykToJiraPriority("low"), "Low");
  assert.equal(snykToJiraPriority("critical"), "Low");
});

test("getDueDateByPriority uses the current remediation windows", () => {
  const currentDate = new Date(2026, 0, 1);

  assert.equal(getDueDateByPriority(" high ", currentDate), "2026-01-31");
  assert.equal(getDueDateByPriority("medium", currentDate), "2026-04-01");
  assert.equal(getDueDateByPriority("low", currentDate), "2027-01-01");
  assert.equal(getDueDateByPriority("critical", currentDate), "2027-01-01");
});

test("createTicketDescription builds the Jira wiki body from Snyk details", () => {
  const issue = snykIssue({
    title: "User-controlled data in SQL query",
    description: "Unsanitized input flows into a query.",
    riskScore: 876,
    coordinates: [
      {
        remedies: [{ description: "Use parameterized queries.", type: "manual" }],
        representations: [{ sourceLocation: { file: "server/src/query.ts", commit_id: "abc123" } }]
      },
      {
        remedies: [{ description: "Validate input.", type: "manual" }],
        representations: [{ sourceLocation: { file: "server/src/other.ts", commit_id: "def456" } }]
      }
    ]
  });

  assert.equal(
    createTicketDescription(issue),
    [
      "----",
      "*This issue was generated automatically based on findings in Snyk Code*",
      "Do not mark this ticket as 'Done' manually. The automation pipeline will close it once the finding is resolved or ignored in Snyk.",
      "Do not edit the 'External ID' or remove the 'snyk-sync' label. All other edits/comments are welcome.",
      "----",
      "h2. Snyk Code Finding",
      "",
      "*Title:* User-controlled data in SQL query",
      "Risk Score: 876/1000",
      "",
      "h3. Description",
      "Unsanitized input flows into a query.",
      "h3. Suggestions from Snyk",
      "{code}",
      "Use parameterized queries.",
      "",
      "Validate input.",
      "{code}",
      "h4. Affected files",
      "* server/src/query.ts",
      "* server/src/other.ts"
    ].join("\n")
  );
});

test("createTicketDescription keeps the existing fallback text when Snyk omits details", () => {
  const issue = snykIssue({
    title: " ",
    description: "",
    riskScore: 0,
    coordinates: []
  });

  const description = createTicketDescription(issue);

  assert.match(description, /\*Title:\* Snyk Code Issue/);
  assert.match(description, /No description provided by Snyk\./);
  assert.match(description, /No suggestions provided/);
  assert.match(description, /No files provided/);
});

test("run fetches Snyk and Jira, then sends the expected create and close requests", async () => {
  process.env.SNYK_TOKEN = "snyk-token";
  process.env.SNYK_ORG_ID = "org-1";
  process.env.JIRA_TOKEN = "jira-token";
  process.env.JIRA_EPIC = "DEMO-EPIC";

  const requests: CapturedRequest[] = [];
  const logs: string[] = [];
  const existingIssue = snykIssue({ id: "snyk-existing", title: "Existing finding" });
  const newIssue = snykIssue({
    id: "snyk-new",
    title: "New high finding",
    description: "A new Snyk finding.",
    severity: "high",
    riskScore: 600
  });
  const expectedDueDateBeforeRun = getDueDateByPriority("high");

  console.log = ((...args: unknown[]) => {
    logs.push(args.join(" "));
  }) as typeof console.log;
  globalThis.fetch = (async (url: RequestInfo | URL, options: RequestInit = {}) => {
    requests.push({ url: String(url), options: options as CapturedRequest["options"] });

    if (String(url).endsWith("/search")) {
      return jsonResponse({
        issues: [
          jiraIssue("DEMOS-1", "snyk-existing"),
          jiraIssue("DEMOS-2", "snyk-resolved")
        ]
      });
    }

    if (String(url).includes("api.snyk.io")) {
      return jsonResponse({ data: [existingIssue, newIssue] });
    }

    return jsonResponse({ ok: true });
  }) as typeof fetch;

  await run();
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

  const expectedDueDateAfterRun = getDueDateByPriority("high");
  const [searchRequest, snykRequest, createRequest, closeRequest] = requests;
  assert.ok(searchRequest);
  assert.ok(snykRequest);
  assert.ok(createRequest);
  assert.ok(closeRequest);

  const createBody = requestBody<JiraCreateIssueBody>(createRequest);
  const { duedate, ...createFieldsWithoutDueDate } = createBody.fields;

  assert.deepEqual(logs, ["1 to close. 1 to open."]);
  assert.equal(requests.length, 4);

  assert.equal(searchRequest.url, "https://jiraent.cms.gov/rest/api/2/search");
  assert.equal(searchRequest.options.method, "POST");
  assert.equal(searchRequest.options.headers?.Authorization, "Bearer jira-token");
  assert.deepEqual(requestBody(searchRequest), {
    jql: "project = DEMOS AND labels = snyk-sync AND resolution = Unresolved",
    fields: ["summary", "customfield_12104", "priority"]
  });

  assert.equal(
    snykRequest.url,
    "https://api.snyk.io/rest/orgs/org-1/issues?version=2025-11-05&type=code&status=open&ignored=false"
  );
  assert.equal(snykRequest.options.headers?.Authorization, "snyk-token");

  assert.equal(createRequest.url, "https://jiraent.cms.gov/rest/api/2/issue");
  assert.equal(createRequest.options.method, "POST");
  assert.deepEqual(createFieldsWithoutDueDate, {
    project: { key: "DEMOS" },
    issuetype: { name: "Story" },
    priority: {
      name: "High"
    },
    summary: "Snyk Code Finding: New high finding",
    description: createTicketDescription(newIssue),
    labels: ["snyk-sync"],
    customfield_12104: "snyk-new",
    customfield_10100: "DEMO-EPIC"
  });
  assert.ok([expectedDueDateBeforeRun, expectedDueDateAfterRun].includes(duedate));

  assert.equal(closeRequest.url, "https://jiraent.cms.gov/rest/api/2/issue/DEMOS-2/transitions");
  assert.equal(closeRequest.options.method, "POST");
  assert.deepEqual(requestBody(closeRequest), {
    transition: {
      id: 41
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
  });
});

test("run fails before making changes when Snyk returns an unsuccessful response", async () => {
  setRequiredEnv();
  console.log = (() => undefined) as typeof console.log;

  globalThis.fetch = (async (url: RequestInfo | URL) => {
    if (String(url).includes("api.snyk.io")) {
      return jsonResponse({ error: "denied" }, { ok: false, status: 403, statusText: "Forbidden" });
    }

    return jsonResponse({ issues: [] });
  }) as typeof fetch;

  await assert.rejects(
    () => run(),
    /Fetching Snyk Code issues failed with status 403 Forbidden/
  );
});

test("run fails when Jira rejects a create request", async () => {
  setRequiredEnv();
  console.log = (() => undefined) as typeof console.log;

  globalThis.fetch = (async (url: RequestInfo | URL) => {
    if (String(url).endsWith("/search")) {
      return jsonResponse({ issues: [] });
    }

    if (String(url).includes("api.snyk.io")) {
      return jsonResponse({ data: [snykIssue({ id: "snyk-new" })] });
    }

    return jsonResponse({ error: "denied" }, { ok: false, status: 401, statusText: "Unauthorized" });
  }) as typeof fetch;

  await assert.rejects(
    () => run(),
    /Creating Jira issue for Snyk finding snyk-new failed with status 401 Unauthorized/
  );
});

test("run fails when Jira rejects a close request", async () => {
  setRequiredEnv();
  console.log = (() => undefined) as typeof console.log;

  globalThis.fetch = (async (url: RequestInfo | URL) => {
    if (String(url).endsWith("/search")) {
      return jsonResponse({
        issues: [
          jiraIssue("DEMOS-2", "snyk-resolved")
        ]
      });
    }

    if (String(url).includes("api.snyk.io")) {
      return jsonResponse({ data: [] });
    }

    return jsonResponse({ error: "unavailable" }, { ok: false, status: 503, statusText: "Service Unavailable" });
  }) as typeof fetch;

  await assert.rejects(
    () => run(),
    /Closing Jira issue DEMOS-2 failed with status 503 Service Unavailable/
  );
});

function setRequiredEnv() {
  process.env.SNYK_TOKEN = "snyk-token";
  process.env.SNYK_ORG_ID = "org-1";
  process.env.JIRA_TOKEN = "jira-token";
  process.env.JIRA_EPIC = "DEMO-EPIC";
}

function snykIssue(overrides: SnykIssueOverrides = {}): SnykIssueFixture {
  return {
    id: overrides.id ?? "snyk-1",
    attributes: {
      description: overrides.description ?? "Snyk issue description.",
      effective_severity_level: overrides.severity ?? "medium",
      status: "open",
      title: overrides.title ?? "Snyk issue title",
      coordinates: overrides.coordinates ?? [
        {
          remedies: [{ description: "Fix the issue.", type: "manual" }],
          representations: [{ sourceLocation: { file: "src/file.ts", commit_id: "abc123" } }]
        }
      ],
      risk: {
        score: {
          value: overrides.riskScore ?? 500
        }
      }
    }
  };
}

function jiraIssue(key: string, externalId: string): JiraIssueFixture {
  return {
    id: key.toLowerCase(),
    key,
    fields: {
      summary: `${key} summary`,
      customfield_12104: externalId,
      customfield_10100: "DEMO-EPIC",
      duedate: "2026-01-01"
    }
  };
}

function jsonResponse(payload: unknown, options: JsonResponseOptions = {}): Response {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    statusText: options.statusText ?? "OK",
    json: async () => payload
  } as Response;
}

function requestBody<T>(request: CapturedRequest): T {
  return JSON.parse(request.options.body ?? "{}") as T;
}
