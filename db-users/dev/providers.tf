terraform {

  backend "s3" {
    bucket       = "demos-nonprod-state-bucket"
    key          = "dev/db.tfstate"
    region       = "us-east-1"
    use_lockfile = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.99.1"
    }
    postgresql = {
      source  = "cyrilgdn/postgresql"
      version = "1.25.0"
    }
  }
}

provider "aws" {}

provider "postgresql" {
  host            = data.aws_db_instance.database.address
  port            = data.aws_db_instance.database.port
  database        = "demos"
  username        = jsondecode(ephemeral.aws_secretsmanager_secret_version.admin.secret_string).username
  password        = jsondecode(ephemeral.aws_secretsmanager_secret_version.admin.secret_string).password
  sslmode         = "require"
  connect_timeout = 15
  superuser       = false
}
