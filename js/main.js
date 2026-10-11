// Inicialização e máquina de estados: início → montagem → jogando ⇄ pausado → fim.
import { CONFIG } from './config.js';
import { criarRng } from './rng.js';
import { ESPECIES } from './entidades.js';
import {
  criarEstado, adicionar, removerEspecie, limparCelula, especieNaCelula, distribuirAleatoriamente,
  exportarMontagem, importarMontagem, contagem, contarVivos, diasSobrevividos, tick,
} from './simulacao.js';
import { Renderizador, desenharIcone } from './renderizador.js';
import { ligarEntrada } from './entrada.js';
import * as armazenamento from './armazenamento.js';

const $ = (seletor) => document.querySelector(seletor);

const ui = {
  telaInicio: $('#tela-inicio'),
  telaJogo: $('#tela-jogo'),
  tamanhos: $('#tamanhos'),
  canvas: $('#grade'),
  areaGrade: $('#area-grade'),
  dias: $('#contador-dias'),
  detalhe: $('#detalhe-populacao'),
  barraMontagem: $('#barra-montagem'),
  barraJogo: $('#barra-jogo'),
  btnIniciar: $('#btn-iniciar'),
  btnPausa: $('#btn-pausa'),
  btnVelocidade: $('#btn-velocidade'),
  dlgAleatorio: $('#dlg-aleatorio'),
  dlgFim: $('#dlg-fim'),
};

const jogo = {
  modo: 'inicio', // inicio | montagem | jogando | pausado | fim
  lado: 12,
  estado: null,
  rng: criarRng(),
  montagem: [],
  ferramenta: 'verdelim',
  aviso: '',
  acaoGesto: 'adicionar',
  velocidade: 0,
  acumulado: 0,
  ultimoQuadro: 0,
};

const renderizador = new Renderizador(ui.canvas);

// ---------- Telas ----------

function mostrarTela(tela) {
  ui.telaInicio.classList.toggle('ativa', tela === 'inicio');
  ui.telaJogo.classList.toggle('ativa', tela === 'jogo');
}

function montarTelaInicio() {
  ui.tamanhos.replaceChildren();
  for (const { nome, lado } of CONFIG.TAMANHOS_GRADE) {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'tamanho';
    const melhor = armazenamento.recorde(lado);
    botao.innerHTML = `<strong>${nome}</strong><span class="dimensao">${lado} × ${lado}</span>`
      + (melhor ? `<span class="recorde-tamanho">Recorde: ${melhor} ${melhor === 1 ? 'dia' : 'dias'}</span>` : '');
    botao.addEventListener('click', () => abrirMontagem(lado));
    ui.tamanhos.append(botao);
  }
}

function irParaInicio() {
  jogo.modo = 'inicio';
  montarTelaInicio();
  mostrarTela('inicio');
}

// ---------- Montagem ----------

function abrirMontagem(lado, itens = armazenamento.ultimaMontagem(lado) ?? []) {
  jogo.lado = lado;
  jogo.estado = criarEstado(lado);
  importarMontagem(jogo.estado, itens);
  jogo.aviso = '';
  definirModo('montagem');
  mostrarTela('jogo');
  ajustarTamanho();
}

function definirModo(modo) {
  jogo.modo = modo;
  const emJogo = modo === 'jogando' || modo === 'pausado';
  ui.barraMontagem.hidden = emJogo;
  ui.barraJogo.hidden = !emJogo;
  ui.btnPausa.textContent = modo === 'pausado' ? 'Continuar' : 'Pausar';
  ui.canvas.style.cursor = modo === 'montagem' ? 'crosshair' : 'default';
  atualizarHud();
}

function selecionarFerramenta(nome) {
  jogo.ferramenta = nome;
  for (const b of document.querySelectorAll('.ferramenta')) {
    const ativa = b.dataset.ferramenta === nome;
    b.classList.toggle('ativa', ativa);
    b.setAttribute('aria-checked', String(ativa));
  }
}

// Cada célula tem no máximo um personagem. Tocar numa célula vazia adiciona; tocar onde já está a espécie
// selecionada remove; tocar sobre outra espécie a substitui. Arrastar repete a ação do primeiro toque,
// mas ao adicionar só preenche células vazias (não apaga o que já foi colocado).
function aoTocarCelula(x, y, inicioDoGesto) {
  if (jogo.modo !== 'montagem') return;
  const { estado, ferramenta } = jogo;
  jogo.aviso = '';
  if (ferramenta === 'borracha') {
    limparCelula(estado, x, y);
  } else {
    const atual = especieNaCelula(estado, x, y);
    if (inicioDoGesto) {
      jogo.acaoGesto = atual === ferramenta ? 'remover' : 'adicionar';
      if (atual && atual !== ferramenta) limparCelula(estado, x, y);
    }
    if (jogo.acaoGesto === 'remover') removerEspecie(estado, ferramenta, x, y);
    else adicionar(estado, ferramenta, x, y);
  }
  atualizarHud();
}

