import { index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

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
  aliases: jsonb('aliases').notNull().default([]),
  scope: text('scope'),
  includes: jsonb('includes').notNull().default([]),
  excludes: jsonb('excludes').notNull().default([]),
  overlaps: jsonb('overlaps').notNull().default([]),
  referenceSections: jsonb('reference_sections').notNull().default([]),
  estimatedTopics: integer('estimated_topics'),
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
  slug: text('slug').notNull(),
  kind: text('kind').notNull(),
  aliases: jsonb('aliases').notNull().default([]),
  scope: text('scope'),
  includes: jsonb('includes').notNull().default([]),
  excludes: jsonb('excludes').notNull().default([]),
  relatedTopics: jsonb('related_topics').notNull().default([]),
  secondarySubjects: jsonb('secondary_subjects').notNull().default([]),
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

export const studioQuestion = pgTable('studio_question', {
  id: uuid('id').defaultRandom().primaryKey(), publicQid: text('public_qid').notNull().unique(), questionNumber: integer('question_number').notNull(),
  projectId: uuid('project_id').notNull().references(() => studioProject.id, { onDelete: 'restrict' }),
  status: text('status').notNull().default('DRAFT'),
  publishedRevisionId: uuid('published_revision_id'),
  createdBy: uuid('created_by').notNull().references(() => studioProfile.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [index('studio_question_project_status_idx').on(table.projectId, table.status), uniqueIndex('studio_question_project_number_unique').on(table.projectId, table.questionNumber)]);

export const studioQuestionRevision = pgTable('studio_question_revision', {
  id: uuid('id').defaultRandom().primaryKey(), questionId: uuid('question_id').notNull().references(() => studioQuestion.id, { onDelete: 'cascade' }),
  revisionNumber: integer('revision_number').notNull(), status: text('status').notNull().default('DRAFT'), requiresMedicalReview: text('requires_medical_review').notNull().default('no'), medicalReviewedBy: uuid('medical_reviewed_by').references(() => studioProfile.id, { onDelete: 'restrict' }), medicalReviewedAt: timestamp('medical_reviewed_at', { withTimezone: true }), stem: text('stem').notNull(), correctOption: text('correct_option').notNull(),
  subjectId: uuid('subject_id').notNull().references(() => taxonomySubject.id, { onDelete: 'restrict' }),
  chapterId: uuid('chapter_id').notNull().references(() => taxonomyChapter.id, { onDelete: 'restrict' }),
  topicId: uuid('topic_id').notNull().references(() => taxonomyTopic.id, { onDelete: 'restrict' }),
  difficultyId: uuid('difficulty_id').notNull().references(() => taxonomyDifficulty.id, { onDelete: 'restrict' }),
  createdBy: uuid('created_by').notNull().references(() => studioProfile.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [index('studio_question_revision_question_idx').on(table.questionId, table.revisionNumber)]);

export const studioQuestionOption = pgTable('studio_question_option', {
  id: uuid('id').defaultRandom().primaryKey(), revisionId: uuid('revision_id').notNull().references(() => studioQuestionRevision.id, { onDelete: 'cascade' }),
  label: text('label').notNull(), content: text('content').notNull(), position: integer('position').notNull(),
}, (table) => [index('studio_question_option_revision_idx').on(table.revisionId, table.position)]);

export const studioQuestionRevisionType = pgTable('studio_question_revision_type', {
  revisionId: uuid('revision_id').notNull().references(() => studioQuestionRevision.id, { onDelete: 'cascade' }),
  questionTypeId: uuid('question_type_id').notNull().references(() => taxonomyQuestionType.id, { onDelete: 'restrict' }),
}, (table) => [primaryKey({ columns: [table.revisionId, table.questionTypeId] })]);

export const studioQuestionContributor = pgTable('studio_question_contributor', {
  id: uuid('id').defaultRandom().primaryKey(), questionId: uuid('question_id').notNull().references(() => studioQuestion.id, { onDelete: 'cascade' }),
  profileId: uuid('profile_id').notNull().references(() => studioProfile.id, { onDelete: 'restrict' }), contributionType: text('contribution_type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex('studio_question_contributor_question_profile_type_unique').on(table.questionId, table.profileId, table.contributionType)]);

export const studioQuestionAssignment = pgTable('studio_question_assignment', {
  id: uuid('id').defaultRandom().primaryKey(),
  questionId: uuid('question_id').notNull().references(() => studioQuestion.id, { onDelete: 'cascade' }),
  profileId: uuid('profile_id').notNull().references(() => studioProfile.id, { onDelete: 'restrict' }),
  assignmentType: text('assignment_type').notNull(),
  assignedBy: uuid('assigned_by').notNull().references(() => studioProfile.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex('studio_question_assignment_question_type_unique').on(table.questionId, table.assignmentType),
  index('studio_question_assignment_profile_type_idx').on(table.profileId, table.assignmentType),
]);

export const studioSavedView = pgTable('studio_saved_view', {
  id: uuid('id').defaultRandom().primaryKey(),
  profileId: uuid('profile_id').notNull().references(() => studioProfile.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  resource: text('resource').notNull().default('questions'),
  filters: jsonb('filters').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex('studio_saved_view_profile_resource_name_unique').on(table.profileId, table.resource, table.name),
  index('studio_saved_view_profile_resource_updated_idx').on(table.profileId, table.resource, table.updatedAt),
]);

export const studioAuditLog = pgTable('studio_audit_log', {
  id: uuid('id').defaultRandom().primaryKey(), projectId: uuid('project_id').references(() => studioProject.id, { onDelete: 'restrict' }),
  questionId: uuid('question_id').references(() => studioQuestion.id, { onDelete: 'cascade' }), revisionId: uuid('revision_id').references(() => studioQuestionRevision.id, { onDelete: 'cascade' }),
  actorProfileId: uuid('actor_profile_id').notNull().references(() => studioProfile.id, { onDelete: 'restrict' }), action: text('action').notNull(), metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('studio_audit_log_question_created_idx').on(table.questionId, table.createdAt)]);

export const studioMediaAsset = pgTable('studio_media_asset', {
  id: uuid('id').defaultRandom().primaryKey(), storagePath: text('storage_path').notNull().unique(), fileUrl: text('file_url').notNull(), fileName: text('file_name').notNull(), mimeType: text('mime_type').notNull(), byteSize: integer('byte_size').notNull(),
  sourceUrl: text('source_url'), creator: text('creator'), license: text('license').notNull().default('unverified'), attribution: text('attribution'), caption: text('caption'), altText: text('alt_text'),
  annotated: text('annotated').notNull().default('no'), verificationStatus: text('verification_status').notNull().default('unverified'), uploadedBy: uuid('uploaded_by').notNull().references(() => studioProfile.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [index('studio_media_asset_verification_idx').on(table.verificationStatus)]);

export const studioExplanationBlock = pgTable('studio_explanation_block', {
  id: uuid('id').defaultRandom().primaryKey(), revisionId: uuid('revision_id').notNull().references(() => studioQuestionRevision.id, { onDelete: 'cascade' }),
  blockType: text('block_type').notNull(), content: jsonb('content').notNull(), mediaAssetId: uuid('media_asset_id').references(() => studioMediaAsset.id, { onDelete: 'restrict' }), position: integer('position').notNull(), createdBy: uuid('created_by').notNull().references(() => studioProfile.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [index('studio_explanation_block_revision_position_idx').on(table.revisionId, table.position)]);

export const studioReference = pgTable('studio_reference', {
  id: uuid('id').defaultRandom().primaryKey(),
  revisionId: uuid('revision_id').notNull().references(() => studioQuestionRevision.id, { onDelete: 'cascade' }),
  sourceTitle: text('source_title').notNull(),
  sourceUrl: text('source_url').notNull(),
  citation: text('citation'),
  position: integer('position').notNull(),
  createdBy: uuid('created_by').notNull().references(() => studioProfile.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [index('studio_reference_revision_position_idx').on(table.revisionId, table.position)]);

export const studioReviewQueue = pgTable('studio_review_queue', {
  id: uuid('id').defaultRandom().primaryKey(), reviewerProfileId: uuid('reviewer_profile_id').notNull().references(() => studioProfile.id, { onDelete: 'restrict' }).unique(), name: text('name').notNull().default('My review queue'), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const studioQuestionSecondaryTopic = pgTable('studio_question_secondary_topic', {
  revisionId: uuid('revision_id').notNull().references(() => studioQuestionRevision.id, { onDelete: 'cascade' }),
  topicId: uuid('topic_id').notNull().references(() => taxonomyTopic.id, { onDelete: 'restrict' }),
  role: text('role').notNull().default('DISEASE'),
  position: integer('position').notNull().default(0),
}, (table) => [primaryKey({ columns: [table.revisionId, table.topicId] }), index('studio_question_secondary_topic_revision_idx').on(table.revisionId, table.position)]);

export const studioReviewQueueItem = pgTable('studio_review_queue_item', {
  id: uuid('id').defaultRandom().primaryKey(), queueId: uuid('queue_id').notNull().references(() => studioReviewQueue.id, { onDelete: 'cascade' }), questionId: uuid('question_id').notNull().references(() => studioQuestion.id, { onDelete: 'cascade' }), revisionId: uuid('revision_id').notNull().references(() => studioQuestionRevision.id, { onDelete: 'cascade' }), reviewerProfileId: uuid('reviewer_profile_id').notNull().references(() => studioProfile.id, { onDelete: 'restrict' }),
  status: text('status').notNull().default('ASSIGNED'), position: integer('position').notNull().default(0), assignedBy: uuid('assigned_by').notNull().references(() => studioProfile.id, { onDelete: 'restrict' }), completedAt: timestamp('completed_at', { withTimezone: true }), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [uniqueIndex('studio_review_queue_item_revision_reviewer_unique').on(table.revisionId, table.reviewerProfileId), index('studio_review_queue_item_reviewer_status_position_idx').on(table.reviewerProfileId, table.status, table.position)]);

export const studioReview = pgTable('studio_review', {
  id: uuid('id').defaultRandom().primaryKey(), questionId: uuid('question_id').notNull().references(() => studioQuestion.id, { onDelete: 'cascade' }), revisionId: uuid('revision_id').notNull().references(() => studioQuestionRevision.id, { onDelete: 'cascade' }), reviewerProfileId: uuid('reviewer_profile_id').notNull().references(() => studioProfile.id, { onDelete: 'restrict' }), decision: text('decision').notNull(), comment: text('comment'), isMedicalReview: text('is_medical_review').notNull().default('no'), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('studio_review_revision_created_idx').on(table.revisionId, table.createdAt)]);

export const studioComment = pgTable('studio_comment', {
  id: uuid('id').defaultRandom().primaryKey(), questionId: uuid('question_id').notNull().references(() => studioQuestion.id, { onDelete: 'cascade' }), revisionId: uuid('revision_id').references(() => studioQuestionRevision.id, { onDelete: 'cascade' }), parentCommentId: uuid('parent_comment_id'), body: text('body').notNull(), createdBy: uuid('created_by').notNull().references(() => studioProfile.id, { onDelete: 'restrict' }), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()), deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [index('studio_comment_question_created_idx').on(table.questionId, table.createdAt)]);

export const studioPublishEvent = pgTable('studio_publish_event', {
  id: uuid('id').defaultRandom().primaryKey(), questionId: uuid('question_id').notNull().references(() => studioQuestion.id, { onDelete: 'cascade' }), revisionId: uuid('revision_id').notNull().references(() => studioQuestionRevision.id, { onDelete: 'restrict' }), eventType: text('event_type').notNull(), status: text('status').notNull().default('PENDING'), payload: jsonb('payload').notNull(), attemptCount: integer('attempt_count').notNull().default(0), lastError: text('last_error'), deliveredAt: timestamp('delivered_at', { withTimezone: true }), createdBy: uuid('created_by').notNull().references(() => studioProfile.id, { onDelete: 'restrict' }), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [index('studio_publish_event_status_created_idx').on(table.status, table.createdAt)]);
