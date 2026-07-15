/* ══════════════════════════════════════════════════════════════════
   CLIPES OCULTOS — main.js
   Sem backend externo: curtidas, views, comentários e a lista de
   "quem já votou" ficam salvos no localStorage de cada navegador.
   Isso significa que cada visitante vê os próprios números somados
   à base inicial definida em videos-data.js — não é sincronizado
   entre pessoas diferentes em tempo real (isso exigiria um servidor,
   ex. Firebase configurado com um projeto real).
══════════════════════════════════════════════════════════════════ */

import { VIDEOS, CATEGORY_META, TRENDING_VIEWS_THRESHOLD } from './videos-data.js';

/* ────────────────────────────────────────────────────────────────
   ARMAZENAMENTO LOCAL (sem backend)
──────────────────────────────────────────────────────────────── */
const LS_STATS    = 'co_stats_v1';
const LS_VOTES     = 'co_votes_v1';
const LS_COMMENTS  = 'co_comments_v1';
const LS_WATCHED   = 'co_watched_v1';
const LS_NEWSLETTER = 'co_newsletter_v1';

function safeParse(str, fallback) {
  try { const v = JSON.parse(str); return v ?? fallback; } catch { return fallback; }
}
function lsGet(key, fallback) {
  try { return safeParse(localStorage.getItem(key), fallback); } catch { return fallback; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage indisponível — segue sem persistir */ }
}

const VIDEO_MAP = new Map(VIDEOS.map(v => [v.id, v]));

function getStatsStore() { return lsGet(LS_STATS, {}); }
function getVotesStore() { return lsGet(LS_VOTES, {}); }
function getCommentsStore() { return lsGet(LS_COMMENTS, {}); }
function getWatchedStore() { return lsGet(LS_WATCHED, {}); }

function getStats(id) {
  const store = getStatsStore();
  if (store[id]) return store[id];
  const base = VIDEO_MAP.get(id);
  const seeded = {
    likes: base?.likes || 0,
    dislikes: base?.dislikes || 0,
    views: base?.views || 0
  };
  store[id] = seeded;
  lsSet(LS_STATS, store);
  return seeded;
}
function saveStats(id, stats) {
  const store = getStatsStore();
  store[id] = stats;
  lsSet(LS_STATS, store);
}

function getVote(id) { return getVotesStore()[id] || null; }
function setVote(id, vote) {
  const store = getVotesStore();
  if (vote) store[id] = vote; else delete store[id];
  lsSet(LS_VOTES, store);
}

function getComments(id) { return getCommentsStore()[id] || []; }
function addComment(id, comment) {
  const store = getCommentsStore();
  if (!store[id]) store[id] = [];
  store[id].push(comment);
  lsSet(LS_COMMENTS, store);
}

/* ────────────────────────────────────────────────────────────────
   FORMATAÇÃO DE DATA / HORA
──────────────────────────────────────────────────────────────── */
const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

function relativeTime(isoString) {
  const then = new Date(isoString).getTime();
  if (Number.isNaN(then)) return '';
  const now = Date.now();
  const diffSec = Math.round((then - now) / 1000);
  const abs = Math.abs(diffSec);

  if (abs < 60)   return 'agora mesmo';
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
  if (abs < 2592000) return rtf.format(Math.round(diffSec / 86400), 'day');
  return rtf.format(Math.round(diffSec / 2592000), 'month');
}

function fullDate(isoString) {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '—';
  const datePart = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(d);
  const timePart = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(d);
  const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(d);
  return `${datePart}, às ${timePart} (${weekday})`;
}

function formatViews(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'K';
  return String(n);
}

