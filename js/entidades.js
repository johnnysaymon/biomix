// Dados e fábricas dos personagens. As entidades são objetos simples (serializáveis).
export const ESPECIE = Object.freeze({ VERDELIM: 'verdelim', PULIM: 'pulim', RONDOR: 'rondor' });

export const ESPECIES = [ESPECIE.VERDELIM, ESPECIE.PULIM, ESPECIE.RONDOR];

export const NOMES = Object.freeze({ verdelim: 'Verdelim', pulim: 'Pulim', rondor: 'Rondor' });

const configAnimal = (config, especie) => (especie === ESPECIE.PULIM ? config.PULIM : config.RONDOR);

export function criarPlanta(estado, x, y, { adulta = false } = {}) {
  return {
    id: estado.proximoId++,
    especie: ESPECIE.VERDELIM,
    x,
    y,
    idade: adulta ? estado.config.VERDELIM.TEMPO_CRESCIMENTO : 0,
  };
}

export function criarAnimal(estado, especie, x, y, { adulto = false } = {}) {
  return {
    id: estado.proximoId++,
    especie,
    x,
    y,
    px: x, // posição anterior (para animar o movimento)
    py: y,
    olhando: 1,
    idade: adulto ? configAnimal(estado.config, especie).TEMPO_MATURIDADE : 0,
    fome: 0,
    recarga: 0,
    semente: null, // { restante } — apenas Rondor
    morto: null,
  };
}

export function criarOvo(estado, especie, x, y) {
  const restante = configAnimal(estado.config, especie).TICKS_PARA_CHOCAR;
  return { id: estado.proximoId++, especie, x, y, restante, total: restante };
}

export function fasePlanta(planta, config) {
  const { TEMPO_CRESCIMENTO, TEMPO_VIDA, TEMPO_MURCHA } = config.VERDELIM;
  if (planta.idade < TEMPO_CRESCIMENTO) return 'broto';
  if (planta.idade < TEMPO_CRESCIMENTO + TEMPO_VIDA) return 'adulta';
  if (planta.idade < TEMPO_CRESCIMENTO + TEMPO_VIDA + TEMPO_MURCHA) return 'murchando';
  return 'morta';
}

export const ehAdulto = (animal, config) => animal.idade >= configAnimal(config, animal.especie).TEMPO_MATURIDADE;

export const limiteFome = (animal, config) => configAnimal(config, animal.especie).LIMITE_FOME;

export { configAnimal };
