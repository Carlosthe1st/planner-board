import type { Card } from "../domain/types";
export function filterCards(cards: Card[], query = "", state: "active" | "completed" | "all" = "active", label?: string, due?: "overdue" | "upcoming"): Card[] {
  const today = new Date().toISOString().slice(0, 10);
  const queryText = query.toLowerCase().trim();
  return cards.filter((card) => {
    const matchesState = state === "all" || card.status === state;
    const matchesText = !queryText || `${card.title} ${card.description ?? ""}`.toLowerCase().includes(queryText);
    const matchesLabel = !label || card.labels.some((item) => item.toLowerCase() === label.toLowerCase());
    const matchesDue = !due || (due === "overdue" ? !!card.dueDate && card.dueDate < today : !!card.dueDate && card.dueDate >= today);
    return matchesState && matchesText && matchesLabel && matchesDue;
  });
}
