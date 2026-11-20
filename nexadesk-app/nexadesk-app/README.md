# NexaDesk — Sistema de Chamados de Suporte de TI

Protótipo funcional de um help desk desktop-first. Gerado a partir do layout do Figma
(arquivo *NexaDesk – Sistema de Chamados*), usando as mesmas variáveis (tokens) de cor,
espaçamento e tipografia.

- **Arquitetura:** HTML + CSS + JavaScript puro (multipágina), sem build e sem servidor
- **Dados:** LocalStorage do navegador (sem banco de dados)
- **Bibliotecas:** Chart.js 4.4.1 (gráficos) e Lucide 0.454.0 (ícones), já incluídas em `js/vendor/`; fonte Inter (Google Fonts)

## Como rodar

**Opção 1:** dê dois cliques em `index.html`.

**Opção 2 (recomendada):** rode um servidor local na pasta do projeto e abra http://localhost:8000 no navegador.

```bash
python -m http.server 8000
```

Se preferir, use a extensão **Live Server** do VS Code.

## Contas de demonstração (senha `123456`)

| Perfil | E-mail | O que pode fazer |
|---|---|---|
| Administrador | ana.martins@nexadesk.com | Tudo: chamados, usuários, relatórios, restaurar dados |
| Técnico | carlos.lima@nexadesk.com | Chamados (atender, editar, excluir) e relatórios |
| Solicitante | bruno.reis@nexadesk.com | Abrir e acompanhar os próprios chamados, comentar, reabrir |

Na tela de login, os botões *Administrador*, *Técnico* e *Solicitante* preenchem os dados automaticamente.
Para voltar aos dados originais: **Perfil → Restaurar dados de demonstração** (somente o administrador).

## Telas

| Arquivo | Tela |
|---|---|
| `index.html` | Login |
| `dashboard.html` | Painel principal: indicadores, gráfico mensal, gráfico por status e chamados recentes |
| `chamados.html` | Lista com busca, filtros, paginação e exclusão com modal |
| `novo-chamado.html` | Cadastro de chamado (com `?id=` vira a tela de edição) |
| `chamado.html?id=` | Detalhes: histórico, comentários, status, prioridade, técnico e prazo (SLA) |
| `usuarios.html` | Cadastro, edição, exclusão e perfis de usuários |
| `relatorios.html` | Gráficos por status, prioridade, período e técnico, com exportação em PDF/CSV |
| `perfil.html` | Dados pessoais, alteração de senha e encerramento de sessão |

## Requisitos funcionais atendidos

| ID | Requisito | Onde |
|---|---|---|
| RF01 | Login demonstrativo com validação e perfil | `index.html`, `js/pages/login.js`, `Auth` em `js/storage.js` |
| RF02 | Dashboard com indicadores atualizados | `js/pages/dashboard.js` |
| RF03 | Cadastrar chamado | `js/pages/novo-chamado.js` |
| RF04 | Editar e excluir chamado (com modal de confirmação) | `novo-chamado.js` (`?id=`), `chamados.js`, `chamado.js` |
| RF05 | Atribuir técnico responsável | formulário e card "Atendimento" nos detalhes; botão "Assumir chamado" |
| RF06 | Prioridades Baixa/Média/Alta/Crítica, com prazo (SLA) | formulário, detalhes e filtros |
| RF07 | Status Aberto/Em andamento/Pendente/Concluído | detalhes e edição; tudo fica registrado no histórico |
| RF08 | Pesquisa (ID, título, solicitante, técnico) | `chamados.html` e a busca global da topbar |
| RF09 | Filtros por status e prioridade | `chamados.html` (os filtros ficam na URL) |
| RF10 | Gerenciar usuários e perfis | `usuarios.html` |
| RF11 | Relatórios com gráficos | `relatorios.html` |
| RF12 | Perfil, senha demonstrativa e logout | `perfil.html` |
| RF13 | Persistência no LocalStorage | `js/storage.js` (`nexadesk_users`, `nexadesk_tickets`, `nexadesk_session`) |

**Regras de negócio extras:**
- O solicitante só vê os próprios chamados.
- O técnico não acessa a tela de Usuários.
- Usuários com chamados vinculados não podem ser excluídos, apenas inativados.
- O e-mail precisa ser único.
- O administrador não pode excluir a si mesmo.

## Estrutura

```
nexadesk-app/
├── index.html, dashboard.html, chamados.html, novo-chamado.html,
│   chamado.html, usuarios.html, relatorios.html, perfil.html
├── css/
│   ├── tokens.css     ← variáveis do Figma (cores, espaçamentos, raios, fontes)
│   └── style.css      ← componentes e layout
├── js/
│   ├── storage.js     ← dados iniciais, CRUD no LocalStorage, autenticação e permissões
│   ├── ui.js          ← badges, modais, toasts, formatação, gráficos
│   ├── layout.js      ← sidebar, topbar, notificações, proteção de rotas
│   ├── pages/         ← um script por tela
│   └── vendor/        ← Chart.js e Lucide
├── assets/favicon.svg
└── docs/design.md     ← especificação do projeto (prompt usado com a IA)
```

## Do Figma ao código

1. A especificação (`docs/design.md`) foi escrita no formato pedido na atividade: básico, técnico e específico.
2. O layout foi gerado no Figma via **MCP** (`use_figma`), com variáveis, estilos de texto, componentes com variantes e auto layout.
3. As telas foram conferidas por screenshot via MCP (`get_screenshot`).
4. O código replica a estrutura do Figma:
   - auto layout → flexbox/grid;
   - variáveis `base/primary`, `space/24`, `radius/lg` etc. → `--base-primary`, `--space-24`, `--radius-lg`;
   - tokens `tint/*` → `color-mix()` com 16%.
5. Testes automatizados no navegador (Playwright) validaram login, CRUD, filtros, paginação, permissões por perfil e ausência de erros de JavaScript.
