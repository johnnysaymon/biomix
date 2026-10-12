// Regras do bioma. Não depende do navegador: pode ser testada com `node --test`.
import { CONFIG } from './config.js';
import { indice, vizinhos, agruparPorCelula } from './grade.js';
import {
  ESPECIE, ESPECIES, criarPlanta, criarAnimal, criarOvo, fasePlanta, ehAdulto, limiteFome, configAnimal,
} from './entidades.js';

export function criarEstado(lado, config = CONFIG) {
  return {
    lado,
    config,
    tick: 0,
    proximoId: 1,
    plantas: [],
    animais: [],
    ovos: [],
    picos: { verdelim: 0, pulim: 0, rondor: 0 },
    eventos: [],
    fim: false,
  };
}

export const diasSobrevividos = (estado) => Math.floor(estado.tick / estado.config.TICKS_POR_DIA);

// ---------- Montagem ----------

// Espécie do personagem que ocupa a célula (ou null se estiver vazia).
export function especieNaCelula(estado, x, y) {
  const naCelula = (e) => e.x === x && e.y === y;
  return (estado.plantas.find(naCelula) ?? estado.animais.find(naCelula) ?? estado.ovos.find(naCelula))?.especie ?? null;
}

// Coloca um personagem adulto na célula. Na montagem cada célula aceita no máximo um personagem.
export function adicionar(estado, especie, x, y) {
  if (especieNaCelula(estado, x, y)) return false;
  if (especie === ESPECIE.VERDELIM) estado.plantas.push(criarPlanta(estado, x, y, { adulta: true }));
  else estado.animais.push(criarAnimal(estado, especie, x, y, { adulto: true }));
  atualizarPicos(estado);
  return true;
}

export function removerEspecie(estado, especie, x, y) {
  const fica = (e) => e.especie !== especie || e.x !== x || e.y !== y;
  if (especie === ESPECIE.VERDELIM) estado.plantas = estado.plantas.filter(fica);
  else estado.animais = estado.animais.filter(fica);
}

export function limparCelula(estado, x, y) {
  const fora = (e) => e.x !== x || e.y !== y;
  const antes = estado.plantas.length + estado.animais.length + estado.ovos.length;
  estado.plantas = estado.plantas.filter(fora);
  estado.animais = estado.animais.filter(fora);
  estado.ovos = estado.ovos.filter(fora);
  return antes !== estado.plantas.length + estado.animais.length + estado.ovos.length;
}

// Coloca os personagens em células vazias sorteadas. Retorna quantos de cada espécie couberam.
export function distribuirAleatoriamente(estado, quantidades, rng) {
  const livres = [];
  for (let y = 0; y < estado.lado; y++) {
    for (let x = 0; x < estado.lado; x++) {
      if (!especieNaCelula(estado, x, y)) livres.push([x, y]);
    }
  }
  rng.embaralhar(livres);
  const pedidos = ESPECIES.flatMap((especie) => Array(Math.max(0, quantidades[especie] ?? 0)).fill(especie));
  rng.embaralhar(pedidos); // se faltar espaço, o corte fica proporcional entre as espécies
  const colocados = { verdelim: 0, pulim: 0, rondor: 0 };
  pedidos.slice(0, livres.length).forEach((especie, i) => {
    adicionar(estado, especie, livres[i][0], livres[i][1]);
    colocados[especie]++;
  });
  return colocados;
}

// Lista serializável da montagem, para salvar e repetir a partida.
export const exportarMontagem = (estado) => [
  ...estado.plantas.map((p) => [p.especie, p.x, p.y]),
  ...estado.animais.map((a) => [a.especie, a.x, a.y]),
];

export function importarMontagem(estado, itens) {
  for (const [especie, x, y] of itens) {
    if (ESPECIES.includes(especie) && x < estado.lado && y < estado.lado) adicionar(estado, especie, x, y);
  }
}

// ---------- Contagens ----------

export function contagem(estado) {
  const c = {
    verdelim: { total: 0, broto: 0, adulta: 0, murchando: 0 },
    pulim: { total: 0, adultos: 0, filhotes: 0, ovos: 0 },
    rondor: { total: 0, adultos: 0, filhotes: 0, ovos: 0, sementes: 0 },
  };
  for (const p of estado.plantas) {
    c.verdelim.total++;
    c.verdelim[fasePlanta(p, estado.config)]++;
  }
  for (const a of estado.animais) {
    const g = c[a.especie];
    g.total++;
    if (ehAdulto(a, estado.config)) g.adultos++;
    else g.filhotes++;
    if (a.semente) g.sementes++;
  }
  for (const o of estado.ovos) {
    c[o.especie].total++;
    c[o.especie].ovos++;
  }
  return c;
}

