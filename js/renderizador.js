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

  registrarEventos(eventos, agora) {
    for (const ev of eventos) {
      if (['come', 'preda', 'nasce', 'brota', 'morre', 'murcha', 'ovo'].includes(ev.tipo)) {
        this.efeitos.push({ ...ev, inicio: agora });
      }
    }
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
    const DURACAO = 700;
    const cores = {
      come: '#62bf5a', preda: '#d94a3a', nasce: '#f2c94c', brota: '#3f9a4a',
      morre: '#555', murcha: '#b9a24a', ovo: '#fbf3df',
    };
    this.efeitos = this.efeitos.filter((ef) => agora - ef.inicio < DURACAO);
    for (const ef of this.efeitos) {
      const p = (agora - ef.inicio) / DURACAO;
      ctx.globalAlpha = 1 - p;
      ctx.strokeStyle = cores[ef.tipo];
      ctx.lineWidth = Math.max(1.5, s * 0.08);
      ctx.beginPath();
      ctx.arc((ef.x + 0.5) * s, (ef.y + 0.5) * s, s * (0.2 + p * 0.4), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}
