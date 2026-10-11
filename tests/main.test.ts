import { beforeEach, describe, expect, it, vi } from "vitest";

const addCommand = vi.fn();
const registerView = vi.fn();

vi.mock("obsidian", () => ({
  Plugin: class { addCommand = addCommand; registerView = registerView; app: unknown; constructor(app: unknown) { this.app = app; } },
  ItemView: class {},
  WorkspaceLeaf: class {},
}));

describe("PlannerBoardPlugin", () => {
  beforeEach(() => { addCommand.mockReset(); registerView.mockReset(); });

  it("registers commands for creating and opening a plan", async () => {
    const { default: PlannerBoardPlugin, VIEW_TYPE_PLANNER_BOARD } = await import("../src/main");
    const plugin = new PlannerBoardPlugin({ vault: {} } as never, {} as never);
    await plugin.onload();
    expect(registerView).toHaveBeenCalledWith(VIEW_TYPE_PLANNER_BOARD, expect.any(Function));
    expect(addCommand).toHaveBeenCalledWith(expect.objectContaining({ id: "create-plan" }));
    expect(addCommand).toHaveBeenCalledWith(expect.objectContaining({ id: "open-plan-as-board" }));
  });
});
