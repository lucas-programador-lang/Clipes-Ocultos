/* ══════════════════════════════════════════
   CLIPES OCULTOS — main.js (Firebase Corrigido & Comentários Avançados)
══════════════════════════════════════════ */

// ── 3. CARREGAMENTO DO FIREBASE VIA MÓDULO SEGURO (Movido para o topo para evitar erros de inicialização) ───
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, runTransaction, push, onValue, set, onDisconnect } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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
let unsubVideoData = null;      // Guarda a referência de cancelamento do onValue de dados
let unsubVideoComments = null;  // Guarda a referência de cancelamento do onValue de comentários
let comentarioPaiIdAtivo = null; // Variável global de controle para respostas (Thread)

// Elementos do Modal Interativo
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
    let current   = 0;
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

// ── OUVINTE E RENDERIZADOR DE COMENTÁRIOS ATUALIZADO ──
function carregarComentariosRealtime(idDoVideo) {
  const commentsRef = ref(db, `videos/${idDoVideo}/comments`);
  
  unsubVideoComments = onValue(commentsRef, (snapshot) => {
    if (!commentsContainer) return;
    commentsContainer.innerHTML = "";
    const data = snapshot.val();
    
    if (data) {
      const tempoLimite90Dias = Date.now() - (90 * 24 * 60 * 60 * 1000);
      const nomeUsuarioAtual = inputUser?.value.trim();

      Object.keys(data).forEach(key => {
        const c = data[key];
        if (!c) return; 

        // Limpeza automática de 90 dias
        if (c.timestamp && c.timestamp < tempoLimite90Dias) {
          set(ref(db, `videos/${idDoVideo}/comments/${key}`), null);
          return; 
        }

        // Ignora respostas nesta primeira passada (elas serão renderizadas dentro do pai)
        if (c.parentId) return;

        // Renderiza o comentário principal
        const item = criarElementoComentario(idDoVideo, key, c, data, nomeUsuarioAtual);
        commentsContainer.appendChild(item);
      });
      
      commentsContainer.scrollTop = commentsContainer.scrollHeight;
    } else {
      commentsContainer.innerHTML = `<p style="color:#666; font-size:0.85rem; font-family:'Space Mono';">Nenhum comentário ainda. Seja o primeiro!</p>`;
    }
  });
}

// Função auxiliar para gerar o HTML de cada comentário e suas respostas
function criarElementoComentario(idDoVideo, commentId, dados, todosOsDados, usuarioAtual) {
  const item = document.createElement("div");
  item.style.padding = "10px";
  item.style.background = "#222";
  item.style.borderRadius = "4px";
  item.style.fontFamily = "'Space Mono', monospace";
  item.style.marginBottom = "8px";
  item.style.borderLeft = "3px solid #e8ff3c";

  const totalLikes = dados.likes || 0;

  item.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <strong style="color: #e8ff3c;">${dados.user}:</strong>
      <span style="font-size: 0.75rem; color: #888;">${new Date(dados.timestamp).toLocaleDateString()}</span>
    </div>
    <div id="text-container-${commentId}" style="margin: 6px 0; font-size:0.9rem; color: #fff;">
      ${dados.text}
    </div>
    
    <div style="display: flex; gap: 12px; margin-top: 8px; font-size: 0.8rem;">
      <button onclick="curtirComentario('${idDoVideo}', '${commentId}')" style="background:none; border:none; color:#e8ff3c; cursor:pointer; padding:0;">
        👍 (${totalLikes})
      </button>
      <button onclick="ativarModoResposta('${commentId}', '${dados.user}')" style="background:none; border:none; color:#888; cursor:pointer; padding:0;">
        💬 Responder
      </button>
      
      <button onclick="editarComentario('${idDoVideo}', '${commentId}', '${dados.text}')" class="btn-autor-${commentId}" style="background:none; border:none; color:#00bfff; cursor:pointer; padding:0; display:none;">
        ✏️ Editar
      </button>
      <button onclick="excluirComentario('${idDoVideo}', '${commentId}')" class="btn-autor-${commentId}" style="background:none; border:none; color:#ff3c6e; cursor:pointer; padding:0; display:none;">
        🗑️ Excluir
      </button>
    </div>

    <div id="respostas-${commentId}" style="margin-top: 10px; padding-left: 15px; border-left: 1px dashed #444;"></div>
  `;

  // Exibe botões de edição/exclusão se o nome bater com o digitado no input de forma reativa
  setTimeout(() => {
    if (usuarioAtual && dados.user.toLowerCase() === usuarioAtual.toLowerCase()) {
      item.querySelectorAll(`.btn-autor-${commentId}`).forEach(btn => btn.style.display = "inline-block");
    }
  }, 100);

  // Renderiza sub-comentários (respostas) pertencentes a este pai
  const containerRespostas = item.querySelector(`#respostas-${commentId}`);
  Object.keys(todosOsDados).forEach(subKey => {
    const subC = todosOsDados[subKey];
    if (subC && subC.parentId === commentId) {
      const respItem = document.createElement("div");
      respItem.style.margin = "6px 0";
      respItem.style.fontSize = "0.85rem";
      respItem.style.background = "#1a1a1a";
      respItem.style.padding = "6px";
      respItem.style.borderRadius = "4px";
      respItem.innerHTML = `
        <div style="display: flex; justify-content: space-between;">
          <strong style="color: #aaa;">${subC.user} <span style="color:#e8ff3c; font-size:0.75rem;">➔ respondeu</span>:</strong>
          <button onclick="excluirComentario('${idDoVideo}', '${subKey}')" class="btn-autor-${subKey}" style="background:none; border:none; color:#ff3c6e; cursor:pointer; font-size:0.75rem; display:none;">🗑️</button>
        </div>
        <p style="margin: 4px 0 0 0; color: #ccc;">${subC.text}</p>
      `;
      
      setTimeout(() => {
        if (usuarioAtual && subC.user.toLowerCase() === usuarioAtual.toLowerCase()) {
          const btnDel = respItem.querySelector(`.btn-autor-${subKey}`);
          if (btnDel) btnDel.style.display = "inline-block";
        }
      }, 100);

      containerRespostas.appendChild(respItem);
    }
  });

  return item;
}

