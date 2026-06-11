/* ══════════════════════════════════════════
   CLIPES OCULTOS — main.js (Premium & Realtime)
══════════════════════════════════════════ */

// ── 1. VARIÁVEIS DO BOTÃO E ANIMAÇÃO INICIAL ──────────────────
const introCanvas = document.getElementById('intro-canvas');
const ictx = introCanvas?.getContext('2d');
let particles = [];
const NUM_PARTICLES = 90;
let introAnimId;

const enterBtn     = document.getElementById('enter-btn');
const introEl      = document.getElementById('intro');
const mainSite     = document.getElementById('main-site');

// ── 2. ACIONAMENTO DO BOTÃO ENTRAR (À PROVA DE TRAVAMENTOS) ───
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

// ── 3. CARREGAMENTO DO FIREBASE VIA MÓDULO SEGURO ──────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, runTransaction, push, onValue, set, onDisconnect } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBeG82FG84I1k3VN3PbfRjON7C-cX5FMjU",
  authDomain: "clipes-ocultos.firebaseapp.com",
  databaseURL: "https://clipes-ocultos-default-rtdb.firebaseio.com",
  projectId: "clipes-ocultos",
  storageBucket: "clipes-ocultos.firebasestorage.app",
  messagingSenderId: "683346960432",
  appId: "1:683346960432:web:9603b865aef1f59f030df5"
};

// Inicializa as conexões com segurança
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ── BANCO DE DADOS LOCAL DOS VÍDEOS MP4 ──────────────────
const listaDeVideos = {
  "v1": { title: "O Arquivo que Quase Desapareceu", url: "videos/arquivo.mp4" },
  "v2": { title: "Dentro da Sala Proibida", url: "videos/sala.mp4" },
  "v3": { title: "Capturado em 1 em 10 Milhões", url: "videos/raro.mp4" },
  "v4": { title: "A Verdade sobre o Projeto X", url: "videos/projeto_x.mp4" },
  "v5": { title: "Lugar Sem Nome no Mapa", url: "videos/lugar.mp4" },
  "v6": { title: "Transmissão Interceptada — 1987", url: "videos/1987.mp4" },
  "v7": { title: "O que Acontece às 3h da Manhã", url: "videos/3am.mp4" },
  "v8": { title: "Subterrâneos Esquecidos da Cidade", url: "videos/sub.mp4" },
  "v9": { title: "Fenômeno Atmosférico Jamais Catalogado", url: "videos/fenomeno.mp4" },
  "v10": { title: "Empresa Fantasma: Quem Está Por Trás?", url: "videos/fantasma.mp4" },
  "v11": { title: "Aldeia Sem Internet — Vida Real", url: "videos/aldeia.mp4" }
};

let videoAtivoId = null;
let viewerRef = null;

// Elementos do Modal Interativo
const playerVideo = document.getElementById("playerVideoMP4");
const modalTitle = document.getElementById("modalVideoTitle");
const countLikesSpan = document.getElementById("countLikes");
const totalViewsSpan = document.getElementById("totalVideoViews");
const onlineViewsSpan = document.getElementById("onlineViews");
const btnLike = document.getElementById("btnLike");
const btnSendComment = document.getElementById("btnSendComment");
const inputUser = document.getElementById("commentUser");
const inputText = document.getElementById("commentText");
const commentsContainer = document.getElementById("commentsContainer");

// Ouvinte do Ranking Global (Contador do topo)
function monitorarRankingGlobal() {
  const videosRef = ref(db, 'videos/');
  onValue(videosRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    let somaViewsGerais = 0;
    Object.keys(data).forEach(id => {
      somaViewsGerais += data[id].views || 0;
    });

    const countViewsEl = document.getElementById('count-views');
    if (countViewsEl) {
      countViewsEl.textContent = somaViewsGerais >= 1000000 
        ? (somaViewsGerais / 1000000).toFixed(1) + 'M' 
        : somaViewsGerais.toLocaleString('pt-BR');
    }
  });
}
monitorarRankingGlobal();

