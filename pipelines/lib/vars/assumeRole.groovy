def call(Map params) {

  def accountNumber = params.accountNumber
  def role = params.role ?: "arn:aws:iam::${accountNumber}:role/delegatedadmin/developer/jenkins-role"
  def containerName = params.containerName ?: 'aws-cli'

  container(containerName) {
    sh """
    aws sts assume-role --role-arn ${role} --role-session-name session > /tmp/role-creds.json
    cat > .aws-creds <<EOF
  [default]
  aws_access_key_id = \$(grep -o '"AccessKeyId": "[^"]*"' /tmp/role-creds.json | awk -F'"' '{print \$4}')
  aws_secret_access_key = \$(grep -o '"SecretAccessKey": "[^"]*"' /tmp/role-creds.json | awk -F'"' '{print \$4}')
  aws_session_token = \$(grep -o '"SessionToken": "[^"]*"' /tmp/role-creds.json | awk -F'"' '{print \$4}')
EOF

  cp -v .aws-creds ${env.WORKSPACE}/aws_credentials
  unset AWS_WEB_IDENTITY_TOKEN_FILE
  """
  env.AWS_WEB_IDENTITY_TOKEN_FILE=""
  env.AWS_SHARED_CREDENTIALS_FILE="${env.WORKSPACE}/aws_credentials"
  sh "echo \$AWS_SHARED_CREDENTIALS_FILE"
  }
}
