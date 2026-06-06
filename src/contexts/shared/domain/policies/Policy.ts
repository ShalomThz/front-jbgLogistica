import type { UserListViewPrimitives } from "@contexts/iam/domain/schemas/user/User";
import type { Permission } from "@contexts/iam/domain/schemas/user/UserRole";
import type { UserType } from "@contexts/iam/domain/schemas/user/User";

export type PolicyMode = "all" | "any";

export interface PolicyMeta {
  /** Permissions evaluated by this policy. Empty for non-permission policies. */
  permissions: Permission[];
  /** "all" → user must have every permission; "any" → at least one. */
  mode: PolicyMode;
}

export type Policy = ((user: UserListViewPrimitives) => boolean) & Partial<PolicyMeta>;

const attachMeta = (
  fn: (user: UserListViewPrimitives) => boolean,
  meta: PolicyMeta,
): Policy => Object.assign(fn, meta);

export const hasAll = (...permissions: Permission[]): Policy =>
  attachMeta(
    (user) => {
      const set = new Set(user.role.permissions);
      return permissions.every((p) => set.has(p));
    },
    { permissions, mode: "all" },
  );

export const hasAny = (...permissions: Permission[]): Policy =>
  attachMeta(
    (user) => {
      const set = new Set(user.role.permissions);
      return permissions.some((p) => set.has(p));
    },
    { permissions, mode: "any" },
  );

export const isUserType =
  (...types: UserType[]): Policy =>
  (user) =>
    types.includes(user.type ?? "EMPLOYEE");

export const allOf =
  (...policies: Policy[]): Policy =>
  (user) =>
    policies.every((p) => p(user));

export const anyOf =
  (...policies: Policy[]): Policy =>
  (user) =>
    policies.some((p) => p(user));

/**
 * Returns the permissions a failing policy required but the user doesn't have.
 * Empty when the policy carries no permission metadata (composed policies,
 * isUserType, etc.) — callers should fall back to a generic message.
 */
export const missingPermissions = (
  policy: Policy,
  user: UserListViewPrimitives,
): Permission[] => {
  if (!policy.permissions || policy.permissions.length === 0) return [];
  const set = new Set(user.role.permissions);
  return policy.permissions.filter((p) => !set.has(p));
};