function iniciarPartida() {
  if (contarVivos(jogo.estado) === 0) return;
  jogo.montagem = exportarMontagem(jogo.estado);
  armazenamento.salvarMontagem(jogo.lado, jogo.montagem);
  // Recria o estado a partir da montagem para começar sempre do tick zero, com picos zerados.
  jogo.estado = criarEstado(jogo.lado);
  importarMontagem(jogo.estado, jogo.montagem);
  jogo.rng = criarRng();
  jogo.acumulado = 0;
  // Toda partida nova começa em 1×, independentemente da velocidade da anterior.
  jogo.velocidade = 0;
  ui.btnVelocidade.textContent = `${CONFIG.VELOCIDADES[jogo.velocidade]}×`;
  definirModo('jogando');
}

// ---------- Simulação ----------

function avancar(dt) {
  if (jogo.modo !== 'jogando') return;
  const msPorTick = CONFIG.TICK_MS / CONFIG.VELOCIDADES[jogo.velocidade];
  jogo.acumulado += dt;
  let passos = 0;
  while (jogo.acumulado >= msPorTick && passos < 8) {
    tick(jogo.estado, jogo.rng);
    renderizador.registrarEventos(jogo.estado.eventos, performance.now());
    jogo.acumulado -= msPorTick;
    passos++;
    if (jogo.estado.fim) {
      terminarPartida();
      return;
    }
  }
  if (passos) atualizarHud();
}

function terminarPartida() {
  definirModo('fim');
  const dias = diasSobrevividos(jogo.estado);
  const anterior = armazenamento.recorde(jogo.lado);
  const novo = armazenamento.registrarResultado(jogo.lado, dias);
  $('#fim-dias').textContent = dias;
  $('#fim-dias-rotulo').textContent = dias === 1 ? 'dia de vida' : 'dias de vida';
  $('#fim-recorde').textContent = novo
    ? (anterior ? `Novo recorde! (antes: ${anterior})` : 'Primeiro recorde neste tamanho!')
    : `Recorde: ${anterior} ${anterior === 1 ? 'dia' : 'dias'}`;
  for (const especie of ESPECIES) $(`#pico-${especie}`).textContent = jogo.estado.picos[especie];
  ui.dlgFim.showModal();
}

// ---------- HUD ----------

function atualizarHud() {
  if (!jogo.estado) return;
  const c = contagem(jogo.estado);
  ui.dias.textContent = diasSobrevividos(jogo.estado);
  for (const especie of ESPECIES) $(`#pop-${especie}`).textContent = c[especie].total;
  if (jogo.modo === 'montagem') {
    ui.detalhe.textContent = jogo.aviso || 'Um por célula · toque para colocar ou tirar · arraste para pintar';
  } else {
    const partes = [];
    if (c.verdelim.broto) partes.push(`${c.verdelim.broto} brotos`);
    if (c.verdelim.murchando) partes.push(`${c.verdelim.murchando} murchando`);
    const ovos = c.pulim.ovos + c.rondor.ovos;
    if (ovos) partes.push(`${ovos} ovos`);
    const filhotes = c.pulim.filhotes + c.rondor.filhotes;
    if (filhotes) partes.push(`${filhotes} filhotes`);
    if (c.rondor.sementes) partes.push(`${c.rondor.sementes} sementes`);
    ui.detalhe.textContent = partes.join(' · ');
  }
  ui.btnIniciar.disabled = contarVivos(jogo.estado) === 0;
}

// ---------- Layout e laço principal ----------

function ajustarTamanho() {
  if (jogo.modo === 'inicio') return;
  const estilo = getComputedStyle(ui.areaGrade);
  const largura = ui.areaGrade.clientWidth - parseFloat(estilo.paddingLeft) - parseFloat(estilo.paddingRight);
  const altura = ui.areaGrade.clientHeight - parseFloat(estilo.paddingTop) - parseFloat(estilo.paddingBottom);
  const tamanho = Math.max(120, Math.floor(Math.min(largura, altura) / jogo.lado) * jogo.lado);
  renderizador.redimensionar(tamanho);
}

