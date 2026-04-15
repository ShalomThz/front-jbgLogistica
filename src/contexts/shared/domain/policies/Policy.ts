import type { UserPrimitives } from "@contexts/iam/domain/schemas/user/User";
import type { Permission } from "@contexts/iam/domain/schemas/user/UserRole";
import type { UserType } from "@contexts/iam/domain/schemas/user/User";

export type Policy = (user: UserPrimitives) => boolean;

export const hasAll =
  (...permissions: Permission[]): Policy =>
  (user) => {
    const set = new Set(user.role.permissions);
    return permissions.every((p) => set.has(p));
  };

export const hasAny =
  (...permissions: Permission[]): Policy =>
  (user) => {
    const set = new Set(user.role.permissions);
    return permissions.some((p) => set.has(p));
  };

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
