/* ==========================================================================
   NexaDesk — Layout compartilhado (sidebar + topbar) e proteção de rotas
   ========================================================================== */
const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', href: 'dashboard.html' },
  { key: 'chamados', label: 'Chamados', icon: 'ticket', href: 'chamados.html' },
  { key: 'novo', label: 'Novo chamado', icon: 'plus', href: 'novo-chamado.html' },
  { key: 'usuarios', label: 'Usuários', icon: 'users', href: 'usuarios.html', perm: 'users' },
  { key: 'relatorios', label: 'Relatórios', icon: 'chart-column', href: 'relatorios.html', perm: 'reports' },
  { key: 'perfil', label: 'Perfil', icon: 'settings', href: 'perfil.html' },
];

function notifications(me) {
  const open = Auth.visibleTickets(me).filter((t) => t.status !== 'Concluído');
  let list;
  if (me.perfil === 'Técnico') list = open.filter((t) => t.tecnicoId === me.id && t.status !== 'Pendente');
  else if (me.perfil === 'Administrador') list = open.filter((t) => t.prioridade === 'Crítica' || !t.tecnicoId);
  else list = open.filter((t) => t.status === 'Pendente');
  const reason = (t) => {
    if (me.perfil === 'Solicitante') return 'Aguardando seu retorno';
    if (!t.tecnicoId) return 'Sem técnico atribuído';
    if (t.prioridade === 'Crítica') return 'Prioridade crítica em aberto';
    return `Atribuído a você · ${t.status}`;
  };
  return list.sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm)).slice(0, 6).map((t) => ({ t, reason: reason(t) }));
}

function confirmLogout() {
  confirmDialog({ title: 'Encerrar sessão?', text: 'Você precisará entrar novamente para acessar o NexaDesk.', confirmText: 'Sair', icon: 'log-out' })
    .then((ok) => ok && Auth.logout());
}

/** Monta sidebar/topbar, valida sessão e permissão. Retorna o usuário logado (ou null). */
function mountShell() {
  Store.init();
  const me = Auth.current();
  if (!me) { location.replace('index.html'); return null; }
  const { page, perm } = document.body.dataset;
  if (perm && !Auth.can(perm, me)) {
    flash('Você não tem permissão para acessar essa página.', 'error');
    location.replace('dashboard.html');
    return null;
  }

  $('#sidebar').innerHTML = `
    <a href="dashboard.html" class="logo"><span class="logo__mark"><i data-lucide="headphones"></i></span><span>NexaDesk</span></a>
    <nav class="menu" aria-label="Menu principal">
      <span class="menu__label">MENU</span>
      ${NAV.filter((n) => !n.perm || Auth.can(n.perm, me)).map((n) => `
        <a class="nav-item${n.key === page ? ' is-active' : ''}" href="${n.href}" title="${n.label}"${n.key === page ? ' aria-current="page"' : ''}>
          <i data-lucide="${n.icon}"></i><span>${n.label}</span></a>`).join('')}
    </nav>
    <button class="nav-item" id="logout-btn" title="Sair"><i data-lucide="log-out"></i><span>Sair</span></button>`;

  const notifs = notifications(me);
  $('#topbar').innerHTML = `
    <form class="global-search" id="global-search" role="search">
      <i data-lucide="search"></i>
      <input name="q" placeholder="Buscar chamados, usuários..." autocomplete="off" aria-label="Buscar" value="${esc(page === 'chamados' ? param('q') || '' : '')}">
    </form>
    <div class="topbar__right">
      <div class="dd">
        <button class="icon-btn icon-btn--lg" data-dd aria-label="Notificações"><i data-lucide="bell"></i>${notifs.length ? `<span class="notif-count">${notifs.length}</span>` : ''}</button>
        <div class="dropdown dropdown--notif">
          <div class="dropdown__title">Notificações</div>
          ${notifs.length ? notifs.map(({ t, reason }) => `
            <a class="notif" href="chamado.html?id=${t.id}">
              ${badge('prio', t.prioridade)}
              <span class="notif__text"><span class="truncate"><b>${ticketCode(t)}</b> ${esc(t.titulo)}</span><span class="cap muted">${esc(reason)}</span></span>
            </a>`).join('') : '<p class="dropdown__empty">Nenhuma notificação no momento.</p>'}
        </div>
      </div>
      <span class="divider-v"></span>
      <div class="dd">
        <button class="user-menu" data-dd aria-label="Menu do usuário">
          ${avatar(me.nome, me.perfil)}
          <span class="user-menu__info"><span class="body-m">${esc(me.nome)}</span><span class="cap muted">${esc(me.perfil)}</span></span>
          <i data-lucide="chevron-down"></i>
        </button>
        <div class="dropdown">
          <a class="dropdown__item" href="perfil.html"><i data-lucide="user"></i>Meu perfil</a>
          <button class="dropdown__item dropdown__item--danger" data-logout><i data-lucide="log-out"></i>Sair</button>
        </div>
      </div>
    </div>`;

  $('#global-search').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = e.target.q.value.trim();
    location.href = `chamados.html${q ? '?q=' + encodeURIComponent(q) : ''}`;
  });
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-dd]');
    const dd = trigger && trigger.closest('.dd');
    $$('.dd.is-open').forEach((x) => { if (x !== dd) x.classList.remove('is-open'); });
    if (dd) dd.classList.toggle('is-open');
    else if (!e.target.closest('.dropdown')) $$('.dd.is-open').forEach((x) => x.classList.remove('is-open'));
  });
  $('#logout-btn').addEventListener('click', confirmLogout);
  $('[data-logout]').addEventListener('click', confirmLogout);

  icons();
  showFlash();
  return me;
}
