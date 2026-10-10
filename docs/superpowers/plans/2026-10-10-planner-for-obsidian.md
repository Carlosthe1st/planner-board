# Planner for Obsidian Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public Obsidian plugin that turns one Markdown note into a Microsoft-Planner-style board with first-class task completion.

**Architecture:** The plugin owns one Markdown grammar: YAML frontmatter identifies a plan, H2 headings define ordered columns, and task list items define cards. A parser/serializer forms the single gateway for reading and writing plan notes. A workspace leaf renders the board, dispatches all edits through a validated update service, and re-renders after vault changes.

**Tech Stack:** TypeScript, Obsidian Plugin API, esbuild, Vitest, jsdom, CSS custom properties.

**Spec:** `docs/superpowers/specs/2026-10-10-planner-for-obsidian-design.md`

## Global Constraints

- Support Obsidian desktop and mobile; do not use Node.js or Electron APIs.
- Store every plan in one human-readable Markdown note; do not create a parallel database.
- Do not transmit task data, use telemetry, or rely on external services.
- Completion is a task state, not a special column; preserve the previous column when completing.
- Invalid or concurrently changed plan notes must never be overwritten automatically.
- Ship only the first-version scope in the spec; no accounts, sync, assignees, attachments, comments, notifications, calendar, or statistics.
- Use a unique plugin ID that does not contain `obsidian`; use `planner-board` unless the Community directory reports it is unavailable.

## Review Focus

- A title containing Markdown punctuation must round-trip without producing a broken task or link; covered in Task 2.
- A manually edited note with duplicate card IDs must be rejected rather than silently merging cards; covered in Task 2.
- A card completed from any column must restore to that exact column and relative position when reopened; covered in Task 3.
- A vault change between rendering and saving must surface a conflict and preserve the newer note; covered in Task 4.
- A due date with an invalid calendar value or timezone suffix must be displayed as absent and must not make the board crash; covered in Task 2 and Task 5.

---

## File Structure

- `package.json`: build, test, release, and dependency definitions.
- `manifest.json`: public Obsidian plugin metadata.
- `esbuild.config.mjs`: builds `src/main.ts` to `main.js`.
- `src/main.ts`: plugin lifecycle, commands, view registration, and vault event wiring.
- `src/domain/types.ts`: stable plan, column, card, and result types.
- `src/markdown/plan-format.ts`: Markdown grammar, parser, serializer, and validation.
- `src/services/plan-service.ts`: load, compare, update, and save plan files.
- `src/views/board-view.ts`: board leaf and UI event handling.
- `src/views/card-modal.ts`: accessible modal for creating and editing a card.
- `src/views/filters.ts`: pure search/filter predicates.
- `styles.css`: responsive board styling using Obsidian CSS variables.
- `tests/markdown/plan-format.test.ts`: unit tests for parsing, serializing, and malformed files.
- `tests/services/plan-service.test.ts`: unit tests for update and conflict behavior.
- `tests/views/filters.test.ts`: unit tests for visible-card selection.
- `README.md`: installation, Markdown grammar, usage, privacy, and beta instructions.
- `LICENSE`: MIT license text.
- `.github/workflows/release.yml`: validates, builds, and uploads release assets for version tags.

## Task 1: Bootstrap a mobile-compatible Obsidian plugin

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `esbuild.config.mjs`
- Create: `manifest.json`
- Create: `src/main.ts`
- Create: `styles.css`
- Create: `.gitignore`
- Create: `LICENSE`

**Interfaces:**
- Produces `PlannerBoardPlugin`, which Task 4 extends with a `PlanService` and Task 5 extends with the board view.
- Produces scripts: `npm run build`, `npm test`, `npm run lint`, and `npm run version`.

- [ ] **Step 1: Initialise the repository and project manifest**

Run:

```bash
git init
npm init -y
npm install --save-dev typescript esbuild vitest jsdom @types/node
npm install --save obsidian
```

Then replace the generated manifest so the package scripts are:

```json
{
  "scripts": {
    "build": "node esbuild.config.mjs production",
    "dev": "node esbuild.config.mjs",
    "test": "vitest run",
    "lint": "tsc --noEmit",
    "version": "node version-bump.mjs"
  }
}
```

- [ ] **Step 2: Add a failing lifecycle test**

Create `tests/main.test.ts` with a mocked `Plugin` and assert the plugin registers the command and view type declared below:

