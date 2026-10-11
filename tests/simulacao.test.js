import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { criarRng } from '../js/rng.js';
import { criarPlanta, criarAnimal, criarOvo, fasePlanta } from '../js/entidades.js';
import {
  criarEstado, adicionar, limparCelula, especieNaCelula, tick, contagem, contarVivos, distribuirAleatoriamente,
  exportarMontagem, importarMontagem, diasSobrevividos,
} from '../js/simulacao.js';

// Configuração de teste: animais ficam parados (grade 1×1 ou vizinhança impossível) quando precisamos controlar encontros.
const cfg = (alteracoes = {}) => ({ ...structuredClone(CONFIG), ...alteracoes });

// RNG falso que sempre escolhe o primeiro elemento: com isso o animal "escolhe" ficar parado.
function rngParado(valor = 1) {
  const r = criarRng(1);
  r.escolher = (lista) => lista[0];
  r.embaralhar = (lista) => lista;
  r.inteiro = () => valor;
  return r;
}

const animal = (estado, especie, x, y, extra = {}) => {
  const a = Object.assign(criarAnimal(estado, especie, x, y, { adulto: true }), extra);
  estado.animais.push(a);
  return a;
};
const planta = (estado, x, y, idade) => {
  const p = criarPlanta(estado, x, y);
  p.idade = idade;
  estado.plantas.push(p);
  return p;
};

test('montagem aceita apenas um personagem por célula e começa com adultos', () => {
  const e = criarEstado(8);
  assert.equal(adicionar(e, 'pulim', 2, 2), true);
  assert.equal(adicionar(e, 'pulim', 2, 2), false);
  assert.equal(adicionar(e, 'rondor', 2, 2), false);
  assert.equal(adicionar(e, 'verdelim', 2, 2), false);
  assert.equal(especieNaCelula(e, 2, 2), 'pulim');
  assert.equal(adicionar(e, 'verdelim', 3, 2), true);
  assert.equal(adicionar(e, 'rondor', 4, 2), true);
  const c = contagem(e);
  assert.equal(c.pulim.adultos, 1);
  assert.equal(c.rondor.adultos, 1);
  assert.equal(c.verdelim.adulta, 1);
  assert.equal(limparCelula(e, 2, 2), true);
  assert.equal(especieNaCelula(e, 2, 2), null);
  assert.equal(contarVivos(e), 2);
});

test('distribuição aleatória usa só células vazias e exportar/importar recria a montagem', () => {
  const e = criarEstado(8);
  adicionar(e, 'pulim', 0, 0);
  const colocados = distribuirAleatoriamente(e, { verdelim: 10, pulim: 5, rondor: 2 }, criarRng(3));
  assert.deepEqual(colocados, { verdelim: 10, pulim: 5, rondor: 2 });
  const c = contagem(e);
  assert.deepEqual([c.verdelim.total, c.pulim.total, c.rondor.total], [10, 6, 2]);
  const ocupadas = new Set(exportarMontagem(e).map(([, x, y]) => `${x},${y}`));
  assert.equal(ocupadas.size, 18, 'nenhuma célula pode ter dois personagens');
  const copia = criarEstado(8);
  importarMontagem(copia, exportarMontagem(e));
  assert.deepEqual(exportarMontagem(copia), exportarMontagem(e));
});

test('distribuição aleatória para quando a grade enche', () => {
  const e = criarEstado(3);
  const colocados = distribuirAleatoriamente(e, { verdelim: 9, pulim: 9, rondor: 9 }, criarRng(5));
  assert.equal(colocados.verdelim + colocados.pulim + colocados.rondor, 9);
  assert.equal(contarVivos(e), 9);
});

test('importar montagem antiga com dois personagens na mesma célula mantém só o primeiro', () => {
  const e = criarEstado(4);
  importarMontagem(e, [['verdelim', 1, 1], ['pulim', 1, 1], ['rondor', 1, 1]]);
  assert.equal(contarVivos(e), 1);
  assert.equal(especieNaCelula(e, 1, 1), 'verdelim');
});

test('animais andam no máximo uma casa por tick e não saem da grade', () => {
  const e = criarEstado(5);
  const rng = criarRng(42);
  for (let i = 0; i < 6; i++) animal(e, 'rondor', i % 5, 0);
  for (let t = 0; t < 50; t++) {
    tick(e, rng);
    for (const a of e.animais) {
      assert.ok(Math.abs(a.x - a.px) <= 1 && Math.abs(a.y - a.py) <= 1);
      assert.ok(a.x >= 0 && a.y >= 0 && a.x < 5 && a.y < 5);
    }
  }
});

test('Rondor preda o Pulim na mesma célula e zera a fome', () => {
  const e = criarEstado(4);
  const r = animal(e, 'rondor', 1, 1, { fome: 30 });
  animal(e, 'pulim', 1, 1);
  tick(e, rngParado());
  assert.equal(e.animais.filter((a) => a.especie === 'pulim').length, 0);
  assert.equal(r.fome, 0);
});

