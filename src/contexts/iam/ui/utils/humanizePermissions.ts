import type { Permission } from "@contexts/iam/domain/schemas/user/UserRole";
import { PERMISSION_LABELS } from "@contexts/iam/ui/components/user/constants";

/** Human-readable label for a single permission code (falls back to the raw code). */
export const humanizePermission = (permission: Permission): string =>
  PERMISSION_LABELS[permission] ?? permission;

/** Comma-joined human-readable labels for a list of permissions. */
export const humanizePermissions = (permissions: Permission[]): string =>
  permissions.map(humanizePermission).join(", ");
