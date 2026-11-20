/* ==========================================================================
   NexaDesk — Dados (LocalStorage) e autenticação demonstrativa
   Chaves: nexadesk_users, nexadesk_tickets, nexadesk_session
   ========================================================================== */
const KEYS = {
  users: 'nexadesk_users',
  tickets: 'nexadesk_tickets',
  session: 'nexadesk_session',
  remember: 'nexadesk_remember',
  version: 'nexadesk_version',
};
const DATA_VERSION = 1;

const STATUS = ['Aberto', 'Em andamento', 'Pendente', 'Concluído'];
const PRIORIDADES = ['Baixa', 'Média', 'Alta', 'Crítica'];
const PERFIS = ['Administrador', 'Técnico', 'Solicitante'];
const CATEGORIAS = ['Hardware', 'Software', 'Rede / VPN', 'Acesso e senhas', 'E-mail', 'Impressoras', 'Outros'];
const DEPARTAMENTOS = ['TI', 'Financeiro', 'RH', 'Comercial', 'Marketing', 'Jurídico', 'Vendas', 'Logística', 'Operações'];
const SLA_HORAS = { 'Baixa': 72, 'Média': 48, 'Alta': 24, 'Crítica': 4 };
const STATUS_KEY = { 'Aberto': 'aberto', 'Em andamento': 'andamento', 'Pendente': 'pendente', 'Concluído': 'concluido' };
const PRIO_KEY = { 'Baixa': 'baixa', 'Média': 'media', 'Alta': 'alta', 'Crítica': 'critica' };
const ROLE_KEY = { 'Administrador': 'admin', 'Técnico': 'tecnico', 'Solicitante': 'solicitante' };

const HOUR = 36e5;
const DAY = 24 * HOUR;
const toISO = (ms) => new Date(ms).toISOString();

