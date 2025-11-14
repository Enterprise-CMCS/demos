import { Role } from "../types";
import { getPool } from "./pool";
import { log } from "../log";

export async function deleteRoles(roleList: Role[]) {
  if (roleList.length == 0) {
    return;
  }
  const roleNames = roleList.map((r) => r.name);
  log.info({ roleNames }, "dropping roles");
  try {
    const client = await getPool();
    await client.query(`DROP ROLE ${roleNames.join(",")}`);
  } catch (err) {
    log.error({ error: (err as Error).message }, "error deleting roles");
  }
}

export async function validateRolesExist(roles: string[]) {
  const client = await getPool();
  const query = `
  WITH desired_roles AS (
    SELECT unnest($1::text[]) AS rolname
  )
  SELECT dr.rolname AS role,
    CASE WHEN pr.rolname IS NOT NULL THEN true ELSE false END AS exists
  FROM desired_roles dr
  LEFT JOIN pg_roles pr ON dr.rolname = pr.rolname;
  `;
  const res = await client.query(query, [roles]);
  const notExist = res.rows.filter((r) => !r.exists);
  if (notExist.length > 0) {
    throw new Error(`at least one role does not exist: ${notExist.map((r) => r.role).join(", ")}`);
  }
}

export async function syncRoleMemberships(role: Role) {
  const client = await getPool();

  try {
    await client.query("BEGIN");
    const { rows: currentRows } = await client.query(
      `
    SELECT r.rolname AS role
    FROM pg_auth_members m
    JOIN pg_roles r ON m.roleid = r.oid
    JOIN pg_roles u ON m.member = u.oid
    WHERE u.rolname = $1 
    `,
      [role.name]
    );

    const currentRoles = new Set(currentRows.map((r) => r.role));
    const desiredSet = new Set(role.memberships);

    const toGrant = [...desiredSet].filter((r) => !currentRoles.has(r));
    const toRevoke = [...currentRoles].filter((r) => !desiredSet.has(r));

    if (toRevoke.length != 0) {
      log.info({ roles: toRevoke }, "revoking roles");
      await client.query(`REVOKE ${toRevoke.join(",")} FROM ${role.name}`);
    }

    if (toGrant.length != 0) {
      log.info({ roles: toGrant }, "granting roles");
      await client.query(`GRANT ${toGrant.join(",")} TO ${role.name}`);
    }

    await client.query("COMMIT");
  } catch (err) {
    log.error({ error: (err as Error).message }, "syncRoleMemberships error");
    await client.query("ROLLBACK");
  }
}

export async function loginRolesNotInDb(roleList: Role[]) {
  const allRoleNames = roleList.map((r) => r.name);

  const pool = await getPool();
  const result = await pool.query(
    "SELECT rolname FROM pg_roles WHERE rolcanlogin = true AND rolname = ANY($1::text[])",
    [allRoleNames]
  );
  const excludeSet = new Set(result.rows.map((r) => r.rolname));
  return roleList.filter((r) => !excludeSet.has(r.name));
}

export async function createRole(role: Role, password: string) {
  const pool = await getPool();
  try {
    await pool.query(`CREATE ROLE ${role.name} LOGIN PASSWORD '${password}'`);
  } catch (err) {
    log.error({ error: (err as Error).message }, "failed to create role");
    throw new Error(`failed to create role: ${role.name}`);
  }
}