export const contarVivos = (estado) => estado.plantas.length + estado.animais.length + estado.ovos.length;

function atualizarPicos(estado) {
  const c = contagem(estado);
  for (const especie of ESPECIES) estado.picos[especie] = Math.max(estado.picos[especie], c[especie].total);
}

// ---------- Simulação ----------

// Dados de um animal que acabou de morrer, para a animação desenhar o corpo onde ele estava.
const retrato = (a, cfg) => ({ especie: a.especie, px: a.px, py: a.py, olhando: a.olhando, filhote: !ehAdulto(a, cfg) });

// Célula livre = sem planta e sem ovo (animais podem estar nela).
function celulaLivre(ocupadas, x, y, lado) {
  return !ocupadas.has(indice(x, y, lado));
}

function celulasOcupadas(estado) {
  const ocupadas = new Set();
  for (const p of estado.plantas) ocupadas.add(indice(p.x, p.y, estado.lado));
  for (const o of estado.ovos) ocupadas.add(indice(o.x, o.y, estado.lado));
  return ocupadas;
}

function vizinhaLivre(estado, ocupadas, x, y, rng) {
  const livres = vizinhos(x, y, estado.lado, estado.config.VIZINHANCA)
    .filter(([vx, vy]) => celulaLivre(ocupadas, vx, vy, estado.lado));
  return livres.length ? rng.escolher(livres) : null;
}

// Semente cai em (x, y); se ocupada, vai para uma vizinha livre; sem vizinha livre, se perde.
function plantarSemente(estado, ocupadas, x, y, rng) {
  let destino = celulaLivre(ocupadas, x, y, estado.lado) ? [x, y] : vizinhaLivre(estado, ocupadas, x, y, rng);
  if (!destino) {
    estado.eventos.push({ tipo: 'semente-perdida', x, y });
    return;
  }
  const [dx, dy] = destino;
  estado.plantas.push(criarPlanta(estado, dx, dy));
  ocupadas.add(indice(dx, dy, estado.lado));
  estado.eventos.push({ tipo: 'brota', x: dx, y: dy });
}

