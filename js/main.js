document.addEventListener('DOMContentLoaded', () => {
  initScrollNav();
  initScrollSpy();
  initWaitlistForm();
  initIngredientPhotos();
});

function initScrollNav() {
  document.querySelectorAll('[data-scroll]').forEach((el) => {
    el.addEventListener('click', () => {
      const target = el.getAttribute('data-scroll');
      if (target === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const section = document.getElementById(target);
      if (section) {
        window.scrollTo({ top: section.offsetTop - 78, behavior: 'smooth' });
      }
    });
  });
}

function initScrollSpy() {
  const navItems = document.querySelectorAll('.nav-item[data-nav]');
  if (!navItems.length) return;

  const sections = Array.from(navItems).map((item) => ({
    item,
    el: document.getElementById(item.getAttribute('data-nav')),
  })).filter((s) => s.el);

  if (!sections.length) return;

  const onScroll = () => {
    const marker = window.scrollY + 140;
    let active = null;
    for (const s of sections) {
      if (s.el.offsetTop <= marker) active = s;
    }
    sections.forEach((s) => s.item.classList.toggle('active', s === active));
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function initWaitlistForm() {
  const form = document.getElementById('waitlist-form');
  if (!form) return;

  const emailInput = document.getElementById('waitlist-email');
  const errorEl = document.getElementById('waitlist-error');
  const confirmEl = document.getElementById('waitlist-confirm');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  emailInput.addEventListener('input', () => {
    errorEl.classList.remove('show');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = emailRegex.test(emailInput.value.trim());
    if (ok) {
      form.hidden = true;
      confirmEl.hidden = false;
    } else {
      errorEl.classList.add('show');
    }
  });
}

function initIngredientPhotos() {
  const photos = document.querySelectorAll('.ingredient-photo');
  if (!photos.length) return;

  const isTouch = window.matchMedia('(hover: none)').matches;
  if (!isTouch) return;

  photos.forEach((photo) => {
    photo.addEventListener('click', () => {
      const wasActive = photo.classList.contains('is-active');
      photos.forEach((p) => p.classList.remove('is-active'));
      if (!wasActive) photo.classList.add('is-active');
    });
  });
}
