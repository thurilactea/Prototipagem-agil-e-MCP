/* Usuários — RF10 (somente Administrador) */
(function () {
  const me = mountShell();
  if (!me) return;
  const state = { q: '', perfil: '', situacao: '' };

  $('#content').innerHTML = `
    ${pageHeader('Usuários', 'Cadastre, edite e defina os perfis de acesso', '<button class="btn btn--primary" id="new-user"><i data-lucide="user-plus"></i>Novo usuário</button>')}
    <section class="grid-kpi grid-kpi--3" id="kpis"></section>
    <div class="toolbar">
      <div class="field field--grow"><div class="control"><i data-lucide="search"></i><input id="f-q" type="search" placeholder="Pesquisar por nome, e-mail ou departamento..." aria-label="Pesquisar usuários"></div></div>
      <div class="field field--select">${selectControl('f-perfil', `<option value="">Todos os perfis</option>${options(PERFIS, '')}`, { icon: 'filter' })}</div>
      <div class="field field--select">${selectControl('f-sit', '<option value="">Todas as situações</option><option value="1">Ativos</option><option value="0">Inativos</option>', { icon: 'filter' })}</div>
    </div>
    <div id="list"></div>`;

  function renderKpis() {
    const users = Store.users();
    const ativos = users.filter((u) => u.ativo);
    const tecs = ativos.filter((u) => u.perfil === 'Técnico');
    const admins = ativos.filter((u) => u.perfil === 'Administrador');
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const novos = users.filter((u) => new Date(u.criadoEm) >= monthStart).length;
    const openTickets = Store.tickets().filter((t) => t.status !== 'Concluído' && t.tecnicoId).length;
    $('#kpis').innerHTML = `
      ${kpiCard({ label: 'Usuários ativos', value: ativos.length, delta: `${novos} novo${novos === 1 ? '' : 's'} este mês · ${users.length - ativos.length} inativo${users.length - ativos.length === 1 ? '' : 's'}`, icon: 'users', color: 'var(--base-primary)' })}
      ${kpiCard({ label: 'Técnicos', value: tecs.length, delta: `Média de ${tecs.length ? Math.round(openTickets / tecs.length) : 0} chamados em aberto/técnico`, icon: 'headphones', color: 'var(--feedback-info)' })}
      ${kpiCard({ label: 'Administradores', value: admins.length, delta: 'Acesso total ao sistema', icon: 'shield-check', color: 'var(--status-pendente)' })}`;
  }

  function render() {
    const q = norm(state.q);
    const list = Store.users()
      .filter((u) => !state.perfil || u.perfil === state.perfil)
      .filter((u) => state.situacao === '' || String(Number(u.ativo)) === state.situacao)
      .filter((u) => !q || norm(`${u.nome} ${u.email} ${u.departamento}`).includes(q))
      .sort((a, b) => PERFIS.indexOf(a.perfil) - PERFIS.indexOf(b.perfil) || a.nome.localeCompare(b.nome));

    $('#list').innerHTML = `
      <div class="table-wrap">
        ${list.length ? `<table class="table">
          <colgroup><col><col style="width:170px"><col style="width:150px"><col style="width:120px"><col style="width:150px"><col style="width:104px"></colgroup>
          <thead><tr><th>Usuário</th><th>Perfil</th><th>Departamento</th><th>Situação</th><th>Último acesso</th><th>Ações</th></tr></thead>
          <tbody>${list.map((u) => `
            <tr>
              <td><div class="user-cell">${avatar(u.nome, u.perfil)}<div class="user-cell__info">
                <span class="body-m truncate">${esc(u.nome)}${u.id === me.id ? ' <span class="cap muted">(você)</span>' : ''}</span>
                <span class="cap muted truncate">${esc(u.email)}</span></div></div></td>
              <td>${badge('role', u.perfil)}</td>
              <td>${esc(u.departamento)}</td>
              <td><span class="person"><span class="legend__dot" style="width:8px;height:8px;background:var(${u.ativo ? '--feedback-success' : '--text-secondary'})"></span>
                <span class="${u.ativo ? '' : 'muted'}">${u.ativo ? 'Ativo' : 'Inativo'}</span></span></td>
              <td>${relTime(u.ultimoAcesso)}</td>
              <td><div class="row-actions">
                <button class="icon-btn" data-edit="${u.id}" title="Editar" aria-label="Editar ${esc(u.nome)}"><i data-lucide="pencil"></i></button>
                <button class="icon-btn icon-btn--danger" data-del="${u.id}" title="Excluir" aria-label="Excluir ${esc(u.nome)}"><i data-lucide="trash-2"></i></button>
              </div></td>
            </tr>`).join('')}</tbody>
        </table>` : emptyState('Nenhum usuário encontrado.', 'search-x')}
      </div>
      <p class="muted">${list.length} usuário${list.length === 1 ? '' : 's'}</p>`;
    icons();
    $$('[data-edit]').forEach((b) => b.addEventListener('click', () => openForm(Store.user(b.dataset.edit))));
    $$('[data-del]').forEach((b) => b.addEventListener('click', () => remove(Store.user(b.dataset.del))));
  }

  async function remove(u) {
    if (u.id === me.id) { toast('Você não pode excluir o próprio usuário.', 'error'); return; }
    const linked = Store.linkedTickets(u.id);
    if (linked) { toast(`${u.nome} possui ${linked} chamado${linked === 1 ? '' : 's'} vinculado${linked === 1 ? '' : 's'}. Inative o usuário em vez de excluir.`, 'error'); return; }
    const ok = await confirmDialog({ title: 'Excluir usuário?', text: `${u.nome} perderá o acesso ao NexaDesk. Essa ação não pode ser desfeita.`, confirmText: 'Excluir' });
    if (!ok) return;
    Store.deleteUser(u.id);
    toast('Usuário excluído.');
    renderKpis(); render();
  }

  function openForm(u) {
    const editing = !!u;
    const v = u || { nome: '', email: '', perfil: 'Solicitante', departamento: 'TI', telefone: '', ativo: true };
    const m = openModal(`
      <div class="modal__header"><h2 class="h3">${editing ? 'Editar usuário' : 'Novo usuário'}</h2>
        <button class="icon-btn" data-close aria-label="Fechar"><i data-lucide="x"></i></button></div>
      <form class="form" id="user-form" novalidate>
        <div class="form-row">
          <div class="field"><label for="u-nome">Nome completo *</label><div class="control"><i data-lucide="user"></i><input id="u-nome" name="nome" maxlength="60" value="${esc(v.nome)}"></div></div>
          <div class="field"><label for="u-email">E-mail *</label><div class="control"><i data-lucide="mail"></i><input id="u-email" name="email" type="email" maxlength="80" value="${esc(v.email)}"></div></div>
        </div>
        <div class="form-row">
          <div class="field"><label for="u-perfil">Perfil</label>${selectControl('u-perfil', options(PERFIS, v.perfil))}</div>
          <div class="field"><label for="u-dep">Departamento</label>${selectControl('u-dep', options(DEPARTAMENTOS, v.departamento))}</div>
        </div>
        <div class="form-row">
          <div class="field"><label for="u-tel">Telefone</label><div class="control"><input id="u-tel" name="telefone" maxlength="20" placeholder="(11) 99999-0000" value="${esc(v.telefone || '')}"></div></div>
          <div class="field"><label for="u-senha">${editing ? 'Nova senha' : 'Senha *'}</label><div class="control"><i data-lucide="lock"></i><input id="u-senha" name="senha" type="password" placeholder="${editing ? 'Deixe em branco para manter' : 'Mínimo de 6 caracteres'}"></div></div>
        </div>
        <label class="switch"><input type="checkbox" name="ativo" ${v.ativo ? 'checked' : ''}${editing && u.id === me.id ? ' disabled' : ''}> Usuário ativo</label>
        <div class="modal__footer">
          <button type="button" class="btn btn--secondary" data-close>Cancelar</button>
          <button class="btn btn--primary" type="submit"><i data-lucide="check"></i>${editing ? 'Salvar alterações' : 'Cadastrar usuário'}</button>
        </div>
      </form>`, { size: 'lg' });

    const f = $('#user-form', m.el);
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      clearErrors(f);
      const data = {
        nome: f.nome.value.trim(), email: f.email.value.trim().toLowerCase(),
        perfil: f['u-perfil'].value, departamento: f['u-dep'].value, telefone: f.telefone.value.trim(),
        ativo: editing && u.id === me.id ? true : f.ativo.checked,
      };
      const senha = f.senha.value;
      let ok = true;
      if (data.nome.split(/\s+/).length < 2) { setError(f.nome, 'Informe nome e sobrenome.'); ok = false; }
      if (!emailValid(data.email)) { setError(f.email, 'Informe um e-mail válido.'); ok = false; }
      else if (Store.emailInUse(data.email, editing ? u.id : null)) { setError(f.email, 'Este e-mail já está cadastrado.'); ok = false; }
      if ((!editing || senha) && senha.length < 6) { setError(f.senha, 'A senha deve ter pelo menos 6 caracteres.'); ok = false; }
      if (editing && u.id === me.id && data.perfil !== 'Administrador') { setError(f['u-perfil'], 'Você não pode remover seu próprio acesso de administrador.'); ok = false; }
      if (!ok) return;
      if (senha) data.senha = senha;
      if (editing) { Store.updateUser(u.id, data); toast('Usuário atualizado.'); }
      else { Store.createUser(data); toast(`${data.nome} cadastrado(a) com sucesso.`); }
      m.close(); renderKpis(); render();
    });
  }

  $('#new-user').addEventListener('click', () => openForm(null));
  $('#f-q').addEventListener('input', (e) => { state.q = e.target.value.trim(); render(); });
  $('#f-perfil').addEventListener('change', (e) => { state.perfil = e.target.value; render(); });
  $('#f-sit').addEventListener('change', (e) => { state.situacao = e.target.value; render(); });

  renderKpis();
  render();
})();