function escapeHTML(str) {
  return String(str).replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

/* ────────────────────────────────────────────────────────────────
   TELA DE INTRODUÇÃO
──────────────────────────────────────────────────────────────── */
const introCanvas = document.getElementById('intro-canvas');
const ictx = introCanvas?.getContext('2d');
let particles = [];
const NUM_PARTICLES = 90;
let introAnimId;

const enterBtn = document.getElementById('enter-btn');
const introEl  = document.getElementById('intro');
const mainSite = document.getElementById('main-site');

if (enterBtn) {
  enterBtn.addEventListener('click', enterSite);
}
function enterSite() {
  if (introEl) introEl.classList.add('fade-out');
  setTimeout(() => {
    if (introEl) introEl.style.display = 'none';
    if (mainSite) mainSite.classList.remove('hidden');
    cancelAnimationFrame(introAnimId);
    initHeroCanvas();
    animateCounters();
    generateNoise();
  }, 800);
}

/* ────────────────────────────────────────────────────────────────
   RENDERIZAÇÃO — CATEGORIAS
──────────────────────────────────────────────────────────────── */
const categoriesGrid = document.getElementById('categoriesGrid');
const CAT_CLASS_BY_INDEX = ['cat-c1', 'cat-c2', 'cat-c3', 'cat-c4', 'cat-c5', 'cat-c6'];

function renderCategories() {
  if (!categoriesGrid) return;
  const keys = Object.keys(CATEGORY_META);
  categoriesGrid.innerHTML = keys.map((key, i) => {
    const meta = CATEGORY_META[key];
    const count = VIDEOS.filter(v => v.category === key).length;
    return `
      <div class="cat-card ${CAT_CLASS_BY_INDEX[i % CAT_CLASS_BY_INDEX.length]}" data-cat="${escapeHTML(key)}" tabindex="0">
        <div class="cat-icon">${meta.icon}</div>
        <h3>${escapeHTML(meta.label)}</h3>
        <p>${escapeHTML(meta.desc)}</p>
        <span class="cat-count">${count} vídeo${count === 1 ? '' : 's'}</span>
      </div>`;
  }).join('');
  bindCategoryTilt();
}

/* ────────────────────────────────────────────────────────────────
   BADGES / SELOS DE VÍDEO
──────────────────────────────────────────────────────────────── */
function trendingBadgeHTML(views, rank) {
  if (views >= TRENDING_VIEWS_THRESHOLD) {
    return `<span class="trending-badge trending-badge-fire">🔥 EM ALTA</span>`;
  }
  if (rank) {
    return `<span class="trending-badge">#${rank}</span>`;
  }
  return '';
}

/* ────────────────────────────────────────────────────────────────
   RENDERIZAÇÃO — EM ALTA (top 5 por visualizações)
──────────────────────────────────────────────────────────────── */
const trendingGrid  = document.getElementById('trendingGrid');
const trendingEmpty = document.getElementById('trendingEmpty');

function videosWithLiveStats() {
  return VIDEOS.map(v => ({ ...v, ...getStats(v.id) }));
}

function renderTrending(filterFn = null) {
  if (!trendingGrid) return;
  let list = videosWithLiveStats().sort((a, b) => b.views - a.views);
  if (filterFn) list = list.filter(filterFn);

  trendingEmpty?.classList.toggle('hidden', list.length > 0);
  const top = list.slice(0, 5);

  trendingGrid.innerHTML = top.map((v, i) => `
    <div class="video-card ${i === 0 ? 'featured-card' : ''}" data-video-id="${v.id}" tabindex="0" role="button" aria-label="Assistir ${escapeHTML(v.title)}">
      <div class="video-thumb">
        <div class="thumb-placeholder ${v.thumbClass}"></div>
        <div class="video-overlay">
          <button class="play-btn" aria-label="Reproduzir vídeo" tabindex="-1"><svg width="${i === 0 ? 24 : 20}" height="${i === 0 ? 24 : 20}" viewBox="0 0 24 24" fill="none"><polygon points="8,5 22,12 8,19" fill="white"/></svg></button>
          <span class="video-duration">${escapeHTML(v.duration)}</span>
        </div>
        ${trendingBadgeHTML(v.views, i + 1)}
      </div>
      <div class="video-info">
        <span class="video-cat">${escapeHTML(v.category)}</span>
        <h3 class="video-title">${escapeHTML(v.title)}</h3>
        ${i === 0 && v.description ? `<p class="video-desc">${escapeHTML(v.description)}</p>` : ''}
        <div class="video-meta">
          <span class="views-count">🔥 ${formatViews(v.views)} views</span>
          <span>· ${relativeTime(v.publishedAt)}</span>
        </div>
      </div>
    </div>`).join('');

  bindCardInteractions(trendingGrid);
}

/* ────────────────────────────────────────────────────────────────
   RENDERIZAÇÃO — RECENTES (paginado com "carregar mais")
──────────────────────────────────────────────────────────────── */
const recentsList  = document.getElementById('recentsList');
const recentsEmpty = document.getElementById('recentsEmpty');
const loadMoreBtn  = document.getElementById('loadMore');
const loadMoreWrap = document.getElementById('loadMoreWrap');
const PAGE_SIZE = 6;
let recentsShown = PAGE_SIZE;
let activeFilter = null;

function recentsSortedList() {
  let list = videosWithLiveStats().sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  if (activeFilter) list = list.filter(activeFilter);
  return list;
}

function renderRecents() {
  if (!recentsList) return;
  const list = recentsSortedList();
  recentsEmpty?.classList.toggle('hidden', list.length > 0);

  const slice = list.slice(0, recentsShown);
  recentsList.innerHTML = slice.map(v => `
    <article class="recent-item" data-video-id="${v.id}" tabindex="0" role="button" aria-label="Assistir ${escapeHTML(v.title)}">
      <div class="recent-thumb">
        <div class="thumb-placeholder ${v.thumbClass}"></div>
        <span class="video-duration">${escapeHTML(v.duration)}</span>
        ${trendingBadgeHTML(v.views, null)}
      </div>
      <div class="recent-info">
        <span class="video-cat">${escapeHTML(v.category)}</span>
        <h3>${escapeHTML(v.title)}</h3>
        ${v.description ? `<p>${escapeHTML(v.description)}</p>` : ''}
        <div class="video-meta">
          <span class="views-count">${formatViews(v.views)} views</span>
          <span>· ${relativeTime(v.publishedAt)}</span>
        </div>
      </div>
    </article>`).join('');

  loadMoreWrap?.classList.toggle('hidden', recentsShown >= list.length);
  bindCardInteractions(recentsList);
}

loadMoreBtn?.addEventListener('click', () => {
  loadMoreBtn.classList.add('loading');
  loadMoreBtn.textContent = 'A carregar arquivos...';
  setTimeout(() => {
    recentsShown += PAGE_SIZE;
    renderRecents();
    loadMoreBtn.classList.remove('loading');
    loadMoreBtn.textContent = 'Carregar Mais Vídeos';
  }, 500);
});

/* ────────────────────────────────────────────────────────────────
   HERO — CLIPE EM DESTAQUE + CONTADORES
──────────────────────────────────────────────────────────────── */
function renderHeroFeatured() {
  const top = videosWithLiveStats().sort((a, b) => b.views - a.views)[0];
  const btn = document.getElementById('heroFeaturedBtn');
  const titleEl = document.getElementById('heroFeaturedTitle');
  if (!top || !btn) return;
  btn.dataset.videoId = top.id;
  if (titleEl) titleEl.textContent = top.title.toUpperCase();
  btn.addEventListener('click', () => openVideoModal(top.id));
}

function animateCounters() {
  const cVid = document.getElementById('count-videos');
  const cViw = document.getElementById('count-views');
  const cCat = document.getElementById('count-cats');

  const totalViews = videosWithLiveStats().reduce((sum, v) => sum + v.views, 0);
  const totalCats  = Object.keys(CATEGORY_META).length;

  const speed = 60;
  const run = (el, target, suffix = "") => {
    if (!el) return;
    let current = 0;
    const step = target / speed || target;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        clearInterval(timer);
        el.textContent = Math.floor(target).toLocaleString('pt-BR') + suffix;
      } else {
        el.textContent = Math.floor(current).toLocaleString('pt-BR') + suffix;
      }
    }, 20);
  };

  run(cVid, VIDEOS.length);
  run(cViw, totalViews, '+');
  run(cCat, totalCats);
}

