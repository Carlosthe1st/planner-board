import { Notice, Plugin, TFile } from "obsidian";
import { PlanService } from "./services/plan-service";
import { BoardView } from "./views/board-view";

export const VIEW_TYPE_PLANNER_BOARD = "planner-board-view";

export default class PlannerBoardPlugin extends Plugin {
  planService!: PlanService;
  async onload(): Promise<void> {
    this.planService = new PlanService(this.app.vault);
    this.registerView(VIEW_TYPE_PLANNER_BOARD, (leaf) => new BoardView(leaf, this));
    this.addCommand({ id: "create-plan", name: "Create planner board", callback: () => this.createPlan() });
    this.addCommand({ id: "open-plan-as-board", name: "Open current plan as board", callback: () => this.openActivePlan() });
  }

  async createPlan(): Promise<void> {
    let path = "Planner.md"; let index = 2;
    while (this.app.vault.getAbstractFileByPath(path)) path = `Planner ${index++}.md`;
    const file = await this.app.vault.create(path, "---\nplanner-board: true\n---\n\n<!-- planner-board:start -->\n## To do ^column-todo\n\n<!-- planner-board:end -->\n");
    await this.openPlan(file);
  }
  async openActivePlan(): Promise<void> {
    const file = this.app.workspace.getActiveFile();
    if (!file) { new Notice("Open a Markdown plan first."); return; }
    await this.openPlan(file);
  }
  async openPlan(file: TFile): Promise<void> {
    try { await this.planService.load(file); }
    catch (error) { new Notice(error instanceof Error ? error.message : "This is not a Planner Board note."); return; }
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.setViewState({ type: VIEW_TYPE_PLANNER_BOARD, active: true });
    await (leaf.view as BoardView).setFile(file);
  }
}
