import groovy.transform.Field

@Field List<String> caughtFailures = []

def call(Boolean shouldCatchError = false, Closure body) {
  if (shouldCatchError) {
    catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
      try {
        body()
      } catch ( Exception err) {
        echo "Failure in ${env.STAGE_NAME}"
        echo "Error: ${err}"

        caughtFailures << env.STAGE_NAME

        throw err
      }
    }
  } else {
    body()
  }
}

def setFailureDescription() {
  if (caughtFailures.size() > 0) {
    def failureList = caughtFailures.join('|')
    currentBuild.description = "${failureList}"
  }
}