/* ────────────────────────────────────────────────────────────────
   BUSCA
──────────────────────────────────────────────────────────────── */
const searchInput = document.getElementById('searchInput');

function applySearch(term) {
  const q = term.trim().toLowerCase();
  activeFilter = q ? (v => v.title.toLowerCase().includes(q) || v.category.toLowerCase().includes(q) || (v.description || '').toLowerCase().includes(q)) : null;
  recentsShown = PAGE_SIZE;
  renderTrending(activeFilter);
  renderRecents();
}
searchInput?.addEventListener('input', (e) => applySearch(e.target.value));

/* ────────────────────────────────────────────────────────────────
   INTERAÇÕES DOS CARTÕES (delegação — não duplica listeners)
──────────────────────────────────────────────────────────────── */
function bindCardInteractions(container) {
  container.querySelectorAll('[data-video-id]').forEach(card => {
    card.addEventListener('click', () => openVideoModal(card.dataset.videoId));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openVideoModal(card.dataset.videoId); }
    });
  });
  // Efeito 3D nos cartões da grade "Em Alta"
  container.querySelectorAll('.video-card').forEach(card => {
    card.addEventListener('mousemove', tiltHandler);
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
  revealOnScroll(container.querySelectorAll('.video-card, .recent-item'));
}

function bindCategoryTilt() {
  categoriesGrid?.querySelectorAll('.cat-card').forEach(card => {
    card.addEventListener('mousemove', tiltHandler);
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
  revealOnScroll(categoriesGrid?.querySelectorAll('.cat-card') || []);
}

function tiltHandler(e) {
  const card = e.currentTarget;
  const rect = card.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = (e.clientX - cx) / (rect.width / 2);
  const dy = (e.clientY - cy) / (rect.height / 2);
  card.style.transform = `translateY(-4px) rotateY(${dx * 6}deg) rotateX(${-dy * 6}deg)`;
}

let revealObserver;
function revealOnScroll(elements) {
  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  }
  elements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.6s cubic-bezier(0.2,0.8,0.2,1), transform 0.6s cubic-bezier(0.2,0.8,0.2,1)';
    revealObserver.observe(el);
  });
}

