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
        script {

        sh "mkdir -p zap-files"

        container("zap") {
          withCredentials([usernamePassword(credentialsId: 'zap-credentials', usernameVariable: 'ZAP_EMAIL', passwordVariable: 'ZAP_PASSWORD')]) { // pragma: allowlist secret
            sh "/zap/zap.sh -cmd -autorun \$(pwd)/zap-output/demos-zap.yaml"
          }
        }

        archiveArtifacts artifacts: 'zap-output/output/**', allowEmptyArchive: true, fingerprint: true
    

        }
      }
    }

  }

}
