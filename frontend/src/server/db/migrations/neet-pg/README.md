# Exam question migrations

This migration is deliberately source-driven: it imports the existing PYQS TypeScript seed modules at runtime and does not hand-copy question content. The same `buildPlan`/`MigrationItem` pipeline supports NEET PG and UPSC CMS through exam-specific batch and ID configuration.

## Mapping

| PYQS source | Studio destination | Rule |
| --- | --- | --- |
| `description` | revision `stem` | Direct copy; no cleanup |
| option `text` | option `content` | Direct copy, including the original `A)`/`B)` prefixes |
| option `isCorrect` | revision `correctOption` | Source option position becomes A–D |
| subject name | taxonomy subject | Explicit spelling map to existing Studio subject |
| `chapter` | taxonomy chapter | Exact name/alias match only; otherwise `null` |
| `microTopics` | taxonomy topic | Unique exact name/alias match only; otherwise `null` |
| `difficulty[0]` | difficulty taxonomy | Existing code match; Studio medium fallback only when source value is absent |
| `questionType[]` | revision question types | Explicit source-code map; single-best-answer fallback only when source type is absent/unmapped |
| year/set/subject/ordinal | `publicQid` | Deterministic source traceability key |
| title/images/references/tags/pages | import audit metadata | Preserved as source metadata; no explanation or guessed media/reference records |
| source `solution` | omitted | Explanations are intentionally not migrated |

Imported questions remain `DRAFT`, because the Studio workflow requires review and explanation work before publishing.

The seed processes 50 questions per transaction. Each batch logs start/completion progress and cumulative inserted/existing counts; a failed batch rolls back as a unit.

Run `pnpm validate:neet-pg-migration` and `pnpm seed:neet-pg` for NEET PG, or `pnpm validate:upsc-cms-migration` and `pnpm seed:upsc-cms` for UPSC CMS. Each writes a separate report under `migration-reports/`. Apply the nullable-taxonomy migration and normal Studio taxonomy seed first.
