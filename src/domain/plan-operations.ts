import type { Card, Plan } from "./types";

const renumber = (cards: Card[]): Card[] => cards.map((card, position) => ({ ...card, position }));
const replaceCards = (plan: Plan, cards: Card[]): Plan => ({ ...plan, cards });
const findCard = (plan: Plan, id: string): Card => {
  const card = plan.cards.find((item) => item.id === id);
  if (!card) throw new Error(`Card not found: ${id}`);
  return card;
};

export function completeCard(plan: Plan, cardId: string, completedAt: string): Plan {
  const card = findCard(plan, cardId);
  const cards = plan.cards.map((item) => item.id === cardId ? { ...item, status: "completed" as const, completedAt, previousColumnId: item.columnId, previousPosition: item.position } : item);
  return replaceCards(plan, cards);
}

export function reopenCard(plan: Plan, cardId: string): Plan {
  const card = findCard(plan, cardId);
  if (!card.previousColumnId || card.previousPosition === undefined) throw new Error(`Completed card has no saved position: ${cardId}`);
  const destination = plan.columns.some((column) => column.id === card.previousColumnId) ? card.previousColumnId : plan.columns[0]?.id;
  if (!destination) throw new Error("Plan has no columns");
  const active = plan.cards.filter((item) => item.id !== cardId && item.status === "active" && item.columnId === destination).sort((a, b) => a.position - b.position);
  const insertAt = Math.min(card.previousPosition, active.length);
  active.splice(insertAt, 0, { ...card, columnId: destination, status: "active", completedAt: undefined, previousColumnId: undefined, previousPosition: undefined });
  const activeIds = new Set(active.map((item) => item.id));
  return replaceCards(plan, [...plan.cards.filter((item) => !activeIds.has(item.id)), ...renumber(active)]);
}

export function moveCard(plan: Plan, cardId: string, targetColumnId: string, targetPosition: number): Plan {
  if (!plan.columns.some((column) => column.id === targetColumnId)) throw new Error(`Column not found: ${targetColumnId}`);
  const card = findCard(plan, cardId);
  const target = plan.cards.filter((item) => item.id !== cardId && item.status === "active" && item.columnId === targetColumnId).sort((a, b) => a.position - b.position);
  target.splice(Math.max(0, Math.min(targetPosition, target.length)), 0, { ...card, columnId: targetColumnId, status: "active", completedAt: undefined, previousColumnId: undefined, previousPosition: undefined });
  const ids = new Set(target.map((item) => item.id));
  return replaceCards(plan, [...plan.cards.filter((item) => !ids.has(item.id)), ...renumber(target)]);
}
