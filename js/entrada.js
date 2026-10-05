// Toques e cliques na grade durante a montagem. Arrastar o dedo "pinta" várias células.
export function ligarEntrada(canvas, renderizador, obterLado, aoTocarCelula) {
  let ativo = false;
  let ultima = null;

  const celulaDoEvento = (ev) => {
    const r = canvas.getBoundingClientRect();
    return renderizador.celulaEm(ev.clientX - r.left, ev.clientY - r.top, obterLado());
  };

  const aplicar = (ev, inicio) => {
    const c = celulaDoEvento(ev);
    if (!c || (ultima && ultima.x === c.x && ultima.y === c.y)) return;
    ultima = c;
    aoTocarCelula(c.x, c.y, inicio);
  };

  canvas.addEventListener('pointerdown', (ev) => {
    if (ev.button !== 0) return;
    ativo = true;
    ultima = null;
    canvas.setPointerCapture(ev.pointerId);
    aplicar(ev, true);
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (ativo) aplicar(ev, false);
  });
  const parar = () => {
    ativo = false;
    ultima = null;
  };
  canvas.addEventListener('pointerup', parar);
  canvas.addEventListener('pointercancel', parar);
}
