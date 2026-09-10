#!/usr/bin/env bash
set -euo pipefail

JIRA_URL="${JIRA_URL:-https://jiraent.cms.gov}"
PROJECT_KEY="${PROJECT_KEY:-DEMOS}"
CONFLUENCE_URL="${CONFLUENCE_URL:-https://confluenceent.cms.gov}"
CONFLUENCE_PAGE_ID="${CONFLUENCE_PAGE_ID:-1485117668}"

: "${JIRA_API_TOKEN:?Export JIRA_API_TOKEN before running this script}"
: "${CONF_API_TOKEN:?Export CONF_API_TOKEN before running this script}"

# Pass the PI as the first argument, or set PI in the environment.
# Examples: ./jira.sh PI6
#           PI=PI7 ./jira.sh
PI="${1:-${PI:-PI6}}"
PI_LABEL_PREFIX="${PI}_"

page_size=100

search_jira() {
  local jql=$1
  local fields=$2
  local start_at=$3
  local response

  if ! response=$(
    curl --fail-with-body --silent --show-error \
      -H "Authorization: Bearer $JIRA_API_TOKEN" \
      --get "$JIRA_URL/rest/api/2/search" \
      --data-urlencode "jql=$jql" \
      --data-urlencode "fields=$fields" \
      --data-urlencode "startAt=$start_at" \
      --data-urlencode "maxResults=$page_size"
  ); then
    printf 'Jira returned:\n%s\n' "$response" >&2
    return 1
  fi

  printf '%s\n' "$response"
}

# Collect all epics for the requested PI. Jira labels do not support native
# prefix matching, so labels are filtered locally after each page is fetched.
epics='[]'
start_at=0

