import { App, Modal } from "obsidian";

export class InputModal extends Modal {
  private input!: HTMLInputElement;
  constructor(app: App, private readonly title: string, private readonly placeholder: string, private readonly onSubmit: (value: string) => void, private readonly initialValue = "", private readonly submitLabel = "Guardar") { super(app); }
  onOpen(): void {
    this.titleEl.setText(this.title);
    this.input = this.contentEl.createEl("input", { type: "text", placeholder: this.placeholder });
    this.input.value = this.initialValue;
    this.input.addClass("planner-modal-input");
    const actions = this.contentEl.createDiv({ cls: "modal-button-container" });
    const cancel = actions.createEl("button", { text: "Cancelar" });
    cancel.onclick = () => this.close();
    const create = actions.createEl("button", { text: this.submitLabel, cls: "mod-cta" });
    const submit = () => { const value = this.input.value.trim(); if (value) { this.onSubmit(value); this.close(); } };
    create.onclick = submit;
    this.input.onkeydown = (event) => { if (event.key === "Enter") submit(); };
    window.setTimeout(() => this.input.focus(), 0);
  }
  onClose(): void { this.contentEl.empty(); }
}

export class SelectModal extends Modal {
  constructor(app: App, private readonly title: string, private readonly options: Array<{ value: string; label: string }>, private readonly onSubmit: (value: string) => void) { super(app); }
  onOpen(): void {
    this.titleEl.setText(this.title);
    const select = this.contentEl.createEl("select", { cls: "planner-modal-input" });
    for (const option of this.options) select.createEl("option", { value: option.value, text: option.label });
    const actions = this.contentEl.createDiv({ cls: "modal-button-container" });
    actions.createEl("button", { text: "Cancelar" }).onclick = () => this.close();
    actions.createEl("button", { text: "Mover", cls: "mod-cta" }).onclick = () => { this.onSubmit(select.value); this.close(); };
  }
  onClose(): void { this.contentEl.empty(); }
}
