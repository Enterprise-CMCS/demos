def call(Map params) {
  def dir = params.dir ?: ''

  if (dir == '') {
      error("Target directory (dir) is required")
  }

  def updateGroupName = params.group ?: dir
  echo "The group name is: ${updateGroupName}"
  if (!(updateGroupName instanceof CharSequence)) {
    error("'group' or 'dir' must be a string")
  }

  git branch: 'main', url: "https://github.com/Enterprise-CMCS/demos.git"


  def dirs = dir instanceof CharSequence ? [dir] : dir;
  def notUpdated = [:]

  dirs.each { curDir ->
    dirCon(curDir, "node") {
      sh "npx npm-check-updates -u -t minor --install always"
      sh "npx npm-check-updates --format group > not_updated.txt"
      sh(script: "sed '1d;\$d' not_updated.txt > not_updated2.txt")
      notUpdated[curDir] = sh(script: '''awk '{printf "%s\\\\n", $0}' RS='\\n' ORS='' not_updated2.txt''', returnStdout: true).trim()
    }
  }
  sh """
    git config user.name "${GITHUB_SERVICE_ACCOUNT_USER}"
    git config user.email "${GITHUB_SERVICE_ACCOUNT_EMAIL}"
  """
  def thisDate = sh(script: "date '+%Y%m%d%H%M%S'", returnStdout: true).trim()
  sh "git checkout -b update-dependencies-${updateGroupName}-${thisDate}"

  // If package.json or package-lock.json aren't changed, exit
  def hasChanged = sh(script: """
    if [ "\$(git diff --name-only | grep '.json\$' | wc -l | tr -d '[:space:]')" -gt 0 ]; then
      echo "true"
    else
      echo "false"
    fi
  """, returnStdout: true).trim() 
  
  if (hasChanged == "false") {
      echo "No dependency updates found in ${updateGroupName}."
      return
  }
  sh "git add -u && git commit -m 'Update ${updateGroupName} dependencies'"
  withCredentials([
    usernamePassword(credentialsId: 'demos-git-svc-account', usernameVariable: 'GITHUB_USERNAME', passwordVariable: 'GITHUB_TOKEN'), // pragma: allowlist secret
  ]) {
  sh "git push -u https://\$GITHUB_USERNAME:\$GITHUB_TOKEN@github.com/Enterprise-CMCS/demos.git update-dependencies-${updateGroupName}-${thisDate}"

  def major = "\\n\\n> No major updates are available"
  if (notUpdated.values().every { it != "" }) {
    major = "\\n\\n## Major updates are available\\n\\nThe following packages were **not** updated, but have major version updates available:"

    notUpdated.each { key, value ->
      major += "\\n### ${key.split('/').last()}: \\n```${value}```\\n"
    }
  }
  sh """
  curl -L -X POST -H "Accept: application/vnd.github+json" -H "Authorization: Bearer \$GITHUB_TOKEN" -H "X-GitHub-Api-Version: 2022-11-28" https://api.github.com/repos/Enterprise-CMCS/demos/pulls -d '{"title":"Upgrade ${updateGroupName} npm packages","body":"## Minor and patch updates\\n\\nAll available *minor* and *patch* updates have been installed. See diff for details.${major}","head":"update-dependencies-${updateGroupName}-${thisDate}","base":"main"}'
  """
  }
}
