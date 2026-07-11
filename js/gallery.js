/**
 * gallery.js
 * Replaces the static masonry HTML with dynamically loaded gallery items
 * fetched from GET /api/gallery.
 *
 * Drop this as <script src="js/gallery.js"></script> at the bottom of gallery.html,
 * after main.js, replacing the inline <script> block.
 */


  const API_BASE = 'https://wild-tours.onrender.com';   // set window.API_BASE = 'https://...' before this script

  // ── DOM refs ──────────────────────────────────────────────────────────────
  const grid        = document.getElementById('masonryGrid');
  const filterChips = document.querySelectorAll('#filterChips .chip');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  const lightbox    = document.getElementById('lightbox');
  const lbImg       = document.getElementById('lbImg');
  const lbTitle     = document.getElementById('lbTitle');
  const lbLocation  = document.getElementById('lbLocation');
  const lbCounter   = document.getElementById('lbCounter');

  // ── State ─────────────────────────────────────────────────────────────────
  let allItems      = [];   // full fetched list
  let visibleItems  = [];   // currently visible after filter
  let currentIndex  = 0;
  let currentFilter = 'all';
  const INITIAL_VISIBLE = 12;

  // ── Fetch gallery from API ────────────────────────────────────────────────
  async function fetchGallery(category = 'all') {
    try {
      const url = category === 'all'
        ? `${API_BASE}/api/gallery?limit=200&sort=order`
        : `${API_BASE}/api/gallery?category=${category}&limit=200&sort=order`;

      const res  = await fetch(url);
      const json = await res.json();

      if (!json.success) throw new Error(json.message);
      return json.data;

    } catch (err) {
      console.error('[Gallery] Fetch error:', err);
      return [];
    }
  }

  // ── Render a single masonry item ──────────────────────────────────────────
  function renderItem(item, hidden = false) {
    const el = document.createElement('div');
    el.className = `masonry-item${hidden ? ' hidden' : ''}`;
    el.dataset.category = item.category;
    el.dataset.title    = item.title;
    el.dataset.location = item.location;
    el.dataset.id       = item._id;

    // Use thumbnail for grid, full image for lightbox
    const thumbSrc = item.thumbnailUrl || item.imageUrl;

    el.innerHTML = `
      <img
        src="${thumbSrc}"
        data-fullsrc="${item.imageUrl}"
        alt="${item.altText || item.title}"
        loading="lazy"
      />
      <div class="overlay">
        <span class="overlay-zoom">🔍</span>
        <span class="overlay-tag">${capitalise(item.category)}</span>
        <span class="overlay-title">${item.title}</span>
        <span class="overlay-location">📍 ${item.location}</span>
      </div>
    `;

    el.addEventListener('click', () => {
      const filtered = getFiltered();
      const idx = filtered.findIndex(i => i.dataset.id === el.dataset.id);
      openLightbox(idx >= 0 ? idx : 0);
    });

    return el;
  }

  // ── Render all items into the grid ────────────────────────────────────────
  function renderGrid(items) {
    grid.innerHTML = '';

    if (items.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-muted);">
          <div style="font-size:2.5rem;margin-bottom:12px;">📷</div>
          <p style="font-size:1rem;">No photos found in this category yet.</p>
        </div>`;
      loadMoreBtn.style.display = 'none';
      return;
    }

    items.forEach((item, i) => {
      grid.appendChild(renderItem(item, i >= INITIAL_VISIBLE));
    });

    // Show/hide load more
    loadMoreBtn.style.display = items.length > INITIAL_VISIBLE ? 'inline-flex' : 'none';
  }

  // ── Filter helpers ────────────────────────────────────────────────────────
  function getFiltered() {
    return Array.from(grid.querySelectorAll('.masonry-item'))
      .filter(el => el.style.display !== 'none');
  }

  function applyFilter(category) {
    currentFilter = category;
    const domItems = Array.from(grid.querySelectorAll('.masonry-item'));

    domItems.forEach((el, i) => {
      const match = category === 'all' || el.dataset.category === category;
      el.style.display = match ? 'block' : 'none';

      // Re-apply load-more hidden state within the filtered set
      const matchingItems = domItems.filter(e => category === 'all' || e.dataset.category === category);
      const posInFiltered  = matchingItems.indexOf(el);
      if (match && posInFiltered >= INITIAL_VISIBLE) {
        el.classList.add('hidden');
        el.style.display = 'none';
      } else if (match) {
        el.classList.remove('hidden');
      }
    });

    // Count visible after filter for load more
    const totalVisible = domItems.filter(el => category === 'all' || el.dataset.category === category).length;
    loadMoreBtn.style.display = totalVisible > INITIAL_VISIBLE ? 'inline-flex' : 'none';
  }

  // ── Load more ─────────────────────────────────────────────────────────────
  loadMoreBtn.addEventListener('click', () => {
    const hidden = Array.from(grid.querySelectorAll('.masonry-item.hidden'))
      .filter(el => currentFilter === 'all' || el.dataset.category === currentFilter);

    hidden.forEach(el => {
      el.classList.remove('hidden');
      el.style.display = 'block';
    });

    loadMoreBtn.style.display = 'none';
  });

  // ── Filter chips ──────────────────────────────────────────────────────────
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      applyFilter(chip.dataset.filter);
    });
  });

  // ── Lightbox ──────────────────────────────────────────────────────────────
  function openLightbox(index) {
    visibleItems = getFiltered();
    currentIndex = index;
    updateLightbox();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function updateLightbox() {
    const item = visibleItems[currentIndex];
    if (!item) return;
    const img = item.querySelector('img');
    lbImg.src      = img.dataset.fullsrc || img.src;
    lbImg.alt      = item.dataset.title;
    lbTitle.textContent    = item.dataset.title;
    lbLocation.textContent = '📍 ' + item.dataset.location;
    lbCounter.textContent  = `${currentIndex + 1} / ${visibleItems.length}`;
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  document.getElementById('lbClose').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  document.getElementById('lbPrev').addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + visibleItems.length) % visibleItems.length;
    updateLightbox();
  });
  document.getElementById('lbNext').addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % visibleItems.length;
    updateLightbox();
  });
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowLeft')  { currentIndex = (currentIndex - 1 + visibleItems.length) % visibleItems.length; updateLightbox(); }
    if (e.key === 'ArrowRight') { currentIndex = (currentIndex + 1) % visibleItems.length; updateLightbox(); }
  });

  // ── Utility ───────────────────────────────────────────────────────────────
  function capitalise(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
  }

  function showSkeleton() {
    grid.innerHTML = Array.from({ length: 8 }, (_, i) => `
      <div class="masonry-item" style="background:#e9e4d8;min-height:${180 + (i % 3) * 80}px;
           border-radius:var(--radius);animation:pulse 1.4s ease-in-out infinite alternate;">
      </div>
    `).join('');
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  async function init() {
    showSkeleton();
    allItems = await fetchGallery();
    renderGrid(allItems);
  }

  init();
;