/* ---------- Dados iniciais (gerados de forma determinística) ---------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedData() {
  const now = Date.now();
  const users = [
    ['u1', 'Ana Martins', 'ana.martins@nexadesk.com', 'Administrador', 'TI', '(11) 98888-0000', true],
    ['u2', 'Carlos Lima', 'carlos.lima@nexadesk.com', 'Técnico', 'TI', '(11) 97777-1111', true],
    ['u3', 'Marina Alves', 'marina.alves@nexadesk.com', 'Técnico', 'TI', '(11) 96666-2222', true],
    ['u4', 'Rafael Gomes', 'rafael.gomes@nexadesk.com', 'Técnico', 'TI', '(11) 95555-3333', true],
    ['u5', 'Bruno Reis', 'bruno.reis@nexadesk.com', 'Solicitante', 'Financeiro', '(11) 94444-4444', true],
    ['u6', 'Juliana Costa', 'juliana.costa@nexadesk.com', 'Solicitante', 'RH', '', true],
    ['u7', 'Pedro Martins', 'pedro.martins@nexadesk.com', 'Solicitante', 'Comercial', '', false],
    ['u8', 'Ana Souza', 'ana.souza@nexadesk.com', 'Solicitante', 'Marketing', '', true],
    ['u9', 'Larissa Melo', 'larissa.melo@nexadesk.com', 'Solicitante', 'Jurídico', '', true],
    ['u10', 'Felipe Rocha', 'felipe.rocha@nexadesk.com', 'Solicitante', 'Vendas', '', true],
    ['u11', 'Camila Dias', 'camila.dias@nexadesk.com', 'Solicitante', 'Financeiro', '', true],
    ['u12', 'Gustavo Nunes', 'gustavo.nunes@nexadesk.com', 'Solicitante', 'Logística', '', true],
  ].map(([id, nome, email, perfil, departamento, telefone, ativo], i) => ({
    id, nome, email, senha: '123456', perfil, departamento, telefone, ativo,
    criadoEm: toISO(now - (420 - i * 12) * DAY),
    ultimoAcesso: toISO(now - (ativo ? (i * 5 + 1) * HOUR : 12 * DAY)),
  }));
  const name = (id) => users.find((u) => u.id === id).nome;
  const r = mulberry32(2026);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const weighted = (items, weights) => {
    let x = r() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < items.length; i++) { x -= weights[i]; if (x < 0) return items[i]; }
    return items[items.length - 1];
  };

  const DESC = {
    'Hardware': 'O equipamento apresenta falha intermitente e está atrapalhando o trabalho do dia a dia. Já tentei reiniciar, sem sucesso.',
    'Software': 'O programa apresenta erro ao abrir e fecha sozinho. O problema começou após a última atualização.',
    'Rede / VPN': 'A conexão está instável e cai várias vezes ao dia, impedindo o acesso aos sistemas internos.',
    'Acesso e senhas': 'Preciso de liberação de acesso para executar minhas atividades. Meu gestor já aprovou a solicitação.',
    'E-mail': 'Estou com problemas no e-mail corporativo: mensagens não chegam ou ficam presas na caixa de saída.',
    'Impressoras': 'A impressora do setor não responde aos comandos de impressão e exibe uma luz de erro.',
    'Outros': 'Solicitação geral para a equipe de TI. Detalhes adicionais podem ser combinados pelo chat.',
  };
  const POOL = [
    ['Computador não liga', 'Hardware'], ['Monitor piscando', 'Hardware'], ['Teclado com teclas falhando', 'Hardware'],
    ['Solicitação de novo headset', 'Hardware'], ['Erro ao abrir o ERP', 'Software'], ['Atualização do Windows travada', 'Software'],
    ['Instalação do Adobe Reader', 'Software'], ['Sem acesso à internet', 'Rede / VPN'], ['Wi-Fi da sala de reunião instável', 'Rede / VPN'],
    ['Senha do e-mail expirada', 'Acesso e senhas'], ['Acesso à pasta compartilhada', 'Acesso e senhas'], ['Caixa de e-mail cheia', 'E-mail'],
    ['E-mails indo para o spam', 'E-mail'], ['Impressora atolando papel', 'Impressoras'], ['Scanner não reconhece documento', 'Impressoras'],
    ['Configurar ramal telefônico', 'Outros'],
  ];
  const SOLIC = ['u5', 'u6', 'u8', 'u9', 'u10', 'u11', 'u12'];
  const TECS = ['u2', 'u3', 'u4'];

  function makeTicket({ id, titulo, descricao, categoria, prioridade, status, sol, tec, created, durHours, reaberto }) {
    const hist = [{ data: toISO(created), texto: `Chamado aberto por ${name(sol)}`, cor: 'aberto' }];
    let t = created;
    if (prioridade === 'Crítica') { t += 8 * 60e3; hist.push({ data: toISO(t), texto: 'Prioridade definida como Crítica', cor: 'critica' }); }
    if (tec) { t += (8 + r() * 40) * 60e3; hist.push({ data: toISO(t), texto: `${name(tec)} foi atribuído(a) como técnico responsável`, cor: 'primary' }); }
    if (status !== 'Aberto') { t += (5 + r() * 20) * 60e3; hist.push({ data: toISO(t), texto: `${name(tec)} alterou o status para Em andamento`, cor: 'andamento' }); }
    if (status === 'Pendente') {
      t += (1 + r() * 4) * HOUR;
      hist.push({ data: toISO(t), texto: `${name(tec)} alterou o status para Pendente`, cor: 'pendente' });
      hist.push({ data: toISO(t + 60e3), tipo: 'comentario', autor: name(tec), texto: 'Aguardando retorno do solicitante com mais informações.', cor: 'info' });
      t += 60e3;
    }
    let resolvido = null;
    if (status === 'Concluído') {
      resolvido = Math.min(created + durHours * HOUR, now - HOUR);
      if (reaberto) {
        const mid = created + (resolvido - created) * 0.5;
        hist.push({ data: toISO(mid), texto: `${name(tec)} alterou o status para Concluído`, cor: 'concluido' });
        hist.push({ data: toISO(mid + 30 * 60e3), texto: `${name(sol)} reabriu o chamado`, cor: 'aberto' });
      }
      hist.push({ data: toISO(resolvido), texto: `${name(tec)} alterou o status para Concluído`, cor: 'concluido' });
      t = resolvido;
    }
    return {
      id, titulo, descricao, categoria, prioridade, status,
      solicitanteId: sol, tecnicoId: tec || null,
      criadoEm: toISO(created), atualizadoEm: toISO(t),
      resolvidoEm: resolvido ? toISO(resolvido) : null,
      reaberto: !!reaberto, historico: hist,
    };
  }

  const tickets = [];
  const dates = Array.from({ length: 52 }, () => now - (6 + r() * 174) * DAY).sort((a, b) => a - b);
  dates.forEach((created, i) => {
    const [titulo, categoria] = pick(POOL);
    const prioridade = weighted(PRIORIDADES, [28, 38, 24, 10]);
    const age = (now - created) / DAY;
    const status = age > 20 ? (r() < 0.9 ? 'Concluído' : weighted(['Pendente', 'Em andamento'], [1, 1])) : weighted(STATUS, [25, 30, 15, 30]);
    const tec = status === 'Aberto' && r() < 0.4 ? null : pick(TECS);
    const sla = SLA_HORAS[prioridade];
    const durHours = sla * (r() < 0.9 ? 0.2 + r() * 0.75 : 1.05 + r() * 0.6);
    tickets.push(makeTicket({
      id: 972 + i, titulo, descricao: DESC[categoria], categoria, prioridade, status,
      sol: pick(SOLIC), tec, created, durHours, reaberto: status === 'Concluído' && r() < 0.05,
    }));
  });

  // Chamados recentes (os mesmos do protótipo no Figma)
  const NAMED = [
    [1024, 'Lentidão no computador', 'O computador está muito lento desde a última atualização, demorando vários minutos para abrir planilhas.', 'Hardware', 'Média', 'Concluído', 'u12', 'u3', 5.2],
    [1025, 'Acesso ao sistema financeiro', 'Preciso de acesso de leitura ao módulo de contas a pagar do sistema financeiro. Meu gestor já aprovou.', 'Acesso e senhas', 'Alta', 'Aberto', 'u11', 'u2', 4.1],
    [1026, 'E-mail não sincroniza no celular', 'Os e-mails pararam de sincronizar no aplicativo do celular corporativo desde ontem à tarde.', 'E-mail', 'Média', 'Em andamento', 'u10', 'u4', 3.3],
    [1027, 'Troca de mouse e teclado', 'Mouse com clique falhando e teclado com teclas soltas. Solicito a troca dos periféricos.', 'Hardware', 'Baixa', 'Concluído', 'u9', 'u3', 3.1],
    [1028, 'Impressora do 2º andar sem conexão', 'A impressora do 2º andar não aparece na rede. Ninguém do setor consegue imprimir.', 'Impressoras', 'Média', 'Pendente', 'u7', 'u4', 2.2],
    [1029, 'Instalação do pacote Office', 'Novo colaborador do RH precisa do pacote Office instalado e licenciado.', 'Software', 'Baixa', 'Concluído', 'u6', 'u2', 2.1],
    [1030, 'Erro ao acessar VPN', 'Desde hoje cedo não consigo conectar na VPN da empresa. O cliente exibe a mensagem "Falha na autenticação (erro 809)". Já reiniciei o notebook e testei em outra rede, mas o problema continua. Preciso acessar o sistema financeiro até as 14h.', 'Rede / VPN', 'Crítica', 'Em andamento', 'u5', 'u3', 1.1],
    [1031, 'Notebook não liga', 'O notebook não liga mesmo conectado ao carregador. A luz de energia não acende.', 'Hardware', 'Alta', 'Aberto', 'u8', 'u2', 0.3],
  ];
  for (const [id, titulo, descricao, categoria, prioridade, status, sol, tec, daysAgo] of NAMED) {
    tickets.push(makeTicket({
      id, titulo, descricao, categoria, prioridade, status, sol, tec,
      created: now - daysAgo * DAY, durHours: SLA_HORAS[prioridade] * 0.4,
    }));
  }
  return { users, tickets };
}

/* ---------- Store ---------- */
const Store = {
  read(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; }
  },
  write(key, value) { localStorage.setItem(key, JSON.stringify(value)); },

  init() {
    if (this.read(KEYS.version) !== DATA_VERSION || !localStorage.getItem(KEYS.users) || !localStorage.getItem(KEYS.tickets)) {
      const d = seedData();
      this.write(KEYS.users, d.users);
      this.write(KEYS.tickets, d.tickets);
      this.write(KEYS.version, DATA_VERSION);
    }
  },
  reset() {
    [KEYS.users, KEYS.tickets, KEYS.version].forEach((k) => localStorage.removeItem(k));
    this.init();
  },

  /* usuários */
  users() { return this.read(KEYS.users, []); },
  saveUsers(list) { this.write(KEYS.users, list); },
  user(id) { return this.users().find((u) => u.id === id) || null; },
  userName(id) { const u = this.user(id); return u ? u.nome : 'Não atribuído'; },
  tecnicos() { return this.users().filter((u) => u.perfil === 'Técnico' && u.ativo); },
  emailInUse(email, exceptId) {
    const e = email.trim().toLowerCase();
    return this.users().some((u) => u.email.toLowerCase() === e && u.id !== exceptId);
  },
  createUser(data) {
    const list = this.users();
    const next = Math.max(0, ...list.map((u) => Number(u.id.slice(1)) || 0)) + 1;
    const u = { id: 'u' + next, criadoEm: new Date().toISOString(), ultimoAcesso: null, telefone: '', ...data };
    list.push(u); this.saveUsers(list); return u;
  },
  updateUser(id, patch) {
    const list = this.users();
    const u = list.find((x) => x.id === id);
    if (!u) return null;
    Object.assign(u, patch); this.saveUsers(list); return u;
  },
  deleteUser(id) { this.saveUsers(this.users().filter((u) => u.id !== id)); },
  linkedTickets(userId) { return this.tickets().filter((t) => t.solicitanteId === userId || t.tecnicoId === userId).length; },

  /* chamados */
  tickets() { return this.read(KEYS.tickets, []); },
  saveTickets(list) { this.write(KEYS.tickets, list); },
  ticket(id) { return this.tickets().find((t) => t.id === Number(id)) || null; },

  createTicket(data, autorId) {
    const list = this.tickets();
    const now = new Date().toISOString();
    const id = Math.max(1000, ...list.map((t) => t.id)) + 1;
    const autor = this.userName(autorId);
    const t = {
      id, status: 'Aberto', criadoEm: now, atualizadoEm: now, resolvidoEm: null, reaberto: false,
      ...data, historico: [{ data: now, texto: `Chamado aberto por ${autor}`, cor: 'aberto' }],
    };
    if (t.tecnicoId) t.historico.push({ data: now, texto: `${this.userName(t.tecnicoId)} foi atribuído(a) como técnico responsável`, cor: 'primary' });
    list.push(t); this.saveTickets(list); return t;
  },

  updateTicket(id, patch, autorId) {
    const list = this.tickets();
    const t = list.find((x) => x.id === Number(id));
    if (!t) return null;
    const now = new Date().toISOString();
    const autor = this.userName(autorId);
    const log = (texto, cor) => t.historico.push({ data: now, texto, cor });

    const edited = ['titulo', 'descricao', 'categoria', 'solicitanteId'].some((k) => k in patch && patch[k] !== t[k]);
    if (edited) log(`${autor} editou as informações do chamado`, 'secondary');
    if ('prioridade' in patch && patch.prioridade !== t.prioridade) log(`${autor} alterou a prioridade para ${patch.prioridade}`, PRIO_KEY[patch.prioridade]);
    if ('tecnicoId' in patch && (patch.tecnicoId || null) !== (t.tecnicoId || null)) {
      log(patch.tecnicoId ? `${this.userName(patch.tecnicoId)} foi atribuído(a) como técnico responsável` : `${autor} removeu o técnico responsável`, 'primary');
    }
    if ('status' in patch && patch.status !== t.status) {
      if (t.status === 'Concluído') { t.reaberto = true; t.resolvidoEm = null; }
      if (t.status === 'Concluído' && patch.status === 'Aberto') log(`${autor} reabriu o chamado`, 'aberto');
      else log(`${autor} alterou o status para ${patch.status}`, STATUS_KEY[patch.status]);
      if (patch.status === 'Concluído') t.resolvidoEm = now;
    }
    Object.assign(t, patch, { atualizadoEm: now });
    this.saveTickets(list); return t;
  },

  comment(id, texto, autorId) {
    const list = this.tickets();
    const t = list.find((x) => x.id === Number(id));
    if (!t) return null;
    const now = new Date().toISOString();
    t.historico.push({ data: now, tipo: 'comentario', autor: this.userName(autorId), texto, cor: 'info' });
    t.atualizadoEm = now;
    this.saveTickets(list); return t;
  },

  deleteTicket(id) { this.saveTickets(this.tickets().filter((t) => t.id !== Number(id))); },
};

