// Desenho do bioma no <canvas>. Os personagens são desenhados com formas simples (arte original, sem imagens).
import { fasePlanta, ehAdulto, limiteFome } from './entidades.js';

const CORES = {
  grama1: '#9fd38a',
  grama2: '#93ca7e',
  linha: 'rgba(40, 80, 40, 0.10)',
  contorno: '#2f3b2f',
};

// ---------- Personagens (desenhados em torno do centro cx, cy; s = tamanho da célula) ----------

function elipse(ctx, x, y, rx, ry, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
}

function folha(ctx, x, y, comprimento, largura, angulo, cor) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angulo);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(comprimento * 0.5, -largura, comprimento, 0);
  ctx.quadraticCurveTo(comprimento * 0.5, largura, 0, 0);
  ctx.fillStyle = cor;
  ctx.fill();
  ctx.restore();
}

export function desenharVerdelim(ctx, cx, cy, s, fase = 'adulta', t = 0) {
  const k = s * 0.42;
  const balanco = Math.sin(t / 600 + cx * 0.05) * 0.06;
  const murcha = fase === 'murchando';
  const broto = fase === 'broto';
  const verde = murcha ? '#b9a24a' : '#3f9a4a';
  const verdeClaro = murcha ? '#d1bd62' : '#62bf5a';
  const base = cy + k * 0.75;

  // Montinho de terra
  ctx.fillStyle = '#8a6440';
  elipse(ctx, cx, base, k * 0.5, k * 0.16);
  ctx.fill();

  ctx.save();
  ctx.translate(cx, base);
  ctx.rotate(balanco + (murcha ? 0.35 : 0));
  const altura = broto ? k * 0.55 : k * 1.15;

  // Caule
  ctx.strokeStyle = verde;
  ctx.lineWidth = Math.max(1.5, k * 0.11);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(k * 0.12, -altura * 0.5, 0, -altura);
  ctx.stroke();

  if (broto) {
    folha(ctx, 0, -altura, k * 0.42, k * 0.2, -Math.PI * 0.85, verdeClaro);
    folha(ctx, 0, -altura, k * 0.42, k * 0.2, -Math.PI * 0.15, verdeClaro);
    ctx.restore();
    return;
  }

  const caida = murcha ? 0.7 : 0;
  folha(ctx, 0, -altura * 0.45, k * 0.6, k * 0.26, Math.PI + 0.45 - caida, verde);
  folha(ctx, 0, -altura * 0.6, k * 0.6, k * 0.26, -0.45 + caida, verde);

  // Cabecinha: botão redondo com duas folhinhas e um rosto
  const r = k * 0.34;
  folha(ctx, 0, -altura - r * 0.6, k * 0.35, k * 0.16, -Math.PI * 0.7, verdeClaro);
  folha(ctx, 0, -altura - r * 0.6, k * 0.35, k * 0.16, -Math.PI * 0.3, verdeClaro);
  ctx.fillStyle = murcha ? '#e3cf7a' : '#8fdc6f';
  elipse(ctx, 0, -altura, r, r * 0.9);
  ctx.fill();
  ctx.fillStyle = CORES.contorno;
  if (murcha) {
    ctx.fillRect(-r * 0.45, -altura - r * 0.05, r * 0.3, Math.max(1, r * 0.1));
    ctx.fillRect(r * 0.15, -altura - r * 0.05, r * 0.3, Math.max(1, r * 0.1));
  } else {
    elipse(ctx, -r * 0.32, -altura - r * 0.05, r * 0.12, r * 0.16);
    ctx.fill();
    elipse(ctx, r * 0.32, -altura - r * 0.05, r * 0.12, r * 0.16);
    ctx.fill();
    ctx.fillStyle = '#f29bb0';
    elipse(ctx, -r * 0.55, -altura + r * 0.3, r * 0.14, r * 0.09);
    ctx.fill();
    elipse(ctx, r * 0.55, -altura + r * 0.3, r * 0.14, r * 0.09);
    ctx.fill();
  }
  ctx.restore();
}

