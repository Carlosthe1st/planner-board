import { ItemView, Plugin, WorkspaceLeaf } from "obsidian";

export const VIEW_TYPE_PLANNER_BOARD = "planner-board-view";

class BoardView extends ItemView {
  constructor(leaf: WorkspaceLeaf) { super(leaf); }
  getViewType(): string { return VIEW_TYPE_PLANNER_BOARD; }
  getDisplayText(): string { return "Planner board"; }
}

export default class PlannerBoardPlugin extends Plugin {
  async onload(): Promise<void> {
    this.registerView(VIEW_TYPE_PLANNER_BOARD, (leaf) => new BoardView(leaf));
    this.addCommand({ id: "create-plan", name: "Create planner board", callback: () => this.createPlan() });
    this.addCommand({ id: "open-plan-as-board", name: "Open current plan as board", callback: () => this.openActivePlan() });
  }

  async createPlan(): Promise<void> {}
  async openActivePlan(): Promise<void> {}
}
