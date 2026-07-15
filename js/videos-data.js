/* ══════════════════════════════════════════════════════════════════
   CLIPES OCULTOS — BANCO DE VÍDEOS
   ══════════════════════════════════════════════════════════════════

   ➜ COMO POSTAR UM VÍDEO NOVO

   1. Copie um bloco { ... } inteiro da lista VIDEOS abaixo.
   2. Cole no TOPO da lista (logo depois de "export const VIDEOS = [").
   3. Troque os campos:

      id            → um código único, ex: "v16" (nunca repita um id)
      title         → título do vídeo
      category      → uma destas (copie exatamente, com acento):
                       "Documentário" | "Câmera Oculta" | "Arquivo Secreto"
                       "Mundo Oculto" | "Momentos Raros" | "Investigação"
      description   → texto curto (pode deixar "" se não quiser)
      duration      → duração no formato "mm:ss" ou "h:mm:ss"
      thumbClass    → cor de fundo da miniatura: "tp1" até "tp11"
                       (pode repetir, só é estética)
      publishedAt   → DATA e HORA exatas da publicação, formato:
                       "AAAA-MM-DDTHH:MM:00"
                       Exemplo: publicado hoje às 20h45 de 15/07/2026:
                       "2026-07-15T20:45:00"
                       É a partir deste campo que o site calcula
                       sozinho o "há X horas/dias" e a data completa
                       mostrada dentro do vídeo.
      views         → visualizações iniciais (pode deixar 0 se o vídeo
                       é novo — o contador sobe sozinho quando alguém
                       assiste quase o vídeo inteiro)
      likes/dislikes→ pode deixar 0 e 0 em vídeo novo
      sources       → arquivo(s) de vídeo. Se você só tem 1 arquivo,
                       use somente a chave "auto":
                         sources: { auto: "videos/meu-video.mp4" }
                       Se tiver mais de uma qualidade, acrescente as
                       chaves extras — o seletor de qualidade aparece
                       automaticamente quando há mais de uma opção:
                         sources: {
                           auto:  "videos/meu-video-720p.mp4",
                           "1080p": "videos/meu-video-1080p.mp4",
                           "720p":  "videos/meu-video-720p.mp4",
                           "480p":  "videos/meu-video-480p.mp4"
                         }

   4. Salve o arquivo. Pronto — o vídeo já aparece no site, com data,
      contadores, curtidas e comentários funcionando sozinhos.

   Nada mais precisa ser tocado (nem o HTML, nem o main.js) só pra
   postar um vídeo novo.
   ══════════════════════════════════════════════════════════════════ */

// Limite de visualizações a partir do qual um vídeo ganha o selo "🔥 EM ALTA".
// Pode ajustar esse número livremente.
export const TRENDING_VIEWS_THRESHOLD = 50000;

export const CATEGORY_META = {
  "Documentário":  { label: "Documentários",   icon: "🎬", desc: "Histórias reais jamais transmitidas" },
  "Câmera Oculta": { label: "Câmeras Ocultas",  icon: "👁️", desc: "Flagrantes autênticos e reveladores" },
  "Arquivo Secreto": { label: "Arquivos Secretos", icon: "📡", desc: "Gravações de acesso restrito" },
  "Mundo Oculto":  { label: "Mundo Oculto",     icon: "🌍", desc: "Lugares e eventos ignorados pela mídia" },
  "Momentos Raros":{ label: "Momentos Raros",   icon: "⚡", desc: "Capturas únicas que desafiam a lógica" },
  "Investigação":  { label: "Investigações",    icon: "🔍", desc: "Jornalismo independente e corajoso" }
};