export function desenharPulim(ctx, cx, cy, s, { filhote = false, olhando = 1, t = 0, pulo = 0 } = {}) {
  const k = s * (filhote ? 0.27 : 0.4);
  ctx.save();
  ctx.translate(cx, cy + k * 0.2 - pulo * k * 0.5);
  ctx.scale(olhando, 1);

  const corpo = '#c7b3ea';
  const escuro = '#8f78bf';
  // Pé grande
  ctx.fillStyle = escuro;
  elipse(ctx, -k * 0.05, k * 0.55, k * 0.4, k * 0.14);
  ctx.fill();
  // Rabinho
  ctx.fillStyle = '#fbf7ff';
  elipse(ctx, -k * 0.62, k * 0.05, k * 0.18, k * 0.18);
  ctx.fill();
  // Corpo
  ctx.fillStyle = corpo;
  elipse(ctx, -k * 0.08, k * 0.15, k * 0.58, k * 0.45);
  ctx.fill();
  // Orelhas longas e curvadas
  const mexe = Math.sin(t / 300 + cx) * 0.08;
  for (const [ox, rot] of [[0.18, -0.35 + mexe], [0.45, 0.2 - mexe]]) {
    ctx.fillStyle = corpo;
    elipse(ctx, k * ox, -k * 0.75, k * 0.13, k * 0.42, rot);
    ctx.fill();
    ctx.fillStyle = '#f3b6d0';
    elipse(ctx, k * ox, -k * 0.72, k * 0.06, k * 0.3, rot);
    ctx.fill();
  }
  // Cabeça
  ctx.fillStyle = corpo;
  elipse(ctx, k * 0.38, -k * 0.2, k * 0.34, k * 0.31);
  ctx.fill();
  // Olho, bochecha e focinho
  ctx.fillStyle = CORES.contorno;
  elipse(ctx, k * 0.5, -k * 0.26, k * 0.07, k * 0.09);
  ctx.fill();
  ctx.fillStyle = '#f29bb0';
  elipse(ctx, k * 0.46, -k * 0.08, k * 0.09, k * 0.06);
  ctx.fill();
  ctx.fillStyle = escuro;
  elipse(ctx, k * 0.71, -k * 0.16, k * 0.05, k * 0.04);
  ctx.fill();
  ctx.restore();
}

