# NexaDesk — Especificação de Design (design.md)

> Use este arquivo como contexto para a IA nas etapas de **layout** e **protótipo**.
> Em ferramentas que não leem `.md`, cole o conteúdo inteiro no chat.

---

## 1. Básico

### Nome do projeto
**NexaDesk**: sistema de gerenciamento de chamados de suporte técnico (help desk).

### Finalidade (problema que resolve)
Em empresas pequenas e médias, os pedidos de suporte de TI chegam por WhatsApp, e-mail e no corredor. Com isso, chamados se perdem, ninguém sabe o que é prioridade e não há números sobre o atendimento.
O NexaDesk centraliza **registro, acompanhamento e resolução** dessas solicitações, com prioridades, status, responsáveis e indicadores.

### Usuários
| Perfil | Quem é | O que faz |
|---|---|---|
| **Administrador** | Coordenador(a) de TI, 25–50 anos | Gerencia usuários e perfis, vê todos os chamados e relatórios |
| **Técnico** | Analista/técnico de suporte, 20–45 anos | Recebe chamados, altera status e prioridade, registra o andamento |
| **Solicitante** | Colaborador(a) de qualquer setor, 18–60 anos, com pouca familiaridade técnica | Abre chamados e acompanha o andamento |

Público: ambiente corporativo, uso diário no computador do trabalho.

### Requisitos de usuário
- RU01: Quero entrar no sistema com e-mail e senha.
- RU02: Quero abrir um chamado descrevendo meu problema.
- RU03: Quero acompanhar o status dos meus chamados.
- RU04: Como técnico, quero ver os chamados atribuídos a mim e atualizar o status.
- RU05: Como administrador, quero cadastrar usuários e definir perfis.
- RU06: Como administrador, quero ver indicadores e relatórios do atendimento.

### Requisitos funcionais
| ID | Requisito |
|---|---|
| RF01 | Login demonstrativo com validação de e-mail/senha e identificação do perfil |
| RF02 | Dashboard com indicadores (total, abertos, em andamento, concluídos), gráfico mensal, gráfico por status e chamados recentes |
| RF03 | Cadastrar chamado (título, descrição, categoria, prioridade, solicitante, técnico) |
| RF04 | Editar e excluir chamado (exclusão com modal de confirmação) |
| RF05 | Atribuir técnico responsável |
| RF06 | Definir prioridade: Baixa, Média, Alta, Crítica |
| RF07 | Alterar status: Aberto, Em andamento, Pendente, Concluído |
| RF08 | Pesquisar chamados por ID, título ou solicitante |
| RF09 | Filtrar chamados por status e prioridade |
| RF10 | Cadastrar, editar, excluir usuários e definir perfil (Administrador, Técnico, Solicitante) |
| RF11 | Relatórios com gráficos por status, prioridade, período e técnico |
| RF12 | Perfil: ver dados pessoais, alterar senha (demonstrativo) e encerrar sessão |
| RF13 | Persistir todos os dados no **LocalStorage** (sem banco de dados) |

### Telas
1. Login
2. Dashboard (painel principal)
3. Chamados (lista + pesquisa + filtros)
4. Chamados: modal de confirmação de exclusão
5. Novo chamado
6. Detalhes do chamado (status, histórico, comentários)
7. Usuários
8. Relatórios
9. Perfil / Configurações

---

## 2. Técnico

### Abordagem
**Desktop first.** Frame base de **1440 × 900 px**. Grid: sidebar fixa de 240 px + área de conteúdo fluida com padding de 32 px.

### Cores (tema escuro)
| Token | Hex | Uso |
|---|---|---|
| `base/background` | `#101827` | Fundo da aplicação |
| `base/primary` | `#2563EB` | Cor principal: botões primários, item ativo, links, gráficos |
| `base/primary-hover` | `#1D4ED8` | Hover do primário |
| `base/secondary` | `#1E293B` | Cor secundária: cards, sidebar, modais |
| `base/tertiary` | `#334155` | Cor terciária: bordas, divisores, botão secundário |
| `text/primary` | `#F8FAFC` | Texto principal |
| `text/secondary` | `#94A3B8` | Texto de apoio, rótulos, placeholders |
| `text/on-primary` | `#FFFFFF` | Texto sobre o primário |
| `feedback/success` | `#22C55E` | Sucesso |
| `feedback/warning` | `#F59E0B` | Atenção |
| `feedback/error` | `#EF4444` | Erro / ações destrutivas |
| `feedback/info` | `#38BDF8` | Informação |

