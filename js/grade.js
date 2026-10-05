// Utilitários da matriz quadrada: índices, limites e vizinhança.
const DIRECOES_4 = [[0, -1], [-1, 0], [1, 0], [0, 1]];
const DIRECOES_8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

export const indice = (x, y, lado) => y * lado + x;

export const dentro = (x, y, lado) => x >= 0 && y >= 0 && x < lado && y < lado;

export function vizinhos(x, y, lado, vizinhanca = 8) {
  const direcoes = vizinhanca === 4 ? DIRECOES_4 : DIRECOES_8;
  const resultado = [];
  for (const [dx, dy] of direcoes) {
    const nx = x + dx;
    const ny = y + dy;
    if (dentro(nx, ny, lado)) resultado.push([nx, ny]);
  }
  return resultado;
}

// Agrupa entidades por célula: Map<indice, entidade[]>.
export function agruparPorCelula(entidades, lado) {
  const mapa = new Map();
  for (const e of entidades) {
    const i = indice(e.x, e.y, lado);
    const lista = mapa.get(i);
    if (lista) lista.push(e);
    else mapa.set(i, [e]);
  }
  return mapa;
}