export function desenharRondor(ctx, cx, cy, s, { filhote = false, olhando = 1, semente = false, t = 0 } = {}) {
  const k = s * (filhote ? 0.28 : 0.42);
  ctx.save();
  ctx.translate(cx, cy + k * 0.15);
  ctx.scale(olhando, 1);

  const pelo = '#d8743a';
  const marca = '#2f7f86'; // marcas azuladas: deixam o Rondor diferente de uma raposa comum
  const claro = '#f7e6c6';
  const cauda = Math.sin(t / 250 + cy) * 0.15;

  // Cauda volumosa
  ctx.save();
  ctx.translate(-k * 0.45, 0);
  ctx.rotate(-0.7 + cauda);
  ctx.fillStyle = pelo;
  elipse(ctx, -k * 0.35, 0, k * 0.42, k * 0.2);
  ctx.fill();
  ctx.fillStyle = marca;
  elipse(ctx, -k * 0.7, 0, k * 0.14, k * 0.14);
  ctx.fill();
  ctx.restore();
  // Patas
  ctx.fillStyle = marca;
  for (const px of [-0.35, -0.15, 0.15, 0.32]) {
    ctx.fillRect(k * px - k * 0.05, k * 0.2, k * 0.1, k * 0.32);
  }
  // Corpo esguio
  ctx.fillStyle = pelo;
  elipse(ctx, -k * 0.02, k * 0.08, k * 0.52, k * 0.27);
  ctx.fill();
  ctx.fillStyle = claro;
  elipse(ctx, k * 0.05, k * 0.2, k * 0.3, k * 0.1);
  ctx.fill();
  // Listra azulada no dorso
  ctx.fillStyle = marca;
  elipse(ctx, -k * 0.1, -k * 0.13, k * 0.25, k * 0.06);
  ctx.fill();
  // Cabeça com focinho pontudo
  ctx.fillStyle = pelo;
  ctx.beginPath();
  ctx.moveTo(k * 0.25, -k * 0.35);
  ctx.quadraticCurveTo(k * 0.55, -k * 0.5, k * 0.9, -k * 0.12);
  ctx.quadraticCurveTo(k * 0.55, k * 0.05, k * 0.25, -k * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = claro;
  ctx.beginPath();
  ctx.moveTo(k * 0.5, -k * 0.1);
  ctx.quadraticCurveTo(k * 0.7, -k * 0.12, k * 0.9, -k * 0.12);
  ctx.quadraticCurveTo(k * 0.6, k * 0.02, k * 0.42, -k * 0.02);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = CORES.contorno;
  elipse(ctx, k * 0.9, -k * 0.13, k * 0.05, k * 0.05);
  ctx.fill();
  // Orelhas pontudas
  for (const ox of [0.3, 0.5]) {
    ctx.fillStyle = pelo;
    ctx.beginPath();
    ctx.moveTo(k * (ox - 0.1), -k * 0.36);
    ctx.lineTo(k * (ox + 0.02), -k * 0.75);
    ctx.lineTo(k * (ox + 0.13), -k * 0.32);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = marca;
    ctx.beginPath();
    ctx.moveTo(k * (ox - 0.02), -k * 0.6);
    ctx.lineTo(k * (ox + 0.02), -k * 0.75);
    ctx.lineTo(k * (ox + 0.07), -k * 0.58);
    ctx.closePath();
    ctx.fill();
  }
  // Olho fino
  ctx.strokeStyle = CORES.contorno;
  ctx.lineWidth = Math.max(1, k * 0.06);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(k * 0.5, -k * 0.24);
  ctx.lineTo(k * 0.62, -k * 0.22);
  ctx.stroke();

  // Semente carregada
  if (semente) {
    ctx.fillStyle = '#3f9a4a';
    ctx.strokeStyle = '#f7f3e3';
    ctx.lineWidth = Math.max(1, k * 0.05);
    elipse(ctx, -k * 0.1, -k * 0.3, k * 0.13, k * 0.1, -0.4);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

export function desenharOvo(ctx, cx, cy, s, especie, progresso = 0, t = 0) {
  const k = s * 0.3;
  const tremor = progresso > 0.7 ? Math.sin(t / 60) * 0.12 * (progresso - 0.7) / 0.3 : 0;
  ctx.save();
  ctx.translate(cx, cy + k * 0.3);
  ctx.rotate(tremor);
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  elipse(ctx, 0, k * 0.75, k * 0.6, k * 0.15);
  ctx.fill();
  ctx.fillStyle = '#fbf3df';
  elipse(ctx, 0, 0, k * 0.6, k * 0.78);
  ctx.fill();
  ctx.fillStyle = especie === 'pulim' ? '#a98fd8' : '#d8743a';
  for (const [x, y, r] of [[-0.25, -0.3, 0.13], [0.2, -0.05, 0.1], [-0.1, 0.35, 0.11], [0.3, 0.4, 0.08]]) {
    elipse(ctx, k * x, k * y, k * r, k * r);
    ctx.fill();
  }
  if (progresso > 0.5) {
    ctx.strokeStyle = '#6b5a3a';
    ctx.lineWidth = Math.max(1, k * 0.06);
    ctx.beginPath();
    ctx.moveTo(-k * 0.35, -k * 0.1);
    ctx.lineTo(-k * 0.15, k * 0.05);
    ctx.lineTo(0, -k * 0.12);
    ctx.lineTo(k * 0.15, k * 0.04);
    ctx.stroke();
  }
  ctx.restore();
}

// Desenha um ícone de espécie num canvas pequeno (barra de ferramentas, contadores).
export function desenharIcone(canvas, especie) {
  const dpr = window.devicePixelRatio || 1;
  const tamanho = parseFloat(getComputedStyle(canvas).width) || 28;
  canvas.width = tamanho * dpr;
  canvas.height = tamanho * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const c = tamanho / 2;
  if (especie === 'verdelim') desenharVerdelim(ctx, c, c, tamanho);
  else if (especie === 'pulim') desenharPulim(ctx, c, c, tamanho);
  else if (especie === 'rondor') desenharRondor(ctx, c - tamanho * 0.05, c, tamanho * 0.9);
  else if (especie === 'ovo') desenharOvo(ctx, c, c, tamanho, 'pulim');
}

// ---------- Tabuleiro ----------

const suave = (x) => x * x * (3 - 2 * x);

export class Renderizador {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tamanho = 0;
    this.efeitos = [];
  }

  redimensionar(tamanhoCss) {
    const dpr = window.devicePixelRatio || 1;
    this.tamanho = tamanhoCss;
    this.canvas.style.width = `${tamanhoCss}px`;
    this.canvas.style.height = `${tamanhoCss}px`;
    this.canvas.width = Math.round(tamanhoCss * dpr);
    this.canvas.height = Math.round(tamanhoCss * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Converte coordenadas do ponteiro (relativas ao canvas) em célula.
  celulaEm(px, py, lado) {
    const s = this.tamanho / lado;
    const x = Math.floor(px / s);
    const y = Math.floor(py / s);
    return x >= 0 && y >= 0 && x < lado && y < lado ? { x, y } : null;
  }

  // passo = duração de um tick em ms: o corpo de quem morre termina o último deslocamento no mesmo ritmo dos vivos.
  registrarEventos(eventos, agora, passo = 350) {
    for (const ev of eventos) {
      if (['come', 'preda', 'nasce', 'brota', 'morre', 'murcha', 'ovo'].includes(ev.tipo)) {
        this.efeitos.push({ ...ev, inicio: agora, passo });
      }
    }
  }

  // Desenha o animal num canvas auxiliar (centrado, com folga de uma célula para cada lado) e, se pedido, pinta
  // por cima com uma cor só onde há desenho. Permite girar, encolher e tingir o personagem como uma figura só.
  figuraAnimal(animal, s, t, cor, quanto) {
    const dpr = window.devicePixelRatio || 1;
    const lado = Math.ceil(s * 2 * dpr);
    const c = (this.auxiliar ??= document.createElement('canvas'));
    if (c.width !== lado) c.width = c.height = lado;
    const g = c.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, lado, lado);
    g.setTransform(lado / (s * 2), 0, 0, lado / (s * 2), 0, 0);
    const opcoes = { filhote: animal.filhote, olhando: animal.olhando || 1, t };
    if (animal.especie === 'pulim') desenharPulim(g, s, s, s, opcoes);
    else desenharRondor(g, s, s, s, opcoes);
    if (quanto > 0) {
      g.globalCompositeOperation = 'source-atop';
      g.globalAlpha = Math.min(1, quanto);
      g.fillStyle = cor;
      g.fillRect(0, 0, s * 2, s * 2);
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
    }
    return c;
  }

  desenhar(estado, alpha, agora) {
    const { ctx } = this;
    const lado = estado.lado;
    const s = this.tamanho / lado;
    const cfg = estado.config;

    // Grama em xadrez
    for (let y = 0; y < lado; y++) {
      for (let x = 0; x < lado; x++) {
        ctx.fillStyle = (x + y) % 2 ? CORES.grama2 : CORES.grama1;
        ctx.fillRect(x * s, y * s, s + 0.5, s + 0.5);
      }
    }

    for (const p of estado.plantas) {
      desenharVerdelim(ctx, (p.x + 0.5) * s, (p.y + 0.5) * s, s, fasePlanta(p, cfg), agora);
    }
    for (const o of estado.ovos) {
      desenharOvo(ctx, (o.x + 0.5) * s, (o.y + 0.5) * s, s, o.especie, 1 - o.restante / o.total, agora);
    }

    // Animais: interpolação entre a posição anterior e a atual; vários na mesma célula ficam lado a lado.
    const porCelula = new Map();
    for (const a of estado.animais) {
      const chave = a.y * lado + a.x;
      if (!porCelula.has(chave)) porCelula.set(chave, []);
      porCelula.get(chave).push(a);
    }
    const ordenados = [...estado.animais].sort((a, b) => a.y - b.y || (a.especie === 'rondor') - (b.especie === 'rondor'));
    const f = suave(Math.min(1, Math.max(0, alpha)));
    for (const a of ordenados) {
      const grupo = porCelula.get(a.y * lado + a.x);
      const i = grupo.indexOf(a);
      const deslocamento = grupo.length > 1 ? (i / (grupo.length - 1) - 0.5) * s * 0.4 : 0;
      const x = (a.px + (a.x - a.px) * f + 0.5) * s + deslocamento;
      const y = (a.py + (a.y - a.py) * f + 0.5) * s;
      const filhote = !ehAdulto(a, cfg);
      const faminto = a.fome / limiteFome(a, cfg) > 0.7;
      const pulo = a.x !== a.px || a.y !== a.py ? Math.sin(f * Math.PI) : 0;
      ctx.globalAlpha = faminto ? 0.55 + 0.25 * Math.sin(agora / 150) : 1;
      if (a.especie === 'pulim') desenharPulim(ctx, x, y, s, { filhote, olhando: a.olhando, t: agora, pulo });
      else desenharRondor(ctx, x, y, s, { filhote, olhando: a.olhando, semente: !!a.semente, t: agora });
      ctx.globalAlpha = 1;
    }

    this.desenharEfeitos(s, agora);

    // Linhas da grade (ajudam a mirar o toque)
    ctx.strokeStyle = CORES.linha;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < lado; i++) {
      ctx.moveTo(i * s, 0);
      ctx.lineTo(i * s, this.tamanho);
      ctx.moveTo(0, i * s);
      ctx.lineTo(this.tamanho, i * s);
    }
    ctx.stroke();
  }

  desenharEfeitos(s, agora) {
    const { ctx } = this;
    this.efeitos = this.efeitos.filter((ef) => agora - ef.inicio < (DURACAO[ef.tipo] ?? DURACAO.anel));
    for (const ef of this.efeitos) {
      const decorrido = agora - ef.inicio;
      if (ef.tipo === 'morre') this.desenharMorte(ef, s, decorrido);
      else if (ef.tipo === 'preda') this.desenharCaptura(ef, s, decorrido);
      else desenharAnel(ctx, ef, s, decorrido / DURACAO.anel);
    }
    ctx.globalAlpha = 1;
  }

  // Morte de fome: o animal fica cinza e treme, tomba de lado com um quique, levanta poeira e some enquanto um
  // fantasminha sobe balançando.
  desenharMorte(ef, s, decorrido) {
    const { ctx } = this;
    const p = decorrido / DURACAO.morre;
    const { cx, cy } = posicaoDoCorpo(ef, s, decorrido);
    const cinza = 0.7 * limitar(p / 0.3);
    const tremor = p < 0.3 ? Math.sin(decorrido / 25) * s * 0.035 * (1 - p / 0.3) : 0;
    const queda = quique(limitar((p - 0.25) / 0.25));
    const sumir = limitar((p - 0.6) / 0.4);
    const base = s * 0.3; // altura do chão em relação ao centro da célula

    // Pulinho de susto e depois cambalhota para trás, caindo de barriga para cima.
    const pulo = Math.sin(limitar((p - 0.25) / 0.25) * Math.PI) * s * 0.18;
    const figura = this.figuraAnimal(ef, s, ef.inicio, '#7d7f88', cinza);
    ctx.save();
    ctx.globalAlpha = 1 - sumir;
    ctx.translate(cx + tremor, cy + queda * s * 0.08 - pulo);
    ctx.rotate(-(ef.olhando || 1) * queda * Math.PI);
    ctx.scale(1, 1 - sumir * 0.4);
    ctx.drawImage(figura, -s, -s, s * 2, s * 2);
    ctx.restore();

    // Poeira no chão quando o corpo bate.
    const poeira = limitar((p - 0.45) / 0.35);
    if (poeira > 0 && poeira < 1) {
      ctx.fillStyle = '#b8ab95';
      for (const lado of [-1, 1]) {
        for (let i = 0; i < 2; i++) {
          ctx.globalAlpha = 0.6 * (1 - poeira);
          elipse(ctx, cx + lado * s * (0.15 + poeira * (0.25 + i * 0.12)), cy + base - poeira * s * (0.08 + i * 0.05),
            s * (0.07 + poeira * 0.06) * (1 - i * 0.3), s * (0.05 + poeira * 0.04) * (1 - i * 0.3));
          ctx.fill();
        }
      }
    }

    const alma = limitar((p - 0.45) / 0.55);
    if (alma > 0) {
      ctx.globalAlpha = Math.min(1, alma * 4) * (1 - alma) * 0.9;
      desenharFantasminha(ctx, cx + Math.sin(alma * Math.PI * 3) * s * 0.12, cy - alma * s * 0.9, s * 0.17, decorrido);
    }
    ctx.globalAlpha = 1;
  }

  // Captura: o Pulim chega assustado (com um "!"), a mandíbula do Rondor fecha sobre ele com um clarão, ele gira e
  // encolhe até sumir e tufos de pelo voam.
  desenharCaptura(ef, s, decorrido) {
    const { ctx } = this;
    const presa = ef.presa;
    if (!presa) return desenharAnel(ctx, ef, s, decorrido / DURACAO.anel);
    const { cx, cy } = posicaoDoCorpo(presa, s, decorrido, ef);
    const impacto = Math.min(ef.passo, 300);
    const total = DURACAO.preda - impacto;
    const q = limitar((decorrido - impacto) / total);

    if (decorrido < impacto) {
      // Antes da mordida: o Pulim ainda é visível e se assusta.
      ctx.drawImage(this.figuraAnimal(presa, s, ef.inicio, '#fff', 0), cx - s, cy - s, s * 2, s * 2);
      desenharExclamacao(ctx, cx, cy - s * 0.55, s, decorrido / impacto);
      return;
    }

    // Clarão em estrela atrás da presa.
    const clarao = limitar(q / 0.45);
    if (clarao < 1) {
      ctx.globalAlpha = 1 - clarao;
      desenharEstrela(ctx, cx, cy, s * (0.25 + 0.45 * suave(clarao)), clarao * 0.6, '#ffe27a', '#fff8d6');
    }

    // A presa pisca em branco e vermelho, gira e encolhe.
    const encolher = limitar(q / 0.5);
    if (encolher < 1) {
      const figura = this.figuraAnimal(presa, s, ef.inicio, q < 0.08 ? '#ffffff' : '#e0523f', 0.75 * (1 - encolher * 0.5));
      const escala = 1 - suave(encolher);
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.translate(cx, cy);
      ctx.rotate(encolher * Math.PI * 1.5 * (presa.olhando || 1));
      ctx.scale(escala, escala);
      ctx.drawImage(figura, -s, -s, s * 2, s * 2);
      ctx.restore();
    }

    // Mandíbula: duas fileiras de dentes que se fecham e somem.
    const mordida = limitar(q / 0.22);
    const someDentes = limitar((q - 0.3) / 0.25);
    if (someDentes < 1) {
      ctx.globalAlpha = 1 - someDentes;
      const abertura = s * 0.34 * (1 - suave(mordida)) + s * 0.04;
      desenharDentes(ctx, cx, cy - abertura, s * 0.56, s * 0.17, 1);
      desenharDentes(ctx, cx, cy + abertura, s * 0.56, s * 0.17, -1);
    }

    // Tufos de pelo que voam e caem.
    const semente = ef.x * 7 + ef.y * 13;
    const n = 8;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 + semente;
      const vel = s * (0.45 + ((i * 37 + semente) % 5) * 0.08);
      const px = cx + Math.cos(ang) * vel * q;
      const py = cy + Math.sin(ang) * vel * q * 0.8 + s * 0.6 * q * q;
      ctx.globalAlpha = 1 - q;
      ctx.fillStyle = i % 3 === 0 ? '#fbf7ff' : '#c7b3ea';
      elipse(ctx, px, py, s * 0.06 * (1 - q * 0.4), s * 0.035, ang + q * 4);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

// ---------- Peças dos efeitos ----------

const DURACAO = { anel: 700, morre: 1500, preda: 1000 };

const limitar = (x) => Math.min(1, Math.max(0, x));

// Queda com um quique pequeno no fim (0 → 1).
function quique(x) {
  if (x < 0.7) return suave(x / 0.7);
  return 1 - Math.sin(((x - 0.7) / 0.3) * Math.PI) * 0.12;
}

// Posição do corpo: termina o último deslocamento (px, py → x, y) no ritmo de um tick, como os vivos.
function posicaoDoCorpo(animal, s, decorrido, destino = animal) {
  const f = suave(limitar(decorrido / (destino.passo || 350)));
  return {
    cx: (animal.px + (destino.x - animal.px) * f + 0.5) * s,
    cy: (animal.py + (destino.y - animal.py) * f + 0.5) * s,
  };
}

function desenharAnel(ctx, ef, s, p) {
  const cores = {
    come: '#62bf5a', preda: '#d94a3a', nasce: '#f2c94c', brota: '#3f9a4a',
    morre: '#555', murcha: '#b9a24a', ovo: '#fbf3df',
  };
  ctx.globalAlpha = 1 - p;
  ctx.strokeStyle = cores[ef.tipo];
  ctx.lineWidth = Math.max(1.5, s * 0.08);
  ctx.beginPath();
  ctx.arc((ef.x + 0.5) * s, (ef.y + 0.5) * s, s * (0.2 + p * 0.4), 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function desenharFantasminha(ctx, x, y, r, t) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = 'rgba(60, 70, 90, 0.35)';
  ctx.lineWidth = Math.max(1, r * 0.12);
  ctx.beginPath();
  ctx.arc(x, y, r, Math.PI, 0);
  const ondas = 3;
  const largura = (r * 2) / ondas;
  ctx.lineTo(x + r, y + r * 1.1);
  for (let i = 0; i < ondas; i++) {
    const x0 = x + r - largura * i;
    const balanco = Math.sin(t / 120 + i) * r * 0.15;
    ctx.quadraticCurveTo(x0 - largura / 2, y + r * 1.5 + balanco, x0 - largura, y + r * 1.1);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = CORES.contorno;
  elipse(ctx, x - r * 0.35, y - r * 0.05, r * 0.14, r * 0.2);
  ctx.fill();
  elipse(ctx, x + r * 0.35, y - r * 0.05, r * 0.14, r * 0.2);
  ctx.fill();
}

function desenharExclamacao(ctx, x, y, s, p) {
  const salto = Math.sin(limitar(p * 1.5) * Math.PI) * s * 0.08;
  ctx.save();
  ctx.globalAlpha = limitar(p * 4);
  ctx.fillStyle = '#d94a3a';
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = Math.max(1.5, s * 0.05);
  ctx.font = `bold ${Math.round(s * 0.42)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.strokeText('!', x, y - salto);
  ctx.fillText('!', x, y - salto);
  ctx.restore();
}

function desenharEstrela(ctx, x, y, r, rot, cor, miolo) {
  const pontas = 8;
  ctx.beginPath();
  for (let i = 0; i < pontas * 2; i++) {
    const raio = i % 2 ? r * 0.45 : r;
    const ang = (i / (pontas * 2)) * Math.PI * 2 + rot;
    ctx.lineTo(x + Math.cos(ang) * raio, y + Math.sin(ang) * raio);
  }
  ctx.closePath();
  ctx.fillStyle = cor;
  ctx.fill();
  ctx.fillStyle = miolo;
  elipse(ctx, x, y, r * 0.35, r * 0.35);
  ctx.fill();
}

// Fileira de dentes; sentido 1 = dentes apontando para baixo (arcada de cima), -1 = para cima.
function desenharDentes(ctx, x, y, largura, altura, sentido) {
  const n = 4;
  const w = largura / n;
  ctx.beginPath();
  ctx.moveTo(x - largura / 2, y);
  for (let i = 0; i < n; i++) {
    const x0 = x - largura / 2 + i * w;
    ctx.lineTo(x0 + w / 2, y + altura * sentido);
    ctx.lineTo(x0 + w, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#fffdf5';
  ctx.strokeStyle = CORES.contorno;
  ctx.lineWidth = Math.max(1, largura * 0.04);
  ctx.lineJoin = 'round';
  ctx.fill();
  ctx.stroke();
}
