def call(Map params) {
  def scannerHome = tool 'SonarQube'
  println "Running sonarQubeScan"

  def success = true
  def qualityGateResult = null;

  def projectKey = params.projectKey ?: ''
  def prBranchName = params.prBranchName ?: ''
  def exclusions = params.exclusions ?: ''
  def credentialsId = params.credentialsId ?: ''
  def projectBaseDir = params.projectBaseDir ?: ''
  def sonarqubeFlags = params.sonarqubeFlags ?: [:]

  if (credentialsId == '') {
      error("SonarQube credentials ID is required")
  }

  if (projectKey == '') {
      error("SonarQube project key is required")
  }

  if (projectBaseDir == '') {
      error("SonarQube project base directory is required")
  }

  def sonarqubeDefaultsYaml = libraryResource "sonarqube/defaults.yaml"
  def sonarqubeDefaultFlags = readYaml text: sonarqubeDefaultsYaml
  def sonarqubeCliFlags = sonarqubeDefaultFlags + sonarqubeFlags
  def formattedFlags = sonarqubeCliFlags.collect { key, value -> "-Dsonar.${key}=${value}" }.join(" ")

  withCredentials([string(credentialsId: "${credentialsId}", variable: 'TOKEN')]) {
    withSonarQubeEnv('SonarQube') {
        sh """
          ${scannerHome}/bin/sonar-scanner \
            -Dsonar.projectKey=${projectKey} \
            -Dsonar.projectBaseDir=${projectBaseDir} \
            -Dsonar.host.url=https://sonarqube.cloud.cms.gov \
            -Dsonar.qualitygate.wait=true \
            -Dsonar.login=\$TOKEN \
            ${formattedFlags} \
            -X
        """
    }
  }
  def reportTask = readProperties file: "./${projectBaseDir}/.scannerwork/report-task.txt"
  def dashboardUrl = "${reportTask['dashboardUrl']}"
  println "SonarQube dashboard URL: ${dashboardUrl}"
  return dashboardUrl
}