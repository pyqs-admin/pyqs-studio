# pyqs-content-studio docs vs. actual studio implementation

This file compares the product and feature descriptions in `pyqs-content-studio/`
(`07-content-studio/DEVELOPER.md`, `STUDIO.md`, `PLAN.md`, `MEDRAG.md`, `AI-PLAN.md`,
`AUDIT-BACKLOG.md`, `schema/README.md`, `README-FIRST.md`) with what the actual
`backend/` and `frontend/` in this repository implement. Stack/tech differences are
deliberately out of scope here — this covers product behaviour, features and frontend
design only.

## TL;DR

| | Dev docs (`pyqs-content-studio/`) | Actual (`backend/` + `frontend/`) |
|---|---|---|
| Roles | Fixed: owner / admin / tutor | DB roles: admin, tutor, reviewer, medical_reviewer, explanation_editor + per-permission codes |
| Structure | Papers → printed sections → questions | Projects → taxonomy subjects → questions → revisions |
| Question model | One record, optimistic lock | Question + versioned revisions, medical-review gate |
| Statuses | DRAFT → NEEDS_EXPLANATION → EXPLANATION_DRAFTED → IN_REVIEW → APPROVED → PUBLISHED | DRAFT → QUESTION_SUBMITTED → NEEDS_EXPLANATION → RAG_EXPORTED → RAG_IMPORTED → EXPLANATION_READY → UNDER_REVIEW → CHANGES_REQUESTED / APPROVED → PUBLISHED (+ ARCHIVED) |
| Explanation | One TinyMCE rich-text document | Structured explanation blocks + separate references |
| Review | Admin approves after checks pass | Assigned review queues, threaded comments, mandatory medical review |
| Publishing | JSON export the site upserts | Signed webhook events with retry, explicit unpublish |
| Taxonomy | Read-only Master Index JSON, owner-only alias edits | Full admin CRUD on subjects/chapters/topics in the database |
| MedRAG | Owner-only offline desk, .docx round trip, review-note flags | Deferred; only status placeholders remain |
| Import | .docx and JSON exchange import | None |
| Media | Local uploads, watermarked per viewer, SVG refused | Library with licence verification workflow, no watermarking |
| Security UX | TOTP 2FA, step-up, session binding, watermark marks | Supabase auth; none of the in-app controls |
| Design | PYQS design kit: #2e93ff, 2px borders, flat shadows, DM Sans, mascot, light/dark | Plain Tailwind slate, no kit, no mascot, no theme toggle |

## 1. Roles and permissions

**Docs**: three fixed roles — owner (one account, moved only via CLI), admin, tutor.
Tutor sees own papers plus sections an admin assigned; admin can't touch the owner;
only the owner runs the MedRAG desk, gets document downloads, and edits Index aliases.

**Actual**: roles are database records seeded as admin, tutor, reviewer,
medical_reviewer, explanation_editor, combined with fine-grained permission codes
(e.g. `project.create`, `question.review`, `medical.review`, `question.publish`,
`explanation.edit`, `media.upload`, `taxonomy.manage`, `users.manage`, `audit.view_all`)
assignable per profile. There is no owner role.

**Change**: the owner's exclusive powers (MedRAG desk, downloads, Index editing) have no
equivalent; authority is split into granular permissions. New roles that didn't exist:
reviewer, medical_reviewer, explanation_editor.

## 2. Structure: papers vs. projects

**Docs**: a paper is one sitting of one exam; its sections are the subjects as printed
(19 for NEET family, 5 for UPSC CMS); the question's subject derives from its topic and
can differ from the printed section (recorded as `exam_subject_label`).

**Actual**: a project (name, exam, year, session, target question count, deadline, lead)
contains questions organised under taxonomy subjects (subject → chapter → topic). There
are no printed sections and no `exam_subject_label` concept — the subject is a direct
field on the question revision.

**Change**: printed-section model replaced by taxonomy subjects; project metadata
(target count, deadline, lead) is new.

## 3. Question model

**Docs**: one question row with stem, options, answer, one topic (subject/chapter
derived), up to three secondary topics with roles, question type + optional second type,
presentation, difficulty with an A/B/C/D rubric and optional rationale, one explanation
document, private notes box, MedRAG flags. Optimistic lock via `version`; soft delete.
Autosave ~1 s after last keystroke.

**Actual**: a question header (public_qid, status, published revision) plus numbered
**revisions**. Each revision carries stem, correctOption, subject/chapter/topic/
difficulty references, question types, options (A–D), and `requiresMedicalReview` with
medical reviewer + timestamp. Editing only happens on a DRAFT revision; "new revision"
copies the previous one. No secondary topics, presentation, difficulty rubric,
rationale, notes box, or MedRAG flags.

**Change**: single editable record → versioned revision workflow; dropped secondary
topics/presentation/rubric/notes; added public_qid and the medical-review flag.

