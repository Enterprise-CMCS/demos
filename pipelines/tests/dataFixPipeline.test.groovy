class PipelineDslHarness {
  Map params
  Map env = [WORKSPACE: '/workspace']
  Map currentBuild = [description: null]
  List consoleLines = []
  List stageDefinitions = []
  List stageNames = []
  List shellCalls = []
  List withEnvCalls = []
  List checkouts = []
  List containerCalls = []
  List roleCalls = []
  List cleanups = []
  List options = []
  List parameters = []
  List fileChecks = []
  Map files = [:]
  String runnerResult
  int runnerStatus
  boolean runnerResultPresent
  Closure postAlways
  Script sourceScript

  PipelineDslHarness(Map configuration = [:]) {
    params = [
      ENVIRONMENT: configuration.environment ?: 'dev',
      FIX_FILE: configuration.fixFile ?: '20261118_DEMOS-1234_safe_fix.sql',
      APPLY: configuration.apply ?: false
    ]
    runnerResult = configuration.runnerResult ?:
      groovy.json.JsonOutput.toJson([
        version: 1, environment: 'dev', filename: params.FIX_FILE, mode: 'dry-run', outcome: 'rolled-back',
        rowsAffected: 2, failurePhase: null, rollbackStatus: 'acknowledged', cleanupStatus: 'succeeded'
      ])
    runnerStatus = configuration.runnerStatus ?: 0
    runnerResultPresent = configuration.containsKey('runnerResultPresent') ? configuration.runnerResultPresent : true
  }

  private def runBlock(Closure block) {
    def delegated = block.rehydrate(this, block.owner, block.thisObject)
    delegated.resolveStrategy = Closure.DELEGATE_FIRST
    return delegated.call()
  }

  def execute(Closure pipelineBlock) {
    runBlock(pipelineBlock)
    Throwable stageFailure
    try {
      stageDefinitions.each { definition ->
        stageNames << definition.name
        runBlock(definition.body)
      }
    } catch (Throwable failure) {
      stageFailure = failure
    } finally {
      if (postAlways != null) {
        runBlock(postAlways)
      }
    }
    if (stageFailure != null) {
      throw stageFailure
    }
  }

  def agent(Closure body) { runBlock(body) }
  def kubernetes(Closure body) { runBlock(body) }
  def yaml(Object ignored) {}
  def podSpec(Object... containers) { "fake pod for ${containers.size()} containers" }
  def options(Closure body) { runBlock(body) }
  def disableConcurrentBuilds(Map value) { options << [disableConcurrentBuilds: value] }
  def skipDefaultCheckout(boolean value) { options << [skipDefaultCheckout: value] }
  def parameters(Closure body) { runBlock(body) }
  def choice(Map value) { parameters << value }
  def string(Map value) { parameters << value }
  def booleanParam(Map value) { parameters << value }
  def environment(Closure body) { runBlock(body) }
  def stages(Closure body) { runBlock(body) }
  def stage(String name, Closure body) { stageDefinitions << [name: name, body: body] }
  def steps(Closure body) { runBlock(body) }
  def script(Closure body) { runBlock(body) }
  def post(Closure body) { runBlock(body) }
  def always(Closure body) { postAlways = body }

  def checkout(Map value) { checkouts << value }
  def deleteDir() { cleanups << 'deleteDir' }
  def cleanWs(Map value) { cleanups << value }
  def error(String message) { throw new RuntimeException(message) }
  def echo(String message) { consoleLines << message }
  def assumeRole(Map value) { roleCalls << value }

  def dirCon(String directory, String container, Closure body) {
    containerCalls << [directory: directory, container: container]
    runBlock(body)
  }

  def withEnv(List<String> values, Closure body) {
    withEnvCalls << values
    def previous = [:]
    values.each { assignment ->
      def parts = assignment.split('=', 2)
      previous[parts[0]] = env.containsKey(parts[0]) ? env[parts[0]] : null
      env[parts[0]] = parts[1]
    }
    try {
      runBlock(body)
    } finally {
      previous.each { key, value ->
        if (value == null) {
          env.remove(key)
        } else {
          env[key] = value
        }
      }
    }
  }

  def sh(String command) {
    shellCalls << [command: command]
    return 0
  }

  def sh(Map arguments) {
    shellCalls << arguments
    if (arguments.returnStdout == true) {
      return '0123456789012345678901234567890123456789\n'
    }
    if (arguments.label == 'Run data-fix dry run') {
      if (runnerResultPresent) {
        files['.data-fix-result.json'] = runnerResult
      }
      return runnerStatus
    }
    return 0
  }

  def fileExists(String path) {
    fileChecks << path
    if (path.startsWith('server/src/data_fixes/')) {
      return true
    }
    return files.containsKey(path)
  }

  def readFile(Map arguments) { files[arguments.file] }

  def summarizeDataFixResult(String contents, String environment, String fileName, String mode, int exitStatus) {
    return sourceScript.invokeMethod('summarizeDataFixResult', [contents, environment, fileName, mode, exitStatus] as Object[])
  }

  def reportDataFixSummary(Map summary, int exitStatus) {
    return sourceScript.invokeMethod('reportDataFixSummary', [summary, exitStatus] as Object[])
  }

  def propertyMissing(String name) { env[name] }
  void propertyMissing(String name, Object value) { env[name] = value }
}

