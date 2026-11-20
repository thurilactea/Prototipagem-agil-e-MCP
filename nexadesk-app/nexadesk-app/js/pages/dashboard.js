/* Dashboard — RF02 */
(function () {
  const me = mountShell();
  if (!me) return;
  setupCharts();

  const tickets = Auth.visibleTickets(me);
  const now = new Date();
  const by = (s) => tickets.filter((t) => t.status === s);
  const concluded = by('Concluído');
  const today = tickets.filter((t) => new Date(t.criadoEm).toDateString() === now.toDateString()).length;
  const monthOf = (offset) => tickets.filter((t) => {
    const c = new Date(t.criadoEm), d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth();
  }).length;
  const thisMonth = monthOf(0), lastMonth = monthOf(1);
  const monthDelta = lastMonth ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;
  const resolutionRate = tickets.length ? Math.round((concluded.length / tickets.length) * 100) : 0;
  const avgRes = avg(concluded.filter((t) => t.resolvidoEm).map((t) => hoursBetween(t.criadoEm, t.resolvidoEm)));
  const isSolic = me.perfil === 'Solicitante';
  const recent = [...tickets].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)).slice(0, 5);
  const status = statusItems(tickets);
  const months = monthBuckets(tickets, 6);

  $('#content').innerHTML = `
    ${pageHeader('Dashboard', `${isSolic ? 'Acompanhe seus chamados' : 'Visão geral dos atendimentos'} · ${fmtDate(now)}`, `
      <button class="btn btn--secondary" id="export"><i data-lucide="download"></i>Exportar</button>
      <a class="btn btn--primary" href="novo-chamado.html"><i data-lucide="plus"></i>Novo chamado</a>`)}

    <section class="grid-kpi" aria-label="Indicadores">
      ${kpiCard({
        label: isSolic ? 'Meus chamados' : 'Total de chamados', value: tickets.length, icon: 'ticket', color: 'var(--base-primary)', href: 'chamados.html',
        delta: monthDelta === null ? `${thisMonth} neste mês` : `${monthDelta >= 0 ? '+' : ''}${monthDelta}% vs. mês anterior`,
        deltaClass: monthDelta === null ? '' : monthDelta >= 0 ? 'is-up' : 'is-down',
      })}
      ${kpiCard({ label: 'Abertos', value: by('Aberto').length, delta: `${today} novo${today === 1 ? '' : 's'} hoje`, icon: 'inbox', color: 'var(--status-aberto)', href: 'chamados.html?status=Aberto' })}
      ${kpiCard({ label: 'Em andamento', value: by('Em andamento').length, delta: `${by('Pendente').length} pendente${by('Pendente').length === 1 ? '' : 's'} de retorno`, icon: 'clock', color: 'var(--status-em-andamento)', href: 'chamados.html?status=Em%20andamento' })}
      ${kpiCard({ label: 'Concluídos', value: concluded.length, delta: `Taxa de resolução: ${resolutionRate}%`, icon: 'circle-check', color: 'var(--status-concluido)', href: 'chamados.html?status=Conclu%C3%ADdo' })}
    </section>

    <section class="charts-row">
      <div class="card">
        <div class="card__header"><h2 class="h3">Chamados por mês</h2><span class="cap muted">Últimos 6 meses</span></div>
        <div class="chart-box"><canvas id="ch-month" aria-label="Chamados por mês"></canvas></div>
      </div>
      <div class="card">
        <div class="card__header"><h2 class="h3">Por status</h2></div>
        ${donutBlock('ch-status', status)}
      </div>
    </section>

    <section class="stack" style="gap:16px">
      <div class="card__header">
        <h2 class="h3">Chamados recentes</h2>
        <a class="btn btn--ghost" href="chamados.html">Ver todos</a>
      </div>
      <div class="table-wrap">
        ${recent.length ? `<table class="table">
          <colgroup><col style="width:120px"><col><col style="width:200px"><col style="width:130px"><col style="width:160px"><col style="width:120px"></colgroup>
          <thead><tr><th>ID</th><th>Título</th><th>Técnico</th><th>Prioridade</th><th>Status</th><th>Data</th></tr></thead>
          <tbody>${recent.map((t) => `
            <tr class="is-clickable" data-href="chamado.html?id=${t.id}" tabindex="0">
              <td class="td-id">${ticketCode(t)}</td>
              <td><div class="truncate">${esc(t.titulo)}</div></td>
              <td>${t.tecnicoId ? esc(Store.userName(t.tecnicoId)) : '<span class="muted">Não atribuído</span>'}</td>
              <td>${badge('prio', t.prioridade)}</td>
              <td>${badge('status', t.status)}</td>
              <td>${fmtDate(t.criadoEm)}</td>
            </tr>`).join('')}</tbody>
        </table>` : emptyState('Nenhum chamado ainda. Que tal abrir o primeiro?')}
      </div>
    </section>`;

  icons();
  barChart($('#ch-month'), months.labels, months.values, { highlightLast: true });
  donutChart($('#ch-status'), status);

  $$('tr[data-href]').forEach((tr) => {
    tr.addEventListener('click', () => (location.href = tr.dataset.href));
    tr.addEventListener('keydown', (e) => { if (e.key === 'Enter') location.href = tr.dataset.href; });
  });
  $('#export').addEventListener('click', () => {
    download(`nexadesk-chamados-${fmtDate(now).replace(/\//g, '-')}.csv`, ticketsCSV(tickets), 'text/csv;charset=utf-8');
    toast(`${tickets.length} chamados exportados para CSV.`);
  });
})();
