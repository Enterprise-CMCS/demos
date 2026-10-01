@Library('demos-lib@zap-fix') _

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
            // If this is enabled, the jenkins IAM role in the CDK should be updated to include "cognito-idp:AdminInitiateAuth"
            // withCredentials([usernamePassword(credentialsId: 'zap-credentials', usernameVariable: 'ZAP_EMAIL', passwordVariable: 'ZAP_PASSWORD')]) { // pragma: allowlist secret
            //   def token = sh(script:'''
            //   aws cognito-idp admin-initiate-auth --user-pool-id us-east-1_E0EpTKk9Z --client-id 5hqp5ph01m92o0mkegrirdusdo --auth-flow ADMIN_NO_SRP_AUTH --auth-parameters USERNAME=$ZAP_EMAIL,PASSWORD=$ZAP_PASSWORD --output json --query 'AuthenticationResult.IdToken'
            //   ''', returnStdout: true).trim()
            //   env.ZAP_AUTH_HEADER_VALUE = "Bearer ${token}"
            // }
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
            // ZAP's launcher only detects the legacy cgroup v1 memory layout.
            // Read the pod limit directly so cgroup v2 nodes do not size the
            // Java heap from the (much larger) Kubernetes node memory.
            sh '''
              if [ -r /sys/fs/cgroup/memory.max ]; then
                zap_memory_limit_bytes=$(cat /sys/fs/cgroup/memory.max)
              elif [ -r /sys/fs/cgroup/memory/memory.limit_in_bytes ]; then
                zap_memory_limit_bytes=$(cat /sys/fs/cgroup/memory/memory.limit_in_bytes)
              else
                echo 'Unable to find the container memory limit in cgroup v1 or v2.' >&2
                exit 1
              fi

              case "$zap_memory_limit_bytes" in
                ''|max|*[!0-9]*)
                  echo "The ZAP container has no usable memory limit: $zap_memory_limit_bytes" >&2
                  exit 1
                  ;;
              esac

              # Very large values are the cgroup v1 representation of "unlimited".
              if [ "$zap_memory_limit_bytes" -ge 1099511627776 ]; then
                echo "The ZAP container memory limit is effectively unlimited: $zap_memory_limit_bytes bytes" >&2
                exit 1
              fi

              zap_memory_limit_mib=$((zap_memory_limit_bytes / 1024 / 1024))
              zap_heap_mib=$((zap_memory_limit_mib * 75 / 100))
              echo "ZAP container limit: ${zap_memory_limit_mib} MiB; JVM max heap: ${zap_heap_mib} MiB"

              /zap/zap.sh "-Xmx${zap_heap_mib}m" -cmd -autorun "$(pwd)/zap/demos-zap.yaml" -loglevel debug
            '''
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
            // slackSend(color: "good", message: "ZAP Scan Complete\n\n<${env.HUDSON_URL}job/ZapScan/${env.BUILD_NUMBER}/artifact/${fileName}|View Results>\n\n<${env.HUDSON_URL}job/ZapScan/${env.BUILD_NUMBER}/artifact/${fileNamePDF}|PDF Version>")
          }
        }
      }
    }

  }

}