```ts
it("registers the new-plan and open-plan commands", async () => {
  const plugin = new PlannerBoardPlugin(mockApp, mockManifest);
  await plugin.onload();
  expect(plugin.addCommand).toHaveBeenCalledWith(
    expect.objectContaining({ id: "create-plan" }),
  );
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- tests/main.test.ts`

Expected: FAIL because `PlannerBoardPlugin` does not exist.

- [ ] **Step 4: Implement the minimal plugin shell**

Create `src/main.ts` with these public constants and command IDs:

```ts
export const VIEW_TYPE_PLANNER_BOARD = "planner-board-view";

export default class PlannerBoardPlugin extends Plugin {
  async onload(): Promise<void> {
    this.registerView(VIEW_TYPE_PLANNER_BOARD, (leaf) => new BoardView(leaf, this));
    this.addCommand({ id: "create-plan", name: "Create planner board", callback: () => this.createPlan() });
    this.addCommand({ id: "open-plan-as-board", name: "Open current plan as board", callback: () => this.openActivePlan() });
  }
}
```

Set `manifest.json` to ID `planner-board`, a 250-character-or-less action-led description ending with a period, and a current stable `minAppVersion`. Set `isDesktopOnly` to `false`.

- [ ] **Step 5: Run static checks and the lifecycle test**

Run: `npm run lint && npm test -- tests/main.test.ts && npm run build`

Expected: all commands exit 0 and `main.js` exists.

- [ ] **Step 6: Commit the bootstrap**

```bash
git add package.json package-lock.json tsconfig.json esbuild.config.mjs manifest.json src/main.ts styles.css tests/main.test.ts .gitignore LICENSE
git commit -m "chore: bootstrap planner board plugin"
```

## Task 2: Define and validate the Markdown plan format

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/markdown/plan-format.ts`
- Create: `tests/markdown/plan-format.test.ts`

**Interfaces:**
- Produces `parsePlan(markdown: string): ParseResult` and `serializePlan(plan: Plan): string`.
- Produces `Plan`, `Column`, and `Card` types used by Tasks 3–5.
- Consumes only a note that starts with `---\nplanner-board: true\n---`.

- [ ] **Step 1: Write failing format tests**

Use this exact initial grammar in the tests:

```markdown
---
planner-board: true
---

## To do ^column-todo
- [ ] Draft home page ^card-1
  - labels: design, copy
  - due: 2026-10-20

## In progress ^column-progress
- [x] Send design review ^card-2
  - completed: 2026-10-10T09:30:00.000Z
  - previous-column: column-progress
  - previous-position: 0
```

Test that parsing returns ordered columns and cards, then serializing and parsing returns the same semantic `Plan`. Add explicit tests for duplicate `^card-` IDs, duplicate `^column-` IDs, invalid `due:` values, titles containing `[]()`, and a card missing a block ID.

- [ ] **Step 2: Run format tests to verify they fail**

Run: `npm test -- tests/markdown/plan-format.test.ts`

Expected: FAIL because `parsePlan` and `serializePlan` do not exist.

- [ ] **Step 3: Implement domain types and parser**

Define these exact types:

```ts
export type CardStatus = "active" | "completed";
export interface Card { id: string; title: string; description?: string; columnId: string; position: number; status: CardStatus; completedAt?: string; previousColumnId?: string; previousPosition?: number; labels: string[]; dueDate?: string; }
export interface Column { id: string; title: string; position: number; }
export interface Plan { columns: Column[]; cards: Card[]; }
export type ParseResult = { ok: true; plan: Plan } | { ok: false; errors: string[] };
```

Treat a checked list item as `completed`; require `completed`, `previous-column`, and `previous-position` metadata for completed cards. Reject malformed metadata, duplicate IDs, cards before any H2 column, and missing frontmatter. Escape list syntax when serializing titles, and only accept `YYYY-MM-DD` dates that form an actual calendar date.

- [ ] **Step 4: Run format tests to verify they pass**

Run: `npm test -- tests/markdown/plan-format.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the plan format**

```bash
git add src/domain/types.ts src/markdown/plan-format.ts tests/markdown/plan-format.test.ts
git commit -m "feat: add readable planner markdown format"
```

## Task 3: Implement completion, ordering, and filter domain operations

