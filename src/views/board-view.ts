import { ItemView, Notice, WorkspaceLeaf, type TFile } from "obsidian";
import type PlannerBoardPlugin from "../main";
import { completeCard, moveCard, reopenCard } from "../domain/plan-operations";
import type { Plan } from "../domain/types";
import { PlanConflictError, PlanFormatError } from "../services/plan-service";
import { filterCards } from "./filters";
import { InputModal, SelectModal } from "./input-modal";

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
    toolbar.createEl("h2", { text: this.file?.basename ?? "Plano" });
    const search = toolbar.createEl("input", { type: "search", placeholder: "Pesquisar tarefas" });
    search.value = this.query;
    search.oninput = () => { this.query = search.value; this.render(); requestAnimationFrame(() => { const next = this.contentEl.querySelector<HTMLInputElement>("input[type=search]"); next?.focus(); next?.setSelectionRange(this.query.length, this.query.length); }); };
    const toggle = toolbar.createEl("button", { text: this.showCompleted ? "Ocultar concluídas" : "Mostrar concluídas" });
    toggle.onclick = () => { this.showCompleted = !this.showCompleted; this.render(); };
    const addColumn = toolbar.createEl("button", { text: "+ Coluna" });
    addColumn.onclick = () => this.addColumn();
    const board = root.createDiv({ cls: "planner-board" });
    for (const column of this.plan.columns) {
      const lane = board.createDiv({ cls: "planner-column" });
      const header = lane.createDiv({ cls: "planner-column-header" }); header.createEl("h3", { text: column.title });
      const columnActions = header.createDiv({ cls: "planner-column-actions" });
      const rename = columnActions.createEl("button", { text: "Editar", cls: "planner-icon-button", attr: { "aria-label": "Editar coluna" } });
      rename.onclick = () => this.renameColumn(column.id);
      const add = columnActions.createEl("button", { text: "+ Tarefa", cls: "planner-add-task" }); add.onclick = () => this.addTask(column.id);
      const cards = filterCards(this.plan.cards.filter((card) => card.columnId === column.id), this.query, "active");
      for (const card of cards) this.renderCard(lane, card.id, false);
    }
    if (this.showCompleted) { const done = root.createEl("details", { cls: "planner-completed" }); done.createEl("summary", { text: "Concluídas" }); for (const card of filterCards(this.plan.cards, this.query, "completed")) this.renderCard(done, card.id, true); }
  }
  private renderCard(parent: HTMLElement, id: string, completed: boolean): void {
    const card = this.plan?.cards.find((item) => item.id === id); if (!card) return;
    const element = parent.createDiv({ cls: `planner-card${completed ? " is-completed" : ""}` });
    const check = element.createEl("input", { type: "checkbox" }); check.checked = completed; check.setAttribute("aria-label", completed ? "Reopen task" : "Complete task");
    check.onchange = () => this.changeCompletion(id, !completed);
    element.createSpan({ text: card.title, cls: "planner-card-title" });
    if (card.dueDate) element.createEl("small", { text: card.dueDate });
    const actions = element.createDiv({ cls: "planner-card-actions" });
    actions.createEl("button", { text: "Editar", cls: "planner-icon-button" }).onclick = () => this.editTask(id);
    if (!completed && (this.plan?.columns.length ?? 0) > 1) actions.createEl("button", { text: "Mover", cls: "planner-icon-button" }).onclick = () => this.moveTask(id);
    actions.createEl("button", { text: "Eliminar", cls: "planner-icon-button planner-danger" }).onclick = () => this.deleteTask(id);
  }
  private async addTask(columnId: string): Promise<void> {
    new InputModal(this.app, "Nova tarefa", "Nome da tarefa", (title) => {
      void this.update((plan) => ({ ...plan, cards: [...plan.cards, { id: `card-${crypto.randomUUID()}`, title, columnId, position: plan.cards.filter((card) => card.columnId === columnId && card.status === "active").length, status: "active", labels: [] }] }));
    }).open();
  }
  private async addColumn(): Promise<void> {
    new InputModal(this.app, "Nova coluna", "Nome da coluna", (title) => {
      void this.update((plan) => ({ ...plan, columns: [...plan.columns, { id: `column-${crypto.randomUUID()}`, title, position: plan.columns.length }] }));
    }).open();
  }
  private renameColumn(id: string): void {
    const column = this.plan?.columns.find((item) => item.id === id); if (!column) return;
    new InputModal(this.app, "Editar coluna", "Nome da coluna", (title) => { void this.update((plan) => ({ ...plan, columns: plan.columns.map((item) => item.id === id ? { ...item, title } : item) })); }, column.title, "Guardar").open();
  }
  private editTask(id: string): void {
    const card = this.plan?.cards.find((item) => item.id === id); if (!card) return;
    new InputModal(this.app, "Editar tarefa", "Nome da tarefa", (title) => { void this.update((plan) => ({ ...plan, cards: plan.cards.map((item) => item.id === id ? { ...item, title } : item) })); }, card.title, "Guardar").open();
  }
  private moveTask(id: string): void {
    const card = this.plan?.cards.find((item) => item.id === id); if (!card || !this.plan) return;
    const choices = this.plan.columns.filter((column) => column.id !== card.columnId).map((column) => ({ value: column.id, label: column.title }));
    new SelectModal(this.app, "Mover tarefa para", choices, (columnId) => { void this.update((plan) => moveCard(plan, id, columnId, plan.cards.filter((item) => item.status === "active" && item.columnId === columnId).length)); }).open();
  }
  private deleteTask(id: string): void {
    if (!this.plan?.cards.some((item) => item.id === id)) return;
    new InputModal(this.app, "Eliminar tarefa", "Escreva ELIMINAR para confirmar", (value) => { if (value === "ELIMINAR") void this.update((plan) => ({ ...plan, cards: plan.cards.filter((item) => item.id !== id) })); else new Notice("A tarefa não foi eliminada."); }, "", "Eliminar").open();
  }
  private async update(transform: (plan: Plan) => Plan): Promise<void> {
    if (!this.file) return;
    try { const result = await this.plugin.planService.update(this.file, this.markdown, transform); this.plan = result.plan; this.markdown = result.markdown; this.render(); }
    catch (error) { new Notice(error instanceof Error ? error.message : "Não foi possível guardar."); }
  }
  private async changeCompletion(id: string, complete: boolean): Promise<void> {
    if (!this.file) return;
    try { const result = await this.plugin.planService.update(this.file, this.markdown, (plan) => complete ? completeCard(plan, id, new Date().toISOString()) : reopenCard(plan, id)); this.plan = result.plan; this.markdown = result.markdown; this.render(); }
    catch (error) { new Notice(error instanceof PlanConflictError ? "Plan changed. Reloading." : error instanceof Error ? error.message : "Unable to update task."); if (error instanceof PlanConflictError || error instanceof PlanFormatError) await this.reload(); }
  }
}
