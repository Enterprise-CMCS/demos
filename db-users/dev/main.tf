module "postgres_users" {
  source = "../modules/postgres-users"

  env = "dev"

  db_info = {
    dbname               = data.aws_db_instance.database.db_name
    engine               = data.aws_db_instance.database.engine
    port                 = data.aws_db_instance.database.port
    host                 = data.aws_db_instance.database.address
    dbInstanceIdentifier = data.aws_db_instance.database.db_instance_identifier
  }

  users = [
    {
      username = "user_one"
      roles    = ["read_only", "admin"]
    },
    {
      username    = "system_user"
      roles       = ["read_only"]
      system_user = true
    }
  ]
}
