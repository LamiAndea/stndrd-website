document.addEventListener('DOMContentLoaded', () => {
  initGallery();
  initBuyPanel();
});

function initGallery() {
  const layers = Array.from(document.querySelectorAll('.shot-layer'));
  const thumbs = Array.from(document.querySelectorAll('.shop-thumb'));
  if (!layers.length) return;

  let active = 0;
  const show = (i) => {
    active = ((i % layers.length) + layers.length) % layers.length;
    layers.forEach((layer, n) => {
      layer.classList.toggle('is-active', n === active);
      layer.setAttribute('aria-hidden', n === active ? 'false' : 'true');
    });
    thumbs.forEach((thumb, n) => {
      thumb.classList.toggle('is-selected', n === active);
      if (n === active) thumb.setAttribute('aria-current', 'true');
      else thumb.removeAttribute('aria-current');
    });
  };

  document.getElementById('shop-prev')?.addEventListener('click', () => show(active - 1));
  document.getElementById('shop-next')?.addEventListener('click', () => show(active + 1));
  thumbs.forEach((thumb, n) => thumb.addEventListener('click', () => show(n)));
}

function initBuyPanel() {
  const panel = document.getElementById('buy-panel');
  if (!panel) return;

  const price = parseFloat(panel.dataset.price);
  const qtyValue = document.getElementById('qty-value');
  const addBtn = document.getElementById('add-to-cart');
  const addLabel = document.getElementById('add-label');
  const addTotal = document.getElementById('add-total');
  const cartCount = document.getElementById('cart-count');

  // Header count is the only cart feedback in this concept; the real
  // cart mutation replaces this when the backend lands.
  let qty = 1;
  let cart = 0;
  let labelTimer = null;

  const money = (n) => '$' + n.toFixed(2);
  const resetLabel = () => { addLabel.textContent = 'Add to cart'; };
  const render = () => {
    qtyValue.textContent = qty;
    addTotal.textContent = money(price * qty);
  };

  const setQty = (next) => {
    qty = Math.min(9, Math.max(1, next));
    clearTimeout(labelTimer);
    resetLabel();
    render();
  };

  document.getElementById('qty-dec')?.addEventListener('click', () => setQty(qty - 1));
  document.getElementById('qty-inc')?.addEventListener('click', () => setQty(qty + 1));

  addBtn.addEventListener('click', () => {
    cart += qty;
    if (cartCount) {
      cartCount.textContent = cart;
      // restart the bump animation on every add
      cartCount.classList.remove('bump');
      void cartCount.offsetWidth;
      cartCount.classList.add('bump');
    }
    addLabel.textContent = 'Added to cart';
    clearTimeout(labelTimer);
    labelTimer = setTimeout(resetLabel, 1800);
  });

  render();
}
