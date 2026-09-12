import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { type MigrationExam } from './config.js';
import { buildPlan, createReport, loadSourceBatches, loadTaxonomy } from './transform.js';

async function main() {
  const exam = (process.argv.includes('--exam') ? process.argv[process.argv.indexOf('--exam') + 1] : 'neet-pg') as MigrationExam;
  if (!['neet-pg', 'upsc-cms'].includes(exam)) throw new Error(`Unsupported exam: ${exam}`);
  const items = buildPlan(await loadSourceBatches(exam), loadTaxonomy(), exam);
  const report = createReport(items);
  const errors: string[] = [];
  for (const item of items) {
    if (item.question.options.length !== 4) errors.push(`${item.publicQid}: expected 4 source options`);
    if (item.question.options.filter((option) => option.isCorrect).length !== 1) errors.push(`${item.publicQid}: expected exactly one correct source option`);
    if (!item.question.description) errors.push(`${item.publicQid}: empty source stem`);
  }
  if (report.sourceCount !== report.generatedCount || report.skippedCount || report.duplicateCount) errors.push(`count invariant failed: ${JSON.stringify(report)}`);
  const output = { ...report, errors, contentEquality: 'verified structurally from source objects; stored stem/options/correctOption are direct representations', taxonomyPolicy: 'exact name/alias matches only; unmatched chapter/topic remain null', explanations: 'omitted' };
  await mkdir(resolve(process.cwd(), 'migration-reports'), { recursive: true });
  await writeFile(resolve(process.cwd(), `migration-reports/${exam}.json`), JSON.stringify(output, null, 2) + '\n');
  console.log(JSON.stringify(output, null, 2));
  if (errors.length) process.exitCode = 1;
}
void main().catch((error) => { console.error(error); process.exitCode = 1; });
