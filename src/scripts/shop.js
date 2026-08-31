const CHECKOUT_ENDPOINT = '/api/checkout';
const CART_KEY = 'stndrd.cart.qty';
const MAX_QUANTITY = 9;

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

// Storage can throw outright in private modes; the cart degrades to
// in-memory rather than breaking the page.
function readCart() {
  try {
    const raw = parseInt(window.localStorage.getItem(CART_KEY), 10);
    return Number.isFinite(raw) ? Math.min(MAX_QUANTITY, Math.max(0, raw)) : 0;
  } catch {
    return 0;
  }
}

function writeCart(value) {
  try {
    window.localStorage.setItem(CART_KEY, String(value));
  } catch {
    /* keep the in-memory count */
  }
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
  const cartPill = document.getElementById('cart-pill');
  const errorEl = document.getElementById('buy-error');

  let qty = 1;
  let cart = readCart();
  let labelTimer = null;

  const money = (n) => '$' + n.toFixed(2);
  const resetLabel = () => { addLabel.textContent = 'Add to cart'; };

  const showError = (message) => {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.classList.add('show');
  };
  const clearError = () => errorEl?.classList.remove('show');

  const renderCart = () => {
    if (cartCount) cartCount.textContent = cart;
    if (cartPill) {
      cartPill.disabled = cart === 0;
      cartPill.setAttribute(
        'aria-label',
        cart === 0 ? 'Cart is empty' : `Cart — check out, ${cart} item${cart === 1 ? '' : 's'}`,
      );
    }
  };

  const render = () => {
    qtyValue.textContent = qty;
    addTotal.textContent = money(price * qty);
  };

  const setQty = (next) => {
    qty = Math.min(MAX_QUANTITY, Math.max(1, next));
    clearTimeout(labelTimer);
    resetLabel();
    render();
  };

  document.getElementById('qty-dec')?.addEventListener('click', () => setQty(qty - 1));
  document.getElementById('qty-inc')?.addEventListener('click', () => setQty(qty + 1));

  addBtn.addEventListener('click', () => {
    clearError();
    const next = Math.min(MAX_QUANTITY, cart + qty);
    if (next === cart) {
      showError(`That's the most we can ship in one order (${MAX_QUANTITY}).`);
      return;
    }
    cart = next;
    writeCart(cart);
    renderCart();
    if (cartCount) {
      // restart the bump animation on every add
      cartCount.classList.remove('bump');
      void cartCount.offsetWidth;
      cartCount.classList.add('bump');
    }
    addLabel.textContent = 'Added to cart';
    clearTimeout(labelTimer);
    labelTimer = setTimeout(resetLabel, 1800);
  });

  cartPill?.addEventListener('click', async () => {
    if (cart === 0) return;
    clearError();
    cartPill.disabled = true;
    const originalCount = cartCount ? cartCount.textContent : '';
    if (cartCount) cartCount.textContent = '…';

    let message = null;
    try {
      const res = await fetch(CHECKOUT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: cart }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      if (res.status === 503) message = "Checkout isn't open yet. Try again soon.";
      else if (res.status === 429) message = 'Too many attempts. Wait a minute and try again.';
      else message = "Couldn't start checkout. Try again in a moment.";
    } catch {
      message = "Couldn't reach the server. Check your connection and try again.";
    }

    if (cartCount) cartCount.textContent = originalCount;
    cartPill.disabled = false;
    showError(message);
  });

  renderCart();
  render();
}
