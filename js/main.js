document.addEventListener('DOMContentLoaded', () => {
  initScrollNav();
  initWaitlistForm('hero-signup-form', 'hero-signup-email', 'hero-signup-error', 'hero-signup-confirm');
  initIngredientPhotos();
  initScrollProgress();
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

function initWaitlistForm(formId, emailId, errorId, confirmId) {
  const form = document.getElementById(formId);
  if (!form) return;

  const emailInput = document.getElementById(emailId);
  const errorEl = document.getElementById(errorId);
  const confirmEl = document.getElementById(confirmId);
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
  const photos = document.querySelectorAll('.crossfade-photo');
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

function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;

  let ticking = false;
  const update = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
    bar.style.width = pct + '%';
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  update();
}