def check = { boolean condition, String message ->
  if (!condition) {
    throw new AssertionError(message)
  }
}
def test = { String name, Closure body ->
  body.call()
  println "PASS ${name}"
}
def resultJson = { Map overrides = [:] ->
  groovy.json.JsonOutput.toJson([
    version: 1, environment: 'dev', filename: '20261118_DEMOS-1234_safe_fix.sql', mode: 'dry-run',
    outcome: 'rolled-back', rowsAffected: 2, failurePhase: null,
    rollbackStatus: 'acknowledged', cleanupStatus: 'succeeded'
  ] + overrides)
}
def runPipeline = { Map configuration = [:] ->
  def harness = new PipelineDslHarness(configuration)
  def pipelineBinding = new Binding([
    pipeline: { Closure body -> harness.execute(body) },
    params: harness.params,
    env: harness.env,
    currentBuild: harness.currentBuild,
    echo: { String message -> harness.echo(message) },
    error: { String message -> harness.error(message) }
  ])
  def script = new GroovyShell(pipelineBinding).parse(new File('pipelines/Jenkinsfile.dataFix'))
  harness.sourceScript = script
  Throwable failure
  try {
    script.run()
  } catch (Throwable thrown) {
    failure = thrown
  }
  return [harness: harness, failure: failure]
}

test('pipeline rejects non-dev and apply requests before resource access') {
  [
    [environment: 'prod', message: 'supports dev dry runs only'],
    [apply: true, message: 'APPLY=true is not supported']
  ].each { scenario ->
    def result = runPipeline(scenario)
    check(result.failure != null && result.failure.message.contains(scenario.message), 'unsafe parameters were not rejected')
    check(result.harness.checkouts.isEmpty() && result.harness.roleCalls.isEmpty(), 'resource access happened before rejection')
    check(result.harness.shellCalls.isEmpty(), 'a shell command ran before parameter rejection')
    check(result.harness.cleanups.contains([deleteDirs: true]), 'workspace was not cleaned after rejection')
  }
}

