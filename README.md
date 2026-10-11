# Planner Board

Manage a Markdown plan as a completion-aware board in Obsidian.

## Use

Run **Create planner board** from the command palette, then add tasks directly in the note. Run **Open current plan as board** to open its board view. Checking a task moves it to the collapsible **Completed** area; reopening returns it to its previous column.

## Markdown format

```md
---
planner-board: true
---

## To do ^column-todo
- [ ] Draft home page ^card-home
  - labels: design, copy
  - due: 2026-10-20
```

The note remains readable and editable without the plugin. Invalid IDs, duplicate IDs, and invalid dates are reported instead of overwritten.

## Installation and privacy

Once listed, install it from Obsidian **Community plugins**. Before listing, beta testers can use [BRAT](https://github.com/TfTHacker/obsidian42-brat) with this repository URL. The plugin works on desktop and mobile, makes no network requests, and collects no telemetry.

## Development

Run `npm install`, `npm test`, `npm run lint`, and `npm run build`.

## License

MIT.
