import groovy.transform.Field

@Field Map<String, Boolean> changes = [:]

def call(String path, String target = "") {

  if (!env.CHANGE_ID) {
    echo "Always trigger if pipeline run is not a pull request"
    return true
  }

  if (changes.containsKey(path)) {
    return changes[path]
  }

  if (target == "") {
    target = env.CHANGE_TARGET
  }
  
  def diffStatus = sh(script: "git diff --name-only --merge-base origin/${target} -- ${path}", returnStdout: true).trim()
  echo "Diff status for path '${path}': ${diffStatus}"
  changes[path] = diffStatus != ""
  return changes[path]
}

def call(List<String> paths, String target = "") {
  for (String path : paths) {
    if (call(path, target)) {
      return true
    }
  }
  return false
}
