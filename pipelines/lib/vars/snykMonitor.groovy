import groovy.transform.Field

@Field String ref = '';

def setRef(String reference) {
  echo "Setting ref to: ${reference}"
  ref = reference
  echo "Ref is now set to: ${ref}"
}

def call(Map params) {

  def containerName = params.containerName ?: 'snyk'
  def repoUrl = params.repoUrl ?: 'https://github.com/Enterprise-CMCS/demos'
  def parentDir = params.parentDir ?: ''
  def targetEnv = params.targetEnv ?: 'prod'

  def localRef = params.ref ?: ref

  echo "ref: ${ref}"
  echo "localRef: ${localRef}"

  if (localRef == '') {
    error "Parameter 'ref' is required or set using setRef()"
  }

  if (!params.dir) {
    error "Parameter 'dir' is required"
  }
  def dirName = params.dir

  if (parentDir) {
    dirName = "${parentDir}/${dirName}"
  }

  dir(dirName) {
    container(containerName) {
      withCredentials([
        string(credentialsId: 'demos-snyk-sa', variable: 'SNYK_TOKEN'),
        string(credentialsId: 'demos-snyk-org-id', variable: 'SNYK_CFG_ORG')
      ]) {
        sh """
          snyk monitor --project-name=${params.dir}-${targetEnv} --target-reference=${localRef} --remote-repo-url=${repoUrl}
        """
      }
    }
  }
}

def call(Map params = [:], String dirName) {
  Map mergedParams = params + [dir: dirName]
  call(mergedParams)
}
