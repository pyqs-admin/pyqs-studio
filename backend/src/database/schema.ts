import { index, integer, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

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

export const taxonomySubject = pgTable('taxonomy_subject', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  status: text('status').notNull().default('active'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [index('taxonomy_subject_status_sort_idx').on(table.status, table.sortOrder)]);

export const taxonomyChapter = pgTable('taxonomy_chapter', {
  id: uuid('id').defaultRandom().primaryKey(),
  subjectId: uuid('subject_id').notNull().references(() => taxonomySubject.id, { onDelete: 'restrict' }),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  status: text('status').notNull().default('active'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [index('taxonomy_chapter_subject_status_sort_idx').on(table.subjectId, table.status, table.sortOrder)]);

export const taxonomyTopic = pgTable('taxonomy_topic', {
  id: uuid('id').defaultRandom().primaryKey(),
  chapterId: uuid('chapter_id').notNull().references(() => taxonomyChapter.id, { onDelete: 'restrict' }),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  status: text('status').notNull().default('active'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [index('taxonomy_topic_chapter_status_sort_idx').on(table.chapterId, table.status, table.sortOrder)]);

export const taxonomyDifficulty = pgTable('taxonomy_difficulty', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  status: text('status').notNull().default('active'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [index('taxonomy_difficulty_status_sort_idx').on(table.status, table.sortOrder)]);

export const taxonomyQuestionType = pgTable('taxonomy_question_type', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  status: text('status').notNull().default('active'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [index('taxonomy_question_type_status_sort_idx').on(table.status, table.sortOrder)]);

export const taxonomyExam = pgTable('taxonomy_exam', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  status: text('status').notNull().default('active'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [index('taxonomy_exam_status_sort_idx').on(table.status, table.sortOrder)]);

export const studioProject = pgTable('studio_project', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  examId: uuid('exam_id').notNull().references(() => taxonomyExam.id, { onDelete: 'restrict' }),
  year: integer('year').notNull(),
  session: text('session'),
  status: text('status').notNull().default('active'),
  templateCode: text('template_code').notNull().default('standard_4_option_mcq'),
  targetQuestionCount: integer('target_question_count'),
  deadline: timestamp('deadline', { withTimezone: true }),
  projectLeadProfileId: uuid('project_lead_profile_id').references(() => studioProfile.id, { onDelete: 'restrict' }),
  createdBy: uuid('created_by').notNull().references(() => studioProfile.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('studio_project_exam_year_session_idx').on(table.examId, table.year, table.session),
  index('studio_project_status_idx').on(table.status),
  index('studio_project_created_by_idx').on(table.createdBy),
]);

export const studioProjectMember = pgTable('studio_project_member', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => studioProject.id, { onDelete: 'cascade' }),
  profileId: uuid('profile_id').notNull().references(() => studioProfile.id, { onDelete: 'restrict' }),
  projectRole: text('project_role').notNull(),
  status: text('status').notNull().default('active'),
  addedBy: uuid('added_by').notNull().references(() => studioProfile.id, { onDelete: 'restrict' }),
  joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('studio_project_member_project_status_idx').on(table.projectId, table.status),
  index('studio_project_member_profile_status_idx').on(table.profileId, table.status),
]);
