/* ══════════════════════════════════════════
   CLIPES OCULTOS — main.js (Fixed Modal Controls & Perfect Layout)
══════════════════════════════════════════ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, runTransaction, push, onValue, set, onDisconnect } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// ── VARIÁVEIS DO BOTÃO E ANIMAÇÃO INICIAL ──────────────────
const introCanvas = document.getElementById('intro-canvas');
const ictx = introCanvas?.getContext('2d');
let particles = [];
const NUM_PARTICLES = 90;
let introAnimId;

const enterBtn     = document.getElementById('enter-btn');
const introEl      = document.getElementById('intro');
const mainSite     = document.getElementById('main-site');

if (enterBtn) {
  enterBtn.addEventListener('click', () => {
    if (introEl) introEl.classList.add('fade-out');
    setTimeout(() => {
      if (introEl) introEl.style.display = 'none';
      if (mainSite) mainSite.classList.remove('hidden');
      cancelAnimationFrame(introAnimId);
      initHeroCanvas();
      animateCounters();
      generateNoise();
    }, 800);
  });
}

// ── CONFIGURAÇÃO DO FIREBASE (Coloque aqui as suas credenciais reais se necessário) ──
const firebaseConfig = {
  apiKey: "AIzaSyBeG82FG84I1k3VN3PbfRjON7C-SUAS-CHAVES",
  authDomain: "clipesocultos-premium.firebaseapp.com",
  databaseURL: "https://clipesocultos-premium-default-rtdb.firebaseio.com",
  projectId: "clipesocultos-premium",
  storageBucket: "clipesocultos-premium.appspot.com",
  messagingSenderId: "384729401234",
  appId: "1:384729401234:web:abcd1234efgh5678"
};

const app = initializeApp(firebaseConfig);
const db  = getDatabase(app);

// ── BANCO DE DADOS LOCAL DE VÍDEOS ─────────────────────────
const VIDEOS_DATA = {
  "v1": { title: "O Arquivo que Quase Desapareceu", views: "142K", url: "https://www.w3schools.com/html/mov_bbb.mp4" },
  "v2": { title: "Dentro da Sala Proibida", views: "98K", url: "https://www.w3schools.com/html/movie.mp4" },
  "v3": { title: "Capturado em 1 em 10 Milhões", views: "76K", url: "https://www.w3schools.com/html/mov_bbb.mp4" },
  "v4": { title: "A Verdade sobre o Projeto X", views: "63K", url: "https://www.w3schools.com/html/movie.mp4" },
  "v5": { title: "Lugar Sem Nome no Mapa", views: "55K", url: "https://www.w3schools.com/html/mov_bbb.mp4" },
  "v6": { title: "Transmissão Interceptada — 1987", views: "12K", url: "https://www.w3schools.com/html/movie.mp4" },
  "v7": { title: "O que Acontece às 3h da Manhã", views: "8.4K", url: "https://www.w3schools.com/html/mov_bbb.mp4" },
  "v8": { title: "Subterrâneos Esquecidos da Cidade", views: "21K", url: "https://www.w3schools.com/html/movie.mp4" },
  "v9": { title: "Fenômeno Atmosférico Jamais Catalogado", views: "5.1K", url: "https://www.w3schools.com/html/mov_bbb.mp4" },
  "v10": { title: "Empresa Fantasma: Quem Está Por Trás?", views: "33K", url: "https://www.w3schools.com/html/movie.mp4" },
  "v11": { title: "Aldeia Sem Internet — Vida Real", views: "19K", url: "https://www.w3schools.com/html/mov_bbb.mp4" }
};

const EXTRA_VIDEOS = [
  { title: "Sinal de Satélite Corrompido", cat: "Arquivo Secreto", desc: "Varredura de frequência encontrou este loop oculto.", views: "4.2K", time: "há 14 horas", duration: "1:45", tp: "tp1" },
  { title: "Experimento de Frequência Antiga", cat: "Momentos Raros", desc: "Efeito do som de 432Hz gravado em fita magnética original.", views: "9.1K", time: "há 18 horas", duration: "6:12", tp: "tp2" },
  { title: "O Guardião do Farol Deserto", cat: "Mundo Oculto", desc: "Registros visuais de uma rotina sem qualquer contato humano.", views: "15K", time: "há 1 dia", duration: "14:20", tp: "tp3" },
  { title: "Códigos na Névoa Noturna", cat: "Investigação", desc: "Análise de flashes luminosos intermitentes na costa deserta.", views: "2.8K", time: "há 2 dias", duration: "5:30", tp: "tp4" }
];

// ── SISTEMA DE PRESENÇA GLOBAL DO SITE ─────────────────────
const globalOnlineRef = ref(db, 'metrics/globalOnlineUsers');
const userPresenceRef = push(ref(db, 'metrics/presenceList'));

onDisconnect(userPresenceRef).remove();
set(userPresenceRef, true);

onValue(ref(db, 'metrics/presenceList'), (snapshot) => {
  const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 1;
  set(globalOnlineRef, count);
});

// ── GERIÇÃO E SINCRONIZAÇÃO DO MODAL DE VÍDEOS ───────────────
const videoModal      = document.getElementById('videoModal');
const modalClose      = document.getElementById('modalClose');
const modalBackdrop   = document.getElementById('modalBackdrop');
const playerVideoMP4  = document.getElementById('playerVideoMP4');
const modalVideoTitle = document.getElementById('modalVideoTitle');

const btnLike         = document.getElementById('btnLike');
const btnDislike      = document.getElementById('btnDislike');
const countLikes      = document.getElementById('countLikes');
const countDislikes   = document.getElementById('countDislikes');
const totalVideoViews = document.getElementById('totalVideoViews');
const onlineViews     = document.getElementById('onlineViews');

const commentUser     = document.getElementById('commentUser');
const commentText     = document.getElementById('commentText');
const btnSendComment  = document.getElementById('btnSendComment');
const commentsContainer = document.getElementById('commentsContainer');

let currentVideoId   = null;
let currentVideoRef  = null;
let currentOnlineRef = null;
let unsubscribeVideo = null;
let unsubscribeComments = null;

function openVideoModal(id) {
  const data = VIDEOS_DATA[id];
  if (!data || !videoModal) return;

  currentVideoId = id;
  if (modalVideoTitle) modalVideoTitle.textContent = data.title;
  
  if (playerVideoMP4) {
    playerVideoMP4.src = data.url;
    playerVideoMP4.load();
    playerVideoMP4.play().catch(() => {});
  }

  videoModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Incrementar Visualizações Totais via Transação
  const viewsRef = ref(db, `videos/${id}/views`);
  runTransaction(viewsRef, (currentValue) => (currentValue || 0) + 1);

  // Incrementar Utilizadores Ativos Assistindo Agora
  currentOnlineRef = push(ref(db, `videos/${id}/watchingList`));
  onDisconnect(currentOnlineRef).remove();
  set(currentOnlineRef, true);

  // Escutar contadores em tempo real (Views, Likes, Dislikes)
  currentVideoRef = ref(db, `videos/${id}`);
  unsubscribeVideo = onValue(currentVideoRef, (snapshot) => {
    if (snapshot.exists()) {
      const val = snapshot.val();
      if (countLikes) countLikes.textContent = val.likes || 0;
      if (countDislikes) countDislikes.textContent = val.dislikes || 0;
      if (totalVideoViews) totalVideoViews.textContent = (val.views || 0).toLocaleString();
      
      const watchingCount = val.watchingList ? Object.keys(val.watchingList).length : 1;
      if (onlineViews) onlineViews.textContent = watchingCount;
    } else {
      if (countLikes) countLikes.textContent = 0;
      if (countDislikes) countDislikes.textContent = 0;
      if (totalVideoViews) totalVideoViews.textContent = 1;
      if (onlineViews) onlineViews.textContent = 1;
    }
  });

  // Carregar Comentários em Tempo Real
  const commentsRef = ref(db, `videos/${id}/comments`);
  unsubscribeComments = onValue(commentsRef, (snapshot) => {
    if (!commentsContainer) return;
    commentsContainer.innerHTML = '';
    if (snapshot.exists()) {
      const data = snapshot.val();
      Object.keys(data).reverse().forEach(key => {
        const c = data[key];
        const div = document.createElement('div');
        div.className = 'comment-item';
        div.innerHTML = `<div class="comment-meta"><strong>${escapeHTML(c.user)}</strong><span>· agora mesmo</span></div><p class="comment-body">${escapeHTML(c.text)}</p>`;
        commentsContainer.appendChild(div);
      });
    } else {
      commentsContainer.innerHTML = '<p style="opacity:0.4; font-size:0.85rem; font-family:\'Space Mono\', monospace;">Nenhum comentário ainda. Seja o primeiro a quebrar o silêncio.</p>';
    }
  });
}

function closeVideoModal() {
  if (videoModal) videoModal.classList.add('hidden');
  document.body.style.overflow = '';

  if (playerVideoMP4) {
    playerVideoMP4.pause();
    playerVideoMP4.src = "";
  }

  if (currentOnlineRef) {
    set(currentOnlineRef, null);
    currentOnlineRef = null;
  }

  if (unsubscribeVideo) { unsubscribeVideo(); unsubscribeVideo = null; }
  if (unsubscribeComments) { unsubscribeComments(); unsubscribeComments = null; }
  currentVideoId = null;
}

if (modalClose) modalClose.addEventListener('click', closeVideoModal);
if (modalBackdrop) modalBackdrop.addEventListener('click', closeVideoModal);

// Lógica de Likes e Dislikes por Transações Síncronas
if (btnLike) {
  btnLike.addEventListener('click', () => {
    if (!currentVideoId) return;
    runTransaction(ref(db, `videos/${currentVideoId}/likes`), (curr) => (curr || 0) + 1);
  });
}

if (btnDislike) {
  btnDislike.addEventListener('click', () => {
    if (!currentVideoId) return;
    runTransaction(ref(db, `videos/${currentVideoId}/dislikes`), (curr) => (curr || 0) + 1);
  });
}

// Envio de Comentários
if (btnSendComment) {
  btnSendComment.addEventListener('click', () => {
    if (!currentVideoId || !commentText) return;
    const user = commentUser?.value.trim() || "Anónimo";
    const text = commentText.value.trim();
    if (!text) return;

    push(ref(db, `videos/${currentVideoId}/comments`), { user, text, timestamp: Date.now() });
    commentText.value = '';
  });
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}

// Mapeamento dinâmico dos cartões de vídeo baseados nas posições do Grid
function mapearBotoesPlay() {
  document.querySelectorAll('.video-card, .recent-item').forEach((card, index) => {
    const playBtn = card.querySelector('.play-btn, .recent-thumb');
    if (playBtn) {
      playBtn.style.cursor = 'pointer';
      playBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openVideoModal(`v${index + 1}`);
      });
    }
  });
}
document.addEventListener('DOMContentLoaded', mapearBotoesPlay);

// ── CANVAS DE INTRODUÇÃO (PARTÍCULAS FX) ───────────────────
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

// ── CANVAS DO HERO (REDES DE DADOS FX) ─────────────────────
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

// ── CONTROLADORES DE ELEMENTOS INTERATIVOS DA NAVBAR ───────
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

searchToggle?.addEventListener('click', () => searchBar?.classList.add('active'));
searchClose?.addEventListener('click', () => searchBar?.classList.remove('active'));
hamburger?.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  mobileMenu?.classList.toggle('active');
});

document.querySelectorAll('.mob-link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger?.classList.remove('active');
    mobileMenu?.classList.remove('active');
  });
});

scrollTopBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// ── ANIMAÇÕES DE CONTADORES PROGRESSIVOS (HERO) ────────────
function animateCounters() {
  const cVid = document.getElementById('count-videos');
  const cViw = document.getElementById('count-views');
  const cCat = document.getElementById('count-cats');

  const speed = 60;
  const run = (el, target, suffix = "") => {
    let current = 0;
    const step = target / speed;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        clearInterval(timer);
        el.textContent = Math.floor(target).toLocaleString() + suffix;
      } else {
        el.textContent = Math.floor(current).toLocaleString() + suffix;
      }
    }, 20);
  };

  if (cVid) run(cVid, 139);
  if (cViw) run(cViw, 1420500, "+");
  if (cCat) run(cCat, 6);
}

// ── PROCESSADOR DE RUÍDO ESTÁTICO (TV NOISE) ───────────────
// ── PROCESSADOR DE RUÍDO ESTÁTICO OTIMIZADO (ESTABILIZAÇÃO DO TICKER) ──
function generateNoise() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const tv = document.getElementById('tvNoise');
  if (!tv || !ctx) return;

  // Resolução reduzida para performance leve em qualquer nível de zoom
  canvas.width = 120; 
  canvas.height = 120;
  
  const imgData = ctx.createImageData(canvas.width, canvas.height);
  const buffer = new Uint32Array(imgData.data.buffer);

  // CRUCIAL: Criamos um cache pré-renderizado para o navegador não recalcular dados do zero a cada milissegundo
  const noiseFrames = [];
  for (let f = 0; f < 6; f++) { // Gera apenas 6 frames de chiado estático fixos
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = Math.random() > 0.5 ? 0xffffffff : 0xff000000;
    }
    ctx.putImageData(imgData, 0, 0);
    noiseFrames.push(canvas.toDataURL());
  }

  let frameIndex = 0;
  let lastUpdate = 0;

  function noiseLoop(timestamp) {
    // LIMITADOR DE FPS: Atualiza o chiado a cada 45ms em vez de sobrecarregar a cada 1ms
    if (timestamp - lastUpdate > 45) {
      tv.style.backgroundImage = `url(${noiseFrames[frameIndex]})`;
      frameIndex = (frameIndex + 1) % noiseFrames.length;
      lastUpdate = timestamp;
    }
    requestAnimationFrame(noiseLoop);
  }
  
  requestAnimationFrame(noiseLoop);
}
// ── SISTEMA DE CARREGAMENTO DINÂMICO (LOAD MORE) ───────────
const loadMoreBtn = document.getElementById('loadMore');
const recentsList = document.getElementById('recentsList');
let loadCount = 12;

if (loadMoreBtn && recentsList) {
  loadMoreBtn.addEventListener('click', () => {
    loadMoreBtn.classList.add('loading');
    loadMoreBtn.textContent = 'A processar arquivos...';

    setTimeout(() => {
      EXTRA_VIDEOS.forEach(v => {
        const id = `v${loadCount}`;
        VIDEOS_DATA[id] = { title: v.title, views: v.views, url: "https://www.w3schools.com/html/movie.mp4" };

        const el = document.createElement('article');
        el.className = 'recent-item';
        el.innerHTML = `
          <div class="recent-thumb">
            <div class="thumb-placeholder ${v.tp}"></div>
            <span class="video-duration">${v.duration}</span>
          </div>
          <div class="recent-info">
            <span class="video-cat">${v.cat}</span>
            <h3>${v.title}</h3>
            <p>${v.desc}</p>
            <div class="video-meta"><span>${v.views} views</span><span>· ${v.time}</span></div>
          </div>`;
        el.style.opacity = '0'; 
        el.style.transform = 'translateY(16px)';
        recentsList.appendChild(el);

        requestAnimationFrame(() => {
          el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
          el.style.opacity = '1'; 
          el.style.transform = 'translateY(0)';
        });
        loadCount++;
      });

      loadMoreBtn.classList.remove('loading');
      loadMoreBtn.textContent = 'Carregar Mais Vídeos';
      mapearBotoesPlay();
    }, 1200);
  });
}

// CARD 3D EFFECT (CATEGORIES)
document.querySelectorAll('.cat-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const cx   = rect.left + rect.width / 2;
    const cy   = rect.top  + rect.height / 2;
    const dx   = (e.clientX - cx) / (rect.width  / 2);
    const dy   = (e.clientY - cy) / (rect.height / 2);
    card.style.transform = `translateY(-4px) rotateY(${dx * 6}deg) rotateX(${-dy * 6}deg)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

// INTERSECTION OBSERVER ANIMATIONS
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity    = '1';
      entry.target.style.transform  = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.video-card, .recent-item, .cat-card, .section-header').forEach(el => {
  el.style.opacity   = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)';
  observer.observe(el);
});
