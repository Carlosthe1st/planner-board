# Planner Board

Um quadro de tarefas para o Obsidian inspirado na simplicidade do Microsoft Planner — mas os dados continuam no teu Markdown, sem conta, servidor ou sincronização externa.

## O que já funciona

- Criar colunas e tarefas diretamente no quadro
- Editar, mover e eliminar tarefas
- Marcar como concluída e reabrir na coluna e posição anteriores
- Pesquisar tarefas sem perder o que estás a escrever
- Manter o resto da nota intacto quando o quadro é alterado

## Começar em menos de um minuto

1. No Obsidian, abre a paleta de comandos (`Cmd/Ctrl + P`).
2. Escolhe **Create planner board**.
3. No quadro aberto, usa **+ Coluna** e **+ Tarefa**.
4. Marca a caixa de uma tarefa para a concluir; ativa **Mostrar concluídas** para a rever ou reabrir.

Também podes abrir uma nota existente com **Open current plan as board**.

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

## Instalação e privacidade

Durante a fase beta, instala com [BRAT](https://github.com/TfTHacker/obsidian42-brat) e o URL deste repositório. Depois da aprovação da comunidade Obsidian, estará disponível em **Community plugins**.

O plugin não faz pedidos de rede, não recolhe telemetria e não envia as tuas notas para nenhum serviço. É atualmente orientado para Obsidian Desktop; a experiência móvel será validada antes de ser anunciada como suportada.

## Limitações honestas

Ainda não existem arrastar-e-largar, etiquetas visuais ou sincronização com Microsoft Planner. Se editares manualmente a estrutura técnica do quadro, mantém os IDs `^column-...` e `^card-...` para o plugin conseguir reconhecer as tarefas.

## Development

Run `npm install`, `npm test`, `npm run lint`, and `npm run build`.

## License

MIT.