**Status dos chamados**: Aberto `#3B82F6` (azul) · Em andamento `#FACC15` (amarelo) · Pendente `#A855F7` (roxo) · Concluído `#22C55E` (verde)
**Prioridades**: Baixa `#94A3B8` (cinza) · Média `#3B82F6` (azul) · Alta `#F97316` (laranja) · Crítica `#EF4444` (vermelho)

Badges: fundo na cor do token com **16% de opacidade** + bolinha de 8 px + texto na cor cheia.

### Tipografia (Inter)
| Estilo | Tamanho | Peso | Altura de linha |
|---|---|---|---|
| Título principal | 28 px | Bold (700) | 36 px |
| Título de seção | 22 px | Semi Bold (600) | 30 px |
| Subtítulo | 18 px | Semi Bold (600) | 26 px |
| Texto padrão | 14 px | Regular (400) / Medium (500) | 20 px |
| Texto secundário | 12 px | Regular (400) / Medium (500) | 16 px |
| Botões | 14 px | Semi Bold (600) | 20 px |

### Espaçamentos (escala de 4 px)
`4 · 8 · 12 · 16 · 24 · 32 · 40`

| Onde | Valor |
|---|---|
| Padding da página | 32 px |
| Gap entre cards/seções | 24 px |
| Padding interno de cards | 24 px |
| Gap entre campos de formulário | 16 px |
| Rótulo → campo | 8 px |
| Ícone + texto | 8–12 px |
| Padding de botões | 12 px × 16 px (altura 44 px) |
| Inputs | altura 44 px, padding horizontal 12 px |

**Raios:** `sm 4` (checkbox, barras) · `md 8` (botões, inputs) · `lg 12` (cards, modais) · `full` (badges, avatares)

### Componentes
Sidebar fixa (240 px) · Topbar com busca e perfil (64 px) · Cards de indicadores (KPI) · Tabelas · Botões (Primary, Secondary, Danger, Ghost) · Inputs e Selects · Badges (status, prioridade, perfil) · Gráficos (colunas, rosca, barras horizontais) · Modal de confirmação · Avatares · Ícones **Lucide** (24 px, traço 2 px).

### Exemplos
- **Botão primário:** fundo `#2563EB`, texto branco 14/600, padding 12×16, raio 8, ícone Lucide de 18 px à esquerda com gap de 8.
- **Badge "Crítica":** fundo `#EF4444` a 16%, bolinha `#EF4444`, texto 12/500 `#EF4444`, padding 4×12, raio full.
- **Card KPI:** fundo `#1E293B`, borda 1 px `#334155`, raio 12, padding 24; rótulo 14 cinza, valor 28/700, descrição 12.
- **Linha de tabela:** padding 12×24, borda superior 1 px `#334155`, ID em 14/500 cinza.

---

## 3. Específico

| Item | Definição |
|---|---|
| Usa banco de dados? | **Não.** Dados mockados e persistidos no `localStorage` (chaves `nexadesk_tickets`, `nexadesk_users`, `nexadesk_session`) |
| Dispositivo preferencial | Desktop (≥ 1280 px). Abaixo de 1024 px, a sidebar recolhe (opcional) |
| Arquitetura | **HTML + CSS + JavaScript puro** (multipágina), CSS com variáveis espelhando os tokens do Figma |
| Bibliotecas (CDN) | **Chart.js** (gráficos), **Lucide** (ícones), **Google Fonts – Inter** |
| Estrutura sugerida | `index.html` (login), `dashboard.html`, `chamados.html`, `chamado.html`, `usuarios.html`, `relatorios.html`, `perfil.html`, `css/tokens.css`, `css/style.css`, `js/storage.js`, `js/auth.js`, `js/<tela>.js` |
| Login demo | `admin@nexadesk.com` / `123456` |

---

## 4. Prompt para a etapa de protótipo (código)

```
Você é um desenvolvedor front-end. Usando o MCP do Figma, leia o arquivo NexaDesk
(página "🖥️ Telas (Desktop 1440)") e as variáveis das coleções "NexaDesk / Cores",
"NexaDesk / Espaçamento" e "NexaDesk / Tipografia".
Siga o design.md em anexo. Gere o protótipo em HTML + CSS + JavaScript puro:
1. Crie css/tokens.css com as variáveis do Figma como CSS custom properties (mesmos nomes).
2. Replique fielmente cada tela (auto layout → flexbox, gaps e paddings dos tokens).
3. Dados no localStorage, com seed inicial dos chamados e usuários mostrados no Figma.
4. Implemente RF01–RF13. Gráficos com Chart.js, ícones com Lucide.
Faça uma tela por vez, começando pelo Login e pelo Dashboard, e me mostre antes de seguir.
```
