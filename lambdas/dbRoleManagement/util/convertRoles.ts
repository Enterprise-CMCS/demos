import { log } from '../log'
import {Role, CDKRole} from '../types'

export function isCDKRoleArray(arr: any[]): arr is CDKRole[] {
  return Array.isArray(arr) && arr.every(item =>
    typeof item === 'object' &&
    item !== null &&
    typeof item.name === 'string' &&
    Array.isArray(item.memberships) &&
    (typeof item.systemRole === 'string' || item.systemRole === undefined))
}

export function isRoleArray(arr: any[]): arr is Role[] {
  return Array.isArray(arr) && arr.every(item =>
    typeof item === 'object' &&
    item !== null &&
    typeof item.name === 'string' &&
    Array.isArray(item.memberships) &&
    (typeof item.systemRole === 'boolean' || item.systemRole === undefined))
}

export function convertRoles(roles: any[]): Role[] {
  if (isCDKRoleArray(roles)) {
    return roles.map(r => ({...r, systemRole: r.systemRole === "true"}))
  }

  if (isRoleArray(roles)) {
    return roles
  }

  log.error(roles, "invalid roles submitted")
  throw new Error("invalid roles submitted")
}