test('com FOME_PARA_COMER, Rondor saciado não preda', () => {
  const c = cfg();
  c.RONDOR.FOME_PARA_COMER = 40;
  const e = criarEstado(4, c);
  animal(e, 'rondor', 1, 1, { fome: 5 });
  animal(e, 'pulim', 1, 1);
  tick(e, rngParado());
  assert.equal(e.animais.filter((a) => a.especie === 'pulim').length, 1);
});

test('com FOME_PARA_COMER, Pulim saciado não come a planta', () => {
  const c = cfg();
  c.PULIM.FOME_PARA_COMER = 20;
  const e = criarEstado(4, c);
  const p = animal(e, 'pulim', 0, 0, { fome: 5 });
  planta(e, 0, 0, CONFIG.VERDELIM.TEMPO_CRESCIMENTO + 5);
  tick(e, rngParado());
  assert.equal(e.plantas.length, 1);
  assert.equal(p.fome, 6);
});

test('Pulim come planta adulta e zera a fome; broto e murcha alimentam menos', () => {
  const { TEMPO_CRESCIMENTO, TEMPO_VIDA } = CONFIG.VERDELIM;
  const casos = [
    [TEMPO_CRESCIMENTO + 5, 0],                        // adulta: zera
    [0, Math.round(41 * (1 - 0.4))],                   // broto: remove 40%
    [TEMPO_CRESCIMENTO + TEMPO_VIDA + 1, Math.round(41 * 0.5)], // murchando: remove 50%
  ];
  for (const [idade, fomeEsperada] of casos) {
    const e = criarEstado(4);
    const p = animal(e, 'pulim', 0, 0, { fome: 40 }); // vira 41 no início do tick
    planta(e, 0, 0, idade);
    tick(e, rngParado());
    assert.equal(e.plantas.length, 0, `planta com idade ${idade} deveria ser comida`);
    assert.equal(p.fome, fomeEsperada);
  }
});

test('Pulim não pega semente; Rondor pega ao passar por planta adulta (sem comê-la)', () => {
  const e = criarEstado(3);
  planta(e, 1, 0, CONFIG.VERDELIM.TEMPO_CRESCIMENTO + 1);
  const r = animal(e, 'rondor', 0, 0);
  const p = animal(e, 'pulim', 2, 2);
  const rng = rngParado(3);
  // Força o Rondor a andar para (1,0), onde está a planta.
  rng.escolher = (lista) => lista.find(([x, y]) => x === 1 && y === 0) ?? lista[0];
  tick(e, rng);
  assert.deepEqual(r.semente, { restante: 3 });
  assert.equal(p.semente, null);
  assert.equal(e.plantas.length, 1);
});

test('semente brota ao completar o alcance; em célula ocupada vai para a vizinha livre', () => {
  const e = criarEstado(3);
  const r = animal(e, 'rondor', 0, 0, { semente: { restante: 1 } });
  planta(e, 1, 0, 0); // célula de destino já tem planta (broto)
  const rng = rngParado();
  rng.escolher = (lista) => lista.find(([x, y]) => x === 1 && y === 0) ?? lista[0];
  tick(e, rng);
  assert.equal(r.semente, null);
  assert.equal(e.plantas.length, 2);
  const nova = e.plantas.find((p) => !(p.x === 1 && p.y === 0));
  assert.ok(Math.abs(nova.x - 1) <= 1 && Math.abs(nova.y - 0) <= 1);
  assert.equal(fasePlanta(nova, CONFIG), 'broto');
});

test('Rondor que morre de fome com semente faz ela brotar onde morreu', () => {
  const e = criarEstado(3);
  animal(e, 'rondor', 2, 2, { fome: CONFIG.RONDOR.LIMITE_FOME - 1, semente: { restante: 5 } });
  tick(e, rngParado());
  assert.equal(e.animais.length, 0);
  assert.equal(e.plantas.length, 1);
  assert.deepEqual([e.plantas[0].x, e.plantas[0].y], [2, 2]);
});

test('adultos da mesma espécie geram ovo em vizinha livre e entram em recarga; filhotes não se reproduzem', () => {
  const e = criarEstado(3);
  const a = animal(e, 'pulim', 1, 1);
  const b = animal(e, 'pulim', 1, 1);
  animal(e, 'rondor', 0, 0, { idade: 0 });
  animal(e, 'rondor', 0, 0, { idade: 0 });
  tick(e, rngParado());
  assert.equal(e.ovos.length, 1);
  assert.equal(e.ovos[0].especie, 'pulim');
  assert.notDeepEqual([e.ovos[0].x, e.ovos[0].y], [1, 1]);
  assert.equal(a.recarga, CONFIG.PULIM.RECARGA_REPRODUCAO);
  assert.equal(b.recarga, CONFIG.PULIM.RECARGA_REPRODUCAO);
});

