import { describe, expect, it } from "vitest";
import { completeCard, reopenCard } from "../../src/domain/plan-operations";
import type { Plan } from "../../src/domain/types";
const plan: Plan = { columns: [{ id: "todo", title: "To do", position: 0 }], cards: [{ id: "one", title: "One", columnId: "todo", position: 0, status: "active", labels: [] }] };
describe("completion", () => it("restores a card to its prior column", () => {
  const completed = completeCard(plan, "one", "2026-10-11T10:00:00.000Z");
  expect(completed.cards[0]).toMatchObject({ status: "completed", previousColumnId: "todo", previousPosition: 0 });
  expect(reopenCard(completed, "one").cards[0]).toMatchObject({ status: "active", columnId: "todo", position: 0 });
}));