/* ---------- Autenticação (demonstrativa) ---------- */
const Auth = {
  current() {
    const s = Store.read(KEYS.session, null);
    if (!s) return null;
    const u = Store.user(s.userId);
    return u && u.ativo ? u : null;
  },
  login(email, senha) {
    const u = Store.users().find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!u || u.senha !== senha) return { ok: false, msg: 'E-mail ou senha inválidos.' };
    if (!u.ativo) return { ok: false, msg: 'Usuário inativo. Procure o administrador do sistema.' };
    Store.write(KEYS.session, { userId: u.id, desde: new Date().toISOString() });
    Store.updateUser(u.id, { ultimoAcesso: new Date().toISOString() });
    return { ok: true, user: u };
  },
  logout() {
    localStorage.removeItem(KEYS.session);
    location.href = 'index.html';
  },
  /* permissões por perfil */
  can(action, u) {
    const p = u.perfil;
    switch (action) {
      case 'users': return p === 'Administrador';
      case 'reports': return p !== 'Solicitante';
      case 'manageTickets': return p !== 'Solicitante';
      case 'resetData': return p === 'Administrador';
      default: return true;
    }
  },
  visibleTickets(u) {
    const all = Store.tickets();
    return u.perfil === 'Solicitante' ? all.filter((t) => t.solicitanteId === u.id) : all;
  },
};
