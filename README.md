# Biomix

Jogo web de sobrevivência de um bioma, feito apenas com **HTML, CSS e JavaScript** (sem frameworks e sem build), pensado primeiro para celular.

Monte uma grade com três espécies fictícias e veja quantos dias o bioma sobrevive:

- **Verdelim**: a planta. Não anda e não se reproduz sozinha; brota das sementes que o Rondor espalha. Murcha e morre com o tempo.
- **Pulim**: a presa (lembra um coelho). Come Verdelins; brotos e plantas murchas alimentam menos.
- **Rondor**: o predador (lembra uma raposa). Caça Pulins e carrega sementes de Verdelim por 1 a 6 casas.

Regras completas e roteiro em [`PLANO.md`](PLANO.md).

## Como rodar

Os módulos JavaScript precisam ser servidos por HTTP (abrir o `index.html` direto do disco não funciona):

```sh
python3 -m http.server 8000
# abra http://localhost:8000 (no celular, use o IP do computador na mesma rede)
```

## Testes das regras

```sh
npm test   # usa o executor de testes nativo do Node (node --test), sem dependências
```

## Estrutura

| Arquivo | Papel |
|---|---|
| `js/config.js` | todos os parâmetros numéricos (balanceamento) |
| `js/simulacao.js` | regras do bioma, ordem de cada tick (independe do navegador) |
| `js/entidades.js` | dados e fábricas dos personagens |
| `js/grade.js`, `js/rng.js` | vizinhança da matriz e gerador aleatório com semente |
| `js/renderizador.js` | desenho no canvas (personagens originais desenhados com formas) |
| `js/entrada.js` | toque/arraste na grade |
| `js/armazenamento.js` | recordes e última montagem no `localStorage` |
| `js/main.js` | telas, controles e laço principal |
