const WAITLIST_ENDPOINT = '/api/waitlist';

document.addEventListener('DOMContentLoaded', () => {
  initGallery();
  initBuyPanel();
  initBandWaitlist();
});

function initGallery() {
  const layers = Array.from(document.querySelectorAll('.shot-layer'));
  const thumbs = Array.from(document.querySelectorAll('.shop-thumb'));
  const caption = document.getElementById('shop-caption');
  if (!layers.length) return;

  let active = 0;
  const show = (i) => {
    active = ((i % layers.length) + layers.length) % layers.length;
    layers.forEach((layer, n) => { layer.hidden = n !== active; });
    thumbs.forEach((thumb, n) => {
      thumb.classList.toggle('is-selected', n === active);
      if (n === active) thumb.setAttribute('aria-current', 'true');
      else thumb.removeAttribute('aria-current');
    });
    if (caption && thumbs[active]) caption.textContent = thumbs[active].title;
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
    if (cartCount) cartCount.textContent = cart;
    addLabel.textContent = 'Added to cart';
    clearTimeout(labelTimer);
    labelTimer = setTimeout(resetLabel, 1800);
  });

  render();
}

function initBandWaitlist() {
  const form = document.getElementById('band-form');
  if (!form) return;

  const emailInput = document.getElementById('band-email');
  const errorEl = document.getElementById('band-error');
  const confirmEl = document.getElementById('band-confirm');
  const submitBtn = document.getElementById('band-join');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const showError = (message) => {
    errorEl.textContent = message;
    errorEl.classList.add('show');
    emailInput.focus();
  };

  emailInput.addEventListener('input', () => {
    errorEl.classList.remove('show');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    if (!emailRegex.test(email)) {
      showError('That address looks incomplete. Check it and try again.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Joining…';
    let failMessage = null;
    try {
      const res = await fetch(WAITLIST_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.status === 503) {
        failMessage = "The waitlist isn't open quite yet. Try again soon.";
      } else if (res.status === 429) {
        failMessage = 'Too many attempts. Wait a minute and try again.';
      } else if (!res.ok) {
        failMessage = "Couldn't save your address. Try again in a moment.";
      }
    } catch {
      failMessage = "Couldn't reach the server. Check your connection and try again.";
    }

    if (failMessage) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Join';
      showError(failMessage);
      return;
    }

    form.hidden = true;
    confirmEl.hidden = false;
  });
}
