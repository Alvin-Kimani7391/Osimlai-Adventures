/**
 * index-dynamic.js
 * Powers the homepage's dynamic sections:
 *  - live program counts on the 5 volunteer category teasers
 *  - featured volunteer programs (fetched from /api/volunteer)
 *  - gallery preview (fetched from /api/gallery, same shape gallery.js uses)
 *  - animated stat counters (stats-strip + community-stat-number)
 *
 * Categories themselves stay static (defined in CATEGORIES below) — only the
 * programs and counts inside them are live.
 */

(function () {
  const API_BASE = 'https://wild-tours.onrender.com';

  const CATEGORIES = ['wildlife', 'education', 'healthcare', 'environment', 'community'];

  const FALLBACK_IMG = 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600&auto=format&fit=crop';

  function escHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }

  /* ============================================================
     CATEGORY TEASER COUNTS
  ============================================================ */
  async function loadCategoryCounts() {
    try {
      const res = await fetch(`${API_BASE}/api/volunteer?limit=200`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      const programs = data.programs || data.data?.programs || data.data || [];

      const counts = Object.fromEntries(CATEGORIES.map(c => [c, 0]));
      programs.forEach(p => {
        const cat = (p.category || '').toLowerCase();
        CATEGORIES.forEach(key => { if (cat.includes(key)) counts[key]++; });
      });

      Object.entries(counts).forEach(([key, val]) => {
        const el = document.querySelector(`[data-cat-count="${key}"]`);
        if (el) el.textContent = `${val} program${val === 1 ? '' : 's'} open`;
      });

      return programs;
    } catch (err) {
      console.warn('[index] Could not load category counts:', err);
      document.querySelectorAll('[data-cat-count]').forEach(el => el.textContent = 'View programs →');
      return [];
    }
  }

  /* ============================================================
     FEATURED VOLUNTEER PROGRAMS
  ============================================================ */
  function renderFeaturedCard(p) {
    const img = p.coverImage?.url || p.images?.[0]?.url || FALLBACK_IMG;
    const title = escHtml(p.title || 'Volunteer Program');
    const desc = escHtml(p.shortDescription || p.summary || (p.description || '').slice(0, 140) || 'A hands-on placement making a measurable difference on the ground.');
    const country = escHtml(p.country || '');
    const location = escHtml(p.location || p.town || '');
    const locStr = [location, country].filter(Boolean).join(', ') || 'Location on request';

    let durStr = '—';
    if (p.duration) {
      if (typeof p.duration === 'object' && p.duration.min != null) {
        const unit = p.duration.unit || 'weeks';
        durStr = (p.duration.max && p.duration.max !== p.duration.min) ? `${p.duration.min}–${p.duration.max} ${unit}` : `${p.duration.min} ${unit}`;
      } else durStr = String(p.duration);
    }

    const fee = Number(p.programFee || p.fee || 0);
    const feeStr = fee > 0 ? `$${fee.toLocaleString()}` : 'Contact us';
    const category = p.category ? escHtml(p.category) : 'Volunteer';
    const badge = p.featured ? 'Featured' : (p.spotsAvailable != null && p.spotsAvailable <= 5 ? `${p.spotsAvailable} spots left` : '');
    const catSlug = CATEGORIES.find(c => (p.category || '').toLowerCase().includes(c)) || '';
    const link = catSlug ? `category.html?cat=${catSlug}` : 'volunteer.html';

    return `
      <a class="fv-card" href="${link}" style="text-decoration:none;color:inherit;">
        <div class="fv-card-img">
          <img src="${img}" alt="${title}" loading="lazy" onerror="this.src='${FALLBACK_IMG}'"/>
          ${badge ? `<span class="fv-badge">${escHtml(badge)}</span>` : ''}
        </div>
        <div class="fv-card-body">
          <div class="fv-tags"><span class="fv-tag">${category}</span></div>
          <h3>${title}</h3>
          <p>${desc}</p>
          <div class="fv-meta">
            <span><i class="fa-solid fa-location-dot"></i> ${locStr}</span>
            <span><i class="fa-regular fa-clock"></i> ${escHtml(durStr)}</span>
          </div>
          <div class="fv-card-footer">
            <div class="fv-price">${feeStr} <span>from</span></div>
            <span style="font-weight:700;font-size:0.83rem;color:var(--forest,#1a3c2e);">View Details →</span>
          </div>
        </div>
      </a>`;
  }

  function renderFeatured(programs) {
    const grid = document.getElementById('featuredVolunteerGrid');
    if (!grid) return;

    if (!programs.length) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:40px 20px;color:#667085;">
          <p>New placements are being added — check back shortly or browse all categories.</p>
        </div>`;
      return;
    }

    // Prefer featured programs, then top-rated, cap at 6
    const sorted = [...programs].sort((a, b) => (b.featured === true) - (a.featured === true) || (b.ratingsAverage || 0) - (a.ratingsAverage || 0));
    grid.innerHTML = sorted.slice(0, 6).map(renderFeaturedCard).join('');
  }

  /* ============================================================
     GALLERY (mirrors gallery.js data shape, condensed for homepage)
  ============================================================ */
  let idxGalleryItems = [];
  let idxVisibleItems = [];
  let idxCurrentIndex = 0;
  let idxCurrentFilter = 'all';

  async function fetchGalleryPreview() {
    try {
      const res = await fetch(`${API_BASE}/api/gallery?limit=16&sort=order`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Gallery fetch failed');
      idxGalleryItems = json.data || [];
      renderIdxGallery(idxGalleryItems);
    } catch (err) {
      console.warn('[index] Gallery fetch error:', err);
      const grid = document.getElementById('idxGalleryGrid');
      if (grid) grid.innerHTML = `<p style="text-align:center;color:#667085;grid-column:1/-1;">Gallery is loading slowly — <a href="gallery.html">view the full gallery here</a>.</p>`;
      const chips = document.getElementById('idxGalleryChips');
      if (chips) chips.style.display = 'none';
    }
  }

  function renderIdxGallery(items) {
    const grid = document.getElementById('idxGalleryGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!items.length) {
      grid.innerHTML = `<p style="text-align:center;color:#667085;">No photos yet in this category.</p>`;
      return;
    }

    items.forEach((item, i) => {
      const el = document.createElement('div');
      el.className = 'idx-gallery-item';
      el.dataset.category = item.category || '';
      el.dataset.id = item._id || String(i);
      const thumb = item.thumbnailUrl || item.imageUrl || FALLBACK_IMG;
      el.innerHTML = `
        <img src="${thumb}" data-fullsrc="${item.imageUrl || thumb}" alt="${escHtml(item.altText || item.title || 'Gallery photo')}" loading="lazy" onerror="this.src='${FALLBACK_IMG}'"/>
        <div class="idx-g-overlay">
          <span class="tag">${escHtml(item.category || '')}</span>
          <span class="title">${escHtml(item.title || '')}</span>
        </div>`;
      el.addEventListener('click', () => openIdxLightbox(el));
      grid.appendChild(el);
      revealObserver.observe(el);
    });
  }

  function applyIdxGalleryFilter(filter) {
    idxCurrentFilter = filter;
    document.querySelectorAll('#idxGalleryGrid .idx-gallery-item').forEach(el => {
      const match = filter === 'all' || el.dataset.category === filter;
      el.style.display = match ? '' : 'none';
    });
  }

  function openIdxLightbox(clickedEl) {
    idxVisibleItems = Array.from(document.querySelectorAll('#idxGalleryGrid .idx-gallery-item')).filter(el => el.style.display !== 'none');
    idxCurrentIndex = idxVisibleItems.indexOf(clickedEl);
    updateIdxLightbox();
    document.getElementById('idxLightbox').classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function updateIdxLightbox() {
    const item = idxVisibleItems[idxCurrentIndex];
    if (!item) return;
    const img = item.querySelector('img');
    document.getElementById('idxLbImg').src = img.dataset.fullsrc || img.src;
    document.getElementById('idxLbTitle').textContent = item.querySelector('.title')?.textContent || '';
    document.getElementById('idxLbLocation').textContent = item.querySelector('.tag')?.textContent || '';
  }
  function closeIdxLightbox() {
    document.getElementById('idxLightbox').classList.remove('active');
    document.body.style.overflow = '';
  }

  function wireIdxGalleryControls() {
    document.querySelectorAll('#idxGalleryChips .idx-gchip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#idxGalleryChips .idx-gchip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        applyIdxGalleryFilter(chip.dataset.filter);
      });
    });
    document.getElementById('idxLbClose')?.addEventListener('click', closeIdxLightbox);
    document.getElementById('idxLightbox')?.addEventListener('click', e => { if (e.target.id === 'idxLightbox') closeIdxLightbox(); });
    document.getElementById('idxLbPrev')?.addEventListener('click', () => { idxCurrentIndex = (idxCurrentIndex - 1 + idxVisibleItems.length) % idxVisibleItems.length; updateIdxLightbox(); });
    document.getElementById('idxLbNext')?.addEventListener('click', () => { idxCurrentIndex = (idxCurrentIndex + 1) % idxVisibleItems.length; updateIdxLightbox(); });
    document.addEventListener('keydown', e => {
      if (!document.getElementById('idxLightbox')?.classList.contains('active')) return;
      if (e.key === 'Escape') closeIdxLightbox();
      if (e.key === 'ArrowLeft') { idxCurrentIndex = (idxCurrentIndex - 1 + idxVisibleItems.length) % idxVisibleItems.length; updateIdxLightbox(); }
      if (e.key === 'ArrowRight') { idxCurrentIndex = (idxCurrentIndex + 1) % idxVisibleItems.length; updateIdxLightbox(); }
    });
  }

  /* ============================================================
     REVEAL-ON-SCROLL (IntersectionObserver, per house style —
     avoids scroll listeners for layout-shift-sensitive UI)
  ============================================================ */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  /* ============================================================
     ANIMATED STAT COUNTERS
  ============================================================ */
  function animateNumber(el, target, decimals, suffix) {
    const dur = 1100;
    const start = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = target * eased;
      el.textContent = (decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString()) + (suffix || '');
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = (decimals ? target.toFixed(decimals) : Math.round(target).toLocaleString()) + (suffix || '');
    }
    requestAnimationFrame(tick);
  }

  function wireStatCounters() {
    // .stat-num[data-target][data-suffix] — stats strip
    document.querySelectorAll('.stat-num[data-target]').forEach(el => {
      const target = parseFloat(el.dataset.target || '0');
      const suffix = el.dataset.suffix || '';
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) { animateNumber(el, target, 0, suffix); obs.unobserve(entry.target); }
        });
      }, { threshold: 0.5 });
      obs.observe(el);
    });

    // .community-stat-number[data-count] — community section
    document.querySelectorAll('.community-stat-number[data-count]').forEach(el => {
      const target = parseFloat(el.dataset.count || '0');
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) { animateNumber(el, target, 0, ''); obs.unobserve(entry.target); }
        });
      }, { threshold: 0.5 });
      obs.observe(el);
    });
  }

  /* ============================================================
     INIT
  ============================================================ */
  document.addEventListener('DOMContentLoaded', () => {
    wireIdxGalleryControls();
    wireStatCounters();
    document.querySelectorAll('.cat-teaser').forEach(el => revealObserver.observe(el));

    loadCategoryCounts().then(renderFeatured);
    fetchGalleryPreview();
  });
})();