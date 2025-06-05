variable "env" {
  type = string
}

variable "users" {
  type = list(object({
    username    = string
    roles       = list(string)
    system_user = optional(bool)
  }))
}

variable "db_info" {
  type = object({
    dbname               = string
    engine               = string
    port                 = number
    dbInstanceIdentifier = string
    host                 = string
  })
}