// ── PARTICLE CANVAS ENGINE ───────────────────────────────
function resizeIntroCanvas() {
  if (!introCanvas) return;
  introCanvas.width  = window.innerWidth;
  introCanvas.height = window.innerHeight;
}
if (introCanvas) resizeIntroCanvas();

class Particle {
  constructor() { this.reset(); }
  reset() {
    this.x  = Math.random() * (introCanvas?.width || 800);
    this.y  = Math.random() * (introCanvas?.height || 600);
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = (Math.random() - 0.5) * 0.4;
    this.r  = Math.random() * 2 + 0.5;
    this.a  = Math.random() * 0.6 + 0.2;
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (introCanvas) {
      if (this.x < 0 || this.x > introCanvas.width)  this.vx *= -1;
      if (this.y < 0 || this.y > introCanvas.height)  this.vy *= -1;
    }
  }
  draw() {
    if (!ictx) return;
    ictx.beginPath();
    ictx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ictx.fillStyle = `rgba(232,255,60,${this.a})`;
    ictx.fill();
  }
}

if (introCanvas) {
  for (let i = 0; i < NUM_PARTICLES; i++) particles.push(new Particle());
}

function drawLines() {
  if (!ictx) return;
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx   = particles[i].x - particles[j].x;
      const dy   = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        ictx.beginPath();
        ictx.moveTo(particles[i].x, particles[i].y);
        ictx.lineTo(particles[j].x, particles[j].y);
        ictx.strokeStyle = `rgba(232,255,60,${0.15 * (1 - dist / 120)})`;
        ictx.lineWidth   = 0.6;
        ictx.stroke();
      }
    }
  }
}

function animateIntro() {
  if (!introCanvas) return;
  introAnimId = requestAnimationFrame(animateIntro);
  ictx.clearRect(0, 0, introCanvas.width, introCanvas.height);
  particles.forEach(p => { p.update(); p.draw(); });
  drawLines();
}
animateIntro();
window.addEventListener('resize', resizeIntroCanvas);

// ── HERO CANVAS (floating grid) ──────────────────────────
const heroCanvas = document.getElementById('hero-canvas');
let hctx;
let heroAnimId;

function initHeroCanvas() {
  if (!heroCanvas) return;
  hctx = heroCanvas.getContext('2d');
  resizeHeroCanvas();
  window.addEventListener('resize', resizeHeroCanvas);
  animateHero();
}

function resizeHeroCanvas() {
  if (!heroCanvas) return;
  heroCanvas.width  = heroCanvas.offsetWidth;
  heroCanvas.height = heroCanvas.offsetHeight;
}

let heroTime = 0;
function animateHero() {
  if (!heroCanvas || !hctx) return;
  heroAnimId = requestAnimationFrame(animateHero);
  heroTime += 0.005;
  const w = heroCanvas.width;
  const h = heroCanvas.height;
  hctx.clearRect(0, 0, w, h);

  const gridSize = 60;
  const offsetX = (heroTime * 20) % gridSize;
  const offsetY = (heroTime * 10) % gridSize;
  hctx.strokeStyle = 'rgba(232,255,60,0.04)';
  hctx.lineWidth   = 1;
  for (let x = -gridSize + offsetX; x < w + gridSize; x += gridSize) {
    hctx.beginPath(); hctx.moveTo(x, 0); hctx.lineTo(x, h); hctx.stroke();
  }
  for (let y = -gridSize + offsetY; y < h + gridSize; y += gridSize) {
    hctx.beginPath(); hctx.moveTo(0, y); hctx.lineTo(w, y); hctx.stroke();
  }

  const grad = hctx.createRadialGradient(w * 0.2, h * 0.5, 0, w * 0.2, h * 0.5, w * 0.6);
  grad.addColorStop(0, 'rgba(232,255,60,0.04)');
  grad.addColorStop(1, 'transparent');
  hctx.fillStyle = grad;
  hctx.fillRect(0, 0, w, h);
}

