def call(stage: String) {
  def username = sh(script: '''
  curl https://api.github.com/repos/Enterprise-CMCS/demos/commits/$(git log -1 --pretty=format:"%H") | grep '"login":' | head -n1 | sed -E 's/.*"login": *"(.*)".*/\\1/'
  ''', returnStdout: true).trim()
  def slackId = slackIdFromGithubUser(username)
  def arr = env.SLACK_DB_NOTIFICATION_USERS.toString().split(",").collect { "${it.trim()}".toString() }
  
  
  if (slackId && !arr.contains(slackId.trim())) {
    arr << slackId
  }

  def mentions =  arr.collect { "<@$it>" }.join(" ")
  slackSend(color: "danger", message: "${mentions} There was an issue applying migrations in ${stage}")
}
