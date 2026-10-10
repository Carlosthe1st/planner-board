# Planner for Obsidian — Design

## Objetivo

Criar um plugin público de Obsidian inspirado no Microsoft Planner. Cada
plano é uma nota Markdown individual apresentada como um quadro de colunas e
cartões. A primeira versão resolve, sobretudo, a conclusão explícita de
tarefas: concluir uma tarefa não depende de a mover para uma coluna específica.

O plugin deve ser privado por defeito, rápido e utilizável em desktop e mobile.
Todos os dados devem continuar compreensíveis e editáveis no vault sem o
plugin.

## Âmbito da primeira versão

- Criar e abrir uma nota de plano como quadro.
- Criar, editar, duplicar, apagar, reordenar e mover cartões entre colunas.
- Criar, renomear, reordenar e apagar colunas.
- Concluir e reabrir cartões através de um checkbox próprio.
- Mostrar cartões concluídos numa secção recolhível independente das colunas.
- Manter a última coluna de cada cartão concluído para o repor ao reabrir.
- Suportar título, descrição curta, etiquetas e prazo opcional nos cartões.
- Pesquisar cartões e filtrar por estado, etiqueta e prazo.
- Sincronizar a vista com alterações manuais feitas no Markdown.

Ficam fora desta versão: contas, sincronização por serviços externos,
atribuição de pessoas, anexos, comentários, notificações, calendário e
estatísticas.

## Modelo de dados e persistência

Cada plano é uma nota Markdown. O plugin escreve uma secção de dados
estruturados com IDs estáveis para colunas e cartões; a vista do quadro é uma
representação desses dados, não uma base de dados paralela.

Um cartão tem:

- `id`: identificador estável;
- `title`: título obrigatório;
- `description`: texto curto opcional;
- `columnId`: coluna ativa ou a última coluna antes de ser concluído;
- `position`: ordem no respetivo grupo;
- `status`: `active` ou `completed`;
- `completedAt`: data/hora ISO, quando concluído;
- `labels`: lista de etiquetas;
- `dueDate`: data opcional.

As colunas têm `id`, `title` e `position`. A secção de concluídos é uma
projeção de todos os cartões cujo `status` é `completed`; não é uma coluna
especial e não altera a semântica das colunas do plano.

Quando uma pessoa editar o Markdown manualmente, o plugin volta a analisar o
ficheiro ao abrir ou atualizar a vista. Se os dados forem inválidos, interrompe
a operação de escrita, explica o erro e nunca substitui conteúdo sem uma ação
explícita da pessoa.

## Interface

O plano pode ser aberto pela paleta de comandos e por um botão na própria nota.
No topo do quadro existem pesquisa, filtros por estado/etiqueta/prazo, criação
de tarefa e o controlo para mostrar ou ocultar concluídas.

Cada coluna mostra o título, a contagem de tarefas ativas e o controlo para
criar cartão. Cartões podem ser arrastados entre colunas e reordenados. Cada
cartão mostra o checkbox de conclusão, título, etiquetas e prazo. O menu do
cartão abre edição, duplicação e eliminação.

Ao concluir, o cartão desaparece da coluna ativa e passa para a secção
recolhível **Concluídas**. Ao reabrir, regressa à coluna em que estava. Uma
coluna chamada “Feito” pode existir normalmente, mas não determina se uma
tarefa está concluída: o estado é sempre definido pelo checkbox.

## Escrita, erros e integridade

Todas as mudanças na vista passam por um único serviço de atualização da nota.
Antes de gravar, o serviço valida o modelo, lê a versão mais recente do
ficheiro e aplica a alteração como uma única atualização. Se a nota se tiver
alterado entretanto ou a estrutura não puder ser lida, a operação falha sem
sobrescrever dados e oferece a atualização da vista.

O plugin usa apenas APIs compatíveis com desktop e mobile e não recolhe
telemetria nem depende de serviços de rede.

## Testes e lançamento

Os testes devem cobrir a serialização e análise Markdown, criação e edição de
cartões, conclusão e reabertura, ordenação, arrasto entre colunas, filtros,
alterações manuais e falhas de validação. Haverá ainda verificação manual num
vault limpo em desktop e mobile.

Antes da publicação, o plugin será distribuído a beta testers via BRAT. A
release pública terá README, licença, capturas de ecrã, `manifest.json`,
`main.js` e `styles.css` se aplicável. Será publicada num repositório GitHub e
submetida ao diretório comunitário do Obsidian.

## Critérios de aceitação

1. Uma pessoa consegue criar uma nota de plano e geri-la como quadro.
2. Marcar uma tarefa como concluída move-a para **Concluídas**, regista a data
   e preserva a coluna anterior.
3. Reabrir uma tarefa devolve-a à coluna anterior.
4. O conteúdo do plano continua legível e editável em Markdown sem o plugin.
5. Uma nota com dados inválidos não é alterada automaticamente.
6. O plugin instala-se e funciona num vault limpo no desktop e no mobile.
