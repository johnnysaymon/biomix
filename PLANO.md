# Biomix — Plano de Desenvolvimento

Jogo web de sobrevivência de um bioma, feito **apenas com HTML, CSS e JavaScript** (sem frameworks, sem etapa de build), **mobile first**.
O objetivo do jogador é montar um ecossistema equilibrado e fazer o bioma sobreviver o **maior número de dias** possível.

---

## 1. Conceito

- Uma **área quadrada** (matriz N×N) representa o bioma. O jogador escolhe o tamanho entre opções pré-definidas.
- O jogador escolhe **quantos** personagens de cada espécie colocar (sem limite) e **em quais células**.
- Ao tocar em **Iniciar**, a simulação roda sozinha: os animais se movem aleatoriamente, comem, espalham sementes, se reproduzem (ovos), crescem e morrem; as plantas brotam, envelhecem e murcham.
- Um contador mostra **quantos dias** o bioma sobreviveu. Quando não sobra **nenhum ser vivo**, o jogo termina e o recorde é salvo.

## 2. Personagens (fictícios, com referência indireta)

| Papel | Nome provisório | Inspiração indireta | Visual sugerido |
|---|---|---|---|
| Planta (produtor) | **Verdelim** | plantinha / broto | broto arredondado, 2–3 folhas, carinha simples |
| Presa (herbívoro) | **Pulim** | coelho | corpo oval, orelhas longas curvadas, pés grandes, cor creme/lilás |
| Predador (carnívoro) | **Rondor** | raposa | corpo esguio, cauda volumosa, orelhas pontudas, cor laranja-ferrugem/azulada |

- Arte própria desenhada em **SVG inline** ou desenhada no **Canvas** (sem imagens de terceiros), garantindo que os personagens sejam originais.
- Estados visuais:
  - **Verdelim**: broto → adulta → murchando (folhas caídas, cor amarelada) → morta.
  - **Pulim / Rondor**: ovo → filhote (menor, traço mais arredondado) → adulto; indicador de fome (cor esmaecida); indicador de **semente carregada** (pontinho verde no corpo).

## 3. Regras do jogo

### 3.1 Tempo
- A simulação avança em **ticks** (turnos).
- **1 dia = `TICKS_POR_DIA` ticks** (ex.: 10). O contador de dias é o placar.
- Velocidade ajustável (1×, 2×, 4×) e botão de pausa.

### 3.2 Movimento
- A cada tick, cada **Pulim** e **Rondor** (filhotes e adultos) se move para uma célula vizinha aleatória (vizinhança de 4 ou 8 direções — configurável) ou permanece parado.
- Não sai dos limites da matriz (bordas são paredes).
- **Verdelim e ovos não se movem.**

### 3.3 Encontros (quando dois personagens ficam na mesma célula)
| Encontro | Resultado |
|---|---|
| Pulim + Verdelim | Pulim **come** a planta → planta some, fome do Pulim zera (e ele pega semente — ver 3.4) |
| Rondor + Pulim | Rondor **preda** o Pulim (filhote ou adulto) → Pulim morre, fome do Rondor zera |
| Pulim adulto + Pulim adulto | Geram um **ovo de Pulim** numa célula vizinha livre |
| Rondor adulto + Rondor adulto | Geram um **ovo de Rondor** numa célula vizinha livre |
| Rondor + Verdelim | Rondor não come, mas **pega semente** (ver 3.4) |
| Qualquer animal + ovo | **Nada acontece** — ovos não podem ser comidos |

- "Encontrar" = **ocupar a mesma célula** após o movimento.
- Só **adultos** se reproduzem. Após gerar um ovo, cada animal entra em **recarga de reprodução**.

### 3.4 Sementes e brotamento (plantas não se reproduzem sozinhas)
- Quando um animal (Pulim **ou** Rondor) **passa por uma célula com Verdelim adulta**, ele fica com uma **semente**, comendo a planta ou não.
- A semente é carregada por **`ALCANCE_SEMENTE` casas** (ex.: sorteado entre 3 e 6 movimentos).
- Ao completar o alcance, a semente cai na célula atual e **brota um novo Verdelim (broto)**, desde que a célula esteja livre de planta e de ovo. Se estiver ocupada, a semente se perde.
- Cada animal carrega **uma semente por vez**; enquanto carrega, não pega outra.
- Brotos não fornecem semente (só plantas adultas).

### 3.5 Ciclo de vida das plantas
- **Broto** → após `TEMPO_CRESCIMENTO` vira **adulta**.
- **Adulta** → após `TEMPO_VIDA` começa a **murchar**.
- **Murchando** → após `TEMPO_MURCHA` **morre** e some da grade.
- Plantas murchando ainda podem ser comidas (definição a confirmar).

