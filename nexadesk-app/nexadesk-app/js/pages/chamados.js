/* Chamados — RF04, RF08, RF09 */
(function () {
  const me = mountShell();
  if (!me) return;
  const staff = Auth.can('manageTickets', me);
  const PER_PAGE = 8;
  const state = {
    q: param('q') || '',
    status: STATUS.includes(param('status')) ? param('status') : '',
    prio: PRIORIDADES.includes(param('prioridade')) ? param('prioridade') : '',
    page: 1,
  };

  $('#content').innerHTML = `
    ${pageHeader('Chamados', staff ? 'Gerencie, pesquise e filtre todas as solicitações' : 'Acompanhe as solicitações que você abriu',
      '<a class="btn btn--primary" href="novo-chamado.html"><i data-lucide="plus"></i>Novo chamado</a>')}
    <div class="toolbar no-print">
      <div class="field field--grow"><div class="control"><i data-lucide="search"></i>
        <input id="f-q" type="search" placeholder="Pesquisar por ID, título, solicitante ou técnico..." aria-label="Pesquisar chamados" value="${esc(state.q)}"></div></div>
      <div class="field field--select">${selectControl('f-status', `<option value="">Todos os status</option>${options(STATUS, state.status)}`, { icon: 'filter' })}</div>
      <div class="field field--select">${selectControl('f-prio', `<option value="">Todas as prioridades</option>${options(PRIORIDADES, state.prio)}`, { icon: 'filter' })}</div>
      <button class="btn btn--ghost" id="f-clear"><i data-lucide="x"></i>Limpar</button>
    </div>
    <div id="list"></div>`;

  function filtered() {
    const q = norm(state.q).replace('#', '');
    return Auth.visibleTickets(me)
      .filter((t) => !state.status || t.status === state.status)
      .filter((t) => !state.prio || t.prioridade === state.prio)
      .filter((t) => !q || norm(`nx-${t.id} ${t.titulo} ${t.categoria} ${Store.userName(t.solicitanteId)} ${t.tecnicoId ? Store.userName(t.tecnicoId) : ''}`).includes(q))
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }

  function pageList(cur, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const set = new Set([1, 2, total, cur - 1, cur, cur + 1].filter((n) => n >= 1 && n <= total));
    const arr = [...set].sort((a, b) => a - b);
    const out = [];
    arr.forEach((n, i) => { if (i && n - arr[i - 1] > 1) out.push('…'); out.push(n); });
    return out;
  }

  function syncURL() {
    const p = new URLSearchParams();
    if (state.q) p.set('q', state.q);
    if (state.status) p.set('status', state.status);
    if (state.prio) p.set('prioridade', state.prio);
    history.replaceState(null, '', `chamados.html${p.toString() ? '?' + p : ''}`);
  }

  function render() {
    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    state.page = Math.min(state.page, pages);
    const slice = list.slice((state.page - 1) * PER_PAGE, state.page * PER_PAGE);
    const from = list.length ? (state.page - 1) * PER_PAGE + 1 : 0;

    $('#list').innerHTML = `
      <div class="table-wrap">
        ${slice.length ? `<table class="table table--dense">
          <colgroup><col style="width:116px"><col><col style="width:150px"><col style="width:150px"><col style="width:112px"><col style="width:148px"><col style="width:104px">${staff ? '<col style="width:112px">' : ''}</colgroup>
          <thead><tr><th>ID</th><th>Título</th><th>Solicitante</th><th>Técnico</th><th>Prioridade</th><th>Status</th><th>Data</th>${staff ? '<th>Ações</th>' : ''}</tr></thead>
          <tbody>${slice.map((t) => `
            <tr class="is-clickable" data-id="${t.id}" tabindex="0">
              <td class="td-id">${ticketCode(t)}</td>
              <td><div class="truncate" title="${esc(t.titulo)}">${esc(t.titulo)}</div><div class="cap muted">${esc(t.categoria)}</div></td>
              <td><div class="truncate">${esc(Store.userName(t.solicitanteId))}</div></td>
              <td><div class="truncate">${t.tecnicoId ? esc(Store.userName(t.tecnicoId)) : '<span class="muted">Não atribuído</span>'}</div></td>
              <td>${badge('prio', t.prioridade)}</td>
              <td>${badge('status', t.status)}</td>
              <td>${fmtDate(t.criadoEm)}</td>
              ${staff ? `<td><div class="row-actions">
                <a class="icon-btn" href="novo-chamado.html?id=${t.id}" title="Editar" aria-label="Editar ${ticketCode(t)}" data-stop><i data-lucide="pencil"></i></a>
                <button class="icon-btn icon-btn--danger" data-del="${t.id}" title="Excluir" aria-label="Excluir ${ticketCode(t)}" data-stop><i data-lucide="trash-2"></i></button>
              </div></td>` : ''}
            </tr>`).join('')}</tbody>
        </table>` : emptyState(state.q || state.status || state.prio ? 'Nenhum chamado encontrado com esses filtros.' : 'Nenhum chamado registrado ainda.', 'search-x')}
      </div>
      <div class="pagination">
        <span class="muted">Mostrando ${from}–${from + slice.length - (slice.length ? 1 : 0)} de ${list.length} chamado${list.length === 1 ? '' : 's'}</span>
        ${pages > 1 ? `<div class="pages" role="navigation" aria-label="Paginação">
          <button class="page-btn" data-page="${state.page - 1}" ${state.page === 1 ? 'disabled' : ''} aria-label="Página anterior"><i data-lucide="chevron-left"></i></button>
          ${pageList(state.page, pages).map((p) => (p === '…' ? '<span class="page-gap">…</span>'
            : `<button class="page-btn${p === state.page ? ' is-active' : ''}" data-page="${p}"${p === state.page ? ' aria-current="page"' : ''}>${p}</button>`)).join('')}
          <button class="page-btn" data-page="${state.page + 1}" ${state.page === pages ? 'disabled' : ''} aria-label="Próxima página"><i data-lucide="chevron-right"></i></button>
        </div>` : ''}
      </div>`;
    icons();

    $$('tr[data-id]').forEach((tr) => {
      const go = () => (location.href = `chamado.html?id=${tr.dataset.id}`);
      tr.addEventListener('click', (e) => { if (!fromStop(e)) go(); });
      tr.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target === tr) go(); });
    });
    $$('.page-btn[data-page]').forEach((b) => b.addEventListener('click', () => { state.page = Number(b.dataset.page); render(); }));
    $$('[data-del]').forEach((b) => b.addEventListener('click', async () => {
      const t = Store.ticket(b.dataset.del);
      const ok = await confirmDialog({
        title: 'Excluir chamado?',
        text: `O chamado ${ticketCode(t)} será removido permanentemente. Essa ação não pode ser desfeita.`,
        confirmText: 'Excluir',
      });
      if (!ok) return;
      Store.deleteTicket(t.id);
      toast(`Chamado ${ticketCode(t)} excluído.`);
      render();
    }));
  }

  let timer;
  $('#f-q').addEventListener('input', (e) => { clearTimeout(timer); timer = setTimeout(() => { state.q = e.target.value.trim(); state.page = 1; syncURL(); render(); }, 150); });
  $('#f-status').addEventListener('change', (e) => { state.status = e.target.value; state.page = 1; syncURL(); render(); });
  $('#f-prio').addEventListener('change', (e) => { state.prio = e.target.value; state.page = 1; syncURL(); render(); });
  $('#f-clear').addEventListener('click', () => {
    Object.assign(state, { q: '', status: '', prio: '', page: 1 });
    $('#f-q').value = ''; $('#f-status').value = ''; $('#f-prio').value = '';
    const gs = $('#global-search input'); if (gs) gs.value = '';
    syncURL(); render();
  });

  render();
})();
