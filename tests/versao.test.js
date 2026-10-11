import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

// A lista MODULOS do index.html define quais arquivos recebem ?v=VERSAO. Um módulo fora dela ficaria preso no cache.
test('MODULOS do index.html lista todos os arquivos de js/', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const lista = html.match(/const MODULOS = \[([^\]]*)\]/)[1];
  const modulos = [...lista.matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();
  const arquivos = readdirSync(new URL('../js/', import.meta.url))
    .filter((f) => f.endsWith('.js'))
    .map((f) => f.slice(0, -3))
    .sort();
  assert.deepEqual(modulos, arquivos);
});

test('VERSAO do index.html segue o formato MAIOR.MENOR.CORRECAO', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /const VERSAO = '\d+\.\d+\.\d+';/);
});