### 3.6 Ciclo de vida dos animais
- **Ovo** → choca após `TICKS_PARA_CHOCAR`, nascendo um **filhote**.
- **Filhote** → move-se, come, sente fome, pode ser predado e carrega sementes, mas **não se reproduz**. Após `TEMPO_MATURIDADE` vira **adulto**.
- **Fome**: contador que aumenta 1 por tick e zera ao comer. Ao atingir `LIMITE_FOME` (diferente para Pulim e Rondor), o animal **morre**.

### 3.7 Fim de jogo
- O bioma só **morre quando não sobra nenhum ser vivo** na grade.
- Contam como vivos: Verdelim (qualquer fase), Pulim, Rondor e **ovos**. Sementes carregadas não contam sozinhas (morrem com o animal).
- Tela final: dias sobrevividos, população máxima de cada espécie, recorde pessoal (por tamanho de grade).

### 3.8 Ordem de resolução de cada tick (determinística)
1. Incrementar fome e idade; decrementar recargas, contagem dos ovos e alcance das sementes.
2. **Mover** animais (ordem aleatória a cada tick para não favorecer ninguém).
3. **Plantar sementes** cujo alcance terminou (gera brotos).
4. **Pegar sementes** ao entrar em célula com Verdelim adulta.
5. Resolver **predação** (Rondor × Pulim).
6. Resolver **alimentação** (Pulim × Verdelim).
7. Resolver **reprodução** (adultos, gera ovos).
8. **Chocar** ovos prontos (nascem filhotes).
9. Avançar **ciclo das plantas** (broto → adulta → murchando → morta) e **maturidade** dos filhotes.
10. Remover mortos por fome.
11. Verificar fim de jogo e atualizar contador de dias.

## 4. Parâmetros configuráveis (`config.js`)

Todas as regras numéricas ficam centralizadas para facilitar o balanceamento e a adição de novas regras (valores iniciais, a ajustar na etapa de balanceamento):

```js
export const CONFIG = {
  TAMANHOS_GRADE: [
    { nome: 'Pequena', lado: 8 },
    { nome: 'Média',   lado: 12 },
    { nome: 'Grande',  lado: 16 },
    { nome: 'Enorme',  lado: 20 },
  ],
  TICKS_POR_DIA: 10,
  VIZINHANCA: 8,                       // 4 ou 8
  SEMENTE: { ALCANCE_MIN: 3, ALCANCE_MAX: 6 },
  VERDELIM: { TEMPO_CRESCIMENTO: 20, TEMPO_VIDA: 80, TEMPO_MURCHA: 20 },
  PULIM:  { LIMITE_FOME: 30, RECARGA_REPRODUCAO: 20, TICKS_PARA_CHOCAR: 15, TEMPO_MATURIDADE: 25 },
  RONDOR: { LIMITE_FOME: 45, RECARGA_REPRODUCAO: 35, TICKS_PARA_CHOCAR: 25, TEMPO_MATURIDADE: 40 },
  SEMENTE_ALEATORIA: null              // semente do gerador aleatório (null = aleatória)
};
```

## 5. Experiência mobile first

- `<meta name="viewport" content="width=device-width, initial-scale=1">`, layout pensado primeiro para ~360px de largura.
- **Tela inicial**: escolha do tamanho da grade (Pequena 8×8, Média 12×12, Grande 16×16, Enorme 20×20). Trocar o tamanho durante a montagem pede confirmação, pois limpa a grade.
- A grade ocupa `min(largura, altura disponível)` e se mantém **quadrada**; nas grades maiores, células pequenas ganham **zoom com pinça** e arraste para manter alvos de toque confortáveis (~32px).
- **Barra de ferramentas inferior** (zona do polegar): selecionar Verdelim / Pulim / Rondor / Borracha, e botão **Iniciar**.
- Toque numa célula = coloca o personagem selecionado; arrastar o dedo = "pintar" várias células. Sem limite de quantidade.
- Personagens colocados na montagem começam como **adultos** (plantas adultas, animais adultos sem fome).
- Opção "Distribuir aleatoriamente" (informa quantidades e o jogo posiciona).
- Contadores de cada espécie (adultos, filhotes, ovos, brotos) visíveis durante o jogo.
- Pointer Events (funciona com toque e mouse), sem dependência de hover.
- Desktop: o mesmo layout centralizado, com a barra lateral em telas largas (media query).

## 6. Arquitetura técnica

Simulação **separada** da renderização, para poder testar as regras sem navegador e trocar o visual sem mexer na lógica.

