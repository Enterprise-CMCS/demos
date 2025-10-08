import groovy.transform.Field

@Field Map<String, Boolean> changes = [:]

def call(String path, String target = "") {

  if (changes.containsKey(path)) {
    echo "cache hit"
    return changes[path]
  }

  if (target == "") {
    target = env.CHANGE_TARGET
  }
  
  def diffStatus = sh(script: "git diff --name-only --merge-base origin/${target} -- ${path}", returnStdout: true).trim()
  changes[path] = diffStatus != ""
  return changes[path]
}
