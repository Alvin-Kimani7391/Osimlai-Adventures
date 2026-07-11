/* =============================================================
   WildRoots Africa — index.html dynamic script
   Drop this inside a <script> tag at the bottom of index.html,
   AFTER the <script src="js/main.js"></script> line.
   ============================================================= */

const API_BASE = 'https://wild-tours.onrender.com/api';

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function escHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])
  );
}
function fmtMoney(n) {
  return '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

/* ─────────────────────────────────────────────
   AUTH NAV  (desktop + mobile menu)
───────────────────────────────────────────── */
function updateNavForAuth() {
  const token   = localStorage.getItem('wr_token');
  const userRaw = localStorage.getItem('wr_user');

  if (!token || !userRaw) return; // keep default Sign In / Get Started

  try {
    const user = JSON.parse(userRaw);
    const firstName = user.firstName || user.name?.split(' ')[0] || 'Traveler';
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    // ── Desktop nav-actions ──
    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
      navActions.innerHTML = `
        <span style="font-weight:600;color:var(--forest,#1a3c2e);white-space:nowrap;">
          ${greeting}, ${escHtml(firstName)} 👋
        </span>
        <a href="my-portal.html" class="btn btn-outline-dark btn-sm" style="margin-left:10px;">My Portal</a>
        <a onclick="confirmLogout()" class="btn btn-outline-dark btn-sm" style="margin-left:8px;cursor:pointer;">Logout</a>
      `;
    }

    // ── Mobile menu actions ──
    const mobileActions = document.querySelector('.mobile-actions');
    if (mobileActions) {
      mobileActions.innerHTML = `
        <span style="font-weight:600;color:var(--forest,#1a3c2e);text-align:center;padding:8px 0;">
          ${greeting}, ${escHtml(firstName)} 👋
        </span>
        <a href="my-portal.html" class="btn btn-outline-dark" style="justify-content:center;">My Portal</a>
        <a onclick="confirmLogout()" class="btn btn-primary" style="justify-content:center;cursor:pointer;">Logout</a>
      `;
    }
  } catch (e) {
    // Corrupted storage — clear it
    localStorage.removeItem('wr_token');
    localStorage.removeItem('wr_user');
  }
}

/* ─────────────────────────────────────────────
   SKELETON HELPERS
───────────────────────────────────────────── */
function injectSkeletonStyles() {
  if (document.getElementById('wr-skeleton-styles')) return;
  const style = document.createElement('style');
  style.id = 'wr-skeleton-styles';
  style.textContent = `
    .wr-skeleton {
      background: linear-gradient(90deg,#e8e8e8 25%,#f5f5f5 50%,#e8e8e8 75%);
      background-size: 200% 100%;
      animation: wr-shimmer 1.4s infinite;
      border-radius: 8px;
    }
    @keyframes wr-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
    .wr-skel-card{background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e8e8e8;box-shadow:0 2px 8px rgba(0,0,0,.05);}
    .wr-skel-img{height:220px;width:100%;}
    .wr-skel-body{padding:18px;display:flex;flex-direction:column;gap:10px;}
    .wr-skel-line{height:14px;}
    .wr-skel-line.short{width:60%;}
    .wr-skel-line.long{width:90%;}
    .wr-skel-line.med{width:75%;}
    .wr-vol-skel{background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e8e8e8;}
    .wr-vol-skel-img{height:200px;width:100%;}
  `;
  document.head.appendChild(style);
}

function skeletonCard() {
  return `<div class="wr-skel-card">
    <div class="wr-skeleton wr-skel-img"></div>
    <div class="wr-skel-body">
      <div class="wr-skeleton wr-skel-line short"></div>
      <div class="wr-skeleton wr-skel-line long"></div>
      <div class="wr-skeleton wr-skel-line med"></div>
      <div class="wr-skeleton wr-skel-line short"></div>
    </div>
  </div>`;
}

