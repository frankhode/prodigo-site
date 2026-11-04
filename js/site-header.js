const menu = document.getElementById('menu');
const nav = document.getElementById('nav');
function setMenu(open) {
  nav.classList.toggle('open', open);
  menu.setAttribute('aria-expanded', String(open));
}
menu.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
nav.addEventListener('click', event => {
  if (event.target.closest('a')) setMenu(false);
});
window.addEventListener('hashchange', () => setMenu(false));
