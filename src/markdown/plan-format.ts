import type { Card, Column, ParseResult, Plan } from "../domain/types";

const dateOnly = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

export function parsePlan(markdown: string): ParseResult {
  const errors: string[] = [];
  if (!markdown.startsWith("---\nplanner-board: true\n---")) return { ok: false, errors: ["Missing planner-board frontmatter."] };
  const columns: Column[] = [];
  const cards: Card[] = [];
  const columnIds = new Set<string>();
  const cardIds = new Set<string>();
  let currentColumn: Column | undefined;
  const lines = markdown.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const heading = /^## (.+?) \^column-([^\s]+)$/.exec(lines[index]);
    if (heading) {
      const id = `column-${heading[2]}`;
      if (columnIds.has(id)) errors.push(`Duplicate column ID: ${id}.`);
      columnIds.add(id);
      currentColumn = { id, title: heading[1], position: columns.length };
      columns.push(currentColumn);
      continue;
    }
    const task = /^- \[([ xX])\] (.+?) \^card-([^\s]+)$/.exec(lines[index]);
    if (!task) {
      if (/^- \[[ xX]\] /.test(lines[index])) errors.push("Card is missing a block ID.");
      continue;
    }
    if (!currentColumn) { errors.push("Card appears before a column."); continue; }
    const id = `card-${task[3]}`;
    if (cardIds.has(id)) errors.push(`Duplicate card ID: ${id}.`);
    cardIds.add(id);
    const metadata: Record<string, string> = {};
    while (/^  - /.test(lines[index + 1] ?? "")) {
      index += 1;
      const entry = /^  - ([a-z-]+):\s*(.*)$/.exec(lines[index]);
      if (entry) metadata[entry[1]] = entry[2];
    }
    if (metadata.due && !dateOnly(metadata.due)) errors.push(`Invalid due date for ${id}.`);
    const completed = task[1].toLowerCase() === "x";
    if (completed && (!metadata.completed || !metadata["previous-column"] || !/^\d+$/.test(metadata["previous-position"] ?? ""))) errors.push(`Completed card ${id} has incomplete metadata.`);
    cards.push({ id, title: task[2], columnId: currentColumn.id, position: cards.filter((card) => card.columnId === currentColumn!.id).length, status: completed ? "completed" : "active", completedAt: metadata.completed, previousColumnId: metadata["previous-column"], previousPosition: metadata["previous-position"] ? Number(metadata["previous-position"]) : undefined, labels: metadata.labels ? metadata.labels.split(",").map((label) => label.trim()).filter(Boolean) : [], dueDate: metadata.due });
  }
  if (!columns.length) errors.push("Plan has no columns.");
  return errors.length ? { ok: false, errors } : { ok: true, plan: { columns, cards } };
}

export function serializePlan(plan: Plan): string {
  const lines = ["---", "planner-board: true", "---", ""];
  for (const column of [...plan.columns].sort((a, b) => a.position - b.position)) {
    lines.push(`## ${column.title} ^${column.id}`);
    for (const card of plan.cards.filter((item) => item.columnId === column.id).sort((a, b) => a.position - b.position)) {
      lines.push(`- [${card.status === "completed" ? "x" : " "}] ${card.title} ^${card.id}`);
      if (card.labels.length) lines.push(`  - labels: ${card.labels.join(", ")}`);
      if (card.dueDate) lines.push(`  - due: ${card.dueDate}`);
      if (card.status === "completed") { lines.push(`  - completed: ${card.completedAt}`); lines.push(`  - previous-column: ${card.previousColumnId}`); lines.push(`  - previous-position: ${card.previousPosition}`); }
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd() + "\n";
}