/* ────────────────────────────────────────────────────────────────
   MODAL DE VÍDEO — player, qualidade, tela cheia, views, likes, comentários
──────────────────────────────────────────────────────────────── */
const videoModal      = document.getElementById('videoModal');
const modalClose      = document.getElementById('modalClose');
const modalBackdrop   = document.getElementById('modalBackdrop');
const playerVideoMP4  = document.getElementById('playerVideoMP4');
const modalVideoTitle = document.getElementById('modalVideoTitle');
const qualityGroup    = document.getElementById('qualityGroup');
const qualitySelect   = document.getElementById('qualitySelect');
const btnFullscreen   = document.getElementById('btnFullscreen');

const btnLike         = document.getElementById('btnLike');
const btnDislike      = document.getElementById('btnDislike');
const countLikes      = document.getElementById('countLikes');
const countDislikes   = document.getElementById('countDislikes');
const totalVideoViews = document.getElementById('totalVideoViews');
const publishDateText = document.getElementById('publishDateText');
const publishDateChip = document.getElementById('publishDateChip');

const commentUser        = document.getElementById('commentUser');
const commentText        = document.getElementById('commentText');
const btnSendComment     = document.getElementById('btnSendComment');
const commentsContainer  = document.getElementById('commentsContainer');

let currentVideoId = null;
let viewCountedForSession = new Set(); // evita contar mais de 1 view por vídeo por visita

// Considera "assistido" quando o usuário passa deste percentual do vídeo
const WATCH_COMPLETE_RATIO = 0.9;

function openVideoModal(id) {
  const data = VIDEO_MAP.get(id);
  if (!data || !videoModal) return;

  currentVideoId = id;
  if (modalVideoTitle) modalVideoTitle.textContent = data.title;

  // Fonte de vídeo + seletor de qualidade
  const sourceKeys = Object.keys(data.sources || {});
  const hasMultipleQualities = sourceKeys.filter(k => k !== 'auto').length > 0;
  if (qualityGroup) qualityGroup.classList.toggle('hidden', !hasMultipleQualities);
  if (qualitySelect) {
    qualitySelect.innerHTML = sourceKeys.map(k => `<option value="${k}">${k === 'auto' ? 'Automática' : k}</option>`).join('');
    qualitySelect.value = 'auto' in data.sources ? 'auto' : sourceKeys[0];
  }

  const initialSrc = data.sources?.auto || data.sources?.[sourceKeys[0]];
  if (playerVideoMP4 && initialSrc) {
    playerVideoMP4.src = initialSrc;
    playerVideoMP4.load();
    playerVideoMP4.play().catch(() => {});
  }

  videoModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  refreshCounters(id);
  renderPublishDate(id);
  renderComments(id);
  refreshVoteButtons(id);

  playerVideoMP4?.addEventListener('timeupdate', onTimeUpdateCountView);
}

