#!/usr/bin/env bash
set -euo pipefail

: "${CONF_API_TOKEN:?Export CONF_API_TOKEN before running this script}"
: "${JIRA_URL:?Export JIRA_URL before running this script}"
: "${CONFLUENCE_URL:?Export CONFLUENCE_URL before running this script}"
: "${CONFLUENCE_PAGE_ID:?Export CONFLUENCE_PAGE_ID before running this script}"

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

extract_input=$(jq -n --arg body "$current_body" '{body: $body}')

# The Epic column in Confluence is the source of truth for both membership and
# row order. Only Jira issue keys from that column are returned here.
epics=$(python3 -c '
import html.entities
import json
import re
import sys
import xml.etree.ElementTree as ET

body = json.load(sys.stdin)["body"]

def replace_named_entity(match):
    name = match.group(1)
    if name in ("amp", "lt", "gt", "quot", "apos"):
        return match.group(0)
    codepoint = html.entities.name2codepoint.get(name)
    return f"&#{codepoint};" if codepoint else match.group(0)

body = re.sub(r"&([A-Za-z][A-Za-z0-9]+);", replace_named_entity, body)
wrapped = (
    "<root xmlns:ac=\"http://atlassian.com/content\" "
    "xmlns:ri=\"http://atlassian.com/resource/identifier\">"
    + body
    + "</root>"
)

try:
    root = ET.fromstring(wrapped)
except ET.ParseError as error:
    print(f"Unable to parse the existing Confluence table: {error}", file=sys.stderr)
    sys.exit(1)

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

epics = []
seen = set()
managed_table_count = 0
for table in (element for element in root.iter() if local_name(element.tag) == "table"):
    rows = list(table_rows(table))
    if not rows:
        continue
    headers = [cell_text(cell).casefold() for cell in direct_cells(rows[0])]
    identifying_headers = {"epic", "summary", "total tickets"}
    if not identifying_headers.issubset(headers):
        continue
    automated_headers = {
        "epic",
        "summary",
        "total tickets",
        "unassigned tickets",
        "dev complete",
        "ready for test",
        "in qa",
        "complete",
        "% complete",
        "bugs",
    }
    missing_headers = automated_headers.difference(headers)
    if missing_headers:
        print(
            "Managed epic table is missing automated columns: "
            + ", ".join(sorted(missing_headers)),
            file=sys.stderr,
        )
        sys.exit(1)
    managed_table_count += 1
    epic_column = headers.index("epic")
    for row in rows[1:]:
        cells = direct_cells(row)
        if epic_column >= len(cells):
            continue
        match = re.search(
            r"\b[A-Z][A-Z0-9_]*-\d+\b",
            cell_text(cells[epic_column]),
            re.IGNORECASE,
        )
        if not match:
            continue
        key = match.group(0).upper()
        if key not in seen:
            seen.add(key)
            epics.append({"key": key})

if managed_table_count == 0:
    print("No managed epic tables were found on the Confluence page", file=sys.stderr)
elif not epics:
    print("No epic keys were found in the Confluence Epic column", file=sys.stderr)

json.dump(epics, sys.stdout)
' <<<"$extract_input")

# Fetch all epic summaries in one paginated search and validate that every key
# supplied in Confluence is an Epic visible to the Jira token.
epic_count=$(jq 'length' <<<"$epics")
if ((epic_count > 0)); then
: "${JIRA_API_TOKEN:?Export JIRA_API_TOKEN before running this script}"
keys_csv=$(jq -r '[.[].key | "\"" + . + "\""] | join(", ")' <<<"$epics")
epic_details='{}'
start_at=0

while :; do
  response=$(search_jira \
    "key in ($keys_csv) AND issuetype = Epic" \
    'summary' \
    "$start_at")

  epic_details=$(jq \
    --argjson collected "$epic_details" '
      reduce .issues[] as $issue (
        $collected;
        .[$issue.key] = $issue.fields.summary
      )
    ' <<<"$response")

  returned=$(jq '.issues | length' <<<"$response")
  total=$(jq '.total' <<<"$response")

  ((returned == 0)) && break
  start_at=$((start_at + returned))
  ((start_at >= total)) && break
done

missing_epics=$(jq -n \
  --argjson epics "$epics" \
  --argjson details "$epic_details" '
    [$epics[].key | select($details[.] == null)]
  ')

if (( $(jq 'length' <<<"$missing_epics") > 0 )); then
  printf 'These Confluence entries are not visible Jira epics: %s\n' \
    "$(jq -r 'join(", ")' <<<"$missing_epics")" >&2
  exit 1
fi

epics=$(jq \
  --argjson details "$epic_details" '
    [.[] | . + {summary: $details[.key]}]
  ' <<<"$epics")
fi

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

merge_input=$(jq -n \
  --argjson report "$report" \
  --arg currentBody "$current_body" \
  --arg jiraUrl "$JIRA_URL" '
    {
      report: $report,
      currentBody: $currentBody,
      jiraUrl: $jiraUrl
    }
  ')

table_body=$(python3 -c '
import html
import html.entities
import json
import re
import sys
import xml.etree.ElementTree as ET
from datetime import datetime
from zoneinfo import ZoneInfo

data = json.load(sys.stdin)
current_body = data["currentBody"]
managed_tables = []
root = None

ET.register_namespace("ac", "http://atlassian.com/content")
ET.register_namespace("ri", "http://atlassian.com/resource/identifier")

def replace_named_entity(match):
    name = match.group(1)
    if name in ("amp", "lt", "gt", "quot", "apos"):
        return match.group(0)
    codepoint = html.entities.name2codepoint.get(name)
    return f"&#{codepoint};" if codepoint else match.group(0)

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
    current_body = re.sub(
        r"&([A-Za-z][A-Za-z0-9]+);",
        replace_named_entity,
        current_body,
    )
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
        normalized_headers = [header.casefold() for header in headers]
        identifying_headers = {"epic", "summary", "total tickets"}
        if not identifying_headers.issubset(normalized_headers):
            continue
        automated_headers = {
            "epic",
            "summary",
            "total tickets",
            "unassigned tickets",
            "dev complete",
            "ready for test",
            "in qa",
            "complete",
            "% complete",
            "bugs",
        }
        missing_headers = automated_headers.difference(normalized_headers)
        if missing_headers:
            print(
                "Managed epic table is missing automated columns: "
                + ", ".join(sorted(missing_headers)),
                file=sys.stderr,
            )
            sys.exit(1)
        managed_tables.append(
            {
                "rows": rows[1:],
                "column_indexes": {
                    header: normalized_headers.index(header)
                    for header in automated_headers
                },
            }
        )
else:
    root = ET.fromstring(
        "<root xmlns:ac=\"http://atlassian.com/content\" "
        "xmlns:ri=\"http://atlassian.com/resource/identifier\" />"
    )

if root is None:
    print(
        "Unable to parse the Confluence page",
        file=sys.stderr,
    )
    sys.exit(1)

report_by_key = {epic["key"]: epic for epic in data["report"]}
jira_url = data["jiraUrl"]

def clear_cell(cell):
    cell.text = None
    for child in list(cell):
        cell.remove(child)

def set_text(cell, value):
    clear_cell(cell)
    cell.text = str(value)

def set_epic_link(cell, key):
    clear_cell(cell)
    link = ET.SubElement(
        cell,
        "a",
        {"href": f"{jira_url}/browse/{key}"},
    )
    link.text = key

def apply_row_highlight(cell, highlighted):
    classes = [
        name
        for name in cell.get("class", "").split()
        if not name.startswith("highlight-")
    ]
    if highlighted:
        classes.append("highlight-#f4f5f7")
        cell.set("data-highlight-colour", "#f4f5f7")
    else:
        cell.attrib.pop("data-highlight-colour", None)

    if classes:
        cell.set("class", " ".join(classes))
    else:
        cell.attrib.pop("class", None)

for managed_table in managed_tables:
    indexes = managed_table["column_indexes"]
    highest_automated_index = max(indexes.values())

    for row_index, row in enumerate(managed_table["rows"]):
        cells = direct_cells(row)
        if len(cells) <= highest_automated_index:
            print(
                "A managed epic row has fewer cells than its header row",
                file=sys.stderr,
            )
            sys.exit(1)

        highlighted = row_index % 2 == 1
        for cell in cells:
            apply_row_highlight(cell, highlighted)

        match = re.search(
            r"\b[A-Z][A-Z0-9_]*-\d+\b",
            cell_text(cells[indexes["epic"]]),
            re.IGNORECASE,
        )
        if not match:
            continue

        key = match.group(0).upper()
        epic = report_by_key.get(key)
        if epic is None:
            print(f"No Jira results were found for epic {key}", file=sys.stderr)
            sys.exit(1)

        set_epic_link(cells[indexes["epic"]], key)
        set_text(cells[indexes["summary"]], epic["summary"])
        set_text(cells[indexes["total tickets"]], epic["totalTickets"])
        set_text(cells[indexes["unassigned tickets"]], epic["unassignedTickets"])
        set_text(cells[indexes["dev complete"]], epic["devCompleteTickets"])
        set_text(cells[indexes["ready for test"]], epic["readyForTestTickets"])
        set_text(cells[indexes["in qa"]], epic["ticketsInQa"])
        set_text(cells[indexes["complete"]], epic["complete"])
        set_text(
            cells[indexes["% complete"]],
            str(epic["completionPercentage"]) + "%",
        )
        set_text(cells[indexes["bugs"]], epic["bugs"])

indicator_label = "Epic report automation last ran:"
run_timestamp = datetime.now(ZoneInfo("America/New_York")).strftime(
    "%Y-%m-%d %H:%M:%S %Z"
)
indicators = [
    element
    for element in root.iter()
    if local_name(element.tag) == "p"
    and cell_text(element).casefold().startswith(indicator_label.casefold())
]

if not indicators:
    indicators = [ET.SubElement(root, "p")]

for indicator in indicators:
    indicator_tail = indicator.tail
    clear_cell(indicator)
    label = ET.SubElement(indicator, "strong")
    label.text = indicator_label
    label.tail = " " + run_timestamp
    indicator.tail = indicator_tail

print(inner_xml(root))
' <<<"$merge_input")

payload=$(jq -n \
  --arg id "$CONFLUENCE_PAGE_ID" \
  --arg title "$page_title" \
  --arg body "$table_body" \
  --argjson version "$next_version" \
  --arg message "Refresh epic completion table" '
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
