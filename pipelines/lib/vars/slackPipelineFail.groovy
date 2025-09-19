def call(String pipeline, Boolean always) {
  if (env.CHANGE_ID || always) {
    def userId = slackIdFromGithubUser(env.CHANGE_AUTHOR)
    def mention = userId ? "<@${userId}>" : "`${env.CHANGE_AUTHOR}`"
    slackSend(color: "danger", message: "<${env.CHANGE_URL}|PR ${env.CHANGE_ID}> by ${mention} - ${pipeline} Pipeline failed: ${env.BUILD_URL}")
  }
}

def call(String pipeline) {
  call(pipeline, false)
}
