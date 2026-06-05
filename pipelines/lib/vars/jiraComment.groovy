import groovy.json.JsonOutput
import java.net.URLEncoder

def call(Map params) {
  def ticket = params.ticket ?: params.jiraTicket ?: params.issueKey ?: ''
  def content = params.content ?: params.body ?: ''
  def jiraBaseUrl = (params.baseUrl ?: env.JIRA_BASE_URL ?: '').trim()
  def credentialsId = params.credentialsId ?: 'demos-jira-svc-account'

  if (!ticket) {
    error('Jira ticket number is required. Example: jiraComment(ticket: "DEMOS-1234", content: "...")')
  }

  if (!content) {
    error('Jira comment content is required. Example: jiraComment(ticket: "DEMOS-1234", content: "...")')
  }

  if (!jiraBaseUrl) {
    error('Jira base URL is required. Pass baseUrl or set JIRA_BASE_URL in the pipeline environment.')
  }

  def normalizedBaseUrl = jiraBaseUrl.replaceAll('/+$', '')
  def encodedTicket = URLEncoder.encode(ticket.toString(), 'UTF-8')
  def commentUrl = "${normalizedBaseUrl}/rest/api/2/issue/${encodedTicket}/comment"
  def payloadFile = "jira-comment-${env.BUILD_TAG ?: UUID.randomUUID().toString()}.json".replaceAll('[^A-Za-z0-9_.-]', '-')

  writeFile(
    file: payloadFile,
    text: JsonOutput.toJson([body: content.toString()])
  )

  withCredentials([
    string(
      credentialsId: credentialsId,
      variable: 'JIRA_API_TOKEN'
    )
  ]) {
    sh(
      label: "Add Jira comment to ${ticket}",
      script: """
        curl --fail --silent --show-error \\
          --request POST \\
          --HEADER "Authorization: Bearer \$JIRA_API_TOKEN" \\
          --header "Accept: application/json" \\
          --header "Content-Type: application/json" \\
          --data @${payloadFile} \\
          "${commentUrl}"
      """
    )
  }
}

def call(String ticket, String content) {
  call(ticket: ticket, content: content)
}
