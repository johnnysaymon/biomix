// Parâmetros do jogo. Todas as regras numéricas ficam aqui para facilitar o balanceamento.
export const CONFIG = {
  TAMANHOS_GRADE: [
    { nome: 'Pequena', lado: 8 },
    { nome: 'Média', lado: 12 },
    { nome: 'Grande', lado: 16 },
    { nome: 'Enorme', lado: 20 },
  ],
  TICKS_POR_DIA: 10,
  TICK_MS: 350,                 // duração de um tick na velocidade 1×
  VELOCIDADES: [1, 2, 4],
  VIZINHANCA: 8,                // 4 ou 8
  SEMENTE: { ALCANCE_MIN: 1, ALCANCE_MAX: 6 },
  VERDELIM: {
    TEMPO_CRESCIMENTO: 15,
    TEMPO_VIDA: 160,
    TEMPO_MURCHA: 20,
    NUTRICAO: { adulta: 1.0, murchando: 0.5, broto: 0.4 }, // fração da fome removida ao ser comida
  },
  PULIM: { LIMITE_FOME: 70, RECARGA_REPRODUCAO: 10, TICKS_PARA_CHOCAR: 10, TEMPO_MATURIDADE: 15 },
  RONDOR: {
    LIMITE_FOME: 110,
    RECARGA_REPRODUCAO: 35,
    TICKS_PARA_CHOCAR: 25,
    TEMPO_MATURIDADE: 40,
    // Fome mínima para caçar. 0 = sempre preda o Pulim que encontrar (regra atual).
    // Valores maiores (ex.: 40) deixam o Rondor saciado poupar presas e estabilizam muito o bioma.
    FOME_PARA_CACAR: 0,
  },
};
