/* ==========================================================================
   NexaDesk — Utilitários de interface
   ========================================================================== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function norm(s) { return String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
function icons() {
  if (!window.lucide) return;
  window.lucide.createIcons();
  // evita que ícones já desenhados sejam recriados (e removidos do DOM) na próxima chamada
  $$('svg[data-lucide]').forEach((s) => s.removeAttribute('data-lucide'));
}
/** true se o clique partiu de um elemento marcado com data-stop (ex.: botões de ação dentro de linhas clicáveis) */
const fromStop = (e) => e.composedPath().some((el) => el.dataset && 'stop' in el.dataset);
function param(name) { return new URLSearchParams(location.search).get(name); }

/* ---------- Datas e números ---------- */
const pad2 = (n) => String(n).padStart(2, '0');
function fmtDate(iso) { const d = new Date(iso); return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`; }
function fmtTime(iso) { const d = new Date(iso); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; }
function fmtDateTime(iso) { return `${fmtDate(iso)} · ${fmtTime(iso)}`; }
function relTime(iso) {
  if (!iso) return 'Nunca';
  const m = Math.round((Date.now() - new Date(iso)) / 60e3);
  if (m < 1) return 'Agora';
  if (m < 60) return `Há ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `Há ${h} h`;
  const d = Math.round(h / 24);
  if (d === 1) return 'Ontem';
  if (d < 30) return `Há ${d} dias`;
  return fmtDate(iso);
}
function fmtDuration(hours) {
  if (!isFinite(hours)) return '—';
  const total = Math.max(0, Math.round(hours * 60));
  const d = Math.floor(total / 1440), h = Math.floor((total % 1440) / 60), m = total % 60;
  if (d > 0) return `${d}d ${h}h`;
  return `${h}h ${pad2(m)}min`;
}
const hoursBetween = (a, b) => (new Date(b) - new Date(a)) / HOUR;
const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : NaN);
const ticketCode = (t) => `#NX-${t.id}`;
function initials(nome) { const p = String(nome).trim().split(/\s+/); return ((p[0] || '?')[0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase(); }
function emailValid(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim()); }

function slaInfo(t) {
  const due = new Date(t.criadoEm).getTime() + SLA_HORAS[t.prioridade] * HOUR;
  if (t.status === 'Concluído' && t.resolvidoEm) {
    return new Date(t.resolvidoEm).getTime() <= due ? { cls: 'ok', text: 'Cumprido' } : { cls: 'late', text: 'Fora do prazo' };
  }
  const left = (due - Date.now()) / HOUR;
  if (left < 0) return { cls: 'late', text: `Atrasado ${fmtDuration(-left)}` };
  return { cls: left < SLA_HORAS[t.prioridade] * 0.25 ? 'warn' : 'ok', text: `Vence em ${fmtDuration(left)}` };
}
const slaMet = (t) => t.status === 'Concluído' && t.resolvidoEm && hoursBetween(t.criadoEm, t.resolvidoEm) <= SLA_HORAS[t.prioridade];

/* ---------- Componentes (HTML) ---------- */
function badge(kind, label) {
  const map = { status: STATUS_KEY, prio: PRIO_KEY, role: ROLE_KEY };
  return `<span class="badge badge--${kind}-${map[kind][label] || ''}"><i class="badge__dot"></i>${esc(label)}</span>`;
}
function avatar(nome, perfil, size) {
  return `<span class="avatar avatar--${ROLE_KEY[perfil] || 'solicitante'}${size ? ' avatar--' + size : ''}" aria-hidden="true">${esc(initials(nome))}</span>`;
}
function person(userId) {
  const u = Store.user(userId);
  if (!u) return '<span class="muted">Não atribuído</span>';
  return `<span class="person">${avatar(u.nome, u.perfil, 'sm')}<span class="truncate">${esc(u.nome)}</span></span>`;
}
function pageHeader(title, subtitle, actions = '') {
  return `<header class="page-header">
    <div class="page-header__titles"><h1 class="h1">${esc(title)}</h1><p class="muted">${esc(subtitle)}</p></div>
    <div class="actions no-print">${actions}</div>
  </header>`;
}
function kpiCard({ label, value, delta = '', deltaClass = '', icon, color, href }) {
  const tag = href ? 'a' : 'div';
  return `<${tag} class="card kpi"${href ? ` href="${href}"` : ''} style="--c:${color}">
    <div class="kpi__top"><span>${esc(label)}</span><span class="kpi__chip"><i data-lucide="${icon}"></i></span></div>
    <div class="kpi__value">${esc(value)}</div>
    <div class="kpi__delta ${deltaClass}">${esc(delta)}</div>
  </${tag}>`;
}
function emptyState(text, icon = 'inbox') {
  return `<div class="empty"><i data-lucide="${icon}"></i><p>${esc(text)}</p></div>`;
}
function options(list, selected, labelFn = (x) => x, valueFn = (x) => x) {
  return list.map((x) => `<option value="${esc(valueFn(x))}"${String(valueFn(x)) === String(selected ?? '') ? ' selected' : ''}>${esc(labelFn(x))}</option>`).join('');
}
function selectControl(id, opts, { icon } = {}) {
  return `<div class="control">${icon ? `<i data-lucide="${icon}"></i>` : ''}<select id="${id}" name="${id}">${opts}</select><i data-lucide="chevron-down" class="chevron"></i></div>`;
}
function deltaPct(cur, prev) {
  if (!prev) return { text: cur ? 'Sem base de comparação' : 'Sem chamados no período anterior', cls: '' };
  const p = Math.round(((cur - prev) / prev) * 100);
  return { text: `${p >= 0 ? '+' : ''}${p}% vs. período anterior`, cls: p >= 0 ? 'is-up' : 'is-down' };
}

/* ---------- Toasts e mensagens entre páginas ---------- */
function toast(msg, type = 'success') {
  let root = $('.toasts');
  if (!root) { root = document.createElement('div'); root.className = 'toasts'; root.setAttribute('aria-live', 'polite'); document.body.appendChild(root); }
  const icon = { success: 'circle-check', error: 'circle-alert', info: 'info' }[type];
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.innerHTML = `<i data-lucide="${icon}"></i><span>${esc(msg)}</span>`;
  root.appendChild(el); icons();
  setTimeout(() => { el.classList.add('is-leaving'); setTimeout(() => el.remove(), 250); }, 3500);
}
function flash(msg, type = 'success') { sessionStorage.setItem('nexadesk_flash', JSON.stringify({ msg, type })); }
function showFlash() {
  const f = sessionStorage.getItem('nexadesk_flash');
  if (f) { sessionStorage.removeItem('nexadesk_flash'); const { msg, type } = JSON.parse(f); toast(msg, type); }
}

/* ---------- Modais ---------- */
function openModal(html, { size } = {}) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `<div class="modal${size ? ' modal--' + size : ''}" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(overlay);
  icons();
  const close = () => { overlay.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) close(); });
  $$('[data-close]', overlay).forEach((b) => b.addEventListener('click', close));
  const first = $('input, select, textarea, button:not([data-close])', overlay);
  if (first) first.focus();
  return { el: overlay, close };
}
function confirmDialog({ title, text, confirmText = 'Confirmar', danger = true, icon = 'trash-2' }) {
  return new Promise((resolve) => {
    let done = false;
    const m = openModal(`
      <div class="modal__icon" style="--c:${danger ? 'var(--feedback-error)' : 'var(--base-primary)'}"><i data-lucide="${icon}"></i></div>
      <h2 class="h3">${esc(title)}</h2>
      <p class="muted">${esc(text)}</p>
      <div class="modal__footer">
        <button class="btn btn--secondary" data-close>Cancelar</button>
        <button class="btn ${danger ? 'btn--danger' : 'btn--primary'}" data-ok><i data-lucide="${icon}"></i>${esc(confirmText)}</button>
      </div>`);
    $('[data-ok]', m.el).addEventListener('click', () => { done = true; m.close(); resolve(true); });
    new MutationObserver((_, obs) => { if (!document.body.contains(m.el)) { obs.disconnect(); if (!done) resolve(false); } })
      .observe(document.body, { childList: true });
    $('[data-ok]', m.el).focus();
  });
}

/* ---------- Formulários ---------- */
function setError(input, msg) {
  const field = input.closest('.field');
  field.classList.add('has-error');
  let el = $('.field__error', field);
  if (!el) { el = document.createElement('span'); el.className = 'field__error'; field.appendChild(el); }
  el.textContent = msg;
}
function clearErrors(form) {
  $$('.field.has-error', form).forEach((f) => f.classList.remove('has-error'));
  $$('.field__error', form).forEach((e) => e.remove());
}

/* ---------- Exportação ---------- */
function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function ticketsCSV(list) {
  const head = ['ID', 'Título', 'Categoria', 'Prioridade', 'Status', 'Solicitante', 'Técnico', 'Criado em', 'Resolvido em'];
  const rows = list.map((t) => [`NX-${t.id}`, t.titulo, t.categoria, t.prioridade, t.status, Store.userName(t.solicitanteId),
    t.tecnicoId ? Store.userName(t.tecnicoId) : '', fmtDateTime(t.criadoEm), t.resolvidoEm ? fmtDateTime(t.resolvidoEm) : '']);
  const cell = (v) => `"${String(v).replace(/"/g, '""')}"`;
  return '﻿' + [head, ...rows].map((r) => r.map(cell).join(';')).join('\r\n');
}