// ── REALTIME MODAL ENGINE ────────────────────────────────
const modal         = document.getElementById('videoModal');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalClose    = document.getElementById('modalClose');

function openRealtimeVideo(idDoVideo) {
  const videoInfo = listaDeVideos[idDoVideo];
  if (!videoInfo) return;

  // Cancela listeners anteriores para evitar estouro de memória/concorrência no Firebase
  if (typeof unsubVideoData === "function") unsubVideoData();
  if (typeof unsubVideoComments === "function") unsubVideoComments();

  videoAtivoId = idDoVideo;
  cancelarResposta(); // Garante reset do formulário de subcomentários

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
    runTransaction(viewsRef, (currentViews) => {
      return (currentViews || 0) + 1;
    }).then(() => {
      localStorage.setItem(chaveViewStorage, 'true');
    }).catch((error) => console.error("Erro ao computar view única:", error));
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

  // Dispara o novo ouvinte estruturado de comentários e sub-respostas
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

  if (viewerRef) {
    set(viewerRef, null);
    viewerRef = null;
  }
  videoAtivoId = null;
  cancelarResposta(); // Limpa as caixas de texto e referências ao fechar
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

// ── VARIÁVEIS DE TRAVA MECÂNICA (BLOQUEIO ANTI-SPAM PARA CLIQUES RÁPIDOS) ──
let enviandoLike = false;
let enviandoDislike = false;

// ── GERENCIADOR DE LIKES INTELIGENTE ──
if (btnLike) {
  btnLike.addEventListener("click", () => {
    if (!videoAtivoId || enviandoLike) return;

    const chaveLike = `clips_ocultos_liked_${videoAtivoId}`;
    const chaveDislike = `clips_ocultos_disliked_${videoAtivoId}`;
    
    let jaCurtiu = localStorage.getItem(chaveLike) === 'true';
    let jaDeuDislike = localStorage.getItem(chaveDislike) === 'true';

    if (!jaCurtiu) {
      localStorage.setItem(chaveLike, 'true');
    } else {
      localStorage.removeItem(chaveLike);
    }

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
      runTransaction(likesRef, (curr) => {
        const n = (curr || 0) - 1; return n < 0 ? 0 : n;
      }).then(() => {
        btnLike.classList.remove('liked');
        if (likeTextEl) likeTextEl.textContent = 'Curtir';
        enviandoLike = false; 
      }).catch(() => { enviandoLike = false; });
    }
  });
}

// ── GERENCIADOR DE DISLIKES INTELIGENTE ──
if (btnDislike) {
  btnDislike.addEventListener("click", () => {
    if (!videoAtivoId || enviandoDislike) return;

    const chaveLike = `clips_ocultos_liked_${videoAtivoId}`;
    const chaveDislike = `clips_ocultos_disliked_${videoAtivoId}`;
    
    let jaCurtiu = localStorage.getItem(chaveLike) === 'true';
    let jaDeuDislike = localStorage.getItem(chaveDislike) === 'true';

    if (!jaDeuDislike) {
      localStorage.setItem(chaveDislike, 'true');
    } else {
      localStorage.removeItem(chaveDislike);
    }

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
      runTransaction(dislikesRef, (curr) => {
        const n = (curr || 0) - 1; return n < 0 ? 0 : n;
      }).then(() => {
        btnDislike.classList.remove('disliked');
        if (dislikeTextEl) dislikeTextEl.textContent = 'Disgostar';
        enviandoDislike = false; 
      }).catch(() => { enviandoDislike = false; });
    }
  });
}

