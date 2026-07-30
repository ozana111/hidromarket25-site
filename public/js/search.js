/**
 * Live catalog search with autocomplete dropdown.
 * Case-insensitive, matches any part of the product name/brand/model/category.
 */
(function () {
  const DEBOUNCE_MS = 180;
  const MIN_CHARS = 1;

  class LiveSearch {
    constructor(root) {
      this.root = root;
      this.input = root.querySelector('#site-search-input');
      this.resultsBox = root.querySelector('#site-search-results');

      this.items = [];
      this.activeIndex = -1;
      this.debounceTimer = null;
      this.requestSeq = 0;

      this.bindEvents();
    }

    bindEvents() {
      this.input.addEventListener('input', () => this.onInput());
      this.input.addEventListener('keydown', (e) => this.onKeyDown(e));
      this.input.addEventListener('focus', () => {
        if (this.items.length) this.showResults();
      });
      document.addEventListener('click', (e) => {
        if (!this.root.contains(e.target)) this.hideResults();
      });
    }

    onInput() {
      const query = this.input.value.trim();
      clearTimeout(this.debounceTimer);

      if (query.length < MIN_CHARS) {
        this.hideResults();
        this.items = [];
        return;
      }

      this.debounceTimer = setTimeout(() => this.runSearch(query), DEBOUNCE_MS);
    }

    async runSearch(query) {
      const seq = ++this.requestSeq;
      this.renderLoading();

      let results = [];
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        results = data.results || [];
      } catch (err) {
        results = [];
      }

      if (seq !== this.requestSeq) return; // stale response, ignore

      this.items = results;
      this.activeIndex = -1;
      this.renderResults(query);
    }

    renderLoading() {
      this.resultsBox.innerHTML = '<div class="search-loading">Поиск…</div>';
      this.showResults();
    }

    renderResults(query) {
      if (this.items.length === 0) {
        this.resultsBox.innerHTML = '<div class="search-empty">Ничего не найдено</div>';
        this.showResults();
        return;
      }

      const html = this.items
        .map((item, index) => {
          const nameHtml = this.highlight(item.name, query);
          return `
            <div class="search-result-item" role="option" data-index="${index}" data-slug="${item.slug}">
              <span class="result-name">${nameHtml}</span>
              <span class="result-meta">${this.escape(item.category)} · ${this.escape(item.brand)} ${this.escape(item.model)}</span>
            </div>
          `;
        })
        .join('');

      this.resultsBox.innerHTML = html;
      this.showResults();

      this.resultsBox.querySelectorAll('.search-result-item').forEach((el) => {
        el.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this.goToProduct(el.dataset.slug);
        });
        el.addEventListener('mouseenter', () => {
          this.setActiveIndex(Number(el.dataset.index));
        });
      });
    }

    highlight(text, query) {
      const safeText = this.escape(text);
      const safeQuery = this.escape(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (!safeQuery) return safeText;
      const re = new RegExp(`(${safeQuery})`, 'ig');
      return safeText.replace(re, '<mark>$1</mark>');
    }

    escape(str) {
      const div = document.createElement('div');
      div.textContent = str == null ? '' : String(str);
      return div.innerHTML;
    }

    showResults() {
      this.resultsBox.hidden = false;
      this.input.setAttribute('aria-expanded', 'true');
    }

    hideResults() {
      this.resultsBox.hidden = true;
      this.input.setAttribute('aria-expanded', 'false');
      this.activeIndex = -1;
    }

    setActiveIndex(index) {
      const els = this.resultsBox.querySelectorAll('.search-result-item');
      els.forEach((el) => el.classList.remove('is-active'));
      if (index >= 0 && index < els.length) {
        els[index].classList.add('is-active');
        els[index].scrollIntoView({ block: 'nearest' });
        this.activeIndex = index;
      } else {
        this.activeIndex = -1;
      }
    }

    onKeyDown(e) {
      const count = this.items.length;
      if (this.resultsBox.hidden || count === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.setActiveIndex((this.activeIndex + 1) % count);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.setActiveIndex((this.activeIndex - 1 + count) % count);
      } else if (e.key === 'Enter') {
        if (this.activeIndex >= 0) {
          e.preventDefault();
          this.goToProduct(this.items[this.activeIndex].slug);
        }
      } else if (e.key === 'Escape') {
        this.hideResults();
      }
    }

    goToProduct(slug) {
      if (!slug) return;
      window.location.href = `/katalog/${slug}`;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('site-search');
    if (root) new LiveSearch(root);
  });
})();
