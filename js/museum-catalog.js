const endpoint = 'https://wgtircsltokentekqgdq.supabase.co/functions/v1/museum-catalog';
const filterFields = [
  ['category', 'Clase de objeto'],
  ['brand', 'Marca'],
  ['model', 'Modelo'],
  ['manufacture_date', 'Fecha'],
  ['type', 'Tipo'],
];
const fields = [
  ...filterFields,
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

const listing = byId('listing');
const dialog = byId('catalog-detail');
const order = byId('catalog-order');
const thumbnailSize = byId('catalog-size');

function titleOf(item) {
  return [item.brand, item.model].filter(Boolean).join(' ') || item.category;
}

function showPhoto(container, item, lazy = false) {
  const photo = document.createElement('img');
  photo.alt = lazy ? '' : titleOf(item);
  if (lazy) photo.loading = 'lazy';
  photo.addEventListener('error', () => {
    const missing = document.createElement('span');
    missing.className = 'catalog-photo-missing';
    missing.textContent = 'Foto no disponible';
    photo.replaceWith(missing);
  });
  photo.src = endpoint + '?foto=' + encodeURIComponent(item.code);
  container.replaceChildren(photo);
}

function openDetail(item) {
  byId('catalog-detail-title').textContent = titleOf(item);
  showPhoto(byId('catalog-detail-photo'), item);
  const details = byId('catalog-detail-fields');
  details.replaceChildren();
  for (const [key, label] of fields) {
    if (!item[key]) continue;
    const term = document.createElement('dt');
    const value = document.createElement('dd');
    term.textContent = label;
    value.textContent = item[key];
    details.append(term, value);
  }
  dialog.showModal();
  dialog.scrollTop = 0;
}

function photoCard(item) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'catalog-thumbnail';
  button.setAttribute('aria-label', titleOf(item) + ' · ' + item.code);
  showPhoto(button, item, true);
  const title = document.createElement('span');
  title.className = 'catalog-thumbnail-title';
  title.textContent = titleOf(item);
  button.append(title);
  button.addEventListener('click', () => openDetail(item));
  return button;
}

function dateKey(value) {
  const text = value || '';
  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) return Number(iso[1] + iso[2] + iso[3]);
  const full = text.match(/\b(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})\b/);
  if (full) return Number(full[3]) * 10000 + Number(full[2]) * 100 + Number(full[1]);
  const year = text.match(/\b\d{4}\b/);
  return year ? Number(year[0]) * 10000 : null;
}

function sortByDate(left, right) {
  const a = dateKey(left.manufacture_date);
  const b = dateKey(right.manufacture_date);
  const byCode = () => collator.compare(left.code, right.code);
  if (a === null) return b === null ? byCode() : 1;
  if (b === null) return -1;
  return (order.value === 'oldest' ? a - b : b - a) || byCode();
}

thumbnailSize.addEventListener('change', () => listing.dataset.size = thumbnailSize.value);
order.addEventListener('change', () => {
  if (!items) return;
  visible = 24;
  render();
});
dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener('close', () => byId('catalog-detail-photo').replaceChildren());

function render() {
  const results = items.filter(item => matches(item)).sort(sortByDate);
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

for (const [key, name] of filterFields) {
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
  listing.children[previous]?.focus();
});
byId('catalog-retry').addEventListener('click', load);

function onRoute() {
  const [route, query] = location.hash.slice(1).split('?');
  if (dialog.open) dialog.close();
  if (route !== 'colecciones') return;
  requestedCategory = new URLSearchParams(query).get('tipo') || '';
  if (items) applyCategory();
  else load();
}
window.addEventListener('hashchange', onRoute);
onRoute();
