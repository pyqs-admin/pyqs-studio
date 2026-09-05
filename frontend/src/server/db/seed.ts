import { eq } from "drizzle-orm";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";

import { closeDb, db } from "./client";
import { seedTaxonomy } from "./seed-taxonomy";
import { studioPermission, studioProfile, studioProfileRole, studioRole, studioRolePermission, taxonomyDifficulty, taxonomyExam, taxonomyQuestionType } from "./schema";

const exams = ["NEET PG", "UPSC CMS", "FMGE", "INI-CET"];
const questionTypes = [
  "Single Best Answer",
  "Clinical Reasoning",
  "Assertion Reason",
  "Image Based",
  "Match the Following",
  "Direct Recall",
  "Conceptual",
  "Clinical Diagnosis",
  "Clinical Management",
  "Numerical",
  "Mechanism of Action",
  "Classification and Staging",
  "Staging",
  "Side Effects",
  "Clinical Complications",
  "Clinical Correlation",
  "Clinical-Pathological Correlation",
  "Clinical Genetic Correlation",
  "Clinical Physiology",
  "Clinical Syndromes",
  "Clinical Finding",
  "Clinical Diagnosis & Management",
  "Biochemical Correlation",
  "Graph Based",
  "Instruments",
  "Named Tests",
  "Treatment Protocol",
];
const permissions = ["project.create", "project.view_all", "project.manage_all", "project.manage_members", "question.create", "question.edit", "question.view_all", "question.review", "question.publish", "review.assign", "review.view_all", "medical.review", "explanation.edit", "media.view", "media.upload", "media.edit", "media.delete", "taxonomy.manage", "audit.view_all", "users.manage"];
const roles: Record<string, string[]> = { admin: permissions, tutor: ["project.create", "question.create", "question.edit", "explanation.edit", "media.view", "media.upload"], reviewer: ["question.review", "media.view"], medical_reviewer: ["question.review", "medical.review", "media.view"], explanation_editor: ["explanation.edit", "media.view", "media.upload"] };
const code = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

async function ensure<T extends { id: string }>(table: PgTable, values: { code: string; name: string; sortOrder?: number }, column: AnyPgColumn): Promise<T> { await db.insert(table).values(values as never).onConflictDoNothing(); const [row] = await db.select().from(table).where(eq(column, values.code)).limit(1); if (!row) throw new Error(`Could not seed ${values.code}`); return row as T; }
async function main() {
  const permissionRows = new Map<string, { id: string }>();
  for (const item of permissions) permissionRows.set(item, await ensure(studioPermission, { code: item, name: item.replaceAll(".", " ") }, studioPermission.code));
  for (const [roleCode, rolePermissions] of Object.entries(roles)) { const role = await ensure<{ id: string }>(studioRole, { code: roleCode, name: roleCode.replaceAll("_", " ") }, studioRole.code); for (const permission of rolePermissions) await db.insert(studioRolePermission).values({ roleId: role.id, permissionId: permissionRows.get(permission)!.id }).onConflictDoNothing(); }
  for (const [index, name] of exams.entries()) await ensure(taxonomyExam, { code: code(name), name, sortOrder: index + 1 }, taxonomyExam.code);
  for (const [index, name] of ["Easy", "Medium", "Hard"].entries()) await ensure(taxonomyDifficulty, { code: code(name), name, sortOrder: index + 1 }, taxonomyDifficulty.code);
  for (const [index, name] of questionTypes.entries()) await ensure(taxonomyQuestionType, { code: code(name), name, sortOrder: index + 1 }, taxonomyQuestionType.code);
  await seedTaxonomy();
  const adminId = process.env.STUDIO_INITIAL_ADMIN_ID; const adminEmail = process.env.STUDIO_INITIAL_ADMIN_EMAIL; const adminName = process.env.STUDIO_INITIAL_ADMIN_NAME;
  if (adminId && adminEmail && adminName) { await db.insert(studioProfile).values({ id: adminId, email: adminEmail, displayName: adminName, status: "active" }).onConflictDoNothing(); const [adminRole] = await db.select().from(studioRole).where(eq(studioRole.code, "admin")); if (adminRole) await db.insert(studioProfileRole).values({ profileId: adminId, roleId: adminRole.id }).onConflictDoNothing(); console.log(`Provisioned initial admin ${adminEmail}.`); } else console.log("No initial admin provisioned. Set STUDIO_INITIAL_ADMIN_ID, STUDIO_INITIAL_ADMIN_EMAIL, and STUDIO_INITIAL_ADMIN_NAME after creating that user in Studio Supabase Auth.");
  console.log("Studio seed completed.");
}
void main().finally(closeDb).catch((error) => { console.error(error); process.exitCode = 1; });
