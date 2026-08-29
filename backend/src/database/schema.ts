import { index, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const studioProfile = pgTable('studio_profile', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  displayName: text('display_name').notNull(),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('studio_profile_status_idx').on(table.status),
]);

export const studioRole = pgTable('studio_role', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const studioPermission = pgTable('studio_permission', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const studioProfileRole = pgTable('studio_profile_role', {
  profileId: uuid('profile_id').notNull().references(() => studioProfile.id, { onDelete: 'restrict' }),
  roleId: uuid('role_id').notNull().references(() => studioRole.id, { onDelete: 'restrict' }),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.profileId, table.roleId] }),
  index('studio_profile_role_role_id_idx').on(table.roleId),
]);

export const studioRolePermission = pgTable('studio_role_permission', {
  roleId: uuid('role_id').notNull().references(() => studioRole.id, { onDelete: 'cascade' }),
  permissionId: uuid('permission_id').notNull().references(() => studioPermission.id, { onDelete: 'cascade' }),
}, (table) => [
  primaryKey({ columns: [table.roleId, table.permissionId] }),
  index('studio_role_permission_permission_id_idx').on(table.permissionId),
]);

export const studioProfilePermission = pgTable('studio_profile_permission', {
  profileId: uuid('profile_id').notNull().references(() => studioProfile.id, { onDelete: 'restrict' }),
  permissionId: uuid('permission_id').notNull().references(() => studioPermission.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.profileId, table.permissionId] }),
  index('studio_profile_permission_permission_id_idx').on(table.permissionId),
]);
