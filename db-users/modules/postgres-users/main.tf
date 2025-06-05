//
// Grants / Non Login Roles
//

resource "postgresql_role" "read_only" {
  name  = "read_only"
  login = false
}

resource "postgresql_grant" "read_only" {
  database    = var.db_info.dbname
  role        = postgresql_role.read_only.name
  schema      = "public"
  object_type = "table"
  objects     = ["test"]
  privileges  = ["SELECT"]
}

resource "postgresql_role" "admin" {
  name  = "admin"
  login = false
}

resource "postgresql_grant" "admin" {
  database    = var.db_info.dbname
  role        = postgresql_role.admin.name
  schema      = "public"
  object_type = "table"
  objects     = ["test"]
  privileges  = ["SELECT", "INSERT"]
}

locals {
  role_refs = {
    read_only = postgresql_role.read_only.name
    admin     = postgresql_role.admin.name
  }
}


//
// User Creation
//

locals {
  users            = { for u in var.users : u.username => merge(u, { system_user = coalesce(u.system_user, false) }) }
  system_users     = { for k, v in local.users : k => v if v.system_user }
  non_system_users = { for k, v in local.users : k => v if !v.system_user }
}


// Note: These generated passwords will not be used long-term. System user
// passwords are immediately rotated by secrets manager and users will be
// instructed to rotate their own passwords on their first login
resource "random_password" "password" {
  for_each         = local.users
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_ssm_parameter" "initial_password" {
  for_each    = local.non_system_users
  name        = "/demos/${var.env}/database/${each.key}"
  description = "Temp DB password for ${each.key}"
  type        = "SecureString"
  value       = random_password.password[each.key].result

  tags = {
    environment = var.env
  }
}

resource "postgresql_role" "my_role" {
  for_each = local.users
  name     = each.key
  login    = true
  password = random_password.password[each.key].result

  // The value of `r` here is the same as the value within the role ref itself,
  // but this ensures that the role is created before it attempts to assign it
  // to the user
  roles = [for r in each.value.roles : local.role_refs[r]]

  // For non-system users, always assume the read only role on login. This
  // forces an explicit `SET ROLE NONE;` (or similar) in order to make database
  // changes
  assume_role = !each.value.system_user && contains(each.value.roles, local.role_refs.read_only) ? local.role_refs.read_only : null
  inherit     = false

  lifecycle {
    ignore_changes = [password]
  }
}


//
// AWS Secrets Manager Integration - Only for system users
//

resource "aws_secretsmanager_secret" "system_password" {
  for_each                = local.system_users
  name                    = "demos-${var.env}-${each.key}-password"
  recovery_window_in_days = 0 // Only for testing
}

resource "aws_secretsmanager_secret_version" "system_password" {
  for_each  = local.system_users
  secret_id = aws_secretsmanager_secret.system_password[each.key].id
  secret_string = jsonencode({
    username             = each.key
    password             = random_password.password[each.key].result
    dbname               = var.db_info.dbname
    engine               = var.db_info.engine
    port                 = var.db_info.port
    dbInstanceIdentifier = var.db_info.dbInstanceIdentifier
    host                 = var.db_info.host
  })
}

data "aws_lambda_function" "password_rotation" {
  function_name = "demos-${var.env}-rds-rotation"
}

resource "aws_secretsmanager_secret_rotation" "rotation" {
  for_each            = local.system_users
  secret_id           = aws_secretsmanager_secret.system_password[each.key].id
  rotation_lambda_arn = data.aws_lambda_function.password_rotation.arn

  rotation_rules {
    automatically_after_days = 30
  }
}


