import groovy.transform.Field

@Field Map<String, Boolean> changes = [:]

def call(String path, String target = "") {

  def isMergeQueueBranch = env.BRANCH_NAME.startsWith("gh-readonly-queue")

  if (!env.CHANGE_ID && !isMergeQueueBranch) {
    echo "Always trigger if pipeline run is not a pull request"
    return true
  }

  if (changes.containsKey(path)) {
    return changes[path]
  }

  if (target == "") {
    if (env.CHANGE_TARGET != "") {
      target = "origin/${env.CHANGE_TARGET}"
    }
    if (isMergeQueueBranch) {
      // If running in a merge queue branch, compare against the previous commit
      // since this branch will potentially contain changes from multiple other
      // PRs that are not yet merged to main. PRs are squashed, so all changes
      // from this PR are included in one commit. (If the merge queue setting is
      // changed from 'Squash and Merge', this will need to be reworked)
      target = "HEAD~1"
    }
  }
  
  def diffStatus = sh(script: "git diff --name-only --merge-base ${target} -- ${path}", returnStdout: true).trim()
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