**Files:**
- Create: `src/domain/plan-operations.ts`
- Create: `src/views/filters.ts`
- Create: `tests/domain/plan-operations.test.ts`
- Create: `tests/views/filters.test.ts`

**Interfaces:**
- Consumes `Plan` from Task 2.
- Produces `completeCard(plan: Plan, cardId: string, completedAt: string): Plan`, `reopenCard(plan: Plan, cardId: string): Plan`, and `moveCard(plan: Plan, cardId: string, targetColumnId: string, targetPosition: number): Plan`.
- Produces `filterCards(cards: Card[], query: string, state: "active" | "completed" | "all", label?: string, due?: "overdue" | "upcoming"): Card[]`.

- [ ] **Step 1: Write failing operation tests**

Test that `completeCard` preserves the current `columnId` and `position` as `previousColumnId` and `previousPosition`, removes the card from active ordering, and sets a supplied ISO timestamp. Test that `reopenCard` restores exact ordering even when other active cards exist. Test `moveCard` renumbers source and destination positions and always sets `status` to `active`. Test that filtering excludes completed cards by default, matches labels case-insensitively, and considers only valid date-only values for overdue filtering.

- [ ] **Step 2: Run operation tests to verify they fail**

Run: `npm test -- tests/domain/plan-operations.test.ts tests/views/filters.test.ts`

Expected: FAIL because the operation and filter functions do not exist.

- [ ] **Step 3: Implement immutable operations**

Return new `Plan` objects; never mutate input arrays or cards. For reopening a card whose saved column has been deleted, place it at position 0 in the first surviving column. For a missing card or column ID, throw `Error` with the ID in the message so the view can show a notice.

- [ ] **Step 4: Run operation tests to verify they pass**

Run: `npm test -- tests/domain/plan-operations.test.ts tests/views/filters.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit domain operations**

```bash
git add src/domain/plan-operations.ts src/views/filters.ts tests/domain/plan-operations.test.ts tests/views/filters.test.ts
git commit -m "feat: add task completion and board filters"
```

## Task 4: Add validated, conflict-safe vault persistence

**Files:**
- Create: `src/services/plan-service.ts`
- Create: `tests/services/plan-service.test.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Consumes `parsePlan`, `serializePlan`, and domain operations.
- Produces `PlanService.load(file: TFile): Promise<Plan>` and `PlanService.update(file: TFile, expectedMarkdown: string, transform: (plan: Plan) => Plan): Promise<Plan>`.
- Throws `PlanFormatError` for invalid notes and `PlanConflictError` if current vault text differs from `expectedMarkdown`.

- [ ] **Step 1: Write failing persistence tests**

Mock `app.vault.read` and `app.vault.modify`. Verify `load` parses the returned text. Verify `update` reads the file immediately before serializing, calls `modify` exactly once on matching text, does not call `modify` for invalid Markdown, and throws `PlanConflictError` without calling `modify` when the file text differs from `expectedMarkdown`.

- [ ] **Step 2: Run persistence tests to verify they fail**

Run: `npm test -- tests/services/plan-service.test.ts`

Expected: FAIL because `PlanService` does not exist.

- [ ] **Step 3: Implement the update gateway**

Implement `PlanService` with Obsidian `Vault` only. `update` must read fresh text, compare it byte-for-byte to `expectedMarkdown`, parse it, apply `transform`, serialize it, parse the serialized output again, and only then call `vault.modify`. Return the validated transformed plan. Register vault `modify` and `delete` events in `PlannerBoardPlugin` so open views can refresh or close.

- [ ] **Step 4: Run persistence and full unit tests**

Run: `npm test && npm run lint`

Expected: PASS.

- [ ] **Step 5: Commit persistence**

```bash
git add src/services/plan-service.ts tests/services/plan-service.test.ts src/main.ts
git commit -m "feat: save planner notes safely"
```

## Task 5: Build the board and card-editing experience

**Files:**
- Create: `src/views/board-view.ts`
- Create: `src/views/card-modal.ts`
- Modify: `src/main.ts`
- Modify: `styles.css`

**Interfaces:**
- Consumes `PlanService`, `Plan`, domain operations, and `filterCards`.
- Produces `BoardView extends ItemView` and `CardModal extends Modal`.
- `BoardView.setFile(file: TFile): Promise<void>` renders a plan note in a leaf.

- [ ] **Step 1: Write failing view tests**