/* ─────────────────────────────────────────────
   RENDER TOUR CARD  (matches tours.html style)
───────────────────────────────────────────── */
function renderTourCard(tour) {
  const img = tour.coverImage?.url
    || tour.images?.[0]?.url
    || tour.imageCover
    || 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=600&auto=format&fit=crop';

  const title    = escHtml(tour.title || 'Safari Tour');
  const country  = escHtml(tour.country || tour.destination || '');
  const days     = tour.duration?.days || tour.duration || '—';
  const maxGroup = tour.maxGroupSize || '—';
  const price    = Number(tour.price || tour.pricePerPerson || 0);
  const discount = Number(tour.priceDiscount || 0);
  const desc     = escHtml(tour.shortDescription || tour.summary || (tour.description || '').slice(0, 110));
  const rating   = Number(tour.ratingsAverage || 0);
  const ratingQty= tour.ratingsQuantity || 0;
  const tourId   = tour._id || tour.id || '';
  const slug     = tour.slug || tourId;

  let badge = '';
  if (tour.featured)              badge = `<span class="tour-badge">FEATURED</span>`;
  else if (ratingQty >= 80)       badge = `<span class="tour-badge">BESTSELLER</span>`;
  else if (rating >= 4.9)         badge = `<span class="tour-badge">TOP RATED</span>`;

  const priceHtml = discount && discount < price
    ? `<span class="tour-price-from">From</span>
       <span class="tour-price-amt" style="text-decoration:line-through;color:#999;font-size:.9rem;">${fmtMoney(price)}</span>
       <span class="tour-price-amt">&nbsp;${fmtMoney(discount)} <span>/ person</span></span>`
    : `<span class="tour-price-from">From</span>
       <span class="tour-price-amt">${fmtMoney(price)} <span>/ person</span></span>`;

  const ratingHtml = rating > 0
    ? `★ ${rating.toFixed(1)}${ratingQty > 0 ? ` (${ratingQty})` : ''}`
    : '<span style="color:#999;font-size:.8rem;">New</span>';

  return `
    <div class="tour-card" onclick="window.location='tour-detail.html?id=${tourId}&slug=${slug}'" style="cursor:pointer;">
      <div class="tour-card-img">
        <img src="${img}" alt="${title}" loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=600&auto=format&fit=crop'" />
        ${badge}
      </div>
      <div class="tour-card-body">
        <div class="tour-card-meta">
          <div class="tour-meta-item"><i class="fas fa-location-dot"></i> ${country}</div>
          <div class="tour-meta-item"><i class="fas fa-clock"></i> ${days} Day${days !== 1 ? 's' : ''}</div>
          <div class="tour-meta-item"><i class="fas fa-users"></i> Max ${maxGroup}</div>
        </div>
        <h3>${title}</h3>
        <p>${desc || 'An unforgettable African wildlife experience.'}</p>
        <div class="tour-card-footer">
          <div class="tour-price">${priceHtml}</div>
          <div class="tour-rating">${ratingHtml}</div>
        </div>
      </div>
    </div>`;
}

/* ─────────────────────────────────────────────
   RENDER VOLUNTEER CARD  (matches volunteer.html grid style)
───────────────────────────────────────────── */
function renderVolCard(p) {
  const img = p.coverImage?.url
    || p.images?.[0]?.url
    || 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=500&auto=format&fit=crop';

  const title   = escHtml(p.title || 'Volunteer Program');
  const country = escHtml(p.country || '');
  const fee     = Number(p.programFee || p.fee || 0);
  const feeStr  = fee > 0 ? fmtMoney(fee) : 'Contact us';

  let durStr = '—';
  if (p.duration) {
    if (typeof p.duration === 'object' && p.duration.min != null) {
      const unit = p.duration.unit || 'weeks';
      durStr = p.duration.max && p.duration.max !== p.duration.min
        ? `${p.duration.min}–${p.duration.max} ${unit}`
        : `${p.duration.min} ${unit}`;
    } else {
      durStr = String(p.duration);
    }
  }

  const catIcons = { wildlife:'🐾', education:'📚', healthcare:'❤️', environment:'🌿', community:'🤝' };
  const cat = (p.category || '').toLowerCase();
  const catLabel = p.category
    ? `<span class="volunteer-tag">${catIcons[cat] || '🌍'} ${escHtml(p.category)}</span>`
    : '';

  return `
    <div class="volunteer-card" onclick="window.location='volunteer.html'" style="cursor:pointer;">
      <div class="volunteer-card-img">
        <img src="${img}" alt="${title}" loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=500&auto=format&fit=crop'" />
      </div>
      <div class="volunteer-card-body">
        <div class="volunteer-tags">${catLabel}</div>
        <h3>${title}</h3>
        <p>${escHtml(p.shortDescription || p.summary || (p.description||'').slice(0,110) || 'Make a real difference in African communities.')}</p>
        <div class="volunteer-card-meta">
          ${country ? `<div class="volunteer-meta-item"><i class="fas fa-location-dot"></i> ${country}</div>` : ''}
          ${durStr !== '—' ? `<div class="volunteer-meta-item"><i class="fas fa-clock"></i> ${escHtml(durStr)}</div>` : ''}
          <div class="volunteer-meta-item"><i class="fas fa-dollar-sign"></i> From ${feeStr}</div>
        </div>
      </div>
    </div>`;
}