// ── TV NOISE ─────────────────────────────────────────────
function generateNoise() {
  const tv = document.getElementById('tvNoise');
  if (!tv) return;
  setInterval(() => {
    const size = 80;
    const canvas = document.createElement('canvas');
    canvas.width  = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i]     = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 18;
    }
    ctx.putImageData(img, 0, 0);
    tv.style.backgroundImage = `url(${canvas.toDataURL()})`;
  }, 80);
}

// ── COUNTERS ─────────────────────────────────────────────
function animateCounters() {
  const targets = {
    'count-videos': 140,
    'count-cats':   6,
  };
  Object.entries(targets).forEach(([id, target]) => {
    const el = document.getElementById(id);
    if (!el) return;
    let current  = 0;
    const step   = Math.ceil(target / 60);
    const timer  = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = current;
    }, 24);
  });
}

// ── NAVBAR SCROLL ────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 50);
  const scrollTopBtn = document.getElementById('scrollTop');
  if (scrollTopBtn) scrollTopBtn.classList.toggle('hidden', window.scrollY < 400);
});

// ── HAMBURGER ────────────────────────────────────────────
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
  });
}
document.querySelectorAll('.mob-link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger?.classList.remove('open');
    mobileMenu?.classList.remove('open');
  });
});

// ── SEARCH ───────────────────────────────────────────────
const searchToggle = document.getElementById('searchToggle');
const searchBar    = document.getElementById('searchBar');
const searchClose  = document.getElementById('searchClose');
const searchInput  = document.getElementById('searchInput');

if (searchToggle && searchBar) {
  searchToggle.addEventListener('click', () => {
    searchBar.classList.toggle('open');
    if (searchBar.classList.contains('open') && searchInput) searchInput.focus();
  });
}
if (searchClose && searchBar) {
  searchClose.addEventListener('click', () => {
    searchBar.classList.remove('open');
    if (searchInput) searchInput.value = '';
  });
}

// ── REALTIME MODAL ENGINE ────────────────────────────────
const modal         = document.getElementById('videoModal');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalClose    = document.getElementById('modalClose');

function openRealtimeVideo(idDoVideo) {
  const videoInfo = listaDeVideos[idDoVideo];
  if (!videoInfo) return;

  videoAtivoId = idDoVideo;
  if (modalTitle) modalTitle.innerText = videoInfo.title;
  if (playerVideo) playerVideo.src = videoInfo.url;
  
  if (modal) modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Sincroniza o estado visual do botão premium com o histórico local do usuário
  if (btnLike) {
    const jaCurtiuEste = localStorage.getItem(`clips_ocultos_liked_${idDoVideo}`) === 'true';
    const likeTextEl = btnLike.querySelector('.like-text');
    
    if (jaCurtiuEste) {
      btnLike.classList.add('liked');
      if (likeTextEl) likeTextEl.textContent = 'Curtido';
    } else {
      btnLike.classList.remove('liked');
      if (likeTextEl) likeTextEl.textContent = 'Curtir';
    }
  }

  const viewsRef = ref(db, `videos/${idDoVideo}/views`);
  runTransaction(viewsRef, (currentViews) => {
    return (currentViews || 0) + 1;
  });

  const onlineRef = ref(db, `videos/${idDoVideo}/online/${Date.now()}`);
  set(onlineRef, true);
  onDisconnect(onlineRef).remove();
  viewerRef = onlineRef;

  const dataRef = ref(db, `videos/${idDoVideo}`);
  onValue(dataRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      if (countLikesSpan) countLikesSpan.innerText = data.likes || 0;
      if (totalViewsSpan) totalViewsSpan.innerText = (data.views || 0).toLocaleString('pt-BR');
      
      const totalOnline = data.online ? Object.keys(data.online).length : 1;
      if (onlineViewsSpan) onlineViewsSpan.innerText = totalOnline;
    }
  });

  const commentsRef = ref(db, `videos/${idDoVideo}/comments`);
  onValue(commentsRef, (snapshot) => {
    if (!commentsContainer) return;
    commentsContainer.innerHTML = "";
    const data = snapshot.val();
    if (data) {
      Object.keys(data).forEach(key => {
        const c = data[key];
        const item = document.createElement("div");
        item.style.padding = "6px 10px";
        item.style.background = "#222";
        item.style.borderRadius = "4px";
        item.style.fontFamily = "'Space Mono', monospace";
        item.style.marginBottom = "8px";
        item.innerHTML = `<strong style="color: #e8ff3c;">${c.user}:</strong> <span style="font-size:0.9rem;">${c.text}</span>`;
        commentsContainer.appendChild(item);
      });
      commentsContainer.scrollTop = commentsContainer.scrollHeight;
    } else {
      commentsContainer.innerHTML = `<p style="color:#666; font-size:0.85rem; font-family:'Space Mono';">Nenhum comentário ainda. Seja o primeiro!</p>`;
    }
  });
}