function onTimeUpdateCountView() {
  if (!currentVideoId || !playerVideoMP4) return;
  const { currentTime, duration } = playerVideoMP4;
  if (!duration || Number.isNaN(duration)) return;
  if (currentTime / duration >= WATCH_COMPLETE_RATIO && !viewCountedForSession.has(currentVideoId)) {
    viewCountedForSession.add(currentVideoId);
    registerView(currentVideoId);
  }
}

function registerView(id) {
  const stats = getStats(id);
  stats.views += 1;
  saveStats(id, stats);
  refreshCounters(id);
  // Reflete o novo total no card correspondente, se estiver visível na página
  document.querySelectorAll(`[data-video-id="${id}"] .views-count`).forEach(el => {
    el.textContent = `${formatViews(stats.views)} views`;
  });
}

function refreshCounters(id) {
  const stats = getStats(id);
  if (countLikes) countLikes.textContent = stats.likes.toLocaleString('pt-BR');
  if (countDislikes) countDislikes.textContent = stats.dislikes.toLocaleString('pt-BR');
  if (totalVideoViews) totalVideoViews.textContent = stats.views.toLocaleString('pt-BR');
}

function renderPublishDate(id) {
  const data = VIDEO_MAP.get(id);
  if (!data) return;
  if (publishDateText) publishDateText.textContent = `Publicado ${relativeTime(data.publishedAt)}`;
  if (publishDateChip) publishDateChip.title = fullDate(data.publishedAt);
}

function refreshVoteButtons(id) {
  const vote = getVote(id);
  btnLike?.classList.toggle('liked', vote === 'like');
  btnDislike?.classList.toggle('disliked', vote === 'dislike');
  btnLike?.setAttribute('aria-pressed', String(vote === 'like'));
  btnDislike?.setAttribute('aria-pressed', String(vote === 'dislike'));
}

function closeVideoModal() {
  if (videoModal) videoModal.classList.add('hidden');
  document.body.style.overflow = '';

  playerVideoMP4?.removeEventListener('timeupdate', onTimeUpdateCountView);
  if (playerVideoMP4) {
    playerVideoMP4.pause();
    playerVideoMP4.removeAttribute('src');
    playerVideoMP4.load();
  }
  currentVideoId = null;
}

modalClose?.addEventListener('click', closeVideoModal);
modalBackdrop?.addEventListener('click', closeVideoModal);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && videoModal && !videoModal.classList.contains('hidden')) closeVideoModal();
});

/* Troca de qualidade preservando posição e estado de reprodução */
qualitySelect?.addEventListener('change', () => {
  const data = VIDEO_MAP.get(currentVideoId);
  if (!data || !playerVideoMP4) return;
  const src = data.sources[qualitySelect.value];
  if (!src) return;
  const wasPlaying = !playerVideoMP4.paused;
  const time = playerVideoMP4.currentTime;
  playerVideoMP4.src = src;
  playerVideoMP4.load();
  playerVideoMP4.addEventListener('loadedmetadata', function restore() {
    playerVideoMP4.currentTime = time;
    if (wasPlaying) playerVideoMP4.play().catch(() => {});
    playerVideoMP4.removeEventListener('loadedmetadata', restore);
  });
});

/* Tela cheia */
btnFullscreen?.addEventListener('click', () => {
  const el = playerVideoMP4;
  if (!el) return;
  const req = el.requestFullscreen || el.webkitRequestFullscreen || el.webkitEnterFullscreen || el.msRequestFullscreen;
  if (req) req.call(el);
});

/* Curtir / Descurtir — um voto por vídeo por navegador, alternável */
btnLike?.addEventListener('click', () => handleVote('like'));
btnDislike?.addEventListener('click', () => handleVote('dislike'));

function handleVote(type) {
  if (!currentVideoId) return;
  const stats = getStats(currentVideoId);
  const current = getVote(currentVideoId);

  if (current === type) {
    stats[type === 'like' ? 'likes' : 'dislikes'] = Math.max(0, stats[type === 'like' ? 'likes' : 'dislikes'] - 1);
    setVote(currentVideoId, null);
  } else {
    if (current) {
      const oppositeKey = current === 'like' ? 'likes' : 'dislikes';
      stats[oppositeKey] = Math.max(0, stats[oppositeKey] - 1);
    }
    stats[type === 'like' ? 'likes' : 'dislikes'] += 1;
    setVote(currentVideoId, type);
  }

  saveStats(currentVideoId, stats);
  refreshCounters(currentVideoId);
  refreshVoteButtons(currentVideoId);

  const btn = type === 'like' ? btnLike : btnDislike;
  btn?.classList.add('pulse-once');
  setTimeout(() => btn?.classList.remove('pulse-once'), 320);
}

