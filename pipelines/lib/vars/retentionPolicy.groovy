def call(String branchName, Map config = [:]) {
  Map defaults = [
    longNumKeep: '30',
    shortNumKeep: '2',
    longDaysKeep: '60',
    shortDaysKeep: '7',
    longRetentionBranches: ['main', 'test', 'impl', 'prod'],
    additionalLongRetentionBranches: []
  ]

  config = defaults + config
  config.longRetentionBranches.addAll(config.additionalLongRetentionBranches)

  def isLongRetentionBranch = config.longRetentionBranches.contains(branchName)

  if (branchName.startsWith('gh-readonly-queue')) {
    return logRotator(
      numToKeepStr: '0',
      artifactNumToKeepStr: '0',
      daysToKeepStr: '0',
      artifactDaysToKeepStr: '0',
      removeLastBuild: true
    )
  }

  return logRotator(
    numToKeepStr: isLongRetentionBranch ? config.longNumKeep : config.shortNumKeep,
    artifactNumToKeepStr: isLongRetentionBranch ? config.longNumKeep : config.shortNumKeep,
    daysToKeepStr: isLongRetentionBranch ? config.longDaysKeep : config.shortDaysKeep,
    artifactDaysToKeepStr: isLongRetentionBranch ? config.longDaysKeep : config.shortDaysKeep,
    removeLastBuild: !isLongRetentionBranch
  )
}
