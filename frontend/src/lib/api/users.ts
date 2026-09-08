import { listPermissions as listPermissionsAction, listRoles as listRolesAction, listUsersWithAccess as listUsersWithAccessAction, setUserPermissions as setUserPermissionsAction, setUserRoles as setUserRolesAction, setUserStatus as setUserStatusAction } from "@/actions/users";
import { callAction } from "./client";

export type StudioRole = { id: string; code: string; name: string; permissions: string[] };
export type StudioPermission = { id: string; code: string; name: string };
export type StudioUserWithAccess = { id: string; email: string; displayName: string; status: string; roles: string[]; directPermissions: string[] };

export const getRoles = () => callAction<StudioRole[]>(listRolesAction());
export const getPermissions = () => callAction<StudioPermission[]>(listPermissionsAction());
export const getUsersWithAccess = () => callAction<StudioUserWithAccess[]>(listUsersWithAccessAction());
export const setUserRoles = (profileId: string, roles: string[]) => callAction<void>(setUserRolesAction(profileId, { roles }));
export const setUserPermissions = (profileId: string, permissions: string[]) => callAction<void>(setUserPermissionsAction(profileId, { permissions }));
export const setUserStatus = (profileId: string, status: "active" | "inactive") => callAction<void>(setUserStatusAction(profileId, { status }));
