# Instruções para o Claude

## Versão do jogo (obrigatório a cada alteração)

O site é publicado pelo GitHub Pages, que deixa o navegador guardar os arquivos em cache. Para cada publicação
chegar logo aos jogadores, a versão entra na URL de todos os arquivos (`?v=`).

**Em toda solicitação que altere o jogo** (`index.html`, `css/` ou `js/`), antes do commit:

1. Aumente `VERSAO` no `<script>` do `<head>` do `index.html`, no formato `MAIOR.MENOR.CORRECAO`:
   - **CORRECAO** (1.0.0 → 1.0.1): correção de erro, ajuste visual pequeno, mudança de valor no `config.js`;
   - **MENOR** (1.0.1 → 1.1.0): função nova ou mudança de regra do jogo;
   - **MAIOR** (1.1.0 → 2.0.0): mudança grande que quebra recordes ou montagens salvas.
2. Se criar, renomear ou apagar um arquivo em `js/`, atualize a lista `MODULOS` no mesmo `<script>`.
   O teste `tests/versao.test.js` falha se a lista não bater com a pasta.
3. Cite a nova versão na resposta ao usuário: ela aparece na tela inicial ("versão X.Y.Z"), o que permite
   conferir se o navegador já carregou a publicação nova.

Alterações só em documentação (`*.md`) ou em testes não mudam a versão.

## Outras convenções

- Rode `npm test` antes de cada commit.
- Commits vão direto para a `main` (o GitHub Pages publica a partir dela).
- Regras e parâmetros do jogo estão documentados em `PLANO.md` e `js/config.js`.
