def call(String path, String target = "") {
  if (target == "") {
    target = env.CHANGE_TARGET
  }
  
  def diffStatus = sh(script: "git diff --name-only --merge-base origin/${target} -- ${path}", returnStdout: true).trim()
  return diffStatus != ""
}
