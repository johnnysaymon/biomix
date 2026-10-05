// Recordes e última montagem por tamanho de grade, no localStorage do navegador.
const CHAVE = 'biomix:v1';

function ler() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE)) ?? {};
  } catch {
    return {};
  }
}

function gravar(dados) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(dados));
  } catch {
    // Sem armazenamento disponível (modo privado, cota cheia): o jogo segue sem salvar.
  }
}

export const recorde = (lado) => ler().recordes?.[lado] ?? 0;

// Salva o recorde se for maior que o atual. Retorna true se for um novo recorde.
export function registrarResultado(lado, dias) {
  const dados = ler();
  dados.recordes ??= {};
  if (dias <= (dados.recordes[lado] ?? 0)) return false;
  dados.recordes[lado] = dias;
  gravar(dados);
  return true;
}

export const ultimaMontagem = (lado) => ler().montagens?.[lado] ?? null;

export function salvarMontagem(lado, itens) {
  const dados = ler();
  dados.montagens ??= {};
  dados.montagens[lado] = itens;
  gravar(dados);
}
