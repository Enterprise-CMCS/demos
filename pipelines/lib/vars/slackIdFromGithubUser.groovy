def call(String username = "unknown") {
  if (username == "unknown") {
    return null
  }
  return new groovy.json.JsonSlurper().parseText(env.SLACK_IDS)[username]
}
