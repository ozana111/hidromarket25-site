function initHeroSlider() {
  const slider = document.getElementById('hero-slider');
  if (!slider) return;

  const slides = Array.from(slider.querySelectorAll('.hero-slide'));
  const dots = Array.from(slider.querySelectorAll('.hero-dot'));
  const counter = slider.querySelector('.hero-slide-number strong');
  const prevBtn = slider.querySelector('.hero-arrow-prev');
  const nextBtn = slider.querySelector('.hero-arrow-next');
  let current = 0;
  let timer;

  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle('is-active', i === current));
    dots.forEach((d, i) => d.classList.toggle('is-active', i === current));
    if (counter) counter.textContent = String(current + 1).padStart(2, '0');
  }

  function next() { show(current + 1); }
  function prev() { show(current - 1); }

  function restart() {
    clearInterval(timer);
    timer = setInterval(next, 6000);
  }

  dots.forEach((dot, i) => dot.addEventListener('click', () => { show(i); restart(); }));
  if (prevBtn) prevBtn.addEventListener('click', () => { prev(); restart(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { next(); restart(); });

  restart();
}

document.addEventListener('DOMContentLoaded', () => {
  initHeroSlider();

  const toggle = document.getElementById('nav-toggle');
  const nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await res.json();

        status.hidden = false;
        if (result.ok) {
          status.textContent = form.dataset.msgOk;
          status.className = 'form-status ok';
          form.reset();
        } else {
          status.textContent = result.error || form.dataset.msgError;
          status.className = 'form-status error';
        }
      } catch (err) {
        status.hidden = false;
        status.textContent = form.dataset.msgConnError;
        status.className = 'form-status error';
      }
    });
  }
});
