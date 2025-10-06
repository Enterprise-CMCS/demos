@Library('demos-lib@demos-zap') _

pipeline {
  agent {
    kubernetes { 
      yaml kubeBlock(containerNames:["zap"])
    }
  }
  
  options {
    disableConcurrentBuilds()
  }

  stages {
    stage('Zap Scan') {
      steps {
        container("zap") {
          sh "/zap/zap.sh -h"
        }
      }
    }

  }

}
