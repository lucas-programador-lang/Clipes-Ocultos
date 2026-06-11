/* ══════════════════════════════════════════
   CLIPES OCULTOS — main.js (Premium UI, Fully Responsive & Fixed Scope)
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

const firebaseConfig = {
  apiKey: "AIzaSyBeG82FG84I1k3VN3PbfRjON7C-cX5FMjU",
  authDomain: "clipes-ocultos.firebaseapp.com",
  databaseURL: "https://clipes-ocultos-default-rtdb.firebaseio.com",
  projectId: "clipes-ocultos",
  storageBucket: "clipes-ocultos.firebasestorage.app",
  messagingSenderId: "683346960432",
  appId: "1:683346960432:web:9603b865aef1f59f030df5"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

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
let unsubVideoData = null;      
let unsubVideoComments = null;  
let comentarioPaiIdAtivo = null; 

const playerVideo = document.getElementById("playerVideoMP4");
const modalTitle = document.getElementById("modalVideoTitle");
const countLikesSpan = document.getElementById("countLikes");
const countDislikesSpan = document.getElementById("countDislikes"); 
const totalViewsSpan = document.getElementById("totalVideoViews");
const onlineViewsSpan = document.getElementById("onlineViews");
const btnLike = document.getElementById("btnLike");
const btnDislike = document.getElementById("btnDislike"); 
const btnSendComment = document.getElementById("btnSendComment");
const inputUser = document.getElementById("commentUser");
const inputText = document.getElementById("commentText");
const commentsContainer = document.getElementById("commentsContainer");

function monitorarRankingGlobal() {
  const videosRef = ref(db, 'videos/');
  onValue(videosRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;
    let somaViewsGerais = 0;
    Object.keys(data).forEach(id => { somaViewsGerais += data[id].views || 0; });
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

// ── HERO CANVAS ──────────────────────────────────────────
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

function animateCounters() {
  const targets = { 'count-videos': 140, 'count-cats': 6 };
  Object.entries(targets).forEach(([id, target]) => {
    const el = document.getElementById(id);
    if (!el) return;
    let current = 0;
    const step = Math.ceil(target / 60);
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = current;
    }, 24);
  });
}

const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 50);
  const scrollTopBtn = document.getElementById('scrollTop');
  if (scrollTopBtn) scrollTopBtn.classList.toggle('hidden', window.scrollY < 400);
});

const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
  });
}

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

// ── REATIVIDADE EM TEMPO REAL AO DIGITAR O NOME DO USUÁRIO ──
if (inputUser) {
  inputUser.addEventListener("input", () => {
    if (videoAtivoId) carregarComentariosRealtime(videoAtivoId);
  });
}

// ── MOTOR DE COMENTÁRIOS COM AMBIENTAÇÃO PREMIUM TERMINAL ──
function carregarComentariosRealtime(idDoVideo) {
  const commentsRef = ref(db, `videos/${idDoVideo}/comments`);
  
  unsubVideoComments = onValue(commentsRef, (snapshot) => {
    if (!commentsContainer) return;
    commentsContainer.innerHTML = "";
    const data = snapshot.val();
    
    if (data) {
      const tempoLimite90Dias = Date.now() - (90 * 24 * 60 * 60 * 1000);
      const nomeUsuarioAtual = inputUser?.value.trim().toLowerCase();

      Object.keys(data).forEach(key => {
        const c = data[key];
        if (!c) return; 

        if (c.timestamp && c.timestamp < tempoLimite90Dias) {
          set(ref(db, `videos/${idDoVideo}/comments/${key}`), null);
          return; 
        }

        if (c.parentId) return;

        const item = criarElementoComentario(idDoVideo, key, c, data, nomeUsuarioAtual);
        commentsContainer.appendChild(item);
      });
      
      commentsContainer.scrollTop = commentsContainer.scrollHeight;
    } else {
      commentsContainer.innerHTML = `<p style="color:#555; font-size:0.85rem; font-family:'Space Mono'; text-align: center; padding: 20px 0;">[ SISTEMA VAZIO: NENHUM REGISTRO ENCONTRADO ]</p>`;
    }
  });
}

function criarElementoComentario(idDoVideo, commentId, dados, todosOsDados, usuarioAtual) {
  const item = document.createElement("div");
  item.className = "premium-comment-box";
  item.style.padding = "14px";
  item.style.background = "#141414";
  item.style.border = "1px solid #222";
  item.style.borderRadius = "6px";
  item.style.fontFamily = "'Space Mono', monospace";
  item.style.marginBottom = "12px";
  item.style.position = "relative";

  const totalLikes = dados.likes || 0;
  const exibeControleAutor = (usuarioAtual && dados.user.toLowerCase() === usuarioAtual) ? "inline-flex" : "none";

  item.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
      <span style="color: #e8ff3c; font-weight: 600; font-size: 0.9rem;">// ${dados.user}</span>
      <span style="font-size: 0.75rem; color: #555;">${new Date(dados.timestamp).toLocaleDateString()}</span>
    </div>
    <div id="text-container-${commentId}" style="line-height: 1.5; font-size:0.88rem; color: #bbb; margin: 8px 0 12px 0; word-break: break-word;">
      ${dados.text}
    </div>
    
    <div style="display: flex; flex-wrap: wrap; gap: 14px; align-items: center; font-size: 0.78rem; border-top: 1px solid #1c1c1c; padding-top: 10px;">
      <button onclick="window.curtirComentario('${idDoVideo}', '${commentId}')" style="background:none; border:none; color:#666; cursor:pointer; padding:0; display:flex; align-items:center; gap:4px; transition: color 0.2s;" onmouseover="this.style.color='#e8ff3c'" onmouseout="this.style.color='#666'">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
        <span>Apoiar (${totalLikes})</span>
      </button>
      
      <button onclick="window.ativarModoResposta('${commentId}', '${dados.user}')" style="background:none; border:none; color:#666; cursor:pointer; padding:0; display:flex; align-items:center; gap:4px; transition: color 0.2s;" onmouseover="this.style.color='#ffffff'" onmouseout="this.style.color='#666'">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <span>Responder</span>
      </button>
      
      <button onclick="window.editarComentario('${idDoVideo}', '${commentId}', \`${dados.text.replace(/'/g, "\\'")}\`)" style="background:none; border:none; color:#444; cursor:pointer; padding:0; display:${exibeControleAutor}; align-items:center; gap:4px; transition: color 0.2s;" onmouseover="this.style.color='#00bfff'" onmouseout="this.style.color='#444'">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"/></svg>
        <span>Alterar</span>
      </button>
      
      <button onclick="window.excluirComentario('${idDoVideo}', '${commentId}')" style="background:none; border:none; color:#444; cursor:pointer; padding:0; display:${exibeControleAutor}; align-items:center; gap:4px; transition: color 0.2s;" onmouseover="this.style.color='#ff3c6e'" onmouseout="this.style.color='#444'">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        <span>Remover</span>
      </button>
    </div>

    <div id="respostas-${commentId}" style="margin-top: 12px; padding-left: 14px; position: relative;"></div>
  `;

  const containerRespostas = item.querySelector(`#respostas-${commentId}`);
  let temRespostas = false;

  Object.keys(todosOsDados).forEach(subKey => {
    const subC = todosOsDados[subKey];
    if (subC && subC.parentId === commentId) {
      temRespostas = true;
      const exibeControleSubAutor = (usuarioAtual && subC.user.toLowerCase() === usuarioAtual) ? "inline-block" : "none";
      const respItem = document.createElement("div");
      respItem.style.margin = "10px 0 0 0";
      respItem.style.fontSize = "0.82rem";
      respItem.style.background = "#0d0d0d";
      respItem.style.border = "1px solid #1a1a1a";
      respItem.style.padding = "10px";
      respItem.style.borderRadius = "4px";
      
      respItem.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: #888; font-weight:500;">${subC.user} <span style="color:#e8ff3c; font-size:0.75rem; font-weight:normal; opacity:0.8;">↳ replicou</span></strong>
          <button onclick="window.excluirComentario('${idDoVideo}', '${subKey}')" style="background:none; border:none; color:#444; cursor:pointer; padding:0; display:${exibeControleSubAutor}; transition: color 0.2s;" onmouseover="this.style.color='#ff3c6e'" onmouseout="this.style.color='#444'">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
        <p style="margin: 6px 0 0 0; color: #999; line-height: 1.4; word-break: break-word;">${subC.text}</p>
      `;

      containerRespostas.appendChild(respItem);
    }
  });

  if (temRespostas) {
    const linhaArvore = document.createElement("div");
    linhaArvore.style.position = "absolute";
    linhaArvore.style.left = "4px";
    linhaArvore.style.top = "14px";
    linhaArvore.style.bottom = "14px";
    linhaArvore.style.width = "1px";
    linhaArvore.style.background = "#222";
    containerRespostas.appendChild(linhaArvore);
  }

  return item;
}

// ── REALTIME MODAL ENGINE ────────────────────────────────
const modal         = document.getElementById('videoModal');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalClose    = document.getElementById('modalClose');

function openRealtimeVideo(idDoVideo) {
  const videoInfo = listaDeVideos[idDoVideo];
  if (!videoInfo) return;

  if (typeof unsubVideoData === "function") unsubVideoData();
  if (typeof unsubVideoComments === "function") unsubVideoComments();

  videoAtivoId = idDoVideo;
  window.cancelarResposta(); 

  if (modalTitle) modalTitle.innerText = videoInfo.title;
  if (playerVideo) playerVideo.src = videoInfo.url;
  
  if (modal) modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  if (modal) {
    modal.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

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
  if (btnDislike) {
    const jaDeuDislike = localStorage.getItem(`clips_ocultos_disliked_${idDoVideo}`) === 'true';
    const dislikeTextEl = btnDislike.querySelector('.dislike-text');
    if (jaDeuDislike) {
      btnDislike.classList.add('disliked');
      if (dislikeTextEl) dislikeTextEl.textContent = 'Disgostado';
    } else {
      btnDislike.classList.remove('disliked');
      if (dislikeTextEl) dislikeTextEl.textContent = 'Disgostar';
    }
  }

  const chaveViewStorage = `clips_ocultos_viewed_${idDoVideo}`;
  const jaViuEsteVideo = localStorage.getItem(chaveViewStorage) === 'true';

  if (!jaViuEsteVideo) {
    const viewsRef = ref(db, `videos/${idDoVideo}/views`);
    runTransaction(viewsRef, (currentViews) => { return (currentViews || 0) + 1; })
    .then(() => { localStorage.setItem(chaveViewStorage, 'true'); })
    .catch((error) => console.error("Erro views:", error));
  }

  const onlineRef = ref(db, `videos/${idDoVideo}/online/${Date.now()}`);
  set(onlineRef, true);
  onDisconnect(onlineRef).remove();
  viewerRef = onlineRef;

  const dataRef = ref(db, `videos/${idDoVideo}`);
  unsubVideoData = onValue(dataRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      if (countLikesSpan) countLikesSpan.innerText = data.likes || 0;
      if (countDislikesSpan) countDislikesSpan.innerText = data.dislikes || 0; 
      if (totalViewsSpan) totalViewsSpan.innerText = (data.views || 0).toLocaleString('pt-BR');
      const totalOnline = data.online ? Object.keys(data.online).length : 1;
      if (onlineViewsSpan) onlineViewsSpan.innerText = totalOnline;
    }
  });

  carregarComentariosRealtime(idDoVideo);
}

function closeRealtimeVideo() {
  if (playerVideo) {
    playerVideo.pause();
    playerVideo.src = "";
  }
  if (modal) modal.classList.add('hidden');
  document.body.style.overflow = '';

  if (typeof unsubVideoData === "function") { unsubVideoData(); unsubVideoData = null; }
  if (typeof unsubVideoComments === "function") { unsubVideoComments(); unsubVideoComments = null; }

  if (viewerRef) { set(viewerRef, null); viewerRef = null; }
  videoAtivoId = null;
  window.cancelarResposta(); 
}

function mapearBotoesPlay() {
  document.querySelectorAll('.video-card, .recent-item').forEach((card, index) => {
    if (card.getAttribute('data-mapped') === 'true') return; 
    const newCard = card.cloneNode(true);
    newCard.setAttribute('data-mapped', 'true');
    card.parentNode.replaceChild(newCard, card);
    const videoId = card.getAttribute('data-video-id') || `v${index + 1}`;
    newCard.addEventListener('click', (e) => {
      e.preventDefault();
      openRealtimeVideo(videoId);
    });
  });
}

if (modalBackdrop) modalBackdrop.addEventListener('click', closeRealtimeVideo);
if (modalClose) modalClose.addEventListener('click', closeRealtimeVideo);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeRealtimeVideo(); });

// ── TRAVAS DE LIKES / DISLIKES ──
let enviandoLike = false;
let enviandoDislike = false;

if (btnLike) {
  btnLike.addEventListener("click", () => {
    if (!videoAtivoId || enviandoLike) return;
    const chaveLike = `clips_ocultos_liked_${videoAtivoId}`;
    const chaveDislike = `clips_ocultos_disliked_${videoAtivoId}`;
    let jaCurtiu = localStorage.getItem(chaveLike) === 'true';
    let jaDeuDislike = localStorage.getItem(chaveDislike) === 'true';

    localStorage.setItem(chaveLike, !jaCurtiu ? 'true' : 'false');
    enviandoLike = true; 
    const likesRef = ref(db, `videos/${videoAtivoId}/likes`);
    const dislikesRef = ref(db, `videos/${videoAtivoId}/dislikes`);
    const likeTextEl = btnLike.querySelector('.like-text');
    const dislikeTextEl = btnDislike?.querySelector('.dislike-text');

    if (jaDeuDislike && btnDislike) {
      runTransaction(dislikesRef, (curr) => (curr || 1) - 1);
      localStorage.removeItem(chaveDislike);
      btnDislike.classList.remove('disliked');
      if (dislikeTextEl) dislikeTextEl.textContent = 'Disgostar';
    }

    if (!jaCurtiu) {
      runTransaction(likesRef, (curr) => (curr || 0) + 1).then(() => {
        btnLike.classList.add('liked');
        if (likeTextEl) likeTextEl.textContent = 'Curtido';
        enviandoLike = false; 
      }).catch(() => { enviandoLike = false; });
    } else {
      runTransaction(likesRef, (curr) => { const n = (curr || 0) - 1; return n < 0 ? 0 : n; }).then(() => {
        btnLike.classList.remove('liked');
        if (likeTextEl) likeTextEl.textContent = 'Curtir';
        enviandoLike = false; 
      }).catch(() => { enviandoLike = false; });
    }
  });
}

if (btnDislike) {
  btnDislike.addEventListener("click", () => {
    if (!videoAtivoId || enviandoDislike) return;
    const chaveLike = `clips_ocultos_liked_${videoAtivoId}`;
    const chaveDislike = `clips_ocultos_disliked_${videoAtivoId}`;
    let jaCurtiu = localStorage.getItem(chaveLike) === 'true';
    let jaDeuDislike = localStorage.getItem(chaveDislike) === 'true';

    localStorage.setItem(chaveDislike, !jaDeuDislike ? 'true' : 'false');
    enviandoDislike = true; 
    const likesRef = ref(db, `videos/${videoAtivoId}/likes`);
    const dislikesRef = ref(db, `videos/${videoAtivoId}/dislikes`);
    const likeTextEl = btnLike?.querySelector('.like-text');
    const dislikeTextEl = btnDislike.querySelector('.dislike-text');

    if (jaCurtiu && btnLike) {
      runTransaction(likesRef, (curr) => (curr || 1) - 1);
      localStorage.removeItem(chaveLike);
      btnLike.classList.remove('liked');
      if (likeTextEl) likeTextEl.textContent = 'Curtir';
    }

    if (!jaDeuDislike) {
      runTransaction(dislikesRef, (curr) => (curr || 0) + 1).then(() => {
        btnDislike.classList.add('disliked');
        if (dislikeTextEl) dislikeTextEl.textContent = 'Disgostado';
        enviandoDislike = false; 
      }).catch(() => { enviandoDislike = false; });
    } else {
      runTransaction(dislikesRef, (curr) => { const n = (curr || 0) - 1; return n < 0 ? 0 : n; }).then(() => {
        btnDislike.classList.remove('disliked');
        if (dislikeTextEl) dislikeTextEl.textContent = 'Disgostar';
        enviandoDislike = false; 
      }).catch(() => { enviandoDislike = false; });
    }
  });
}

if (btnSendComment) {
  btnSendComment.addEventListener("click", () => {
    const nomeStr = inputUser?.value.trim();
    const textoStr = inputText?.value.trim();

    if (!nomeStr || !textoStr) {
      mostrarToastNotificacao("⚠ Preencha seu nome e mensagem para transmitir.", "#ff3c6e");
      return;
    }
    if (!videoAtivoId) return;

    const commentsListRef = ref(db, `videos/${videoAtivoId}/comments`);
    const novoComentario = { user: nomeStr, text: textoStr, timestamp: Date.now() };

    if (comentarioPaiIdAtivo) novoComentario.parentId = comentarioPaiIdAtivo;

    push(commentsListRef, novoComentario).then(() => {
      if (inputText) inputText.value = "";
      window.cancelarResposta(); 
      mostrarToastNotificacao("✓ Comentário integrado.", "#e8ff3c");
    });
  });
}

// ── INJEÇÃO ESTRETA DE ESCOPO GLOBAL WINDOW (Corrige Falhas de Cliques) ──

window.curtirComentario = function(idDoVideo, commentId) {
  const chaveLikeComentario = `clips_ocultos_like_comment_${commentId}`;
  if (localStorage.getItem(chaveLikeComentario) === 'true') {
    mostrarToastNotificacao("ℹ Assinatura de apoio já computada.", "#ffffff");
    return;
  }
  const commentLikeRef = ref(db, `videos/${idDoVideo}/comments/${commentId}/likes`);
  runTransaction(commentLikeRef, (curr) => { return (curr || 0) + 1; }).then(() => {
    localStorage.setItem(chaveLikeComentario, 'true');
  });
};

window.ativarModoResposta = function(commentId, nomeAutor) {
  comentarioPaiIdAtivo = commentId;
  if (inputText) {
    inputText.placeholder = `Respondendo para @${nomeAutor}...`;
    inputText.focus();
  }
  let aviso = document.getElementById("aviso-resposta");
  if (!aviso && inputText) {
    aviso = document.createElement("div");
    aviso.id = "aviso-resposta";
    aviso.style.fontSize = "0.75rem";
    aviso.style.color = "#e8ff3c";
    aviso.style.marginBottom = "6px";
    aviso.style.fontFamily = "'Space Mono', monospace";
    aviso.innerHTML = `[ CONEXÃO ] Respondendo a @${nomeAutor} <span onclick="window.cancelarResposta()" style="color:#ff3c6e; cursor:pointer; margin-left:8px; text-decoration:underline;">[ABORTAR]</span>`;
    inputText.parentNode.insertBefore(aviso, inputText);
  }
};

window.cancelarResposta = function() {
  comentarioPaiIdAtivo = null;
  if (inputText) inputText.placeholder = "Escreva seu comentário...";
  const aviso = document.getElementById("aviso-resposta");
  if (aviso) aviso.remove();
};

// ── GERADOR DE MODAIS PREMIUM COM DESIGN RESPONSIVO E BOTÃO FECHAR (X) ──
function criarFundoModalCustomizado(onConfirm, contentHTML) {
  // Injeta Folha de Estilos Dinâmica para Responsividade Perfeita (Mobile & Desktop)
  if (!document.getElementById("premium-modal-styles")) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "premium-modal-styles";
    styleSheet.innerText = `
      .premium-overlay {
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(5, 5, 5, 0.85); backdrop-filter: blur(5px);
        display: flex; align-items: center; justify-content: center; z-index: 99999; padding: 16px; box-sizing: border-box;
      }
      .premium-modal-box {
        background: #0f0f0f; border: 1px solid #222; padding: 24px; border-radius: 8px;
        position: relative; width: 100%; box-shadow: 0 25px 50px rgba(0,0,0,0.8); box-sizing: border-box;
      }
      /* Modo Mobile */
      @media (max-width: 768px) { .premium-modal-box { max-width: 100%; padding: 20px; } }
      /* Modo Desktop */
      @media (min-width: 769px) { .premium-modal-box { max-width: 440px; } }
    `;
    document.head.appendChild(styleSheet);
  }

  const overlay = document.createElement("div");
  overlay.className = "premium-overlay";

  const box = document.createElement("div");
  box.className = "premium-modal-box";

  // Injeção de layout contendo o Botão superior direito de Fechar (X)
  box.innerHTML = `
    <button class="btn-close-modal-x" style="position:absolute; top:14px; right:14px; background:none; border:none; color:#555; font-size:1.1rem; cursor:pointer; font-family:sans-serif; transition:color 0.2s;" onmouseover="this.style.color='#ff3c6e'" onmouseout="this.style.color='#555'">✕</button>
    ${contentHTML}
  `;
  
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  const destruirModal = () => overlay.remove();

  box.querySelector(".btn-close-modal-x").addEventListener("click", destruirModal);
  box.querySelector(".btn-cancel-modal").addEventListener("click", destruirModal);
  box.querySelector(".btn-confirm-modal").addEventListener("click", () => {
    onConfirm(box);
    destruirModal();
  });
}

window.excluirComentario = function(idDoVideo, commentId) {
  criarFundoModalCustomizado(() => {
    set(ref(db, `videos/${idDoVideo}/comments/${commentId}`), null).then(() => {
      mostrarToastNotificacao("🗑 Registro removido da base central.", "#ff3c6e");
    });
  }, `
    <h3 style="color:#fff; font-size:1.05rem; margin: 0 0 12px 0; font-family:'Space Mono'; font-weight:600;">// EXCLUIR REGISTRO?</h3>
    <p style="color:#777; font-size:0.85rem; line-height:1.5; margin-bottom:22px; font-family:'Space Mono';">Esta operação irá purgar a transmissão selecionada permanentemente de nossos servidores.</p>
    <div style="display:flex; justify-content:flex-end; gap:14px; font-family:'Space Mono';">
      <button class="btn-cancel-modal" style="background:none; border:none; color:#555; cursor:pointer; font-size:0.82rem; font-family:'Space Mono';">[ ABORTAR ]</button>
      <button class="btn-confirm-modal" style="background:#ff3c6e; border:none; color:#fff; padding:6px 16px; border-radius:4px; cursor:pointer; font-size:0.82rem; font-family:'Space Mono'; font-weight:600;">DELETAR</button>
    </div>
  `);
};

window.editarComentario = function(idDoVideo, commentId, textoAntigo) {
  criarFundoModalCustomizado((box) => {
    const novoTexto = box.querySelector(".input-edit-modal").value.trim();
    if (!novoTexto) {
      mostrarToastNotificacao("⚠ Abortado: Corpo de texto vazio.", "#ff3c6e");
      return;
    }
    set(ref(db, `videos/${idDoVideo}/comments/${commentId}/text`), novoTexto).then(() => {
      mostrarToastNotificacao("✏ Transmissão modificada.", "#00bfff");
    });
  }, `
    <h3 style="color:#fff; font-size:1.05rem; margin:0 0 12px 0; font-family:'Space Mono'; font-weight:600;">// ALTERAR CONTEÚDO</h3>
    <textarea class="input-edit-modal" style="width:100%; height:85px; background:#141414; border:1px solid #333; border-radius:4px; color:#fff; padding:10px; font-family:'Space Mono'; font-size:0.85rem; resize:none; box-sizing:border-box; margin-bottom:18px; outline:none; font-weight:500;" placeholder="Reescreva o relatório...">${textoAntigo}</textarea>
    <div style="display:flex; justify-content:flex-end; gap:14px; font-family:'Space Mono';">
      <button class="btn-cancel-modal" style="background:none; border:none; color:#555; cursor:pointer; font-size:0.82rem; font-family:'Space Mono';">[ ABORTAR ]</button>
      <button class="btn-confirm-modal" style="background:#e8ff3c; border:none; color:#000; padding:6px 16px; border-radius:4px; cursor:pointer; font-size:0.82rem; font-family:'Space Mono'; font-weight:600;">SALVAR</button>
    </div>
  `);
};

// ── TOAST NOTIFICATION ──
function mostrarToastNotificacao(mensagem, corFundo) {
  let toast = document.getElementById("toast-notificacao");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-notificacao";
    toast.style.position = "fixed"; toast.style.bottom = "24px"; toast.style.right = "24px";
    toast.style.padding = "10px 20px"; toast.style.borderRadius = "4px";
    toast.style.fontFamily = "'Space Mono', monospace"; toast.style.fontSize = "0.82rem";
    toast.style.zIndex = "999999"; toast.style.transition = "opacity 0.2s ease";
    document.body.appendChild(toast);
  }
  toast.textContent = mensagem;
  toast.style.background = "#0a0a0a";
  toast.style.border = `1px solid ${corFundo}`;
  toast.style.color = corFundo;
  toast.style.opacity = "1";
  setTimeout(() => { toast.style.opacity = "0"; }, 4000);
}

document.addEventListener("DOMContentLoaded", mapearBotoesPlay);

// ── SCROLL TOP & LOAD MORE ──────────────────
const scrollTopBtn = document.getElementById('scrollTop');
if (scrollTopBtn) {
  scrollTopBtn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });
}

const loadMoreBtn = document.getElementById('loadMore');
let loadCount     = 0;
const moreVideos  = [
  { cat: 'Câmera Oculta',   title: 'Reunião que Ninguém Deveria Ver',         views: '7.2K',  time: 'há 1 dia',   tp: 'tp2'  },
  { cat: 'Documentário',    title: 'Arquivo Perdido de 1971',                  views: '44K',   time: 'há 2 dias',  tp: 'tp1'  }
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
      const idInjetado = loadCount === 0 ? "v1" : "v2"; 
      el.setAttribute('data-video-id', idInjetado);
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
      el.style.opacity   = '0'; el.style.transform = 'translateY(16px)';
      list.appendChild(el);
      requestAnimationFrame(() => {
        el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        el.style.opacity    = '1'; el.style.transform  = 'translateY(0)';
      });
    });
    loadCount += 2;
    mapearBotoesPlay();
  });
}

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
    el.style.opacity    = '0'; el.style.transform  = 'translateY(24px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
}, 50);