/* ─────────────────────────────────────────────
   FETCH & RENDER — FEATURED TOURS
───────────────────────────────────────────── */
async function loadFeaturedTours() {
  const grid = document.querySelector('.tours-grid');
  if (!grid) return;

  // Show skeletons
  grid.innerHTML = skeletonCard() + skeletonCard() + skeletonCard();

  try {
    const res  = await fetch(`${API_BASE}/tours?limit=200`);
    if (!res.ok) throw new Error(`${res.status}`);
    const data = await res.json();
    const all  = data.tours || data.data?.tours || data.data || [];

    // Sort: featured first, then by rating quantity, take top 3
    const featured = [...all]
      .sort((a, b) => {
        if (b.featured && !a.featured) return 1;
        if (a.featured && !b.featured) return -1;
        return (b.ratingsQuantity || 0) - (a.ratingsQuantity || 0);
      })
      .slice(0, 3);

    if (featured.length === 0) {
      grid.innerHTML = `<p style="color:#667085;grid-column:1/-1;text-align:center;padding:40px;">No tours available right now. Check back soon!</p>`;
      return;
    }

    grid.innerHTML = featured.map(renderTourCard).join('');

    // Update "View All X Tours" link text
    const viewAllBtn = document.querySelector('a[href="tours.html"].btn.btn-outline-dark');
    if (viewAllBtn && all.length > 0) {
      viewAllBtn.textContent = `View All ${all.length} Tours →`;
    }

  } catch (err) {
    console.error('[Tours fetch error]', err);
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:48px 24px;">
        <p style="color:#667085;">Couldn't load tours right now.</p>
        <button onclick="loadFeaturedTours()" class="btn btn-primary btn-sm" style="margin-top:12px;">Retry</button>
      </div>`;
  }
}

/* ─────────────────────────────────────────────
   FETCH & RENDER — VOLUNTEER PROGRAMS
───────────────────────────────────────────── */
async function loadFeaturedVolunteer() {
  const grid = document.querySelector('.volunteer-grid');
  if (!grid) return;

  grid.innerHTML = skeletonCard() + skeletonCard() + skeletonCard();

  try {
    const res  = await fetch(`${API_BASE}/volunteer?limit=100`);
    if (!res.ok) throw new Error(`${res.status}`);
    const data = await res.json();
    const all  = data.programs || data.data?.programs || data.data || [];

    const picks = [...all]
      .sort((a, b) => {
        if (b.featured && !a.featured) return 1;
        if (a.featured && !b.featured) return -1;
        return (b.ratingsAverage || 0) - (a.ratingsAverage || 0);
      })
      .slice(0, 3);

    if (picks.length === 0) {
      grid.innerHTML = `<p style="color:#667085;grid-column:1/-1;text-align:center;padding:40px;">No programs available right now.</p>`;
      return;
    }

    grid.innerHTML = picks.map(renderVolCard).join('');

    // Update "Explore All Programs" link
    const exploreBtn = document.querySelector('a[href="volunteer.html"].btn.btn-primary');
    if (exploreBtn && all.length > 0) {
      exploreBtn.textContent = `Explore All ${all.length} Programs →`;
    }

  } catch (err) {
    console.error('[Volunteer fetch error]', err);
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:48px 24px;">
        <p style="color:#667085;">Couldn't load programs right now.</p>
        <button onclick="loadFeaturedVolunteer()" class="btn btn-primary btn-sm" style="margin-top:12px;">Retry</button>
      </div>`;
  }
}

/* ─────────────────────────────────────────────
   SEARCH BAR — wire up the homepage search
   Redirects to tours.html or volunteer.html
   with URL params that those pages already
   understand (country, duration, budget chips)
───────────────────────────────────────────── */
function initSearchBar() {
  // The search section has two tabs: Tours and Volunteer
  // Grab the Search button inside .search-card
  const searchCard = document.querySelector('.search-card');
  if (!searchCard) return;

  const searchBtn = searchCard.querySelector('.btn.btn-primary');
  if (!searchBtn) return;

  searchBtn.addEventListener('click', handleSearch);

  // Also allow Enter key in input fields
  searchCard.querySelectorAll('input, select').forEach(el => {
    el.addEventListener('keydown', e => { if (e.key === 'Enter') handleSearch(); });
  });
}

function handleSearch() {
  const searchCard = document.querySelector('.search-card');
  if (!searchCard) return;

  // Which tab is active?
  const activeTab = searchCard.querySelector('.search-tab.active');
  const isVolunteer = activeTab?.textContent?.trim().toLowerCase().includes('volunteer');

  // Grab field values
  const fields    = searchCard.querySelectorAll('.search-field');
  const destInput = fields[0]?.querySelector('input');
  const durSel    = fields[1]?.querySelector('select');
  const budSel    = fields[2]?.querySelector('select');

  const dest     = destInput?.value.trim() || '';
  const duration = durSel?.value || '';
  const budget   = budSel?.value || '';

  if (isVolunteer) {
    // Volunteer page doesn't have budget/duration server filters,
    // so just pass category hint via search param
    const params = new URLSearchParams();
    if (dest) params.set('q', dest);
    window.location.href = `volunteer.html${params.toString() ? '?' + params.toString() : ''}`;
    return;
  }

  // Build query string for tours.html
  // tours.html reads these on load via URL params
  const params = new URLSearchParams();
  if (dest)     params.set('country', dest);
  if (duration) params.set('duration', mapDurationLabel(duration));
  if (budget)   params.set('budget', mapBudgetLabel(budget));

  window.location.href = `tours.html?${params.toString()}`;
}