## 4. Status workflow

**Docs**: DRAFT → NEEDS_EXPLANATION → EXPLANATION_DRAFTED → IN_REVIEW → APPROVED →
PUBLISHED. Approval and publishing require zero blocking checks and an admin; approved
questions are edited by admins only.

**Actual**: DRAFT → QUESTION_SUBMITTED → NEEDS_EXPLANATION → RAG_EXPORTED →
RAG_IMPORTED → EXPLANATION_READY → UNDER_REVIEW → (CHANGES_REQUESTED back to editable)
or APPROVED → PUBLISHED; plus ARCHIVED. Submission is an explicit action; review
decisions are approve / request-changes on an assigned queue; a revision flagged
`requiresMedicalReview = yes` can only be approved by a medical reviewer; archiving a
published question is blocked until unpublished.

**Change**: longer ladder with explicit submit and changes-requested; explanation and
review stages split into RAG placeholders + UNDER_REVIEW; new medical-review gate and
archive state.

## 5. Explanations

**Docs**: one rich-text document per question (headings, lists, tables, figures, paste
from Word, spellcheck, find/replace, focus mode, keyboard shortcuts); "why the other
options are wrong", educational objective and references live as headings inside the
same document; every picture carries a source link and licence; a private notes box for
tutors/admins never exported.

**Actual**: explanations are ordered **structured blocks** — paragraph, heading,
bullet_list, numbered_list, image, table, high_yield_callout, other_options,
educational_objective, references — with references kept in their own list
(source title, URL, citation). Blocks can be added, reordered, deleted; an image block
picks an asset from the media library; a student preview renders the assembled
document. Only draft revisions are editable.

**Change**: free-form document → structured blocks; references promoted to their own
fields; other-options/objective became block types; notes box removed.

## 6. MedRAG round trip

**Docs** (MEDRAG.md): owner-only Explanations desk. Per-section `.docx` batches with
numbered questions as the join key; return matching guarded by stem; MedRAG Review Note
lines become structured flags (`!! VERIFY MARKED ANSWER`, `!! VERIFY ANSWER`,
`!! CONTROVERSIAL`, `GENERATED`, `AUTO-ESCALATED`, `VERIFY —`, `INFO —`) that block
approval until a human presses "I have reviewed this"; model per batch recorded;
tutors press "Ask for a new explanation" with a reason.

**Actual**: no MedRAG integration at all. The status enum reserves RAG_EXPORTED /
RAG_IMPORTED, and the frontend README states RAG "remains intentionally deferred".
No desk, no batches, no flags, no ask-again reason.

**Change**: entire desk and file round trip removed/deferred; only placeholder statuses
remain.

## 7. Review and collaboration

**Docs**: approval/publish are admin actions gated by checks; the question panel shows
history, created-by / last-edited-by / also-edited-by collaborators; Admin → Activity
log shows everything with who/when/IP.

**Actual**: a review subsystem — per-reviewer queues, assignment of question revisions
to reviewers, ordered queue navigation with skip, approve / request-changes (with a
required comment), threaded comments on questions (author-only edit/delete, soft
delete), audit rows per decision, and contributor records. Dashboard surfaces "My
drafts", "Changes requested", "Waiting for review" counts.

**Change**: ad-hoc admin approval → queues, assignments, comments; contributors tracked
per question; "also edited by" replaced by explicit contributor records.

## 8. Publishing

**Docs**: "Publish payload — approved" JSON export that the site's endpoint upserts on
`question_id`; also RAG/JSON exports, backups, owner-only Markdown.

**Actual**: publish events with a payload snapshot and status (PENDING/DELIVERED/
FAILED/SKIPPED), delivered via a signed outbound webhook with retry; endpoints for
student preview, publish-ready list, single publish, bulk publish, unpublish, retry.
A dedicated "Publishing" workspace lists approved questions ready to publish.

**Change**: export files → webhook event pipeline; unpublish is explicit; no backup or
Markdown export.

## 9. Taxonomy and the Index

**Docs**: the whole Master Index readable at `#/index` like the reference site
(subject rail, chapters, per-topic scope/includes/excludes); search over names, aliases,
includes, abbreviations; the full index never leaves the server; only the owner edits,
and only aliases, after a 30-minute unlock + step-up; edits written back to JSON files
byte-stably; unique-code guard on load.

**Actual**: taxonomy is fully manageable in the database — create/update subjects,
chapters, topics, difficulties, exams and question types behind `taxonomy.manage`.
Read APIs list all of these for dropdowns. No Index browser view, no alias editing, no
unlock window, no server-side-only search protection (the frontend fetches full
taxonomy lists).

**Change**: read-mostly Master Index with owner-only alias edits → full admin CRUD;
Index browsing/editing UI removed; scope/includes/excludes metadata not represented.

## 10. Media

**Docs**: uploads re-encoded, SVG refused, served only to signed-in users; pictures
watermarked with the viewer's name/email (owner excluded); source/licence per picture.

