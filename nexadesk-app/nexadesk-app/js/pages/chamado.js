/* Detalhes do chamado — RF04, RF05, RF06, RF07 */
(function () {
  const me = mountShell();
  if (!me) return;
  const staff = Auth.can('manageTickets', me);
  const id = Number(param('id'));

  function render() {
    const t = Store.ticket(id);
    if (!t || (!staff && t.solicitanteId !== me.id)) {
      $('#content').innerHTML = `${pageHeader('Chamado não encontrado', 'Ele pode ter sido excluído ou você não tem acesso a ele.',
        '<a class="btn btn--ghost" href="chamados.html"><i data-lucide="arrow-left"></i>Voltar</a>')}
        <div class="card">${emptyState('Nenhum chamado para exibir.', 'search-x')}</div>`;
      icons();
      return;
    }
    document.title = `${ticketCode(t)} · NexaDesk`;
    const sol = Store.user(t.solicitanteId);
    const sla = slaInfo(t);
    const events = [...t.historico].reverse();

    $('#content').innerHTML = `
      ${pageHeader(`${ticketCode(t)} · ${t.titulo}`, `Aberto por ${sol ? sol.nome : '—'} em ${fmtDate(t.criadoEm)} às ${fmtTime(t.criadoEm)}`, `
        <a class="btn btn--ghost" href="chamados.html"><i data-lucide="arrow-left"></i>Voltar</a>
        ${staff ? `<a class="btn btn--secondary" href="novo-chamado.html?id=${t.id}"><i data-lucide="pencil"></i>Editar</a>
        <button class="btn btn--danger" id="delete"><i data-lucide="trash-2"></i>Excluir</button>` : ''}`)}
      <div class="two-col">
        <div class="stack">
          <div class="card">
            <h2 class="h3">Descrição</h2>
            <p class="muted pre">${esc(t.descricao)}</p>
          </div>
          <div class="card">
            <div class="card__header"><h2 class="h3">Histórico</h2><span class="cap muted">${t.historico.length} evento${t.historico.length === 1 ? '' : 's'}</span></div>
            <form class="comment-form" id="comment-form">
              <div class="field">
                <label for="comentario">Adicionar comentário</label>
                <div class="control"><i data-lucide="message-square"></i><input id="comentario" name="comentario" maxlength="500" autocomplete="off"
                  placeholder="${staff ? 'Escreva uma atualização para o solicitante...' : 'Envie mais informações para o técnico...'}"></div>
              </div>
              <button class="btn btn--primary" type="submit">Comentar</button>
            </form>
            <div class="timeline">
              ${events.map((e) => `
                <div class="event${e.tipo === 'comentario' ? ' event--comment' : ''}" style="--c:var(${EVENT_VAR[e.cor] || '--text-secondary'})">
                  <span class="event__dot"></span>
                  <div class="event__body">
                    ${e.tipo === 'comentario' ? `<span class="body-m">${esc(e.autor)} comentou</span><div class="event__text">${esc(e.texto)}</div>` : `<span>${esc(e.texto)}</span>`}
                    <span class="cap muted">${fmtDateTime(e.data)}</span>
                  </div>
                </div>`).join('')}
            </div>
          </div>
        </div>

        <aside class="stack">
          <div class="card">
            <h2 class="h3">Detalhes</h2>
            <div class="detail"><span>Status</span>${badge('status', t.status)}</div>
            <div class="detail"><span>Prioridade</span>${badge('prio', t.prioridade)}</div>
            <div class="detail"><span>Técnico</span>${person(t.tecnicoId)}</div>
            <div class="detail"><span>Categoria</span><span>${esc(t.categoria)}</span></div>
            <div class="detail"><span>Solicitante</span><span>${esc(sol ? sol.nome : '—')}</span></div>
            <div class="detail"><span>Criado em</span><span>${fmtDate(t.criadoEm)} ${fmtTime(t.criadoEm)}</span></div>
            <div class="detail"><span>Atualizado em</span><span>${fmtDate(t.atualizadoEm)} ${fmtTime(t.atualizadoEm)}</span></div>
            <div class="detail"><span>Prazo (SLA ${SLA_HORAS[t.prioridade]}h)</span><span class="sla sla--${sla.cls}">${sla.text}</span></div>
          </div>
          ${staff ? `
          <form class="card form" id="manage-form">
            <h2 class="h3">Atendimento</h2>
            <div class="field"><label for="m-status">Status</label>${selectControl('m-status', options(STATUS, t.status))}</div>
            <div class="field"><label for="m-prio">Prioridade</label>${selectControl('m-prio', options(PRIORIDADES, t.prioridade))}</div>
            <div class="field"><label for="m-tec">Técnico responsável</label>${selectControl('m-tec', `<option value="">Não atribuído</option>${options(Store.tecnicos(), t.tecnicoId, (u) => u.nome, (u) => u.id)}`)}</div>
            ${!t.tecnicoId && me.perfil === 'Técnico' ? '<button type="button" class="btn btn--secondary btn--block" id="assume"><i data-lucide="hand"></i>Assumir chamado</button>' : ''}
            <button class="btn btn--primary btn--block" type="submit"><i data-lucide="check"></i>Atualizar chamado</button>
          </form>` : `
          <div class="card">
            <h2 class="h3">Precisa de algo mais?</h2>
            <p class="muted">Use os comentários para enviar informações ao técnico responsável.</p>
            ${t.status === 'Concluído' ? '<button class="btn btn--secondary btn--block" id="reopen"><i data-lucide="rotate-ccw"></i>Reabrir chamado</button>' : ''}
          </div>`}
        </aside>
      </div>`;
    icons();
    bind(t);
  }

  function bind(t) {
    $('#comment-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = e.target.comentario;
      clearErrors(e.target);
      if (input.value.trim().length < 2) { setError(input, 'Escreva um comentário.'); return; }
      Store.comment(t.id, input.value.trim(), me.id);
      toast('Comentário adicionado.');
      render();
    });
    const del = $('#delete');
    if (del) del.addEventListener('click', async () => {
      const ok = await confirmDialog({ title: 'Excluir chamado?', text: `O chamado ${ticketCode(t)} será removido permanentemente. Essa ação não pode ser desfeita.`, confirmText: 'Excluir' });
      if (!ok) return;
      Store.deleteTicket(t.id);
      flash(`Chamado ${ticketCode(t)} excluído.`);
      location.href = 'chamados.html';
    });
    const mf = $('#manage-form');
    if (mf) mf.addEventListener('submit', (e) => {
      e.preventDefault();
      const patch = {};
      if (mf['m-status'].value !== t.status) patch.status = mf['m-status'].value;
      if (mf['m-prio'].value !== t.prioridade) patch.prioridade = mf['m-prio'].value;
      if ((mf['m-tec'].value || null) !== (t.tecnicoId || null)) patch.tecnicoId = mf['m-tec'].value || null;
      if (!Object.keys(patch).length) { toast('Nenhuma alteração para salvar.', 'info'); return; }
      Store.updateTicket(t.id, patch, me.id);
      toast('Chamado atualizado.');
      render();
    });
    const assume = $('#assume');
    if (assume) assume.addEventListener('click', () => {
      Store.updateTicket(t.id, { tecnicoId: me.id, status: t.status === 'Aberto' ? 'Em andamento' : t.status }, me.id);
      toast('Você assumiu este chamado.');
      render();
    });
    const reopen = $('#reopen');
    if (reopen) reopen.addEventListener('click', async () => {
      const ok = await confirmDialog({ title: 'Reabrir chamado?', text: 'O chamado voltará para a fila da equipe de TI com o status "Aberto".', confirmText: 'Reabrir', danger: false, icon: 'rotate-ccw' });
      if (!ok) return;
      Store.updateTicket(t.id, { status: 'Aberto' }, me.id);
      toast('Chamado reaberto.');
      render();
    });
  }

  render();
})();