```
biomix/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js          # inicialização e máquina de estados (escolha da grade → montagem → jogando → pausado → fim)
│   ├── config.js        # parâmetros do jogo
│   ├── rng.js           # gerador aleatório com semente (ex.: mulberry32)
│   ├── grade.js         # matriz, vizinhança, células livres
│   ├── entidades.js     # Verdelim, Pulim, Rondor, Ovo, Semente (dados + fábricas)
│   ├── simulacao.js     # função tick(estado) → aplica as regras na ordem da seção 3.8
│   ├── renderizador.js  # desenho no <canvas> (sprites procedurais, animação entre ticks)
│   ├── entrada.js       # toques/cliques/pinça na grade (fase de montagem)
│   ├── interface.js     # barra de ferramentas, contadores, telas inicial/final
│   └── armazenamento.js # recordes por tamanho de grade e última configuração no localStorage
└── tests/
    └── simulacao.test.js  # testes das regras (node --test, apenas em desenvolvimento)
```

- **ES Modules** nativos (`<script type="module">`), sem bundler.
- **Canvas 2D** para o tabuleiro (bom desempenho com centenas de entidades, ajustado ao `devicePixelRatio`); HTML/CSS para menus e HUD.
- Loop com `requestAnimationFrame` + acumulador de tempo para ticks em intervalo fixo; interpolação de posição para movimento suave.
- Estado do jogo como objeto simples serializável (facilita salvar/retomar e depurar).
- RNG com semente: permite reproduzir uma partida e escrever testes determinísticos.

## 7. Etapas de desenvolvimento

| Etapa | Entrega | Critério de pronto |
|---|---|---|
| **0. Base** | Estrutura de pastas, `index.html`, CSS mobile, escolha do tamanho, grade vazia responsiva | Grades de 8×8 a 20×20 renderizam bem em 360px e no desktop |
| **1. Montagem** | Barra de ferramentas, colocar/remover personagens, contadores, distribuição aleatória, zoom | Usuário monta o bioma só com toques |
| **2. Simulação núcleo** | `tick()` com movimento, alimentação, predação, fome e morte | Testes das regras passando |
| **3. Ciclos de vida** | Ovos, filhotes, maturidade, reprodução com recarga; plantas broto → adulta → murcha → morte | Testes de cada transição passando |
| **4. Sementes** | Pegar semente, carregar por N casas, brotar | Plantas reaparecem pelos caminhos dos animais |
| **5. Tempo e placar** | Contador de dias, velocidade, pausa, fim de jogo (nenhum ser vivo), recordes por grade | Partida completa do início ao fim |
| **6. Arte e animação** | Sprites originais (todas as fases), indicador de semente, animações de comer/nascer/brotar/murchar/morrer | Fases distinguíveis em telas pequenas |
| **7. Balanceamento** | Ajuste de parâmetros, gráfico simples de população por dia (opcional) | Configurações razoáveis duram vários dias |
| **8. Polimento** | Acessibilidade (contraste, rótulos), PWA/offline (opcional), tutorial rápido | Jogável offline no celular |

## 8. Decisões tomadas

- Plantas **não se reproduzem**; brotam a partir de **sementes carregadas pelos animais** (Pulim e Rondor), comendo a planta ou não.
- Plantas têm **tempo de vida**: murcham e morrem.
- **Ovos não podem ser comidos.**
- O bioma só morre quando **não sobra nenhum ser vivo**.
- **Filhotes** precisam de um tempo até poderem se reproduzir.
- **Sem limite** de personagens na montagem.
- **Tamanho da grade** escolhido entre opções pré-definidas.

## 9. Questões em aberto

1. **Alcance da semente**: fixo (ex.: sempre 4 casas) ou sorteado num intervalo? Premissa: sorteado entre 3 e 6.
2. **Semente em célula ocupada**: se a célula onde cai já tem planta ou ovo, a semente se perde (premissa) ou tenta uma célula vizinha?
3. **Animal morre carregando semente**: a semente se perde (premissa) ou cai e brota ali?
4. **Brotos e plantas murchando** podem ser comidos? Premissa: broto e murcha podem ser comidos; só a adulta fornece semente.
5. **Pulim sozinho com plantas** pode criar um ciclo infinito (come → espalha semente → planta brota). Deseja alguma regra de dificuldade crescente (ex.: estações, seca) para evitar partidas sem fim?

## 10. Próximos passos

- Responder às questões em aberto.
- Receber eventuais regras adicionais e incorporá-las em `config.js` / `simulacao.js`.
- Iniciar pela Etapa 0.