export function tick(estado, rng) {
  if (estado.fim) return estado;
  const cfg = estado.config;
  const lado = estado.lado;
  estado.tick++;
  estado.eventos = [];

  // 1. Envelhecer, aumentar fome, recargas e contagem dos ovos.
  for (const a of estado.animais) {
    a.px = a.x;
    a.py = a.y;
    a.idade++;
    a.fome++;
    if (a.recarga > 0) a.recarga--;
  }
  for (const o of estado.ovos) o.restante--;
  for (const p of estado.plantas) p.idade++;

  // 2. Mover (ordem aleatória). Ficar parado também é uma opção. Cada casa andada consome o alcance da semente.
  const ordem = rng.embaralhar([...estado.animais]);
  for (const a of ordem) {
    const [nx, ny] = rng.escolher([[a.x, a.y], ...vizinhos(a.x, a.y, lado, cfg.VIZINHANCA)]);
    if (nx !== a.x || ny !== a.y) {
      if (nx !== a.x) a.olhando = Math.sign(nx - a.x);
      a.x = nx;
      a.y = ny;
      if (a.semente) a.semente.restante--;
    }
  }

  const ocupadas = celulasOcupadas(estado);

  // 3. Plantar sementes cujo alcance terminou.
  for (const a of ordem) {
    if (a.semente && a.semente.restante <= 0) {
      a.semente = null;
      plantarSemente(estado, ocupadas, a.x, a.y, rng);
    }
  }

  // 4. Rondors pegam semente ao entrar numa célula com Verdelim adulta.
  const plantaEm = new Map(estado.plantas.map((p) => [indice(p.x, p.y, lado), p]));
  for (const a of ordem) {
    if (a.especie !== ESPECIE.RONDOR || a.semente) continue;
    if (a.x === a.px && a.y === a.py) continue; // só ao passar por uma planta, não parado
    const p = plantaEm.get(indice(a.x, a.y, lado));
    if (p && fasePlanta(p, cfg) === 'adulta') {
      a.semente = { restante: rng.inteiro(cfg.SEMENTE.ALCANCE_MIN, cfg.SEMENTE.ALCANCE_MAX) };
      estado.eventos.push({ tipo: 'pega-semente', x: a.x, y: a.y });
    }
  }

  const porCelula = agruparPorCelula(ordem, lado);

  // 5. Predação: cada Rondor com fome preda no máximo um Pulim da sua célula. Rondor saciado poupa a presa.
  for (const grupo of porCelula.values()) {
    const pulins = grupo.filter((a) => a.especie === ESPECIE.PULIM && !a.morto);
    if (!pulins.length) continue;
    for (const r of grupo) {
      if (r.especie !== ESPECIE.RONDOR || !pulins.length) continue;
      if (r.fome < cfg.RONDOR.FOME_PARA_COMER) continue;
      const presa = pulins.pop();
      presa.morto = 'predado';
      r.fome = 0;
      r.comeu = true;
      estado.eventos.push({ tipo: 'preda', x: r.x, y: r.y, presa: retrato(presa, cfg) });
    }
  }

  // 6. Alimentação: o Pulim mais faminto da célula come a planta, se estiver com fome. Brotos e plantas murchando
  //    alimentam menos.
  const plantasComidas = new Set();
  for (const [i, grupo] of porCelula) {
    const planta = plantaEm.get(i);
    if (!planta) continue;
    const pulins = grupo.filter((a) => a.especie === ESPECIE.PULIM && !a.morto);
    if (!pulins.length) continue;
    const comedor = pulins.reduce((m, a) => (a.fome > m.fome ? a : m));
    if (comedor.fome < cfg.PULIM.FOME_PARA_COMER) continue;
    const nutricao = cfg.VERDELIM.NUTRICAO[fasePlanta(planta, cfg)] ?? 0;
    comedor.fome = Math.round(comedor.fome * (1 - nutricao));
    comedor.comeu = true;
    plantasComidas.add(planta);
    ocupadas.delete(i);
    estado.eventos.push({ tipo: 'come', x: planta.x, y: planta.y });
  }
  if (plantasComidas.size) estado.plantas = estado.plantas.filter((p) => !plantasComidas.has(p));

  // 7. Reprodução: um par de adultos da mesma espécie, fora da recarga, põe um ovo na célula do encontro. A célula
  //    precisa estar livre (sem planta nem ovo), então sai no máximo um ovo por célula.
  for (const [i, grupo] of porCelula) {
    for (const especie of [ESPECIE.PULIM, ESPECIE.RONDOR]) {
      if (ocupadas.has(i)) break;
      const aptos = grupo.filter((a) => a.especie === especie && !a.morto && a.recarga === 0 && ehAdulto(a, cfg));
      if (aptos.length < 2) continue;
      const [pai, mae] = aptos;
      estado.ovos.push(criarOvo(estado, especie, pai.x, pai.y));
      ocupadas.add(i);
      pai.recarga = mae.recarga = configAnimal(cfg, especie).RECARGA_REPRODUCAO;
      estado.eventos.push({ tipo: 'ovo', x: pai.x, y: pai.y, especie });
    }
  }

  // 8. Chocar ovos prontos.
  const ovosRestantes = [];
  for (const o of estado.ovos) {
    if (o.restante <= 0) {
      estado.animais.push(criarAnimal(estado, o.especie, o.x, o.y));
      ocupadas.delete(indice(o.x, o.y, lado));
      estado.eventos.push({ tipo: 'nasce', x: o.x, y: o.y, especie: o.especie });
    } else {
      ovosRestantes.push(o);
    }
  }
  estado.ovos = ovosRestantes;

  // 9. Ciclo das plantas: as que passaram do tempo de murcha morrem. (A maturidade dos filhotes vem da idade.)
  estado.plantas = estado.plantas.filter((p) => {
    if (fasePlanta(p, cfg) !== 'morta') return true;
    ocupadas.delete(indice(p.x, p.y, lado));
    estado.eventos.push({ tipo: 'murcha', x: p.x, y: p.y });
    return false;
  });

  // 10. Mortes por fome (inclui o filhote que chegou à idade adulta sem ter comido). A semente de um Rondor que morre brota onde ele estava.
  for (const a of estado.animais) {
    if (a.morto || a.fome < limiteFome(a, cfg)) continue;
    a.morto = 'fome';
    estado.eventos.push({ tipo: 'morre', x: a.x, y: a.y, ...retrato(a, cfg) });
    if (a.semente) {
      a.semente = null;
      plantarSemente(estado, ocupadas, a.x, a.y, rng);
    }
  }
  estado.animais = estado.animais.filter((a) => !a.morto);

  // 11. Fim de jogo: só quando não sobra nenhum ser vivo.
  atualizarPicos(estado);
  if (contarVivos(estado) === 0) estado.fim = true;
  return estado;
}
