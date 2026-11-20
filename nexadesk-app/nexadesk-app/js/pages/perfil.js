/* Perfil / Configurações — RF12 */
(function () {
  let me = mountShell();
  if (!me) return;

  function stats(u) {
    const all = Store.tickets();
    if (u.perfil === 'Solicitante') return ['Chamados abertos', all.filter((t) => t.solicitanteId === u.id).length];
    return ['Chamados atendidos', all.filter((t) => t.tecnicoId === u.id && t.status === 'Concluído').length];
  }

  function render() {
    me = Store.user(me.id);
    const [statLabel, statValue] = stats(me);
    const membro = new Date(me.criadoEm);
    $('#content').innerHTML = `
      ${pageHeader('Perfil e configurações', 'Gerencie suas informações pessoais e sua sessão')}
      <div class="two-col two-col--reverse">
        <aside class="stack">
          <div class="card profile-card">
            ${avatar(me.nome, me.perfil, 'xl')}
            <div class="profile-card__id"><h2 class="h2">${esc(me.nome)}</h2><span class="muted">${esc(me.email)}</span></div>
            ${badge('role', me.perfil)}
            <div class="divider"></div>
            <div class="detail"><span>Departamento</span><span>${esc(me.departamento)}</span></div>
            <div class="detail"><span>Membro desde</span><span>${MONTHS[membro.getMonth()]}/${membro.getFullYear()}</span></div>
            <div class="detail"><span>${statLabel}</span><span>${statValue}</span></div>
            <button class="btn btn--danger btn--block" id="logout"><i data-lucide="log-out"></i>Encerrar sessão</button>
          </div>
          ${Auth.can('resetData', me) ? `
          <div class="card">
            <h2 class="h3">Dados do sistema</h2>
            <p class="muted">Restaura os chamados e usuários de demonstração. Útil antes de apresentar o protótipo.</p>
            <button class="btn btn--ghost btn--block" id="reset"><i data-lucide="rotate-ccw"></i>Restaurar dados de demonstração</button>
          </div>` : ''}
        </aside>

        <div class="stack">
          <form class="card form" id="info-form" novalidate>
            <h2 class="h3">Informações pessoais</h2>
            <div class="form-row">
              <div class="field"><label for="p-nome">Nome completo</label><div class="control"><i data-lucide="user"></i><input id="p-nome" name="nome" maxlength="60" value="${esc(me.nome)}"></div></div>
              <div class="field"><label for="p-email">E-mail</label><div class="control"><i data-lucide="mail"></i><input id="p-email" name="email" type="email" maxlength="80" value="${esc(me.email)}"></div></div>
            </div>
            <div class="form-row">
              <div class="field"><label for="p-tel">Telefone</label><div class="control"><i data-lucide="phone"></i><input id="p-tel" name="telefone" maxlength="20" placeholder="(11) 99999-0000" value="${esc(me.telefone || '')}"></div></div>
              <div class="field"><label for="p-dep">Departamento</label>${selectControl('p-dep', options(DEPARTAMENTOS, me.departamento), { icon: 'building-2' })}</div>
            </div>
            <div class="form-actions"><button class="btn btn--primary" type="submit"><i data-lucide="check"></i>Salvar alterações</button></div>
          </form>

          <form class="card form" id="pass-form" novalidate>
            <h2 class="h3">Alterar senha</h2>
            <div class="field"><label for="s-atual">Senha atual</label><div class="control"><i data-lucide="lock"></i><input id="s-atual" name="atual" type="password" autocomplete="current-password" placeholder="••••••••"></div></div>
            <div class="form-row">
              <div class="field"><label for="s-nova">Nova senha</label><div class="control"><i data-lucide="lock"></i><input id="s-nova" name="nova" type="password" autocomplete="new-password" placeholder="Mínimo de 6 caracteres"></div></div>
              <div class="field"><label for="s-conf">Confirmar nova senha</label><div class="control"><i data-lucide="lock"></i><input id="s-conf" name="conf" type="password" autocomplete="new-password" placeholder="Repita a nova senha"></div></div>
            </div>
            <div class="note note--warning"><i data-lucide="triangle-alert"></i><span>Função demonstrativa: os dados ficam salvos apenas no LocalStorage do navegador.</span></div>
            <div class="form-actions"><button class="btn btn--primary" type="submit">Atualizar senha</button></div>
          </form>
        </div>
      </div>`;
    icons();
    bind();
  }

  function bind() {
    $('#logout').addEventListener('click', confirmLogout);
    const reset = $('#reset');
    if (reset) reset.addEventListener('click', async () => {
      const ok = await confirmDialog({ title: 'Restaurar dados de demonstração?', text: 'Todos os chamados e usuários criados ou alterados serão substituídos pelos dados originais. Você continuará conectado.', confirmText: 'Restaurar', icon: 'rotate-ccw' });
      if (!ok) return;
      const email = me.email;
      Store.reset();
      const again = Store.users().find((u) => u.email === email) || Store.user('u1');
      Store.write(KEYS.session, { userId: again.id, desde: new Date().toISOString() });
      flash('Dados de demonstração restaurados.');
      location.reload();
    });

    const info = $('#info-form');
    info.addEventListener('submit', (e) => {
      e.preventDefault();
      clearErrors(info);
      const data = { nome: info.nome.value.trim(), email: info.email.value.trim().toLowerCase(), telefone: info.telefone.value.trim(), departamento: info['p-dep'].value };
      let ok = true;
      if (data.nome.split(/\s+/).length < 2) { setError(info.nome, 'Informe nome e sobrenome.'); ok = false; }
      if (!emailValid(data.email)) { setError(info.email, 'Informe um e-mail válido.'); ok = false; }
      else if (Store.emailInUse(data.email, me.id)) { setError(info.email, 'Este e-mail já está em uso.'); ok = false; }
      if (!ok) return;
      Store.updateUser(me.id, data);
      flash('Informações atualizadas.');
      location.reload(); // atualiza topbar e card
    });

    const pass = $('#pass-form');
    pass.addEventListener('submit', (e) => {
      e.preventDefault();
      clearErrors(pass);
      let ok = true;
      if (pass.atual.value !== me.senha) { setError(pass.atual, 'Senha atual incorreta.'); ok = false; }
      if (pass.nova.value.length < 6) { setError(pass.nova, 'A nova senha deve ter pelo menos 6 caracteres.'); ok = false; }
      else if (pass.nova.value === pass.atual.value) { setError(pass.nova, 'A nova senha deve ser diferente da atual.'); ok = false; }
      if (pass.conf.value !== pass.nova.value) { setError(pass.conf, 'As senhas não conferem.'); ok = false; }
      if (!ok) return;
      Store.updateUser(me.id, { senha: pass.nova.value });
      me = Store.user(me.id);
      pass.reset();
      toast('Senha alterada com sucesso.');
    });
  }

  render();
})();