while :; do
  response=$(search_jira \
    "project = \"$PROJECT_KEY\" AND issuetype = Epic ORDER BY key" \
    'summary,labels' \
    "$start_at")

  epics=$(jq \
    --argjson collected "$epics" \
    --arg prefix "$PI_LABEL_PREFIX" '
      $collected + [
        .issues[]
        | select(any(.fields.labels[]?; startswith($prefix)))
        | {key, summary: .fields.summary}
      ]
    ' <<<"$response")

  returned=$(jq '.issues | length' <<<"$response")
  total=$(jq '.total' <<<"$response")

  ((returned == 0)) && break
  start_at=$((start_at + returned))
  ((start_at >= total)) && break
done

# Query the tickets belonging to each epic and calculate completion. Jira's
# "done" status category includes statuses such as Done, Resolved, and Complete.
report='[]'
epic_index=0
epic_count=$(jq 'length' <<<"$epics")

while ((epic_index < epic_count)); do
  epic=$(jq -c --argjson index "$epic_index" '.[$index]' <<<"$epics")
  epic_key=$(jq -r '.key' <<<"$epic")
  epic_summary=$(jq -r '.summary' <<<"$epic")
  child_start=0
  ticket_count=0
  unassigned_count=0
  dev_complete_count=0
  ready_for_test_count=0
  in_qa_count=0
  completed_count=0
  bug_count=0

  while :; do
    response=$(search_jira \
      "\"Epic Link\" = \"$epic_key\" ORDER BY key" \
      'status,assignee,issuetype' \
      "$child_start")

    child_total=$(jq '.total' <<<"$response")
    page_counts=$(jq '
      def status_is($name):
        (.fields.status.name // "" | ascii_downcase) == ($name | ascii_downcase);

      {
        total: (.issues | length),
        unassigned: ([.issues[] | select(.fields.assignee == null)] | length),
        devComplete: ([.issues[] | select(status_is("In Review"))] | length),
        readyForTest: ([.issues[] | select(status_is("Available for Testing"))] | length),
        inQa: ([.issues[] | select(status_is("Ready for Approval"))] | length),
        complete: ([
          .issues[]
          | select(.fields.status.statusCategory.key == "done")
        ] | length),
        bugs: ([
          .issues[]
          | select((.fields.issuetype.name // "" | ascii_downcase) == "bug")
        ] | length)
      }
    ' <<<"$response")

    returned=$(jq '.total' <<<"$page_counts")
    page_unassigned=$(jq '.unassigned' <<<"$page_counts")
    page_dev_complete=$(jq '.devComplete' <<<"$page_counts")
    page_ready_for_test=$(jq '.readyForTest' <<<"$page_counts")
    page_in_qa=$(jq '.inQa' <<<"$page_counts")
    page_completed=$(jq '.complete' <<<"$page_counts")
    page_bugs=$(jq '.bugs' <<<"$page_counts")

    ticket_count=$((ticket_count + returned))
    unassigned_count=$((unassigned_count + page_unassigned))
    dev_complete_count=$((dev_complete_count + page_dev_complete))
    ready_for_test_count=$((ready_for_test_count + page_ready_for_test))
    in_qa_count=$((in_qa_count + page_in_qa))
    completed_count=$((completed_count + page_completed))
    bug_count=$((bug_count + page_bugs))

    ((returned == 0)) && break
    child_start=$((child_start + returned))
    ((child_start >= child_total)) && break
  done

  if ((ticket_count == 0)); then
    completion_percentage=0
  else
    completion_percentage=$((
      (completed_count * 100 + ticket_count / 2) / ticket_count
    ))
  fi

  row=$(jq -n \
    --arg key "$epic_key" \
    --arg summary "$epic_summary" \
    --argjson totalTickets "$ticket_count" \
    --argjson unassignedTickets "$unassigned_count" \
    --argjson devCompleteTickets "$dev_complete_count" \
    --argjson readyForTestTickets "$ready_for_test_count" \
    --argjson ticketsInQa "$in_qa_count" \
    --argjson complete "$completed_count" \
    --argjson completionPercentage "$completion_percentage" \
    --argjson bugs "$bug_count" '
      {
        key: $key,
        summary: $summary,
        totalTickets: $totalTickets,
        unassignedTickets: $unassignedTickets,
        devCompleteTickets: $devCompleteTickets,
        readyForTestTickets: $readyForTestTickets,
        ticketsInQa: $ticketsInQa,
        complete: $complete,
        completionPercentage: $completionPercentage,
        bugs: $bugs
      }
    ')

  report=$(jq --argjson row "$row" '. + [$row]' <<<"$report")
  epic_index=$((epic_index + 1))
done

confluence_request() {
  local method=$1
  local url=$2
  local payload=${3:-}
  local response

  if [[ -n "$payload" ]]; then
    if ! response=$(
      curl --fail-with-body --silent --show-error \
        -H "Authorization: Bearer $CONF_API_TOKEN" \
        -H 'Accept: application/json' \
        -H 'Content-Type: application/json' \
        --request "$method" \
        --data "$payload" \
        "$url"
    ); then
      printf 'Confluence returned:\n%s\n' "$response" >&2
      return 1
    fi
  else
    if ! response=$(
      curl --fail-with-body --silent --show-error \
        -H "Authorization: Bearer $CONF_API_TOKEN" \
        -H 'Accept: application/json' \
        --request "$method" \
        "$url"
    ); then
      printf 'Confluence returned:\n%s\n' "$response" >&2
      return 1
    fi
  fi

  printf '%s\n' "$response"
}

page=$(confluence_request \
  GET \
  "$CONFLUENCE_URL/rest/api/content/$CONFLUENCE_PAGE_ID?expand=body.storage,version")

page_title=$(jq -er '.title' <<<"$page")
current_version=$(jq -er '.version.number' <<<"$page")
current_body=$(jq -r '.body.storage.value // ""' <<<"$page")
next_version=$((current_version + 1))

merge_input=$(jq -n \
  --argjson report "$report" \
  --arg currentBody "$current_body" \
  --arg pi "$PI" \
  --arg jiraUrl "$JIRA_URL" '
    {
      report: $report,
      currentBody: $currentBody,
      pi: $pi,
      jiraUrl: $jiraUrl
    }
  ')

table_body=$(python3 -c '
import html
import json
import re
import sys
import xml.etree.ElementTree as ET

data = json.load(sys.stdin)
current_body = data["currentBody"]
manual_headers = ["Release Target", "Status", "Risks", "Dependencies"]
manual_values = {}
existing_order = []

ET.register_namespace("ac", "http://atlassian.com/content")
ET.register_namespace("ri", "http://atlassian.com/resource/identifier")

def local_name(tag):
    return tag.rsplit("}", 1)[-1]

def direct_cells(row):
    return [cell for cell in row if local_name(cell.tag) in ("th", "td")]

def table_rows(table):
    for child in table:
        child_name = local_name(child.tag)
        if child_name == "tr":
            yield child
        elif child_name in ("thead", "tbody", "tfoot"):
            for row in child:
                if local_name(row.tag) == "tr":
                    yield row

def cell_text(cell):
    return " ".join("".join(cell.itertext()).split())

def inner_xml(cell):
    parts = []
    if cell.text:
        parts.append(html.escape(cell.text, quote=False))
    for child in cell:
        parts.append(ET.tostring(child, encoding="unicode"))
    return "".join(parts)

if current_body.strip():
    wrapped = (
        "<root xmlns:ac=\"http://atlassian.com/content\" "
        "xmlns:ri=\"http://atlassian.com/resource/identifier\">"
        + current_body
        + "</root>"
    )
    try:
        root = ET.fromstring(wrapped)
    except ET.ParseError as error:
        print(f"Unable to parse the existing Confluence table: {error}", file=sys.stderr)
        sys.exit(1)

    for table in (element for element in root.iter() if local_name(element.tag) == "table"):
        rows = list(table_rows(table))
        if not rows:
            continue

        headers = [cell_text(cell) for cell in direct_cells(rows[0])]
        if "Epic" not in headers:
            continue

        epic_column = headers.index("Epic")
        manual_columns = {
            header: headers.index(header)
            for header in manual_headers
            if header in headers
        }

        for row in rows[1:]:
            cells = direct_cells(row)
            if epic_column >= len(cells):
                continue
            match = re.search(r"\b[A-Z][A-Z0-9_]*-\d+\b", cell_text(cells[epic_column]))
            if not match:
                continue
            epic_key = match.group(0)
            if epic_key not in existing_order:
                existing_order.append(epic_key)
            manual_values[epic_key] = {
                header: inner_xml(cells[index]) if index < len(cells) else ""
                for header, index in manual_columns.items()
            }
        break

headers = [
    "Epic",
    "Summary",
    "Release Target",
    "Status",
    "Total Tickets",
    "Unassigned Tickets",
    "Dev Complete",
    "Ready for Test",
    "In QA",
    "Complete",
    "% Complete",
    "Bugs",
    "Risks",
    "Dependencies",
]

parts = [
    "<p><strong>Program Increment:</strong> ",
    html.escape(data["pi"]),
    "</p><table><tbody><tr>",
]
parts.extend(f"<th>{html.escape(header)}</th>" for header in headers)
parts.append("</tr>")

report_by_key = {epic["key"]: epic for epic in data["report"]}
ordered_report = [
    report_by_key[key]
    for key in existing_order
    if key in report_by_key
]
ordered_keys = {epic["key"] for epic in ordered_report}
ordered_report.extend(
    epic for epic in data["report"] if epic["key"] not in ordered_keys
)

for row_index, epic in enumerate(ordered_report):
    key = epic["key"]
    saved = manual_values.get(key, {})
    jira_url = html.escape(data["jiraUrl"])
    cell_values = [
        f"<a href=\"{jira_url}/browse/{html.escape(key)}\">{html.escape(key)}</a>",
        html.escape(epic["summary"]),
        saved.get("Release Target", ""),
        saved.get("Status", ""),
        str(epic["totalTickets"]),
        str(epic["unassignedTickets"]),
        str(epic["devCompleteTickets"]),
        str(epic["readyForTestTickets"]),
        str(epic["ticketsInQa"]),
        str(epic["complete"]),
        str(epic["completionPercentage"]) + "%",
        str(epic["bugs"]),
        saved.get("Risks", ""),
        saved.get("Dependencies", ""),
    ]
    cell_attributes = (
        " class=\"highlight-#f4f5f7\" data-highlight-colour=\"#f4f5f7\""
        if row_index % 2 == 1
        else ""
    )
    parts.append("<tr>")
    parts.extend(f"<td{cell_attributes}>{value}</td>" for value in cell_values)
    parts.append("</tr>")

parts.append("</tbody></table>")
print("".join(parts))
' <<<"$merge_input")

payload=$(jq -n \
  --arg id "$CONFLUENCE_PAGE_ID" \
  --arg title "$page_title" \
  --arg body "$table_body" \
  --argjson version "$next_version" \
  --arg message "Refresh $PI epic completion table" '
    {
      id: $id,
      type: "page",
      title: $title,
      body: {
        storage: {
          value: $body,
          representation: "storage"
        }
      },
      version: {
        number: $version,
        minorEdit: true,
        message: $message
      }
    }
  ')

confluence_request \
  PUT \
  "$CONFLUENCE_URL/rest/api/content/$CONFLUENCE_PAGE_ID" \
  "$payload" >/dev/null

printf 'Updated %s with %s epic(s): %s/spaces/DEMOS/pages/%s\n' \
  "$page_title" \
  "$(jq 'length' <<<"$report")" \
  "$CONFLUENCE_URL" \
  "$CONFLUENCE_PAGE_ID"