function closeRealtimeVideo() {
  if (playerVideo) {
    playerVideo.pause();
    playerVideo.src = "";
  }
  if (modal) modal.classList.add('hidden');
  document.body.style.overflow = '';

  if (viewerRef) {
    set(viewerRef, null);
    viewerRef = null;
  }
  videoAtivoId = null;
}

function mapearBotoesPlay() {
  document.querySelectorAll('.video-card, .recent-item').forEach((card, index) => {
    const newCard = card.cloneNode(true);
    card.parentNode.replaceChild(newCard, card);
    
    newCard.addEventListener('click', (e) => {
      e.preventDefault();
      openRealtimeVideo(`v${index + 1}`);
    });
  });
}

if (modalBackdrop) modalBackdrop.addEventListener('click', closeRealtimeVideo);
if (modalClose) modalClose.addEventListener('click', closeRealtimeVideo);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeRealtimeVideo(); });


// ── GERENCIADOR ULTRA PREMIUM DE LIKES (INTEGRADO AO FIREBASE) ──
if (btnLike) {
  btnLike.addEventListener("click", () => {
    if (!videoAtivoId) return;

    const chaveStorage = `clips_ocultos_liked_${videoAtivoId}`;
    let jaCurtiu = localStorage.getItem(chaveStorage) === 'true';
    const likesRef = ref(db, `videos/${videoAtivoId}/likes`);
    const likeTextEl = btnLike.querySelector('.like-text');

    if (!jaCurtiu) {
      // Incrementa (+1) no Firebase de forma segura
      runTransaction(likesRef, (currentLikes) => {
        return (currentLikes || 0) + 1;
      }).then(() => {
        localStorage.setItem(chaveStorage, 'true');
        btnLike.classList.add('liked');
        if (likeTextEl) likeTextEl.textContent = 'Curtido';
      }).catch((error) => console.error("Erro ao computar like:", error));

    } else {
      // Se clicar de novo, remove o voto (-1) no Firebase
      runTransaction(likesRef, (currentLikes) => {
        const novosLikes = (currentLikes || 0) - 1;
        return novosLikes < 0 ? 0 : novosLikes; 
      }).then(() => {
        localStorage.removeItem(chaveStorage);
        btnLike.classList.remove('liked');
        if (likeTextEl) likeTextEl.textContent = 'Curtir';
      }).catch((error) => console.error("Erro ao remover like:", error));
    }
  });
}

if (btnSendComment) {
  btnSendComment.addEventListener("click", () => {
    const nomeStr = inputUser?.value.trim() || "Anônimo";
    const textoStr = inputText?.value.trim();

    if (!textoStr || !videoAtivoId) return;

    const commentsListRef = ref(db, `videos/${videoAtivoId}/comments`);
    push(commentsListRef, {
      user: nomeStr,
      text: textoStr,
      timestamp: Date.now()
    });

    if (inputText) inputText.value = "";
  });
}

document.addEventListener("DOMContentLoaded", mapearBotoesPlay);

