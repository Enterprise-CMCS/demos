data "aws_db_instance" "database" {
  db_instance_identifier = "demos-dev-rds"
}

data "aws_secretsmanager_secret" "admin_secret" {
  name = "demos-dev-rds-admin"
}

ephemeral "aws_secretsmanager_secret_version" "admin" {
  secret_id = data.aws_secretsmanager_secret.admin_secret.id
}
