def call(Map params) {
  def dir = params.dir ?: ''

  if (dir == '') {
      error("Target directory (dir) is required")
  }

  git branch: 'main', url: "https://github.com/Enterprise-CMCS/demos.git"

  def notUpdated = ""
  dirCon(dir, "node") {
    sh "npx npm-check-updates -u -t minor --install always"
    sh "npx npm-check-updates --format group > not_updated.txt"
    sh(script: "sed '1d;\$d' not_updated.txt > not_updated2.txt")
    notUpdated = sh(script: '''awk '{printf "%s\\\\n", $0}' RS='\\n' ORS='' not_updated2.txt''', returnStdout: true).trim()
  }
  sh """
    git config user.name "${GITHUB_SERVICE_ACCOUNT_USER}"
    git config user.email "${GITHUB_SERVICE_ACCOUNT_EMAIL}"
  """
  def thisDate = sh(script: "date '+%Y%m%d%H%M%S'", returnStdout: true).trim()
  sh "git checkout -b update-dependencies-${dir}-${thisDate}"
  sh "git status"
  sh "git add -u && git commit -m 'Update ${dir} dependencies'"
  withCredentials([
    usernamePassword(credentialsId: 'demos-git-svc-account', usernameVariable: 'GITHUB_USERNAME', passwordVariable: 'GITHUB_TOKEN'), // pragma: allowlist secret
  ]) {
  sh "git push -u https://\$GITHUB_USERNAME:\$GITHUB_TOKEN@github.com/Enterprise-CMCS/demos.git update-dependencies-${dir}-${thisDate}"
  sh """
  curl -L -X POST -H "Accept: application/vnd.github+json" -H "Authorization: Bearer \$GITHUB_TOKEN" -H "X-GitHub-Api-Version: 2022-11-28" https://api.github.com/repos/Enterprise-CMCS/demos/pulls -d '{"title":"Upgrade ${dir} npm packages","body":"All available minor and patch updates have been installed.\\n\\n## Major Updates Available\\n\\nThe following packages were not updated: \\n```${notUpdated}```","head":"update-dependencies-${dir}-${thisDate}","base":"main"}'
  echo ${notUpdated}
  """
  }
}
