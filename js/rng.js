// Gerador aleatório com semente (mulberry32): permite reproduzir partidas e testar de forma determinística.
export function criarRng(semente = Math.floor(Math.random() * 2 ** 32)) {
  let a = semente >>> 0;

  const rng = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  rng.semente = semente >>> 0;
  rng.inteiro = (min, max) => min + Math.floor(rng() * (max - min + 1));
  rng.escolher = (lista) => lista[Math.floor(rng() * lista.length)];
  rng.embaralhar = (lista) => {
    for (let i = lista.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [lista[i], lista[j]] = [lista[j], lista[i]];
    }
    return lista;
  };

  return rng;
}