test('pipeline runs from full-history main and reports the runner-owned rollback') {
  def fixFile = '20261118_DEMOS-1234_safe_fix.sql'
  def result = runPipeline([fixFile: fixFile])
  def harness = result.harness
  check(result.failure == null, "valid dry run failed: ${result.failure?.message}")
  check(harness.stageNames == ['Checkout main', 'Assume role', 'Dry run'], 'unexpected stage or apply capability was present')
  check(harness.checkouts.size() == 1 && harness.checkouts[0].branches == [[name: '*/main']], 'checkout was not pinned to main')
  def cloneOption = harness.checkouts[0].extensions.find { it.$class == 'CloneOption' }
  check(cloneOption != null && cloneOption.shallow == false && cloneOption.depth == 0, 'checkout did not request full history')
  check(harness.fileChecks.any { it.toString() == "server/src/data_fixes/${fixFile}" }, 'selected fix was not checked in the main checkout')
  check(harness.roleCalls == [[accountEnv: 'dev']], 'dev role was not assumed exactly once')
  check(harness.containerCalls == [
    [directory: 'deployment', container: 'node'],
    [directory: 'deployment', container: 'node']
  ], 'install and runner did not stay in the deployment node container')

  def runnerCall = harness.shellCalls.find { it instanceof Map && it.label == 'Run data-fix dry run' }
  check(runnerCall != null && runnerCall.returnStatus == true, 'runner exit status was not captured')
  check(runnerCall.script.contains('set +x') && runnerCall.script.contains('rm -f -- "$result"'), 'prior result was not cleared with tracing disabled')
  check(runnerCall.script.contains('> /dev/null 2>&1') && runnerCall.script.contains('runner_status=$?'), 'runner output was exposed or its status was masked')
  check(runnerCall.script.contains('npx tsx demosctl/index data-fix "$DATA_FIX_ENVIRONMENT" "$DATA_FIX_FILENAME"'), 'runner arguments are not quoted')
  check(harness.withEnvCalls.flatten().any { it.toString() == 'DATA_FIX_RESULT_FILE=/workspace/.data-fix-result.json' }, 'private result path was not passed to the runner')
  check(harness.consoleLines == ['Dry run rolled back successfully; aggregate rows affected: 2'], 'safe rollback summary was incorrect')
  check(harness.cleanups.contains([deleteDirs: true]), 'workspace cleanup did not run after success')
  check(harness.env.CHECKOUT_COMMIT == '0123456789012345678901234567890123456789', 'main checkout SHA was not recorded')
  check(harness.parameters.find { it.name == 'ENVIRONMENT' }.choices == ['dev'], 'job exposes an unsupported environment')
  check(harness.parameters.find { it.name == 'APPLY' }.defaultValue == false, 'apply is not disabled by default')
  check(harness.options.contains([skipDefaultCheckout: true]) && harness.options.contains([disableConcurrentBuilds: [abortPrevious: false]]), 'pipeline checkout or concurrency options changed')
}

test('pipeline reports an already-applied result as idempotency, not rollback proof') {
  def result = runPipeline([runnerResult: resultJson([
    outcome: 'no-op', rowsAffected: 0, rollbackStatus: 'acknowledged'
  ])])
  check(result.failure == null, 'valid no-op result failed the dry-run pipeline')
  check(result.harness.consoleLines == ['Dry run complete: fix is already applied; no new rows would be changed'], 'no-op was not distinguished from rollback')
  check(result.harness.cleanups.contains([deleteDirs: true]), 'workspace cleanup did not run after no-op')
}

test('pipeline rejects missing and contradictory results and always cleans up') {
  def scenarios = [
    [configuration: [runnerResultPresent: false], message: 'runner result is missing'],
    [configuration: [runnerResult: resultJson([outcome: 'no-op', rowsAffected: 0, rollbackStatus: 'not-started'])], message: 'malformed or contradictory']
  ]
  scenarios.each { scenario ->
    def result = runPipeline(scenario.configuration)
    check(result.failure != null && result.failure.message.contains('Data-fix dry run failed'), 'unusable result did not fail the job')
    check(result.harness.consoleLines.any { it.contains(scenario.message) }, 'unusable result did not produce its fixed diagnostic')
    check(!result.harness.consoleLines.any { it.contains('rolled back successfully') }, 'unusable result was reported as success')
    check(result.harness.cleanups.contains([deleteDirs: true]), 'workspace cleanup did not run after unusable result')
  }
}

test('pipeline does not accept a valid rollback record when the runner exits nonzero') {
  def result = runPipeline([runnerStatus: 1])
  check(result.failure != null, 'nonzero runner exit was accepted')
  check(result.harness.consoleLines.any { it.contains('runner exited with status 1') }, 'nonzero exit status was not reported')
  check(result.harness.consoleLines.any { it.contains('not rollback proof') }, 'failed run was presented as rollback proof')
  check(result.harness.cleanups.contains([deleteDirs: true]), 'workspace cleanup did not run after runner failure')
}

test('pipeline reports pair-lock and unconfirmed-rollback failures safely') {
  def cases = [
    [result: resultJson([outcome: 'failed', rowsAffected: null, failurePhase: 'pair lock', rollbackStatus: 'acknowledged']), message: 'failed during pair lock'],
    [result: resultJson([outcome: 'failed', failurePhase: 'fix body', rollbackStatus: 'unconfirmed']), message: 'Rollback completion is unconfirmed']
  ]
  cases.each { scenario ->
    def result = runPipeline([runnerResult: scenario.result, runnerStatus: 1])
    check(result.failure != null, 'runner failure was accepted')
    check(result.harness.consoleLines.any { it.contains(scenario.message) }, 'runner failure was not safely classified')
    check(result.harness.cleanups.contains([deleteDirs: true]), 'workspace cleanup did not run after runner failure')
  }
}

println 'All data-fix pipeline tests passed.'