/* Comentários — sem login, salvos neste navegador */
function renderComments(id) {
  if (!commentsContainer) return;
  const comments = getComments(id).slice().reverse();
  if (comments.length === 0) {
    commentsContainer.innerHTML = '<p class="comments-empty">Nenhum comentário ainda. Seja o primeiro a quebrar o silêncio.</p>';
    return;
  }
  commentsContainer.innerHTML = comments.map(c => `
    <div class="comment-item">
      <div class="comment-meta"><strong>${escapeHTML(c.user)}</strong><span>· ${relativeTime(new Date(c.timestamp).toISOString())}</span></div>
      <p class="comment-body">${escapeHTML(c.text)}</p>
    </div>`).join('');
}

function submitComment() {
  if (!currentVideoId || !commentText) return;
  const user = (commentUser?.value || '').trim().slice(0, 40) || 'Anônimo';
  const text = (commentText.value || '').trim().slice(0, 400);
  if (!text) { commentText.focus(); return; }

  addComment(currentVideoId, { user, text, timestamp: Date.now() });
  commentText.value = '';
  renderComments(currentVideoId);
}
btnSendComment?.addEventListener('click', submitComment);
commentText?.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitComment(); });

/* ────────────────────────────────────────────────────────────────
   NAVBAR / MENU / BUSCA / SCROLL-TOP
──────────────────────────────────────────────────────────────── */
const navbar       = document.getElementById('navbar');
const searchToggle = document.getElementById('searchToggle');
const searchBar    = document.getElementById('searchBar');
const searchClose  = document.getElementById('searchClose');
const hamburger    = document.getElementById('hamburger');
const mobileMenu   = document.getElementById('mobileMenu');
const scrollTopBtn = document.getElementById('scrollTop');

window.addEventListener('scroll', () => {
  if (window.scrollY > 40) navbar?.classList.add('scrolled');
  else navbar?.classList.remove('scrolled');

  if (window.scrollY > 500) scrollTopBtn?.classList.remove('hidden');
  else scrollTopBtn?.classList.add('hidden');
});

searchToggle?.addEventListener('click', () => {
  searchBar?.classList.add('open');
  searchInput?.focus();
});
searchClose?.addEventListener('click', () => {
  searchBar?.classList.remove('open');
  if (searchInput) searchInput.value = '';
  applySearch('');
});
hamburger?.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu?.classList.toggle('open');
});
document.querySelectorAll('.mob-link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger?.classList.remove('open');
    mobileMenu?.classList.remove('open');
  });
});
scrollTopBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ────────────────────────────────────────────────────────────────
   NEWSLETTER
──────────────────────────────────────────────────────────────── */
const nlEmail = document.getElementById('nlEmail');
const nlBtn   = document.getElementById('nlBtn');
const nlNote  = document.getElementById('nlNote');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

nlBtn?.addEventListener('click', () => {
  const email = (nlEmail?.value || '').trim();
  if (!EMAIL_RE.test(email)) {
    if (nlNote) { nlNote.textContent = 'Digite um e-mail válido.'; nlNote.style.color = 'var(--accent2)'; }
    return;
  }
  const list = lsGet(LS_NEWSLETTER, []);
  if (!list.includes(email)) list.push(email);
  lsSet(LS_NEWSLETTER, list);
  if (nlEmail) nlEmail.value = '';
  if (nlNote) { nlNote.textContent = 'Inscrito! Você vai receber os próximos alertas.'; nlNote.style.color = 'var(--accent)'; }
});

/* ────────────────────────────────────────────────────────────────
   ANO NO RODAPÉ
──────────────────────────────────────────────────────────────── */
const copyYearEl = document.getElementById('copyYear');
if (copyYearEl) copyYearEl.textContent = String(new Date().getFullYear());

