/* Login — RF01 */
Store.init();
if (Auth.current()) location.replace('dashboard.html');

const form = $('#login-form');
const errorBox = $('#login-error');
const remembered = Store.read(KEYS.remember, null);
if (remembered) { form.email.value = remembered; $('#remember').checked = true; }
icons();
showFlash();

function showError(msg) {
  errorBox.hidden = false;
  $('span', errorBox).textContent = msg;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  clearErrors(form);
  errorBox.hidden = true;
  const email = form.email.value.trim();
  const senha = form.senha.value;
  let ok = true;
  if (!email) { setError(form.email, 'Informe seu e-mail.'); ok = false; }
  else if (!emailValid(email)) { setError(form.email, 'Informe um e-mail válido.'); ok = false; }
  if (!senha) { setError(form.senha, 'Informe sua senha.'); ok = false; }
  if (!ok) return;

  const res = Auth.login(email, senha);
  if (!res.ok) { showError(res.msg); form.senha.select(); return; }
  if ($('#remember').checked) Store.write(KEYS.remember, email); else localStorage.removeItem(KEYS.remember);
  flash(`Bem-vindo(a), ${res.user.nome.split(' ')[0]}!`);
  location.href = 'dashboard.html';
});

$('#toggle-pass').addEventListener('click', (e) => {
  const show = form.senha.type === 'password';
  form.senha.type = show ? 'text' : 'password';
  e.currentTarget.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
  e.currentTarget.innerHTML = `<i data-lucide="${show ? 'eye-off' : 'eye'}"></i>`;
  icons();
});

$$('[data-demo]').forEach((b) => b.addEventListener('click', () => {
  form.email.value = b.dataset.demo;
  form.senha.value = '123456';
  clearErrors(form);
  errorBox.hidden = true;
}));

$('#forgot').addEventListener('click', () => {
  toast('Função demonstrativa: peça ao administrador para redefinir sua senha.', 'info');
});