test('ovo não é comido e choca um filhote após o tempo definido', () => {
  const e = criarEstado(3);
  e.ovos.push(criarOvo(e, 'pulim', 1, 1));
  animal(e, 'rondor', 1, 1);
  const rng = rngParado();
  for (let i = 0; i < CONFIG.PULIM.TICKS_PARA_CHOCAR - 1; i++) tick(e, rng);
  assert.equal(e.ovos.length, 1);
  tick(e, rng);
  assert.equal(e.ovos.length, 0);
  const filhote = e.animais.find((a) => a.especie === 'pulim');
  assert.ok(filhote, 'o filhote deveria ter nascido');
  assert.equal(filhote.idade, 0);
});

test('planta murcha e morre após o tempo de vida', () => {
  const e = criarEstado(3);
  const { TEMPO_CRESCIMENTO, TEMPO_VIDA, TEMPO_MURCHA } = CONFIG.VERDELIM;
  planta(e, 0, 0, TEMPO_CRESCIMENTO + TEMPO_VIDA + TEMPO_MURCHA - 2);
  tick(e, rngParado());
  assert.equal(fasePlanta(e.plantas[0], CONFIG), 'murchando');
  tick(e, rngParado());
  assert.equal(e.plantas.length, 0);
});

test('animal sem comer morre ao atingir o limite de fome', () => {
  const e = criarEstado(3);
  animal(e, 'pulim', 0, 0, { fome: CONFIG.PULIM.LIMITE_FOME - 2 });
  tick(e, rngParado());
  assert.equal(e.animais.length, 1);
  tick(e, rngParado());
  assert.equal(e.animais.length, 0);
});

test('o jogo só termina quando não sobra nenhum ser vivo e conta os dias', () => {
  const e = criarEstado(3);
  planta(e, 0, 0, 0);
  const rng = criarRng(9);
  const { TEMPO_CRESCIMENTO, TEMPO_VIDA, TEMPO_MURCHA } = CONFIG.VERDELIM;
  const vida = TEMPO_CRESCIMENTO + TEMPO_VIDA + TEMPO_MURCHA;
  for (let i = 0; i < vida - 1; i++) tick(e, rng);
  assert.equal(e.fim, false);
  tick(e, rng);
  assert.equal(e.fim, true);
  assert.equal(diasSobrevividos(e), Math.floor(vida / CONFIG.TICKS_POR_DIA));
});

test('a mesma semente gera a mesma partida', () => {
  const rodar = () => {
    const rng = criarRng(123);
    const e = criarEstado(10);
    distribuirAleatoriamente(e, { verdelim: 30, pulim: 10, rondor: 3 }, rng);
    while (!e.fim && e.tick < 3000) tick(e, rng);
    return [e.tick, contarVivos(e), e.picos];
  };
  assert.deepEqual(rodar(), rodar());
});

test('filhote que não come até a idade adulta morre de fome; o que comeu vira adulto', () => {
  const { TEMPO_MATURIDADE } = CONFIG.PULIM;
  const e = criarEstado(3);
  const faminto = animal(e, 'pulim', 0, 0, { idade: TEMPO_MATURIDADE - 2, fome: TEMPO_MATURIDADE - 2, comeu: false });
  const alimentado = animal(e, 'pulim', 2, 2, { idade: TEMPO_MATURIDADE - 2, fome: 0, comeu: false });
  planta(e, 2, 2, CONFIG.VERDELIM.TEMPO_CRESCIMENTO);
  tick(e, rngParado());
  assert.equal(alimentado.comeu, true);
  assert.deepEqual(e.animais, [faminto, alimentado]);
  tick(e, rngParado());
  assert.equal(faminto.morto, 'fome');
  assert.deepEqual(e.animais, [alimentado]);
  assert.equal(contagem(e).pulim.adultos, 1);
});

test('filhote que chega à idade adulta sem comer não se reproduz antes de morrer', () => {
  const { TEMPO_MATURIDADE } = CONFIG.RONDOR;
  const e = criarEstado(3);
  animal(e, 'rondor', 1, 1, { idade: TEMPO_MATURIDADE - 1, fome: TEMPO_MATURIDADE - 1, comeu: false });
  animal(e, 'rondor', 1, 1, { idade: TEMPO_MATURIDADE - 1, fome: TEMPO_MATURIDADE - 1, comeu: false });
  tick(e, rngParado());
  assert.equal(e.ovos.length, 0);
  assert.equal(e.animais.length, 0);
});

test('só uma espécie de animal, sem comida, não se mantém para sempre', () => {
  for (const especie of ['pulim', 'rondor']) {
    const rng = criarRng(5);
    const e = criarEstado(12);
    distribuirAleatoriamente(e, { [especie]: 20 }, rng);
    while (!e.fim && e.tick < 5000) tick(e, rng);
    assert.equal(e.fim, true, `${especie} sozinho deveria se extinguir`);
  }
});
