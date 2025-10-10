pipeline {
  agent {
    kubernetes { 
      yaml kubeBlock(containerNames:["zap", "aws-cli"])
    }
  }

  triggers {
    cron('H 2 * * 0')
  }
  
  options {
    disableConcurrentBuilds()
  }

  stages {
    stage('Setup') {
      steps {
        // Keep this hardcoded as the nonprod account number
        assumeRole(accountNumber: env.DEMOS_AWS_NONPROD_ACCOUNT_NUMBER)
        script {
          container("aws-cli") {
            env.ZAP_HEADER_VALUE = sh(script:'''
            aws secretsmanager get-secret-value --secret-id $ZAP_CONFIG_SECRET_ID --query 'SecretString' --output text | grep -o '"zapHeaderValue":"[^"]*"' | sed 's/"zapHeaderValue":"\\(.*\\)"/\\1/'
            ''', returnStdout: true).trim()
          }
        }
      }
    }
    stage('Zap Scan') {
      steps {
        script {
  
        // ENVs in the ZAP yaml work in all current use cases except for the
        // header value, so it has to be replaced prior to running the scan
        sh """
        sed -i 's|{{REPLACE_HEADER_VALUE}}|${env.ZAP_HEADER_VALUE}|g' zap/demos-zap.yaml
        """
        sh "mkdir -p zap-files"

        container("zap") {
          withCredentials([usernamePassword(credentialsId: 'zap-credentials', usernameVariable: 'ZAP_EMAIL', passwordVariable: 'ZAP_PASSWORD')]) { // pragma: allowlist secret
            sh "/zap/zap.sh -cmd -autorun \$(pwd)/zap/demos-zap.yaml"
          }
        }

        archiveArtifacts artifacts: 'zap/output/**', allowEmptyArchive: true, fingerprint: true

        }
      }

      post {
        success {
          script {
            def fileName = sh(script: "ls zap/output/*.html", returnStdout: true).trim()
            def fileNamePDF = sh(script: "ls zap/output/*.pdf", returnStdout: true).trim()
            slackSend(color: "good", message: "ZAP Scan Complete\n\n<${env.HUDSON_URL}job/ZapScan/${env.BUILD_NUMBER}/artifact/${fileName}|View Results>\n\n<${env.HUDSON_URL}job/ZapScan/${env.BUILD_NUMBER}/artifact/${fileNamePDF}|PDF Version>")
          }
        }
      }
    }

  }

}
