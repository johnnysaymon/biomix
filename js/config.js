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
  // Fome mínima para um animal comer (Pulim come Verdelim, Rondor preda Pulim). Abaixo dela o animal está
  // saciado e ignora a comida da célula. 0 = come sempre que encontra comida (regra atual).
  // Valores como Pulim 20 e Rondor 40 estabilizam muito o bioma.
  PULIM: { LIMITE_FOME: 70, RECARGA_REPRODUCAO: 10, TICKS_PARA_CHOCAR: 10, TEMPO_MATURIDADE: 15, FOME_PARA_COMER: 0 },
  RONDOR: {
    LIMITE_FOME: 110,
    RECARGA_REPRODUCAO: 35,
    TICKS_PARA_CHOCAR: 25,
    TEMPO_MATURIDADE: 40,
    FOME_PARA_COMER: 0,
  },
};