// Map the homepage dropdown labels to tours.html filter values
function mapDurationLabel(label) {
  if (label.includes('1') && label.includes('3')) return '1-3';
  if (label.includes('4') && label.includes('7')) return '4-7';
  if (label.includes('8') && label.includes('14')) return '8-14';
  if (label.includes('15')) return '15+';
  return '';
}
function mapBudgetLabel(label) {
  if (label.includes('500') && label.startsWith('Under')) return '0-500';
  if (label.includes('500') && label.includes('1,000')) return '500-1000';
  if (label.includes('1,000') && label.includes('2,500')) return '1000-2500';
  if (label.includes('2,500')) return '2500+';
  return '';
}

/* ─────────────────────────────────────────────
   TOURS.HTML — read URL params and pre-apply filters
   (add this block to tours.html too, or it's
    already handled by tours.html's own script)
───────────────────────────────────────────── */
function applyUrlParamsOnToursPage() {
  // Only run on tours.html
  if (!window.location.pathname.includes('tours')) return;
  // tours.html manages its own state via activeFilters — just
  // pre-set the dropdowns and chips so the page's own
  // applyFiltersAndRender() picks them up after fetchTours()
  const params = new URLSearchParams(window.location.search);

  const country  = params.get('country');
  const duration = params.get('duration');
  const budget   = params.get('budget');

  if (country) {
    // Try to match a chip
    const chip = [...document.querySelectorAll('#destinationChips .chip')]
      .find(c => c.dataset.country?.toLowerCase() === country.toLowerCase());
    if (chip) {
      document.querySelectorAll('#destinationChips .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      if (typeof activeFilters !== 'undefined') activeFilters.country = chip.dataset.country;
    } else {
      // No matching chip — treat as free text search hint; still set country filter
      if (typeof activeFilters !== 'undefined') activeFilters.country = country;
    }
  }
  if (duration) {
    const sel = document.getElementById('durationFilter');
    if (sel) sel.value = duration;
    if (typeof activeFilters !== 'undefined') activeFilters.duration = duration;
  }
  if (budget) {
    const sel = document.getElementById('budgetFilter');
    if (sel) sel.value = budget;
    if (typeof activeFilters !== 'undefined') activeFilters.budget = budget;
  }
}


/* ===== COMMUNITY STATS COUNTER ===== */
document.addEventListener('DOMContentLoaded', function() {
  const statNumbers = document.querySelectorAll('.community-stat-number');
  
  function animateCounter(el) {
    const target = parseInt(el.dataset.count);
    if (!target) return;
    
    let current = 0;
    const increment = Math.ceil(target / 60);
    const duration = 2000; // 2 seconds
    const stepTime = duration / 60;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = current.toLocaleString();
    }, stepTime);
  }
  
  // Intersection Observer for animation trigger
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const stats = entry.target.querySelectorAll('.community-stat-number');
        stats.forEach(stat => animateCounter(stat));
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  
  const statsGrid = document.querySelector('.community-stats-grid');
  if (statsGrid) {
    observer.observe(statsGrid);
  }
});

/* ─────────────────────────────────────────────
   HERO STATS — animate counters from live data
───────────────────────────────────────────── */
async function loadLiveStats() {
  // The hero stats are hardcoded in HTML; the stats-strip
  // already has data-target counters animated by main.js.
  // We optionally update the tour count in the hero subtitle.
  try {
    const res  = await fetch(`${API_BASE}/tours?limit=1`);
    if (!res.ok) return;
    const data = await res.json();
    const total = data.total || data.data?.total || data.results;
    if (total && total > 0) {
      // Update hero stat "48+" to real count
      const tourStatEl = document.querySelectorAll('.hero-stat')[1];
      if (tourStatEl) {
        const numEl = tourStatEl.querySelector('.hero-stat-num');
        if (numEl) numEl.innerHTML = `${total}<span>+</span>`;
      }
    }
  } catch (_) { /* non-critical */ }
}

/* ─────────────────────────────────────────────
   INIT
───────────────────────────────────────────── */
(function init() {
  injectSkeletonStyles();
  updateNavForAuth();
  initSearchBar();
  loadFeaturedTours();
  loadFeaturedVolunteer();
  loadLiveStats();
  applyUrlParamsOnToursPage(); // no-op on index.html
})();