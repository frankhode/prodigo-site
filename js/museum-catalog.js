const endpoint = 'https://wgtircsltokentekqgdq.supabase.co/functions/v1/museum-catalog';
const fields = [
  ['category', 'Clase de objeto'],
  ['brand', 'Marca'],
  ['model', 'Modelo'],
  ['manufacture_date', 'Fecha'],
  ['type', 'Tipo'],
  ['original_number', 'N.º de serie / numeración original'],
  ['code', 'Código de inventario'],
];
const byId = id => document.getElementById(id);
const collator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });
const filters = new Map();
let items;
let selection = {};
let requestedCategory = '';
let visible = 24;
let loading = false;

function matches(item, except) {
  return Object.entries(selection).every(([key, value]) =>
    key === except || item[key] === value);
}

function photoCard(item) {
  const card = document.createElement('article');
  const photo = document.createElement('img');
  photo.loading = 'lazy';
  photo.alt = [item.category, item.brand, item.model].filter(Boolean).join(' · ');
  const url = endpoint + '?foto=' + encodeURIComponent(item.code);
  photo.src = url;
  const imageLink = document.createElement('a');
  imageLink.href = url;
  imageLink.target = '_blank';
  imageLink.rel = 'noopener';
  imageLink.setAttribute('aria-label', 'Ampliar foto de ' + item.code);
  imageLink.append(photo);
  photo.addEventListener('error', () => {
    const missing = document.createElement('div');
    missing.className = 'catalog-photo-missing';
    missing.textContent = 'Foto no disponible';
    imageLink.replaceWith(missing);
  });
  const body = document.createElement('div');
  body.className = 'copy';
  const title = document.createElement('h3');
  title.textContent = [item.brand, item.model].filter(Boolean).join(' ') || item.category;
  const details = document.createElement('dl');
  for (const [key, label] of fields) {
    if (!item[key]) continue;
    const term = document.createElement('dt');
    const value = document.createElement('dd');
    term.textContent = label;
    value.textContent = item[key];
    details.append(term, value);
  }
  body.append(title, details);
  card.append(imageLink, body);
  return card;
}

function render() {
  const results = items.filter(item => matches(item));
  for (const [key, { label, input }] of filters) {
    const counts = new Map();
    for (const item of items) {
      const value = item[key];
      if (value && matches(item, key)) counts.set(value, (counts.get(value) || 0) + 1);
    }
    input.replaceChildren(new Option('Cualquiera', ''));
    for (const value of [...counts.keys()].sort(collator.compare)) {
      input.add(new Option(value + ' (' + counts.get(value) + ')', value));
    }
    if (selection[key] && !counts.has(selection[key])) {
      input.add(new Option(selection[key] + ' (0)', selection[key]));
    }
    input.value = selection[key] || '';
    label.hidden = counts.size === 0 && !selection[key];
  }
  byId('catalog-status').textContent = results.length
    ? results.length + (results.length === 1 ? ' pieza' : ' piezas')
    : Object.keys(selection).length ? 'No hay piezas con estos filtros.' : 'Todavía no hay piezas en el catálogo.';
  byId('catalog-clear').hidden = !Object.keys(selection).length;
  byId('catalog-more').hidden = visible >= results.length;
  byId('listing').replaceChildren(...results.slice(0, visible).map(photoCard));
}

function applyCategory() {
  const category = requestedCategory === 'Máquinas de escribir' ? 'Máquina de escribir' : requestedCategory;
  selection = category ? { category } : {};
  visible = 24;
  render();
}

async function load() {
  if (loading) return;
  loading = true;
  byId('catalog-retry').hidden = true;
  byId('catalog-status').textContent = 'Cargando catálogo…';
  try {
    const rows = [];
    let cursor = null;
    do {
      const url = new URL(endpoint);
      if (cursor) url.searchParams.set('desde', cursor);
      const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw Error('Catálogo no disponible');
      const page = await response.json();
      rows.push(...page.items);
      if (page.next && cursor && page.next <= cursor) throw Error('Paginación inválida');
      cursor = page.next;
    } while (cursor);
    items = rows;
    applyCategory();
  } catch {
    byId('catalog-status').textContent = 'El catálogo no está disponible en este momento.';
    byId('catalog-retry').hidden = false;
  } finally {
    loading = false;
  }
}

for (const [key, name] of fields) {
  const label = document.createElement('label');
  label.hidden = true;
  const input = document.createElement('select');
  label.append(name, input);
  input.addEventListener('change', () => {
    if (input.value) selection[key] = input.value;
    else delete selection[key];
    visible = 24;
    render();
  });
  filters.set(key, { label, input });
  byId('catalog-filters').append(label);
}

byId('catalog-clear').addEventListener('click', () => {
  if (requestedCategory) location.hash = 'colecciones';
  else applyCategory();
});
byId('catalog-more').addEventListener('click', () => {
  const previous = visible;
  visible += 24;
  render();
  byId('listing').children[previous]?.querySelector('a')?.focus();
});
byId('catalog-retry').addEventListener('click', load);

function onRoute() {
  const [route, query] = location.hash.slice(1).split('?');
  if (route !== 'colecciones') return;
  requestedCategory = new URLSearchParams(query).get('tipo') || '';
  if (items) applyCategory();
  else load();
}
window.addEventListener('hashchange', onRoute);
onRoute();
