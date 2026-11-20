/* Novo chamado / Editar chamado — RF03, RF04, RF05, RF06 */
(function () {
  const editId = param('id');
  if (editId) document.body.dataset.page = 'chamados';
  const me = mountShell();
  if (!me) return;
  const staff = Auth.can('manageTickets', me);
  const t = editId ? Store.ticket(editId) : null;
  if (editId && (!t || !staff)) {
    flash(t ? 'Apenas a equipe de TI pode editar chamados.' : 'Chamado não encontrado.', 'error');
    location.replace('chamados.html');
    return;
  }
  document.title = `${t ? 'Editar chamado' : 'Novo chamado'} · NexaDesk`;

  const solicitantes = Store.users().filter((u) => u.ativo || (t && u.id === t.solicitanteId));
  const tecnicos = Store.tecnicos();
  const v = t || { titulo: '', descricao: '', categoria: 'Hardware', prioridade: 'Média', solicitanteId: me.id, tecnicoId: '' };

  $('#content').innerHTML = `
    ${pageHeader(t ? `Editar chamado ${ticketCode(t)}` : 'Novo chamado',
      t ? 'Atualize as informações da solicitação' : 'Preencha as informações para registrar uma solicitação',
      `<a class="btn btn--ghost" href="${t ? `chamado.html?id=${t.id}` : 'chamados.html'}"><i data-lucide="arrow-left"></i>Voltar</a>`)}
    <div class="two-col">
      <form class="card form" id="ticket-form" novalidate>
        <h2 class="h3">Informações do chamado</h2>
        <div class="field">
          <label for="titulo">Título *</label>
          <div class="control"><input id="titulo" name="titulo" maxlength="80" placeholder="Ex.: Impressora não imprime" value="${esc(v.titulo)}"></div>
        </div>
        <div class="field">
          <label for="descricao">Descrição *</label>
          <div class="control control--textarea"><textarea id="descricao" name="descricao" maxlength="1500" placeholder="Descreva o problema com o máximo de detalhes: o que aconteceu, quando começou e mensagens de erro exibidas.">${esc(v.descricao)}</textarea></div>
          <span class="field__hint" id="desc-count"></span>
        </div>
        <div class="form-row">
          <div class="field"><label for="categoria">Categoria</label>${selectControl('categoria', options(CATEGORIAS, v.categoria))}</div>
          <div class="field"><label for="prioridade">Prioridade</label>${selectControl('prioridade', options(PRIORIDADES, v.prioridade))}</div>
        </div>
        <div class="form-row">
          <div class="field">
            <label for="solicitanteId">Solicitante</label>
            ${staff ? selectControl('solicitanteId', options(solicitantes, v.solicitanteId, (u) => `${u.nome} · ${u.departamento}`, (u) => u.id), { icon: 'user' })
              : `<div class="control is-disabled"><i data-lucide="user"></i><input value="${esc(me.nome)}" disabled></div>`}
          </div>
          <div class="field">
            <label for="tecnicoId">Técnico responsável</label>
            ${staff ? selectControl('tecnicoId', `<option value="">Não atribuído</option>${options(tecnicos, v.tecnicoId, (u) => u.nome, (u) => u.id)}`, { icon: 'headphones' })
              : '<div class="control is-disabled"><i data-lucide="headphones"></i><input value="Definido pela equipe de TI" disabled></div>'}
          </div>
        </div>
        ${t ? `<div class="form-row"><div class="field"><label for="status">Status</label>${selectControl('status', options(STATUS, t.status))}</div></div>` : ''}
        <div class="form-actions">
          <a class="btn btn--secondary" href="${t ? `chamado.html?id=${t.id}` : 'chamados.html'}">Cancelar</a>
          <button class="btn btn--primary" type="submit"><i data-lucide="check"></i>${t ? 'Salvar alterações' : 'Registrar chamado'}</button>
        </div>
      </form>

      <aside class="stack">
        <div class="card">
          <h2 class="h3">Prioridades e prazos</h2>
          ${PRIORIDADES.map((p) => `<div class="detail"><span>Até ${SLA_HORAS[p]}h</span>${badge('prio', p)}</div>`).join('')}
          <p class="cap muted">Prazo máximo de atendimento (SLA) contado a partir da abertura do chamado.</p>
        </div>
        <div class="card">
          <h2 class="h3">${t ? 'Status atual' : 'Status inicial'}</h2>
          <div>${badge('status', t ? t.status : 'Aberto')}</div>
          <p class="muted">Todo chamado novo entra como "Aberto" e muda para "Em andamento" quando o técnico inicia o atendimento.</p>
        </div>
      </aside>
    </div>`;
  icons();

  const form = $('#ticket-form');
  const count = () => { $('#desc-count').textContent = `${form.descricao.value.length}/1500 caracteres`; };
  form.descricao.addEventListener('input', count); count();

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors(form);
    const data = {
      titulo: form.titulo.value.trim(),
      descricao: form.descricao.value.trim(),
      categoria: form.categoria.value,
      prioridade: form.prioridade.value,
      solicitanteId: staff ? form.solicitanteId.value : me.id,
    };
    if (staff) data.tecnicoId = form.tecnicoId.value || null;
    let ok = true;
    if (data.titulo.length < 5) { setError(form.titulo, 'O título deve ter pelo menos 5 caracteres.'); ok = false; }
    if (data.descricao.length < 10) { setError(form.descricao, 'Descreva o problema com pelo menos 10 caracteres.'); ok = false; }
    if (!ok) { $('.has-error input, .has-error textarea', form).focus(); return; }

    if (t) {
      if (form.status) data.status = form.status.value;
      Store.updateTicket(t.id, data, me.id);
      flash(`Chamado ${ticketCode(t)} atualizado com sucesso.`);
      location.href = `chamado.html?id=${t.id}`;
    } else {
      const n = Store.createTicket(data, me.id);
      flash(`Chamado ${ticketCode(n)} registrado com sucesso.`);
      location.href = `chamado.html?id=${n.id}`;
    }
  });
})();