**Actual**: a media library where uploads are registered with fileName, mimeType,
source URL, creator, licence, attribution, caption, alt text, an `annotated` flag and a
`verificationStatus` (unverified / verified / rejected) workflow. Explanation image
blocks pick from this library. No re-encoding, SVG ban, signed-in-only serving or
watermarking.

**Change**: watermark/deterrence model → licence-verification library; caption/alt
text/attribution fields added.

## 11. Import / export

**Docs**: import a `.docx` of questions (preview + commit, figures extracted, headings
file sections, auto-tagging with flags); owner-only JSON exchange import; exports for
RAG, publish payload, backup, Markdown.

**Actual**: no import of any kind. No document or JSON imports, no exports beyond the
publish webhook payloads.

**Change**: all import/export document flows removed.

## 12. Security-related product behaviour

**Docs**: in-app security UX — scrypt password policy, TOTP second factor with recovery
codes, 10-minute step-up re-auth before downloads/people/exams/Index edits, sessions
bound to device (and network for tutors), idle/time expiry, invisible zero-width marks
in question text and watermarked pictures to trace leaks, browser deterrence (no print/
drag/copy), rate limits, CSP, full audit with IPs (admins only).

**Actual**: authentication handled externally (Supabase); the API enforces profile
activation + permissions and logs actions to an audit table. None of the in-app
controls exist: no 2FA setup screens, no step-up dialogs, no session binding UI, no
watermarks/marks, no print/copy deterrence, no tutor read-metering (150 questions/10 min
lockout).

**Change**: product-level security features (2FA, step-up, traceability, deterrence)
not carried over; the attack-surface hardening documented in AUDIT-BACKLOG.md applies
only to the reference server.

## 13. AI checks (AI-PLAN.md)

**Docs**: a plan (explicitly not built) for seven AI checks — blind key verification
with escalation, stem/option quality, duplicate detection via embeddings, tag
suggestions, explanation QA, image checks, paper-level consistency — shown as an "AI
review" group in the Checks panel with Accept/Dismiss/Ask-again, plus an Admin › AI
screen.

**Actual**: not built, same as the docs. No AI flags, checks, or admin AI screen.

**Change**: none — planned in both, absent in both.

## 14. Frontend design

**Docs**: a single-page app with hash routes (`#/papers`, `#/paper/:id`, `#/index`,
`#/rag`…), built on the **PYQS design kit**: one accent `#2e93ff` only, 2px borders on
every card/button/input/pill, flat `0 4px 0` shadows with press physics, DM Sans at
−0.5px tracking, kit radii, lucide icons in blue chips, penguin mascot on empty states
and sign-in, light/dark theme toggle remembered per browser (dark flips neutrals only),
sentences case, no emoji. Editor is a dedicated page with sticky toolbar, quick
toolbar on selection, ⌘B/⌘I/⌘K, spellcheck, find/replace, focus mode, autosave with
last-saved time.

**Actual**: a multi-page app (Dashboard, Projects, project subjects, question editor,
question explanation, Review queue, Review item, Publishing, Users, Sign-in) with a
sidebar shell, top search bar with ⌘K, and plain Tailwind styling — slate palette,
white cards, 1px borders, no accent colour system, no design-kit tokens, no mascot, no
light/dark toggle, no press-physics shadows. The question editor is a plain form
(stem textarea, A–D options with correct radio, taxonomy selects) with Ctrl/Cmd+S save,
Ctrl/Cmd+Enter submit, and 1s autosave; the explanation editor is a block list with
up/down/delete controls and a Preview button.

**Change**: PYQS kit + mascot + theming dropped for default Tailwind; hash-route SPA
structure replaced by separate pages; TinyMCE document page replaced by form + block
list.

## 15. Summary of product/feature changes (docs → implementation)

1. Roles: owner/admin/tutor → DB roles + granular permissions; added reviewer,
   medical_reviewer, explanation_editor.
2. Structure: papers/printed sections → projects/taxonomy subjects.
3. Questions: single record → versioned revisions with medical-review gate; dropped
   secondary topics, presentation, difficulty rubric, notes.
4. Statuses: 6-step → 11-step ladder with submit, changes-requested, archive, RAG
   placeholders.
5. Explanations: one rich-text document → structured blocks + references list.
6. Review: admin approval → assigned queues, comments, mandatory medical review.
7. Publishing: JSON export → signed webhook events with retry and unpublish.
8. Taxonomy: read-only Index + owner alias edits → full admin CRUD; Index browser
   removed.
9. MedRAG desk: removed/deferred.
10. Import/export documents: removed.
11. Media: watermarks/deterrence → licence-verification library.
12. Security UX (2FA, step-up, session binding, marks, metering): not carried over.
13. Frontend design: PYQS kit, mascot, themes → plain Tailwind slate, multi-page shell.
