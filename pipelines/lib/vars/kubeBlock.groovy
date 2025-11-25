def call(Map params = [:]) {

  def containerNames = params.containerNames ?: []
  def opts = params.opts ?: [:]

  if (containerNames.size() == 0) {
    error("No container names provided")
  }

    def containerPresets = [
      'node': """
- name: node
  image: ${opts.NODE_IMAGE ?: 'artifactory.cloud.cms.gov/docker/node:24-alpine'}
  command:
  - cat
  tty: true
  resources:
    requests:
      cpu: 750m
      memory: 2Gi
    limits:
      cpu: 1500m
      memory: 4Gi
""",
      'aws-cli': """
- name: aws-cli
  image: ${opts.AWS_IMAGE ?: 'artifactory.cloud.cms.gov/docker/amazon/aws-cli:latest'}
  command:    
  - sleep 
  - 99999
  tty: true
""",
      'scanner': """
- name: scanner
  image: ${opts.SCANNER_IMAGE ?: 'artifactory.cloud.cms.gov/docker/sonarsource/sonar-scanner-cli:latest'}
  command:
  - cat
  tty: true
  resources:
    requests:
      cpu: 1500m
      memory: 2Gi
    limits:
      cpu: 3000m
      memory: 4Gi
""",
      'snyk': """
- name: snyk
  image: ${opts.SCANNER_IMAGE ?: 'artifactory.cloud.cms.gov/docker/snyk/snyk:alpine'}
  command:
  - cat
  tty: true
""",
      'zap': """
- name: zap
  image: ${opts.ZAP_IMAGE ?: 'artifactory.cloud.cms.gov/docker/zaproxy/zap-stable:latest'}
  command:
  - cat
  tty: true
  resources:
    requests:
      cpu: 1500m
      memory: 2Gi
    limits:
      cpu: 3000m
      memory: 4Gi
"""
    ]

    def selectedContainersYaml = containerNames.collect { containerName -> 
      def block = containerPresets[containerName]
      if (!block) error("Unknown container: ${containerName}")
      indentYaml(block, 8)
    }.join('')

    env.AVAILABLE_CONTAINERS = containerNames.join(',')

    def output = """
    spec:
      serviceAccountName: jenkins-role
      containers:
${selectedContainersYaml}

    """
    echo "YAML: ${output}"
    return output
}

String indentYaml(String yamlBlock, int spaces = 4) {
    def indent = ' ' * spaces
    return yamlBlock.readLines().collect { indent + it }.join('\n')
}
