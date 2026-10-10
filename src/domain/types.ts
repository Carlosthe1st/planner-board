export type CardStatus = "active" | "completed";
export interface Card { id: string; title: string; description?: string; columnId: string; position: number; status: CardStatus; completedAt?: string; previousColumnId?: string; previousPosition?: number; labels: string[]; dueDate?: string; }
export interface Column { id: string; title: string; position: number; }
export interface Plan { columns: Column[]; cards: Card[]; }
export type ParseResult = { ok: true; plan: Plan } | { ok: false; errors: string[] };
