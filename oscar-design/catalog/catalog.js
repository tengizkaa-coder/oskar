const search = document.querySelector('#search');
const cards = [...document.querySelectorAll('.card')];
const sections = [...document.querySelectorAll('.category')];
search.addEventListener('input', () => {
  const term = search.value.trim().toLocaleLowerCase('ru');
  let visible = 0;
  for (const card of cards) {
    const matches = card.dataset.name.toLocaleLowerCase('ru').includes(term);
    card.hidden = !matches;
    if (matches) visible++;
  }
  for (const section of sections) section.hidden = !section.querySelector('.card:not([hidden])');
  document.querySelector('#empty').hidden = visible !== 0;
});

const storageKey = 'oscar-design-cart-v1';
const productButtons = [...document.querySelectorAll('.add-to-cart')];
const products = new Map(productButtons.map(button => [button.dataset.image, button.dataset.title]));
let basket = {};
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
  for (const [id, quantity] of Object.entries(saved)) {
    if (products.has(id) && Number.isInteger(quantity) && quantity > 0 && quantity <= 99) basket[id] = quantity;
  }
} catch { /* Basket still works for this page when storage is unavailable. */ }
const dialog = document.querySelector('#cart-dialog');
const items = document.querySelector('#cart-items');
const empty = document.querySelector('#cart-empty');
const checkout = document.querySelector('#checkout');
const count = document.querySelector('#cart-count');
const floatButton = document.querySelector('#cart-float');
const floatCount = document.querySelector('#cart-float-count');

function renderCart() {
  const entries = Object.entries(basket);
  const total = entries.reduce((sum, [, quantity]) => sum + quantity, 0);
  count.textContent = String(total);
  floatCount.textContent = String(total);
  floatButton.hidden = total === 0;
  items.replaceChildren();
  empty.hidden = entries.length !== 0;
  checkout.hidden = entries.length === 0;
  for (const [id, quantity] of entries) {
    const row = document.createElement('div');
    row.className = 'cart-row';
    const image = document.createElement('img');
    image.src = id;
    image.alt = '';
    const name = document.createElement('span');
    name.className = 'cart-name';
    name.textContent = products.get(id);
    const controls = document.createElement('div');
    controls.className = 'quantity';
    const minus = document.createElement('button');
    minus.type = 'button'; minus.textContent = '−'; minus.setAttribute('aria-label', `Уменьшить количество: ${name.textContent}`);
    minus.addEventListener('click', () => changeQuantity(id, -1));
    const number = document.createElement('span'); number.textContent = String(quantity);
    const plus = document.createElement('button');
    plus.type = 'button'; plus.textContent = '+'; plus.setAttribute('aria-label', `Увеличить количество: ${name.textContent}`);
    plus.disabled = quantity >= 99;
    plus.addEventListener('click', () => changeQuantity(id, 1));
    controls.append(minus, number, plus);
    row.append(image, name, controls);
    items.append(row);
  }
}
function changeQuantity(id, amount) {
  const next = Math.max(0, Math.min(99, (basket[id] || 0) + amount));
  if (next) basket[id] = next; else delete basket[id];
  try { localStorage.setItem(storageKey, JSON.stringify(basket)); } catch { /* in-memory fallback */ }
  renderCart();
}
for (const button of productButtons) {
  button.setAttribute('aria-label', `Добавить в корзину: ${button.dataset.title}`);
  button.addEventListener('click', () => {
    changeQuantity(button.dataset.image, 1);
    button.textContent = 'Добавлено ✓';
    clearTimeout(button.resetTimer);
    button.resetTimer = setTimeout(() => { button.textContent = 'В корзину'; }, 1200);
  });
}
function openCart() {
  if (dialog.open) return;
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
}
function closeCart() {
  if (typeof dialog.close === 'function') dialog.close();
  else dialog.removeAttribute('open');
}
document.querySelector('#open-cart').addEventListener('click', openCart);
floatButton.addEventListener('click', openCart);
document.querySelector('#close-cart').addEventListener('click', closeCart);
renderCart();
if (location.hash === '#cart') openCart();
