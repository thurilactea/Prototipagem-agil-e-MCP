/* Relatórios — RF11 (Administrador e Técnico) */
(function () {
  const me = mountShell();
  if (!me) return;
  setupCharts();
  const PERIODOS = [[30, 'Últimos 30 dias'], [90, 'Últimos 3 meses'], [180, 'Últimos 6 meses'], [365, 'Últimos 12 meses'], [0, 'Todo o período']];
  let days = 180;
  let charts = [];

  $('#content').innerHTML = `
    ${pageHeader('Relatórios', 'Análise de desempenho dos atendimentos', `
      <div class="field" style="width:220px">${selectControl('periodo', options(PERIODOS, days, (p) => p[1], (p) => p[0]), { icon: 'calendar' })}</div>
      <button class="btn btn--secondary" id="csv"><i data-lucide="file-down"></i>CSV</button>
      <button class="btn btn--secondary" id="pdf"><i data-lucide="printer"></i>Exportar PDF</button>`)}
    <div id="report" class="stack"></div>`;

  function inRange(list, from, to) { return list.filter((t) => { const c = new Date(t.criadoEm).getTime(); return c > from && c <= to; }); }

  function render() {
    charts.forEach((c) => c && c.destroy()); charts = [];
    const all = Store.tickets();
    const now = Date.now();
    const cur = days ? inRange(all, now - days * DAY, now) : all;
    const prev = days ? inRange(all, now - 2 * days * DAY, now - days * DAY) : [];
    const done = cur.filter((t) => t.status === 'Concluído' && t.resolvidoEm);
    const avgRes = avg(done.map((t) => hoursBetween(t.criadoEm, t.resolvidoEm)));
    const prevDone = prev.filter((t) => t.status === 'Concluído' && t.resolvidoEm);
    const prevAvg = avg(prevDone.map((t) => hoursBetween(t.criadoEm, t.resolvidoEm)));
    const slaPct = done.length ? Math.round((done.filter(slaMet).length / done.length) * 100) : 0;
    const reabertos = cur.filter((t) => t.reaberto).length;
    const reabPct = cur.length ? Math.round((reabertos / cur.length) * 100) : 0;
    const d = deltaPct(cur.length, prev.length);
    const resDelta = isFinite(avgRes) && isFinite(prevAvg) ? avgRes - prevAvg : NaN;

    const status = statusItems(cur);
    const prio = PRIORIDADES.map((p) => ({ label: p, value: cur.filter((t) => t.prioridade === p).length, color: `var(${PRIO_VAR[p]})` }));
    const tecs = Store.users().filter((u) => u.perfil === 'Técnico')
      .map((u) => {
        const mine = cur.filter((t) => t.tecnicoId === u.id);
        const c = mine.filter((t) => t.status === 'Concluído').length;
        return { label: u.nome, value: mine.length, extra: `${mine.length} atribuídos · ${c} concluídos` };
      })
      .filter((x) => x.value).sort((a, b) => b.value - a.value);
    const unassigned = cur.filter((t) => !t.tecnicoId).length;
    if (unassigned) tecs.push({ label: 'Sem técnico', value: unassigned, extra: `${unassigned} aguardando`, color: 'var(--text-secondary)' });
    const spanDays = days || Math.max(30, (now - Math.min(...all.map((t) => new Date(t.criadoEm).getTime()))) / DAY);
    const buckets = spanDays <= 90 ? weekBuckets(cur, Math.ceil(spanDays / 7)) : monthBuckets(cur, Math.min(12, Math.ceil(spanDays / 30)));

    $('#report').innerHTML = `
      <section class="grid-kpi">
        ${kpiCard({ label: 'Chamados no período', value: cur.length, delta: days ? d.text : `${all.length} no total`, deltaClass: days ? d.cls : '', icon: 'ticket', color: 'var(--base-primary)' })}
        ${kpiCard({ label: 'Tempo médio de resolução', value: fmtDuration(avgRes),
          delta: isFinite(resDelta) ? `${resDelta <= 0 ? '−' : '+'}${fmtDuration(Math.abs(resDelta))} vs. período anterior` : `${done.length} chamados concluídos`,
          deltaClass: isFinite(resDelta) ? (resDelta <= 0 ? 'is-up' : 'is-down') : '', icon: 'clock', color: 'var(--status-em-andamento)' })}
        ${kpiCard({ label: 'SLA cumprido', value: `${slaPct}%`, delta: `Meta: 90% · ${slaPct >= 90 ? 'dentro da meta' : 'abaixo da meta'}`, deltaClass: slaPct >= 90 ? 'is-up' : 'is-down', icon: 'circle-check', color: 'var(--feedback-success)' })}
        ${kpiCard({ label: 'Reabertos', value: `${reabPct}%`, delta: `${reabertos} chamado${reabertos === 1 ? '' : 's'}`, icon: 'circle-alert', color: 'var(--feedback-error)' })}
      </section>
      <section class="grid-2">
        <div class="card"><h2 class="h3">Por status</h2>${donutBlock('ch-status', status)}</div>
        <div class="card"><h2 class="h3">Por prioridade</h2>${hbarsBlock(prio)}</div>
      </section>
      <section class="grid-2">
        <div class="card">
          <div class="card__header"><h2 class="h3">Por período</h2><span class="cap muted">${spanDays <= 90 ? 'Por semana' : 'Por mês'}</span></div>
          <div class="chart-box"><canvas id="ch-period" aria-label="Chamados por período"></canvas></div>
        </div>
        <div class="card"><h2 class="h3">Por técnico</h2>${hbarsBlock(tecs)}</div>
      </section>`;
    icons();
    charts.push(donutChart($('#ch-status'), status));
    charts.push(barChart($('#ch-period'), buckets.labels, buckets.values));
    render.cur = cur;
  }

  $('#periodo').addEventListener('change', (e) => { days = Number(e.target.value); render(); });
  $('#pdf').addEventListener('click', () => window.print());
  $('#csv').addEventListener('click', () => {
    download('nexadesk-relatorio.csv', ticketsCSV(render.cur), 'text/csv;charset=utf-8');
    toast(`${render.cur.length} chamados exportados.`);
  });
  render();
})();
