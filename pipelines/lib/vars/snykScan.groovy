def call(Map params) {

  def containerName = params.containerName ?: 'snyk'
  def dirName = params.dir ?: './'
  def severityThreshold = params.severityThreshold ?: 'high'

  dir(dirName) {
    container(containerName) {
      withCredentials([
        string(credentialsId: 'demos-snyk-sa', variable: 'SNYK_TOKEN'),
        string(credentialsId: 'demos-snyk-org-id', variable: 'SNYK_CFG_ORG')
      ]) {
        sh """
          snyk test --severity-threshold=${severityThreshold} --strict-out-of-sync=true --dev
        """
      }
    }
  }
}

def call(String dirName, Map params = [:]) {
  Map mergedParams = params + [dir: dirName]
  call(mergedParams)
}
