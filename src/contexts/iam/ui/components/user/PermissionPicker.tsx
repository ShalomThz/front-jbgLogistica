import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Checkbox, Label } from "@contexts/shared/shadcn";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import type { Permission } from "../../../domain/schemas/user/UserRole";
import { PERMISSION_LABELS, PERMISSION_GROUPS } from "./constants";

interface Props {
  selected: Permission[];
  onChange: (permissions: Permission[]) => void;
  idPrefix: string;
}

export function PermissionPicker({ selected, onChange, idPrefix }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    // Auto-expand groups that have at least one selected permission
    const initial = new Set<string>();
    for (const group of PERMISSION_GROUPS) {
      if (group.permissions.some((p) => selected.includes(p))) {
        initial.add(group.label);
      }
    }
    return initial;
  });

  const toggle = (permission: Permission) => {
    onChange(
      selected.includes(permission)
        ? selected.filter((p) => p !== permission)
        : [...selected, permission],
    );
  };

  const toggleGroup = (groupPermissions: Permission[]) => {
    const allSelected = groupPermissions.every((p) => selected.includes(p));
    if (allSelected) {
      onChange(selected.filter((p) => !groupPermissions.includes(p)));
    } else {
      const toAdd = groupPermissions.filter((p) => !selected.includes(p));
      onChange([...selected, ...toAdd]);
    }
  };

  const toggleExpanded = (label: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  return (
    <div className="rounded-md border divide-y">
      {PERMISSION_GROUPS.map((group) => {
        const isOpen = expanded.has(group.label);
        const selectedCount = group.permissions.filter((p) =>
          selected.includes(p),
        ).length;
        const allSelected = selectedCount === group.permissions.length;
        const someSelected = selectedCount > 0 && !allSelected;
        const Icon = group.icon;

        return (
          <div key={group.label}>
            <div
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleExpanded(group.label)}
            >
              <ChevronRight
                className={cn(
                  "size-4 text-muted-foreground shrink-0 transition-transform duration-200",
                  isOpen && "rotate-90",
                )}
              />
              <Checkbox
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={() => toggleGroup(group.permissions)}
                onClick={(e) => e.stopPropagation()}
                className="shrink-0"
              />
              <Icon className="size-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium flex-1">{group.label}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {selectedCount}/{group.permissions.length}
              </span>
            </div>

            {isOpen && (
              <div className="pb-2 px-3 pl-[3.25rem] grid grid-cols-2 gap-x-2 gap-y-1">
                {group.permissions.map((permission) => (
                  <div key={permission} className="flex items-center gap-1.5">
                    <Checkbox
                      id={`${idPrefix}-${permission}`}
                      checked={selected.includes(permission)}
                      onCheckedChange={() => toggle(permission)}
                      className="shrink-0"
                    />
                    <Label
                      htmlFor={`${idPrefix}-${permission}`}
                      className="cursor-pointer text-sm font-normal truncate"
                    >
                      {PERMISSION_LABELS[permission]}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
