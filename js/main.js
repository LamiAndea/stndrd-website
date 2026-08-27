// Set this to your real waitlist endpoint (e.g. '/api/waitlist' on Vercel).
// While null, submissions are accepted client-side only and NOT stored anywhere.
const WAITLIST_ENDPOINT = null;

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', () => {
  initScrollNav();
  initWaitlistForm('hero-signup-form', 'hero-signup-email', 'hero-signup-error', 'hero-signup-confirm', 'hero-signup-submit');
  initIngredientPhotos();
  initScrollProgress();
});

function initScrollNav() {
  const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
  document.querySelectorAll('[data-scroll]').forEach((el) => {
    el.addEventListener('click', () => {
      const target = el.getAttribute('data-scroll');
      if (target === 'top') {
        window.scrollTo({ top: 0, behavior });
        return;
      }
      const section = document.getElementById(target);
      // sticky-header offset handled by scroll-margin-top in CSS
      if (section) section.scrollIntoView({ behavior });
    });
  });
}

function initWaitlistForm(formId, emailId, errorId, confirmId, submitId) {
  const form = document.getElementById(formId);
  if (!form) return;

  const emailInput = document.getElementById(emailId);
  const errorEl = document.getElementById(errorId);
  const confirmEl = document.getElementById(confirmId);
  const submitBtn = document.getElementById(submitId);
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

    if (WAITLIST_ENDPOINT) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Joining…';
      try {
        const res = await fetch(WAITLIST_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        if (!res.ok) throw new Error('Request failed: ' + res.status);
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Join';
        showError("Couldn't reach the server. Check your connection and try again.");
        return;
      }
    }

    form.hidden = true;
    confirmEl.hidden = false;
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
    const pct = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    bar.style.transform = 'scaleX(' + pct + ')';
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  update();
}