// ── LÓGICA DE ENVIO ADAPTADA PARA SUPORTAR COMENTÁRIOS E RESPOSTAS ──
if (btnSendComment) {
  btnSendComment.addEventListener("click", () => {
    const nomeStr = inputUser?.value.trim();
    const textoStr = inputText?.value.trim();

    if (!nomeStr || !textoStr) {
      mostrarToastNotificacao("⚠ Erro: Você precisa preencher seu nome e o comentário!", "#ff3c6e");
      return;
    }

    if (!videoAtivoId) return;

    const commentsListRef = ref(db, `videos/${videoAtivoId}/comments`);
    
    const novoComentario = {
      user: nomeStr,
      text: textoStr,
      timestamp: Date.now() 
    };

    // Se for resposta, injeta a propriedade parentId apontando para o comentário pai
    if (comentarioPaiIdAtivo) {
      novoComentario.parentId = comentarioPaiIdAtivo;
    }

    push(commentsListRef, novoComentario).then(() => {
      if (inputText) inputText.value = "";
      cancelarResposta(); 
      mostrarToastNotificacao("✓ Comentário enviado com sucesso!", "#e8ff3c");
    }).catch((error) => {
      console.error("Erro ao enviar comentário:", error);
      mostrarToastNotificacao("⚠ Erro ao salvar no servidor.", "#ff3c6e");
    });
  });
}

// ── WINDOW FUNCTIONS (Acessíveis diretamente pelos gatilhos onclick do HTML dinâmico) ──

// 1. Curtir um comentário específico via Transaction
window.curtirComentario = function(idDoVideo, commentId) {
  const chaveLikeComentario = `clips_ocultos_like_comment_${commentId}`;
  if (localStorage.getItem(chaveLikeComentario) === 'true') {
    mostrarToastNotificacao("ℹ Você já curtiu este comentário.", "#00bfff");
    return;
  }

  const commentLikeRef = ref(db, `videos/${idDoVideo}/comments/${commentId}/likes`);
  runTransaction(commentLikeRef, (curr) => {
    return (curr || 0) + 1;
  }).then(() => {
    localStorage.setItem(chaveLikeComentario, 'true');
  });
};

// 2. Ativar Modo Resposta (Injetar um subcomentário na Thread)
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
    aviso.style.color = "#00bfff";
    aviso.style.marginBottom = "4px";
    aviso.innerHTML = `Respondendo a @${nomeAutor} <span onclick="cancelarResposta()" style="color:#ff3c6e; cursor:pointer; margin-left:8px;">[Cancelar]</span>`;
    inputText.parentNode.insertBefore(aviso, inputText);
  }
};

window.cancelarResposta = function() {
  comentarioPaiIdAtivo = null;
  if (inputText) inputText.placeholder = "Escreva seu comentário...";
  const aviso = document.getElementById("aviso-resposta");
  if (aviso) aviso.remove();
};

// 3. Excluir Comentário permanentemente
window.excluirComentario = function(idDoVideo, commentId) {
  if (confirm("Deseja permanentemente deletar este comentário?")) {
    const commentRef = ref(db, `videos/${idDoVideo}/comments/${commentId}`);
    set(commentRef, null).then(() => {
      mostrarToastNotificacao("🗑 Comentário removido.", "#ff3c6e");
    });
  }
};

// 4. Editar texto de comentário existente
window.editarComentario = function(idDoVideo, commentId, textoAntigo) {
  const novoTexto = prompt("Edite o seu comentário:", textoAntigo);
  if (novoTexto === null) return; 
  
  const textoLimpo = novoTexto.trim();
  if (!textoLimpo) {
    mostrarToastNotificacao("⚠ O comentário não pode ficar vazio.", "#ff3c6e");
    return;
  }

  const commentTextRef = ref(db, `videos/${idDoVideo}/comments/${commentId}/text`);
  set(commentTextRef, textoLimpo).then(() => {
    mostrarToastNotificacao("✏ Comentário editado!", "#00bfff");
  });
};

// ── FUNÇÃO DE TOAST ──
function mostrarToastNotificacao(mensagem, corFundo) {
  let toast = document.getElementById("toast-notificacao");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-notificacao";
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.padding = "12px 24px";
    toast.style.borderRadius = "4px";
    toast.style.fontFamily = "'Space Mono', monospace";
    toast.style.fontSize = "0.9rem";
    toast.style.zIndex = "10000";
    toast.style.transition = "opacity 0.3s ease";
    document.body.appendChild(toast);
  }
  toast.textContent = mensaje;
  toast.style.background = "#111";
  toast.style.border = `1px solid ${corFundo}`;
  toast.style.color = corFundo;
  toast.style.opacity = "1";

  setTimeout(() => {
    toast.style.opacity = "0";
  }, 4000);
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
  { cat: 'Momentos Raros',  title: 'Dois Raios no Mesmo Lugar',                 views: '15K',   time: 'há 3 dias',  tp: 'tp3'  },
  { cat: 'Mundo Oculto',    title: 'Praia Sem Turistas — Litoral Fantasma',     views: '28K',   time: 'há 4 dias',  tp: 'tp5'  },
  { cat: 'Investigação',    title: 'Fundo Misterioso de ONG Internacional',     views: '51K',   time: 'há 5 dias',  tp: 'tp4'  },
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
      
      const idInjetado = loadCount === 0 ? "v1" : loadCount === 2 ? "v2" : "v3"; 
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