function quadro(agora) {
  const dt = Math.min(250, agora - (jogo.ultimoQuadro || agora));
  jogo.ultimoQuadro = agora;
  avancar(dt);
  if (jogo.estado && jogo.modo !== 'inicio') {
    const msPorTick = CONFIG.TICK_MS / CONFIG.VELOCIDADES[jogo.velocidade];
    const alpha = jogo.modo === 'jogando' ? jogo.acumulado / msPorTick : 1;
    renderizador.desenhar(jogo.estado, alpha, agora);
  }
  requestAnimationFrame(quadro);
}

// ---------- Eventos ----------

function ligarEventos() {
  for (const b of document.querySelectorAll('.ferramenta')) {
    b.addEventListener('click', () => selecionarFerramenta(b.dataset.ferramenta));
  }
  ligarEntrada(ui.canvas, renderizador, () => jogo.lado, aoTocarCelula);

  $('#btn-voltar').addEventListener('click', () => {
    const emAndamento = jogo.modo === 'jogando' || jogo.modo === 'pausado';
    if (emAndamento && !confirm('Sair da partida atual?')) return;
    irParaInicio();
  });

  $('#btn-limpar').addEventListener('click', () => {
    if (contarVivos(jogo.estado) && confirm('Limpar todo o bioma?')) {
      jogo.estado = criarEstado(jogo.lado);
      atualizarHud();
    }
  });

  $('#btn-aleatorio').addEventListener('click', () => {
    // Sugestão proporcional às células ainda vazias (cada célula aceita um personagem).
    const livres = jogo.lado * jogo.lado - contarVivos(jogo.estado);
    const form = ui.dlgAleatorio.querySelector('form');
    form.verdelim.value = Math.round(livres * 0.3);
    form.pulim.value = Math.round(livres * 0.1);
    form.rondor.value = Math.min(livres, Math.max(2, Math.round(livres * 0.03)));
    for (const input of form.querySelectorAll('input')) input.max = livres;
    ui.dlgAleatorio.showModal();
  });
  ui.dlgAleatorio.addEventListener('close', () => {
    if (ui.dlgAleatorio.returnValue !== 'ok') return;
    const form = ui.dlgAleatorio.querySelector('form');
    const quantidades = Object.fromEntries(ESPECIES.map((e) => [e, Math.max(0, parseInt(form[e].value, 10) || 0)]));
    const colocados = distribuirAleatoriamente(jogo.estado, quantidades, criarRng());
    const pedido = ESPECIES.reduce((t, e) => t + quantidades[e], 0);
    const total = ESPECIES.reduce((t, e) => t + colocados[e], 0);
    jogo.aviso = total < pedido ? `Só couberam ${total} de ${pedido}: cada célula aceita um personagem.` : '';
    atualizarHud();
  });

  ui.btnIniciar.addEventListener('click', iniciarPartida);

  ui.btnPausa.addEventListener('click', () => {
    definirModo(jogo.modo === 'pausado' ? 'jogando' : 'pausado');
  });
  ui.btnVelocidade.addEventListener('click', () => {
    jogo.velocidade = (jogo.velocidade + 1) % CONFIG.VELOCIDADES.length;
    ui.btnVelocidade.textContent = `${CONFIG.VELOCIDADES[jogo.velocidade]}×`;
  });
  $('#btn-encerrar').addEventListener('click', () => {
    if (confirm('Encerrar a partida e voltar para a montagem?')) abrirMontagem(jogo.lado, jogo.montagem);
  });

  $('#btn-repetir').addEventListener('click', () => {
    ui.dlgFim.close();
    abrirMontagem(jogo.lado, jogo.montagem);
    iniciarPartida();
  });
  $('#btn-editar').addEventListener('click', () => {
    ui.dlgFim.close();
    abrirMontagem(jogo.lado, jogo.montagem);
  });
  $('#btn-menu').addEventListener('click', () => {
    ui.dlgFim.close();
    irParaInicio();
  });
  // Esc no diálogo de fim volta para a montagem em vez de deixar o jogo parado.
  ui.dlgFim.addEventListener('cancel', (ev) => {
    ev.preventDefault();
    ui.dlgFim.close();
    abrirMontagem(jogo.lado, jogo.montagem);
  });

  new ResizeObserver(ajustarTamanho).observe(ui.areaGrade);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && jogo.modo === 'jogando') definirModo('pausado');
  });
}

function desenharIcones() {
  for (const c of document.querySelectorAll('canvas[data-icone]')) desenharIcone(c, c.dataset.icone);
}

$('#versao').textContent = `versão ${document.documentElement.dataset.versao}`;
ligarEventos();
irParaInicio();
desenharIcones();
requestAnimationFrame(quadro);
