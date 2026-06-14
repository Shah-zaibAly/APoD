/* =========================================
   APoD — Astronomy Picture of the Day
   App Logic (Plain JavaScript)
   ========================================= */

// ── Configuration ──────────────────────────────────────────
const NASA_API_KEY = 'JLkccE9qnbx62FjjhLQcUAT5iEzsYoXNd5R4KlO1';
const APOD_BASE    = 'https://api.nasa.gov/planetary/apod';
const FAV_KEY      = 'apod_favorites';

// ── DOM References ─────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const dom = {
  loadingState   : $('#loading-state'),
  errorState     : $('#error-state'),
  errorMessage   : $('#error-message'),

  apodCard       : $('#apod-card'),
  apodImage      : $('#apod-image'),
  apodVideoWrap  : $('#apod-video-wrap'),
  apodVideo      : $('#apod-video'),
  apodTitle      : $('#apod-title'),
  apodDate       : $('#apod-date'),
  apodMediaType  : $('#apod-media-type'),
  apodExplanation: $('#apod-explanation'),
  apodCopyright  : $('#apod-copyright'),
  apodMediaWrap  : null, // set after DOM ready

  datePicker     : $('#date-picker'),
  btnExplore     : $('#btn-explore'),
  btnRandom      : $('#btn-random'),
  btnRandom2     : $('#btn-random-2'),
  btnRetry       : $('#btn-retry'),
  btnSaveFav     : $('#btn-save-fav'),
  btnHd          : $('#btn-hd'),

  galleryGrid    : $('#gallery-grid'),
  galleryLoading : $('#gallery-loading'),

  favoritesGrid  : $('#favorites-grid'),
  favoritesEmpty : $('#favorites-empty'),

  lightbox       : $('#lightbox'),
  lightboxImg    : $('#lightbox-img'),
  lightboxClose  : $('#lightbox-close'),

  header         : $('#main-header'),
  mobileMenuBtn  : $('#mobile-menu-btn'),
  nav            : $('nav.nav'),
  navLinks       : $$('.nav-link'),
  scrollIndicator: $('#scroll-indicator'),
};

// ── State ──────────────────────────────────────────────────
let currentApod = null;
let lastRequestedDate = null;

// ── Utility Functions ──────────────────────────────────────

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function todayStr() {
  return formatDate(new Date());
}

function randomDate(startYear = 2015) {
  const start = new Date(`${startYear}-01-01`).getTime();
  const end   = Date.now();
  return formatDate(new Date(start + Math.random() * (end - start)));
}

function prettyDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function lastNDays(n) {
  const dates = [];
  for (let i = 1; i <= n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(formatDate(d));
  }
  return dates;
}

function showToast(message, icon = '✦') {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span class="toast-icon">${icon}</span> ${message}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

// ── LocalStorage — Favorites ───────────────────────────────

function getFavorites() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; }
  catch { return []; }
}

function saveFavorites(favs) {
  localStorage.setItem(FAV_KEY, JSON.stringify(favs));
}

function isFavorited(date) {
  return getFavorites().some(f => f.date === date);
}

function addFavorite(apodData) {
  const favs = getFavorites();
  if (favs.some(f => f.date === apodData.date)) return false;
  favs.unshift({
    date       : apodData.date,
    title      : apodData.title,
    url        : apodData.url,
    hdurl      : apodData.hdurl || apodData.url,
    media_type : apodData.media_type,
    explanation: apodData.explanation,
    copyright  : apodData.copyright || '',
  });
  saveFavorites(favs);
  return true;
}

function removeFavorite(date) {
  saveFavorites(getFavorites().filter(f => f.date !== date));
}

// ── API Fetch ──────────────────────────────────────────────

async function fetchApod(date) {
  const url = `${APOD_BASE}?api_key=${NASA_API_KEY}&date=${date}&thumbs=true`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.msg || `API error ${res.status}`);
  }
  return res.json();
}

