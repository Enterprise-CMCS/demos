def call(String dirName, String containerName, Closure body) {
  dir(dirName) {
    container(containerName) {
      body()
    }
  }
}