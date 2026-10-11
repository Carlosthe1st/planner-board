import { ItemView, Notice, WorkspaceLeaf, type TFile } from "obsidian";
import type PlannerBoardPlugin from "../main";
import { completeCard, reopenCard } from "../domain/plan-operations";
import type { Plan } from "../domain/types";
import { PlanConflictError, PlanFormatError } from "../services/plan-service";
import { filterCards } from "./filters";

export class BoardView extends ItemView {
  private file: TFile | null = null;
  private plan: Plan | null = null;
  private markdown = "";
  private query = "";
  private showCompleted = false;
  constructor(leaf: WorkspaceLeaf, private readonly plugin: PlannerBoardPlugin) { super(leaf); }
  getViewType(): string { return "planner-board-view"; }
  getDisplayText(): string { return this.file?.basename ?? "Planner board"; }
  async setFile(file: TFile): Promise<void> { this.file = file; await this.reload(); }
  async reload(): Promise<void> {
    if (!this.file) return;
    try { const loaded = await this.plugin.planService.load(this.file); this.plan = loaded.plan; this.markdown = loaded.markdown; this.render(); }
    catch (error) { this.contentEl.empty(); this.contentEl.createEl("p", { text: error instanceof Error ? error.message : "Unable to load plan." }); }
  }
  private render(): void {
    if (!this.plan) return;
    const root = this.contentEl; root.empty(); root.addClass("planner-board-root");
    const toolbar = root.createDiv({ cls: "planner-toolbar" });
    const search = toolbar.createEl("input", { type: "search", placeholder: "Search tasks" });
    search.value = this.query; search.oninput = () => { this.query = search.value; this.render(); };
    const toggle = toolbar.createEl("button", { text: this.showCompleted ? "Hide completed" : "Show completed" });
    toggle.onclick = () => { this.showCompleted = !this.showCompleted; this.render(); };
    const board = root.createDiv({ cls: "planner-board" });
    for (const column of this.plan.columns) {
      const lane = board.createDiv({ cls: "planner-column" }); lane.createEl("h3", { text: column.title });
      const cards = filterCards(this.plan.cards.filter((card) => card.columnId === column.id), this.query, "active");
      for (const card of cards) this.renderCard(lane, card.id, false);
    }
    if (this.showCompleted) { const done = root.createEl("details", { cls: "planner-completed" }); done.createEl("summary", { text: "Completed" }); for (const card of filterCards(this.plan.cards, this.query, "completed")) this.renderCard(done, card.id, true); }
  }
  private renderCard(parent: HTMLElement, id: string, completed: boolean): void {
    const card = this.plan?.cards.find((item) => item.id === id); if (!card) return;
    const element = parent.createDiv({ cls: `planner-card${completed ? " is-completed" : ""}` });
    const check = element.createEl("input", { type: "checkbox" }); check.checked = completed; check.setAttribute("aria-label", completed ? "Reopen task" : "Complete task");
    check.onchange = () => this.changeCompletion(id, !completed);
    element.createSpan({ text: card.title });
    if (card.dueDate) element.createEl("small", { text: card.dueDate });
  }
  private async changeCompletion(id: string, complete: boolean): Promise<void> {
    if (!this.file) return;
    try { const result = await this.plugin.planService.update(this.file, this.markdown, (plan) => complete ? completeCard(plan, id, new Date().toISOString()) : reopenCard(plan, id)); this.plan = result.plan; this.markdown = result.markdown; this.render(); }
    catch (error) { new Notice(error instanceof PlanConflictError ? "Plan changed. Reloading." : error instanceof Error ? error.message : "Unable to update task."); if (error instanceof PlanConflictError || error instanceof PlanFormatError) await this.reload(); }
  }
}