// ── SCROLL TOP & NEWSLETTER & LOAD MORE ──────────────────
const scrollTopBtn = document.getElementById('scrollTop');
if (scrollTopBtn) {
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

const nlBtn  = document.getElementById('nlBtn');
const nlNote = document.getElementById('nlNote');
if (nlBtn) {
  nlBtn.addEventListener('click', () => {
    const emailEl = document.getElementById('nlEmail');
    const email = emailEl ? emailEl.value.trim() : "";
    const re    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!nlNote) return;
    if (!re.test(email)) {
      nlNote.textContent = '⚠ Insira um e-mail válido.';
      nlNote.style.color = '#ff3c6e';
      return;
    }
    nlNote.textContent = '✓ Inscrição realizada com sucesso!';
    nlNote.style.color = '#e8ff3c';
    if (emailEl) emailEl.value = '';
    setTimeout(() => { nlNote.textContent = ''; }, 4000);
  });
}

const loadMoreBtn = document.getElementById('loadMore');
let loadCount     = 0;
const moreVideos  = [
  { cat: 'Câmera Oculta',   title: 'Reunião que Ninguém Deveria Ver',         views: '7.2K',  time: 'há 1 dia',   tp: 'tp2'  },
  { cat: 'Documentário',    title: 'Arquivo Perdido de 1971',                  views: '44K',   time: 'há 2 dias',  tp: 'tp1'  },
  { cat: 'Momentos Raros',  title: 'Dois Raios no Mesmo Lugar',                views: '15K',   time: 'há 3 dias',  tp: 'tp3'  },
  { cat: 'Mundo Oculto',    title: 'Praia Sem Turistas — Litoral Fantasma',    views: '28K',   time: 'há 4 dias',  tp: 'tp5'  },
  { cat: 'Investigação',    title: 'Fundo Misterioso de ONG Internacional',    views: '51K',   time: 'há 5 dias',  tp: 'tp4'  },
  { cat: 'Arquivo Secreto', title: 'Ligação Interceptada — Sem Classificação', views: '9.7K',  time: 'há 6 dias',  tp: 'tp6'  },
];

if (loadMoreBtn) {
  loadMoreBtn.addEventListener('click', () => {
    if (loadCount >= moreVideos.length) {
      loadMoreBtn.textContent = 'Sem mais vídeos por agora';
      loadMoreBtn.disabled    = true;
      return;
    }
    const batch = moreVideos.slice(loadCount, loadCount + 2);
    const list  = document.getElementById('recentsList');
    if (!list) return;
    
    batch.forEach(v => {
      const el = document.createElement('article');
      el.classList.add('recent-item');
      el.innerHTML = `
        <div class="recent-thumb">
          <div class="thumb-placeholder ${v.tp}" style="width:100%;height:100%;"></div>
          <span class="video-duration">${(Math.random()*10+1).toFixed(0)}:${String(Math.floor(Math.random()*60)).padStart(2,'0')}</span>
        </div>
        <div class="recent-info">
          <span class="video-cat">${v.cat}</span>
          <h3>${v.title}</h3>
          <div class="video-meta"><span>${v.views} views</span><span>· ${v.time}</span></div>
        </div>`;
      
      el.style.opacity   = '0';
      el.style.transform = 'translateY(16px)';
      list.appendChild(el);
      requestAnimationFrame(() => {
        el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        el.style.opacity    = '1';
        el.style.transform  = 'translateY(0)';
      });
    });
    loadCount += 2;
    mapearBotoesPlay();
  });
}

// ── EFFECTS & OBSERVERS ──────────────────────────────────
document.querySelectorAll('.cat-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const cx   = rect.left + rect.width / 2;
    const cy   = rect.top  + rect.height / 2;
    const dx   = (e.clientX - cx) / (rect.width  / 2);
    const dy   = (e.clientY - cy) / (rect.height / 2);
    card.style.transform = `translateY(-4px) rotateY(${dx * 6}deg) rotateX(${-dy * 6}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity    = '1';
      entry.target.style.transform  = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

setTimeout(() => {
  document.querySelectorAll('.cat-card, .video-card, .recent-item').forEach(el => {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(24px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
}, 50);

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href') || '');
    if (!target) return;
    e.preventDefault();
    const navH   = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h') || '0');
    const top    = target.getBoundingClientRect().top + window.scrollY - navH;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});