export const VIDEOS = [
  {
    id: "v1",
    title: "O Arquivo que Quase Desapareceu",
    category: "Documentário",
    description: "Gravações recuperadas de um cofre selado por décadas revelam fatos que nenhuma emissora quis transmitir.",
    duration: "12:34",
    thumbClass: "tp1",
    publishedAt: "2026-07-13T14:00:00",
    views: 142000, likes: 15300, dislikes: 420,
    sources: { auto: "https://www.w3schools.com/html/mov_bbb.mp4" }
  },
  {
    id: "v2",
    title: "Dentro da Sala Proibida",
    category: "Câmera Oculta",
    description: "Um acesso restrito filmado por engano expõe um cômodo que não deveria existir na planta original.",
    duration: "7:18",
    thumbClass: "tp2",
    publishedAt: "2026-07-12T09:30:00",
    views: 98000, likes: 9800, dislikes: 260,
    sources: { auto: "https://www.w3schools.com/html/movie.mp4" }
  },
  {
    id: "v3",
    title: "Capturado em 1 em 10 Milhões",
    category: "Momentos Raros",
    description: "Uma coincidência captada por acaso e que provavelmente nunca mais vai se repetir.",
    duration: "4:55",
    thumbClass: "tp3",
    publishedAt: "2026-07-10T20:15:00",
    views: 76000, likes: 8100, dislikes: 190,
    sources: { auto: "https://www.w3schools.com/html/mov_bbb.mp4" }
  },
  {
    id: "v4",
    title: "A Verdade sobre o Projeto X",
    category: "Investigação",
    description: "Documentos vazados e depoimentos anônimos reconstróem uma história nunca contada.",
    duration: "9:02",
    thumbClass: "tp4",
    publishedAt: "2026-07-08T11:00:00",
    views: 63000, likes: 6600, dislikes: 340,
    sources: { auto: "https://www.w3schools.com/html/movie.mp4" }
  },
  {
    id: "v5",
    title: "Lugar Sem Nome no Mapa",
    category: "Mundo Oculto",
    description: "Uma região que não consta em nenhum mapa oficial, registrada por curiosidade.",
    duration: "6:47",
    thumbClass: "tp5",
    publishedAt: "2026-07-08T08:00:00",
    views: 55000, likes: 5200, dislikes: 150,
    sources: { auto: "https://www.w3schools.com/html/mov_bbb.mp4" }
  },
  {
    id: "v6",
    title: "Transmissão Interceptada — 1987",
    category: "Arquivo Secreto",
    description: "Sinal captado por radioamador durante conferência sigilosa.",
    duration: "3:21",
    thumbClass: "tp6",
    publishedAt: "2026-07-15T09:00:00",
    views: 12000, likes: 1300, dislikes: 40,
    sources: { auto: "https://www.w3schools.com/html/movie.mp4" }
  },
  {
    id: "v7",
    title: "O que Acontece às 3h da Manhã",
    category: "Câmera Oculta",
    description: "Câmera de segurança registra sequência impossível de explicar.",
    duration: "5:08",
    thumbClass: "tp7",
    publishedAt: "2026-07-15T06:00:00",
    views: 8400, likes: 910, dislikes: 22,
    sources: { auto: "https://www.w3schools.com/html/mov_bbb.mp4" }
  },
  {
    id: "v8",
    title: "Subterrâneos Esquecidos da Cidade",
    category: "Documentário",
    description: "Exploração de túneis abandonados que nenhum mapa oficial registra.",
    duration: "11:15",
    thumbClass: "tp8",
    publishedAt: "2026-07-15T03:00:00",
    views: 21000, likes: 2100, dislikes: 55,
    sources: { auto: "https://www.w3schools.com/html/movie.mp4" }
  },
  {
    id: "v9",
    title: "Fenômeno Atmosférico Jamais Catalogado",
    category: "Momentos Raros",
    description: "Pesquisadores estão intrigados com as imagens capturadas ao amanhecer.",
    duration: "2:44",
    thumbClass: "tp9",
    publishedAt: "2026-07-15T01:00:00",
    views: 5100, likes: 540, dislikes: 12,
    sources: { auto: "https://www.w3schools.com/html/mov_bbb.mp4" }
  },
  {
    id: "v10",
    title: "Empresa Fantasma: Quem Está Por Trás?",
    category: "Investigação",
    description: "Reportagem independente rastreia operações de uma empresa sem endereço físico.",
    duration: "8:33",
    thumbClass: "tp10",
    publishedAt: "2026-07-14T22:00:00",
    views: 33000, likes: 3400, dislikes: 210,
    sources: { auto: "https://www.w3schools.com/html/movie.mp4" }
  },
  {
    id: "v11",
    title: "Aldeia Sem Internet — Vida Real",
    category: "Mundo Oculto",
    description: "Comunidade isolada mantém tradições que o mundo moderno não conhece.",
    duration: "4:19",
    thumbClass: "tp11",
    publishedAt: "2026-07-14T18:00:00",
    views: 19000, likes: 1900, dislikes: 48,
    sources: { auto: "https://www.w3schools.com/html/mov_bbb.mp4" }
  },
  {
    id: "v12",
    title: "Sinal de Satélite Corrompido",
    category: "Arquivo Secreto",
    description: "Varredura de frequência encontrou este loop oculto.",
    duration: "1:45",
    thumbClass: "tp1",
    publishedAt: "2026-07-14T14:00:00",
    views: 4200, likes: 410, dislikes: 9,
    sources: { auto: "https://www.w3schools.com/html/movie.mp4" }
  },
  {
    id: "v13",
    title: "Experimento de Frequência Antiga",
    category: "Momentos Raros",
    description: "Efeito do som de 432Hz gravado em fita magnética original.",
    duration: "6:12",
    thumbClass: "tp2",
    publishedAt: "2026-07-14T10:00:00",
    views: 9100, likes: 970, dislikes: 25,
    sources: { auto: "https://www.w3schools.com/html/mov_bbb.mp4" }
  },
  {
    id: "v14",
    title: "O Guardião do Farol Deserto",
    category: "Mundo Oculto",
    description: "Registros visuais de uma rotina sem qualquer contato humano.",
    duration: "14:20",
    thumbClass: "tp3",
    publishedAt: "2026-07-13T20:00:00",
    views: 15000, likes: 1500, dislikes: 33,
    sources: { auto: "https://www.w3schools.com/html/movie.mp4" }
  },
  {
    id: "v15",
    title: "Códigos na Névoa Noturna",
    category: "Investigação",
    description: "Análise de flashes luminosos intermitentes na costa deserta.",
    duration: "5:30",
    thumbClass: "tp4",
    publishedAt: "2026-07-13T10:00:00",
    views: 2800, likes: 260, dislikes: 14,
    sources: { auto: "https://www.w3schools.com/html/mov_bbb.mp4" }
  }
];
