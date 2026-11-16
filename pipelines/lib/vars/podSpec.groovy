def call(Object... containersInput) {

  String sourceYaml = libraryResource('jenkins-agent-images.yaml')

  Map defaultPodSpec = readYaml(text: sourceYaml)

  Map podSpec = [
    apiVersion: defaultPodSpec.apiVersion,
    kind: defaultPodSpec.kind,
    metadata: defaultPodSpec.metadata,
    spec: [
      serviceAccountName: defaultPodSpec.spec.serviceAccountName,
      restartPolicy: defaultPodSpec.spec.restartPolicy,
      nodeSelector: defaultPodSpec.spec.nodeSelector,
      containers: []
    ]
  ]

  if (!containersInput) { 
    error("You must specify at least one container in property 'containersInput'")
  }

  List<Map> normalizedContainerInput = containersInput.collect { c -> 
    if (c instanceof CharSequence) {
      c = [name: c.toString()]
    }
    return c
  }

  Set<String> seenNames = [] as Set
  boolean hasDuplicateNames = normalizedContainerInput.any { Map container -> !seenNames.add(container.name) }

  if (hasDuplicateNames) {
    error("Multiple containers have the same name")
  }

  List<Map> containers = normalizedContainerInput.collect { Map c -> 
    
    if (!c.name) {
      error("Container must have a name specified")
    }

    // Check if the name exists in the default containers list
    def librarySpec = defaultPodSpec.spec.containers.find { it.name == c.name }
    if (!librarySpec && !c.image) {
        error("Container `${c.name}` must have an `image` property specified")
    }

    Map defaultSpec = librarySpec ?: defaultPodSpec.spec.containers[0]

    Map normalizedResources = [
      requests: defaultSpec.resources.requests + (c.resources?.requests ?: [:]),
      limits: defaultSpec.resources.limits + (c.resources?.limits ?: c.resources?.requests ?: [:]),
    ]

    return [
      name: c.name,
      image: mirroredImage(c.image ?: defaultSpec.image),
      command: c.command ?: defaultSpec.command ?: ['cat'],
      tty: true,
      args: c.args ?: defaultSpec.args ?: [],
      env: c.env ?: defaultSpec.env ?: [],
      resources: normalizedResources,
    ]
  }

  podSpec.spec.containers = containers
  return writeYaml(returnText: true, data:podSpec)
}

String mirroredImage(String image) {
  if (image.startsWith('artifactory.cloud.cms.gov/docker')) {
    return image
  }

  return "artifactory.cloud.cms.gov/docker/${image}"
}