async function fetchApodRange(startDate, endDate) {
  const url = `${APOD_BASE}?api_key=${NASA_API_KEY}&start_date=${startDate}&end_date=${endDate}&thumbs=true`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

// ── Preload image helper ───────────────────────────────────
// Returns a promise that resolves when the image is fully loaded.
function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(src);
    img.onerror = () => reject(new Error('Image failed to load'));
    img.src = src;
  });
}

// UI Rendering 

function showLoading() {
  dom.loadingState.style.display = 'flex';
  dom.errorState.style.display   = 'none';
  dom.apodCard.style.display     = 'none';
}

function showError(msg) {
  dom.loadingState.style.display = 'none';
  dom.errorState.style.display   = 'flex';
  dom.apodCard.style.display     = 'none';
  dom.errorMessage.textContent   = msg || 'Something went wrong. Please try again.';
}

function showApod(data) {
  currentApod = data;
  dom.loadingState.style.display = 'none';
  dom.errorState.style.display   = 'none';
  dom.apodCard.style.display     = 'grid';

  // Re-trigger animation
  dom.apodCard.style.animation = 'none';
  void dom.apodCard.offsetWidth;
  dom.apodCard.style.animation = '';

  // Date & meta
  dom.apodDate.textContent        = prettyDate(data.date);
  dom.apodMediaType.textContent   = data.media_type === 'video' ? '▶ Video' : '📷 Image';
  dom.apodTitle.textContent       = data.title;
  dom.apodExplanation.textContent = data.explanation;
  dom.apodCopyright.textContent   = data.copyright ? `© ${data.copyright}` : '';

  // ── Media handling with preload fix ──
  if (data.media_type === 'video') {
    // Video — no preload needed
    dom.apodImage.style.display     = 'none';
    dom.apodVideoWrap.style.display = 'block';
    dom.apodVideo.src = data.url;
    dom.btnHd.style.display = 'none';
    dom.apodMediaWrap.classList.remove('loading-media');
  } else {
    // Image — hide old image immediately, show skeleton loader, preload new image
    dom.apodVideoWrap.style.display = 'none';
    dom.apodImage.style.display     = 'block';
    dom.btnHd.style.display         = 'flex';

    // 1. Immediately hide the old image and show skeleton
    dom.apodImage.classList.remove('img-loaded');
    dom.apodImage.classList.add('img-loading');
    dom.apodMediaWrap.classList.add('loading-media');

    // 2. Clear old src so old image disappears instantly
    dom.apodImage.src = '';
    dom.apodImage.alt = data.title;

    // 3. Preload in background, then reveal
    const imgSrc = data.url;
    preloadImage(imgSrc)
      .then(() => {
        // Only apply if this is still the current APOD (guard against race)
        if (currentApod && currentApod.date === data.date) {
          dom.apodImage.src = imgSrc;
          dom.apodImage.classList.remove('img-loading');
          dom.apodImage.classList.add('img-loaded');
          dom.apodMediaWrap.classList.remove('loading-media');
        }
      })
      .catch(() => {
        // Fallback — set src directly even if preload fails
        if (currentApod && currentApod.date === data.date) {
          dom.apodImage.src = imgSrc;
          dom.apodImage.classList.remove('img-loading');
          dom.apodImage.classList.add('img-loaded');
          dom.apodMediaWrap.classList.remove('loading-media');
        }
      });
  }

  updateFavButton();

  setTimeout(() => {
    dom.apodCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
}

function updateFavButton() {
  if (!currentApod) return;
  const faved = isFavorited(currentApod.date);
  if (faved) {
    dom.btnSaveFav.classList.add('saved');
    dom.btnSaveFav.innerHTML = '<span class="heart-icon">♥</span> Saved';
  } else {
    dom.btnSaveFav.classList.remove('saved');
    dom.btnSaveFav.innerHTML = '<span class="heart-icon">♡</span> Save to Favorites';
  }
}

// ── Load APOD ──────────────────────────────────────────────

async function loadApod(date) {
  lastRequestedDate = date;
  showLoading();
  try {
    const data = await fetchApod(date);
    if (date === lastRequestedDate) showApod(data);
  } catch (err) {
    if (date === lastRequestedDate) showError(err.message);
  }
}

// ── Gallery ────────────────────────────────────────────────

async function loadGallery() {
  dom.galleryLoading.style.display = 'flex';
  dom.galleryGrid.innerHTML = '';

  try {
    const dates     = lastNDays(5);
    const endDate   = dates[0];
    const startDate = dates[dates.length - 1];
    const items     = await fetchApodRange(startDate, endDate);

    dom.galleryLoading.style.display = 'none';
    items.sort((a, b) => b.date.localeCompare(a.date));
    items.forEach((item, idx) => dom.galleryGrid.appendChild(createGalleryCard(item, idx)));
  } catch (err) {
    dom.galleryLoading.style.display = 'none';
    dom.galleryGrid.innerHTML = `
      <div class="state-card error-state" style="grid-column:1/-1;">
        <span class="error-icon">⚠️</span>
        <p>Failed to load gallery. ${err.message}</p>
      </div>`;
  }
}

function createGalleryCard(item, idx = 0) {
  const card = document.createElement('div');
  card.className = 'gallery-card';
  card.style.animationDelay = `${idx * 0.1}s`;
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');

  let mediaHtml;
  if (item.media_type === 'video') {
    const thumb = item.thumbnail_url || '';
    mediaHtml = thumb
      ? `<img class="gallery-card-img" src="${thumb}" alt="${item.title}" loading="lazy" />`
      : `<div class="gallery-card-video-placeholder">▶</div>`;
  } else {
    mediaHtml = `<img class="gallery-card-img" src="${item.url}" alt="${item.title}" loading="lazy" />`;
  }

  card.innerHTML = `
    ${mediaHtml}
    <div class="gallery-card-info">
      <p class="gallery-card-date">${prettyDate(item.date)}</p>
      <h3 class="gallery-card-title">${item.title}</h3>
    </div>`;

  const handleClick = () => {
    dom.datePicker.value = item.date;
    loadApod(item.date);
  };
  card.addEventListener('click', handleClick);
  card.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleClick(); });

  return card;
}