/* ---------- Gráficos (Chart.js) ---------- */
const STATUS_VAR = { 'Aberto': '--status-aberto', 'Em andamento': '--status-em-andamento', 'Pendente': '--status-pendente', 'Concluído': '--status-concluido' };
const PRIO_VAR = { 'Baixa': '--priority-baixa', 'Média': '--priority-media', 'Alta': '--priority-alta', 'Crítica': '--priority-critica' };
const EVENT_VAR = {
  aberto: '--status-aberto', andamento: '--status-em-andamento', pendente: '--status-pendente', concluido: '--status-concluido',
  baixa: '--priority-baixa', media: '--priority-media', alta: '--priority-alta', critica: '--priority-critica',
  primary: '--base-primary', info: '--feedback-info', secondary: '--text-secondary',
};

function setupCharts() {
  if (!window.Chart) return;
  Chart.defaults.color = cssVar('--text-secondary');
  Chart.defaults.font.family = 'Inter, system-ui, sans-serif';
  Chart.defaults.font.size = 12;
  Chart.defaults.borderColor = cssVar('--base-tertiary');
  Chart.defaults.plugins.legend.display = false;
  Chart.defaults.plugins.tooltip.backgroundColor = cssVar('--base-background');
  Chart.defaults.plugins.tooltip.borderColor = cssVar('--base-tertiary');
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.padding = 12;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
}
function withAlpha(hex, a) {
  const n = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
function barChart(canvas, labels, values, { highlightLast = false } = {}) {
  if (!window.Chart) return null;
  const primary = cssVar('--base-primary');
  return new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: values, borderRadius: { topLeft: 6, topRight: 6 }, borderSkipped: false, maxBarThickness: 36,
        backgroundColor: values.map((_, i) => (highlightLast && i < values.length - 1 ? withAlpha(primary, 0.45) : primary)),
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false }, border: { display: false } },
        y: { beginAtZero: true, ticks: { precision: 0 }, border: { display: false }, grid: { color: withAlpha(cssVar('--base-tertiary'), 0.5) } },
      },
      plugins: { tooltip: { callbacks: { label: (c) => ` ${c.parsed.y} chamado${c.parsed.y === 1 ? '' : 's'}` } } },
    },
  });
}
function donutChart(canvas, items) {
  if (!window.Chart) return null;
  return new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: items.map((i) => i.label),
      datasets: [{ data: items.map((i) => i.value), backgroundColor: items.map((i) => i.color), borderWidth: 0, spacing: 2 }],
    },
    options: { responsive: true, maintainAspectRatio: false, cutout: '68%' },
  });
}
function statusItems(list) {
  return STATUS.map((s) => ({ label: s, value: list.filter((t) => t.status === s).length, color: cssVar(STATUS_VAR[s]) }));
}
function donutBlock(id, items, centerLabel = 'chamados') {
  const total = items.reduce((a, b) => a + b.value, 0);
  return `<div class="donut">
    <div class="donut__canvas"><canvas id="${id}" aria-label="Gráfico de rosca"></canvas>
      <div class="donut__center"><span class="h2">${total}</span><span class="cap muted">${centerLabel}</span></div></div>
    <ul class="legend">${items.map((i) => `<li class="legend__item"><span class="legend__dot" style="background:${i.color}"></span><span>${esc(i.label)}</span>
      <span class="cap muted">${i.value} (${total ? Math.round((i.value / total) * 100) : 0}%)</span></li>`).join('')}</ul>
  </div>`;
}
function hbarsBlock(items) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return emptyState('Sem dados no período.');
  return `<div class="hbars">${items.map((i) => `<div>
    <div class="hbar__top"><span>${esc(i.label)}</span><span class="cap-m muted">${esc(i.extra ?? i.value)}</span></div>
    <div class="hbar__track"><div class="hbar__fill" style="width:${(i.value / max) * 100}%;--c:${i.color || 'var(--base-primary)'}"></div></div>
  </div>`).join('')}</div>`;
}
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
function monthBuckets(list, n) {
  const now = new Date();
  const labels = [], values = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(MONTHS[d.getMonth()]);
    values.push(list.filter((t) => { const c = new Date(t.criadoEm); return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth(); }).length);
  }
  return { labels, values };
}
function weekBuckets(list, n) {
  const end = Date.now();
  const labels = [], values = [];
  for (let i = n - 1; i >= 0; i--) {
    const from = end - (i + 1) * 7 * DAY, to = end - i * 7 * DAY;
    labels.push(fmtDate(toISO(from)).slice(0, 5));
    values.push(list.filter((t) => { const c = new Date(t.criadoEm).getTime(); return c > from && c <= to; }).length);
  }
  return { labels, values };
}