In jsdom, create a fixture plan with two columns, one active card, and one completed card. Assert `BoardView` renders a checkbox, active cards under their column, and a collapsed `Concluídas` section. Simulate checking the checkbox and assert the mocked service receives a transform that returns the card with `status: "completed"`. Simulate opening the completed section and reopening a card. Test search and each filter control using the pure filter function rather than brittle DOM snapshots.

- [ ] **Step 2: Run view tests to verify they fail**

Run: `npm test -- tests/views/board-view.test.ts`

Expected: FAIL because `BoardView` does not exist.

- [ ] **Step 3: Implement the board UI**

Render toolbar controls for search, active/completed/all state, label, due filter, “Nova tarefa”, and “Mostrar concluídas”. Render columns with title, active count, add-card button, cards, and drag targets. Use native HTML drag events to move cards; implement keyboard-accessible buttons for every drag-only outcome. Use `CardModal` with title, description, comma-separated labels, and date input. Every mutating handler must call `PlanService.update` with the view's last loaded Markdown and then re-render from the returned plan. Catch `PlanFormatError` and `PlanConflictError`, show `new Notice(...)`, and offer a reload button.

- [ ] **Step 4: Style for Obsidian and mobile**

Use only Obsidian CSS variables. At widths below 700px, preserve columns in a horizontally scrollable board, make cards at least 44px tall at controls, and keep the toolbar wrapping without overlap. Visually differentiate overdue dates and completed cards without relying only on colour.

- [ ] **Step 5: Run all tests, lint, and production build**

Run: `npm test && npm run lint && npm run build`

Expected: PASS and a production `main.js`.

- [ ] **Step 6: Commit the board UI**

```bash
git add src/views/board-view.ts src/views/card-modal.ts src/main.ts styles.css tests/views/board-view.test.ts
git commit -m "feat: add planner board interface"
```

## Task 6: Document, package, beta test, and release

**Files:**
- Create: `README.md`
- Create: `.github/workflows/release.yml`
- Create: `versions.json`
- Modify: `manifest.json`
- Modify: `package.json`

**Interfaces:**
- Consumes the built `main.js`, `manifest.json`, and optional `styles.css`.
- Produces a GitHub release asset set installable by Obsidian and a Community directory submission-ready repository.

- [ ] **Step 1: Write failing packaging checks**

Add `tests/release-assets.test.ts` that reads `manifest.json` and asserts: the ID does not include `obsidian`; the version matches `x.y.z`; `minAppVersion` is present; description is no more than 250 characters and ends with `.`; `README.md` and `LICENSE` exist. Add a test that the build output contains `main.js`.

- [ ] **Step 2: Run packaging checks to verify the missing documentation failure**

Run: `npm test -- tests/release-assets.test.ts`

Expected: FAIL because `README.md` and the release workflow do not yet meet the test requirements.

- [ ] **Step 3: Write publication documentation and CI**

README must include: why completion is independent from the “Feito” column; installation from Community Plugins; BRAT beta installation by GitHub repository URL; the exact Markdown grammar from Task 2; privacy statement; mobile support; development commands; and MIT license notice. The workflow must run test, lint, and build on pushes, and for a `v*.*.*` tag upload `main.js`, `manifest.json`, and `styles.css` as release attachments. Add at least one 1200×800 screenshot before submission.

- [ ] **Step 4: Run complete release verification**

Run: `npm test && npm run lint && npm run build && git status --short`

Expected: tests and build pass; only intentionally uncommitted release artifacts may remain.

- [ ] **Step 5: Test in a clean vault and beta distribute**

Copy the release assets into a clean vault at `.obsidian/plugins/planner-board/`, enable the plugin, create a plan, complete and reopen a card, edit the Markdown manually, and verify invalid Markdown is not overwritten. Publish a pre-release GitHub tag such as `v0.1.0-beta.1`, then install its repository with BRAT and collect beta feedback.

- [ ] **Step 6: Commit release assets and prepare public submission**

```bash
git add README.md LICENSE .github/workflows/release.yml versions.json manifest.json package.json tests/release-assets.test.ts
git commit -m "docs: prepare planner board for release"
git tag v1.0.0
```

Create the GitHub release for `v1.0.0` and upload `main.js`, `manifest.json`, and `styles.css`. Connect the GitHub account to the Obsidian Community directory and submit the repository. Address automated review feedback with a new semantic version and release.