// ── Favorites ──────────────────────────────────────────────

function renderFavorites() {
  const favs = getFavorites();
  dom.favoritesGrid.innerHTML = '';

  if (favs.length === 0) {
    dom.favoritesEmpty.style.display = 'flex';
    return;
  }

  dom.favoritesEmpty.style.display = 'none';

  favs.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'gallery-card';
    card.style.animationDelay = `${idx * 0.08}s`;

    let mediaHtml;
    if (item.media_type === 'video') {
      mediaHtml = `<div class="gallery-card-video-placeholder">▶</div>`;
    } else {
      mediaHtml = `<img class="gallery-card-img" src="${item.url}" alt="${item.title}" loading="lazy" />`;
    }

    card.innerHTML = `
      <button class="remove-fav-btn" data-date="${item.date}" title="Remove from favorites">✕</button>
      ${mediaHtml}
      <div class="gallery-card-info">
        <p class="gallery-card-date">${prettyDate(item.date)}</p>
        <h3 class="gallery-card-title">${item.title}</h3>
      </div>`;

    card.addEventListener('click', (e) => {
      if (e.target.closest('.remove-fav-btn')) return;
      dom.datePicker.value = item.date;
      loadApod(item.date);
    });

    card.querySelector('.remove-fav-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      removeFavorite(item.date);
      renderFavorites();
      updateFavButton();
      showToast('Removed from favorites', '💔');
    });

    dom.favoritesGrid.appendChild(card);
  });
}

// ── Lightbox ───────────────────────────────────────────────

function openLightbox(src) {
  dom.lightboxImg.src = src;
  dom.lightbox.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  dom.lightbox.style.display = 'none';
  dom.lightboxImg.src = '';
  document.body.style.overflow = '';
}

// ── Stars ──────────────────────────────────────────────────

