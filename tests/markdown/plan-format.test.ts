import { describe, expect, it } from "vitest";
import { parsePlan, replacePlanInMarkdown, serializePlan } from "../../src/markdown/plan-format";

const source = `---
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
`;

describe("planner Markdown format", () => {
  it("parses cards and round-trips the plan", () => {
    const parsed = parsePlan(source);
    expect(parsed).toMatchObject({ ok: true, plan: { columns: [{ id: "column-todo" }, { id: "column-progress" }], cards: [{ id: "card-1", status: "active" }, { id: "card-2", status: "completed" }] } });
    if (!parsed.ok) throw new Error(parsed.errors.join(", "));
    expect(parsePlan(serializePlan(parsed.plan))).toEqual(parsed);
  });

  it.each([
    ["duplicate card IDs", source.replace("^card-2", "^card-1")],
    ["duplicate column IDs", source.replace("^column-progress", "^column-todo")],
    ["invalid calendar date", source.replace("2026-10-20", "2026-02-30")],
    ["missing card ID", source.replace(" ^card-1", "")],
  ])("rejects %s", (_name, markdown) => {
    expect(parsePlan(markdown)).toMatchObject({ ok: false });
  });

  it("preserves Markdown punctuation in titles", () => {
    const parsed = parsePlan(source.replace("Draft home page", "[Plan] (phase 1)"));
    expect(parsed).toMatchObject({ ok: true, plan: { cards: expect.arrayContaining([expect.objectContaining({ title: "[Plan] (phase 1)" })]) } });
  });

  it("updates only the marked board region", () => {
    const markdown = `${serializePlan({ columns: [{ id: "column-todo", title: "To do", position: 0 }], cards: [] })}\n# Notes\nDo not erase this.`;
    const changed = replacePlanInMarkdown(markdown, { columns: [{ id: "column-todo", title: "To do", position: 0 }], cards: [{ id: "card-1", title: "Keep notes", columnId: "column-todo", position: 0, status: "active", labels: [] }] });
    expect(changed).toContain("# Notes\nDo not erase this.");
    expect(parsePlan(changed)).toMatchObject({ ok: true, plan: { cards: [{ id: "card-1" }] } });
  });
});
