export const staffRoles = ["admin", "editor"] as const;

export type StaffRole = (typeof staffRoles)[number];

export function isStaffRole(role: string | null | undefined): role is StaffRole {
  return role === "admin" || role === "editor";
}