function createStars(count = 50) {
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    star.className = 'star-particle';
    star.style.left = `${Math.random() * 100}%`;
    star.style.top  = `${Math.random() * 100}%`;
    star.style.setProperty('--duration', `${2 + Math.random() * 5}s`);
    star.style.setProperty('--max-opacity', `${0.2 + Math.random() * 0.6}`);
    star.style.animationDelay = `${Math.random() * 5}s`;
    const size = `${1 + Math.random() * 1.5}px`;
    star.style.width  = size;
    star.style.height = size;
    document.body.appendChild(star);
  }
}

// ── Scroll animations ──────────────────────────────────────

function setupRevealObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1 });

  $$('.section').forEach(sec => {
    sec.classList.add('reveal');
    observer.observe(sec);
  });
}

function setupScrollSpy() {
  const sections = ['hero', 'gallery-section', 'favorites-section', 'about-section'];
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= 200) current = id;
    });
    dom.navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.section === current);
    });
  }, { passive: true });
}

function setupHeaderScroll() {
  window.addEventListener('scroll', () => {
    dom.header.classList.toggle('scrolled', window.scrollY > 50);
    if (dom.scrollIndicator) {
      dom.scrollIndicator.style.opacity = window.scrollY > 200 ? '0' : '1';
    }
  }, { passive: true });
}

// ── Event Listeners ────────────────────────────────────────

function setupEventListeners() {
  const today = todayStr();
  dom.datePicker.max   = today;
  dom.datePicker.min   = '1995-06-16';
  dom.datePicker.value = today;

  dom.datePicker.addEventListener('change', () => {
    if (dom.datePicker.value) loadApod(dom.datePicker.value);
  });

  dom.btnExplore.addEventListener('click', () => {
    dom.datePicker.value = today;
    loadApod(today);
    document.getElementById('apod-section').scrollIntoView({ behavior: 'smooth' });
  });

  function handleRandom() {
    const date = randomDate(2015);
    dom.datePicker.value = date;
    loadApod(date);
    document.getElementById('apod-section').scrollIntoView({ behavior: 'smooth' });
  }
  dom.btnRandom.addEventListener('click', handleRandom);
  dom.btnRandom2.addEventListener('click', handleRandom);

  dom.btnRetry.addEventListener('click', () => {
    loadApod(lastRequestedDate || today);
  });

  dom.btnSaveFav.addEventListener('click', () => {
    if (!currentApod) return;
    if (isFavorited(currentApod.date)) {
      removeFavorite(currentApod.date);
      updateFavButton();
      renderFavorites();
      showToast('Removed from favorites', '💔');
    } else {
      addFavorite(currentApod);
      updateFavButton();
      renderFavorites();
      showToast('Saved to favorites!', '⭐');
    }
  });

  dom.btnHd.addEventListener('click', () => {
    if (currentApod && currentApod.media_type !== 'video') {
      openLightbox(currentApod.hdurl || currentApod.url);
    }
  });

  dom.apodImage.addEventListener('click', () => {
    if (currentApod && currentApod.media_type !== 'video') {
      openLightbox(currentApod.hdurl || currentApod.url);
    }
  });
  dom.apodImage.style.cursor = 'pointer';

  dom.lightboxClose.addEventListener('click', closeLightbox);
  dom.lightbox.addEventListener('click', (e) => {
    if (e.target === dom.lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  dom.mobileMenuBtn.addEventListener('click', () => {
    dom.nav.classList.toggle('open');
  });

  dom.navLinks.forEach(link => {
    link.addEventListener('click', () => dom.nav.classList.remove('open'));
  });
}

function updateDaysStat() {
  const diff = Math.floor((Date.now() - new Date('1995-06-16').getTime()) / 86400000);
  const el = document.getElementById('stat-days');
  if (el) el.textContent = diff.toLocaleString() + '+';
}

// ── Init ───────────────────────────────────────────────────

function init() {
  // Cache the media wrap reference
  dom.apodMediaWrap = document.querySelector('.apod-media-wrap');

  createStars(50);
  setupEventListeners();
  setupHeaderScroll();
  setupScrollSpy();
  setupRevealObserver();
  updateDaysStat();
  renderFavorites();

  loadApod(todayStr());
  loadGallery();
}

document.addEventListener('DOMContentLoaded', init);
