import type { TFile, Vault } from "obsidian";
import type { Plan } from "../domain/types";
import { parsePlan, serializePlan } from "../markdown/plan-format";

export class PlanFormatError extends Error {}
export class PlanConflictError extends Error {}

export class PlanService {
  constructor(private readonly vault: Vault) {}
  async load(file: TFile): Promise<{ plan: Plan; markdown: string }> {
    const markdown = await this.vault.read(file);
    const parsed = parsePlan(markdown);
    if (!parsed.ok) throw new PlanFormatError(parsed.errors.join(" "));
    return { plan: parsed.plan, markdown };
  }
  async update(file: TFile, expectedMarkdown: string, transform: (plan: Plan) => Plan): Promise<{ plan: Plan; markdown: string }> {
    const current = await this.vault.read(file);
    if (current !== expectedMarkdown) throw new PlanConflictError("The note changed outside Planner Board. Reload and try again.");
    const parsed = parsePlan(current);
    if (!parsed.ok) throw new PlanFormatError(parsed.errors.join(" "));
    const plan = transform(parsed.plan);
    const markdown = serializePlan(plan);
    const verified = parsePlan(markdown);
    if (!verified.ok) throw new PlanFormatError(verified.errors.join(" "));
    await this.vault.modify(file, markdown);
    return { plan: verified.plan, markdown };
  }
}