/* ────────────────────────────────────────────────────────────────
   CANVAS DE INTRODUÇÃO (PARTÍCULAS)
──────────────────────────────────────────────────────────────── */
function resizeIntroCanvas() {
  if (!introCanvas) return;
  introCanvas.width  = window.innerWidth;
  introCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeIntroCanvas);
resizeIntroCanvas();

if (ictx) {
  for (let i = 0; i < NUM_PARTICLES; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.2
    });
  }
  function loopIntro() {
    ictx.clearRect(0, 0, introCanvas.width, introCanvas.height);
    ictx.fillStyle = 'rgba(5, 7, 9, 1)';
    ictx.fillRect(0, 0, introCanvas.width, introCanvas.height);

    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > introCanvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > introCanvas.height) p.vy *= -1;

      ictx.beginPath();
      ictx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ictx.fillStyle = `rgba(232, 255, 60, ${p.alpha})`;
      ictx.fill();
    });
    introAnimId = requestAnimationFrame(loopIntro);
  }
  loopIntro();
}

/* ────────────────────────────────────────────────────────────────
   CANVAS DO HERO (REDES DE DADOS)
──────────────────────────────────────────────────────────────── */
const heroCanvas = document.getElementById('hero-canvas');
const hctx = heroCanvas?.getContext('2d');
let hParticles = [];
let heroAnimId;

function initHeroCanvas() {
  if (!heroCanvas || !hctx) return;
  heroCanvas.width  = heroCanvas.parentElement?.offsetWidth || window.innerWidth;
  heroCanvas.height = heroCanvas.parentElement?.offsetHeight || 600;

  hParticles = [];
  for (let i = 0; i < 45; i++) {
    hParticles.push({
      x: Math.random() * heroCanvas.width,
      y: Math.random() * heroCanvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5
    });
  }
  cancelAnimationFrame(heroAnimId);
  loopHero();
}

function loopHero() {
  if (!hctx || !heroCanvas) return;
  hctx.clearRect(0, 0, heroCanvas.width, heroCanvas.height);

  hParticles.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0 || p.x > heroCanvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > heroCanvas.height) p.vy *= -1;

    hctx.beginPath();
    hctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    hctx.fillStyle = 'rgba(232, 255, 60, 0.25)';
    hctx.fill();
  });

  hctx.strokeStyle = 'rgba(232, 255, 60, 0.04)';
  hctx.lineWidth = 1;
  for (let i = 0; i < hParticles.length; i++) {
    for (let j = i + 1; j < hParticles.length; j++) {
      const dist = Math.hypot(hParticles[i].x - hParticles[j].x, hParticles[i].y - hParticles[j].y);
      if (dist < 110) {
        hctx.beginPath();
        hctx.moveTo(hParticles[i].x, hParticles[i].y);
        hctx.lineTo(hParticles[j].x, hParticles[j].y);
        hctx.stroke();
      }
    }
  }
  heroAnimId = requestAnimationFrame(loopHero);
}
window.addEventListener('resize', initHeroCanvas);

/* ────────────────────────────────────────────────────────────────
   RUÍDO ESTÁTICO DA TV (leve, com cache de frames)
──────────────────────────────────────────────────────────────── */
function generateNoise() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const tv = document.getElementById('tvNoise');
  if (!tv || !ctx) return;

  canvas.width = 120;
  canvas.height = 120;

  const imgData = ctx.createImageData(canvas.width, canvas.height);
  const buffer = new Uint32Array(imgData.data.buffer);

  const noiseFrames = [];
  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = Math.random() > 0.5 ? 0xffffffff : 0xff000000;
    }
    ctx.putImageData(imgData, 0, 0);
    noiseFrames.push(canvas.toDataURL());
  }

  let frameIndex = 0;
  let lastUpdate = 0;

  function noiseLoop(timestamp) {
    if (timestamp - lastUpdate > 45) {
      tv.style.backgroundImage = `url(${noiseFrames[frameIndex]})`;
      frameIndex = (frameIndex + 1) % noiseFrames.length;
      lastUpdate = timestamp;
    }
    requestAnimationFrame(noiseLoop);
  }
  requestAnimationFrame(noiseLoop);
}

/* ────────────────────────────────────────────────────────────────
   INICIALIZAÇÃO
──────────────────────────────────────────────────────────────── */
renderCategories();
renderTrending();
renderRecents();
renderHeroFeatured();
revealOnScroll(document.querySelectorAll('.section-header'));
