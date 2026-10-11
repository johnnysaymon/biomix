# Biomix — Plano de Desenvolvimento

Jogo web de sobrevivência de um bioma, feito **apenas com HTML, CSS e JavaScript** (sem frameworks, sem etapa de build), **mobile first**.
O objetivo do jogador é montar um ecossistema equilibrado e fazer o bioma sobreviver o **maior número de dias** possível.

---

## 1. Conceito

- Uma **área quadrada** (matriz N×N) representa o bioma. O jogador escolhe o tamanho entre opções pré-definidas.
- O jogador escolhe **quantos** personagens de cada espécie colocar (sem limite) e **em quais células**.
- Ao tocar em **Iniciar**, a simulação roda sozinha: os animais se movem aleatoriamente, comem, se reproduzem (ovos), crescem e morrem; o predador espalha sementes; as plantas brotam, envelhecem e murcham.
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
  - **Pulim / Rondor**: ovo → filhote (menor, traço mais arredondado) → adulto; indicador de fome (cor esmaecida).
  - **Rondor**: indicador de **semente carregada** (pontinho verde no corpo/cauda).

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
| Pulim + Verdelim | Pulim **come** a planta → planta some, fome do Pulim diminui conforme a fase da planta (ver 3.5). Pulim **não** pega semente |
| Rondor + Pulim | Rondor **preda** o Pulim (filhote ou adulto) → Pulim morre, fome do Rondor zera |
| Pulim adulto + Pulim adulto | Geram um **ovo de Pulim** numa célula vizinha livre |
| Rondor adulto + Rondor adulto | Geram um **ovo de Rondor** numa célula vizinha livre |
| Rondor + Verdelim | Rondor não come, mas **pega semente** se a planta for adulta (ver 3.4) |
| Qualquer animal + ovo | **Nada acontece** — ovos não podem ser comidos |

- "Encontrar" = **ocupar a mesma célula** após o movimento.
- Só **adultos** se reproduzem. Após gerar um ovo, cada animal entra em **recarga de reprodução**.

### 3.4 Sementes e brotamento (plantas não se reproduzem sozinhas)
- **Apenas o Rondor espalha sementes.** Isso fecha um ciclo de dependência entre as três espécies:
  - Verdelim depende do **Rondor** para se espalhar;
  - Pulim depende do **Verdelim** para comer;
  - Rondor depende do **Pulim** para comer.
- Quando um Rondor (filhote ou adulto) **passa por uma célula com Verdelim adulta**, ele fica com uma **semente**. A planta continua no lugar.
- A semente é carregada por um número de casas **sorteado entre 1 e 6** no momento em que é pega.
- Ao completar o alcance, a semente cai na célula atual e **brota um novo Verdelim (broto)**.
- **Célula ocupada** (já tem planta ou ovo): a semente vai para uma **célula vizinha livre** sorteada. Se não houver nenhuma vizinha livre, a semente se perde.
- **Rondor morre carregando semente** (de fome): a semente **brota na célula onde ele morreu** (com a mesma regra de célula ocupada → vizinha livre).
- Cada Rondor carrega **uma semente por vez**; enquanto carrega, não pega outra.
- Brotos e plantas murchando não fornecem semente (só plantas adultas).

### 3.5 Ciclo de vida das plantas
- **Broto** → após `TEMPO_CRESCIMENTO` vira **adulta**.
- **Adulta** → após `TEMPO_VIDA` começa a **murchar**.
- **Murchando** → após `TEMPO_MURCHA` **morre** e some da grade.
- **Todas as fases podem ser comidas**, mas brotos e plantas murchando (no chão) alimentam menos: em vez de zerar a fome, reduzem apenas uma fração dela.

| Fase comida | Efeito na fome do Pulim (valor inicial, ajustável) |
|---|---|
| Adulta | zera a fome (100%) |
| Murchando | reduz 50% da fome atual |
| Broto | reduz 40% da fome atual |

### 3.6 Ciclo de vida dos animais
- **Ovo** → choca após `TICKS_PARA_CHOCAR`, nascendo um **filhote**.
- **Filhote** → move-se, come, sente fome, pode ser predado (Pulim) e carrega sementes (Rondor), mas **não se reproduz**. Após `TEMPO_MATURIDADE` vira **adulto**, desde que tenha **comido ao menos uma vez** (Pulim comendo Verdelim, Rondor predando Pulim). Filhote que chega à idade adulta sem ter comido **morre de fome** — assim uma única espécie sem comida não se mantém para sempre.
- **Fome**: contador que aumenta 1 por tick e zera ao comer. Ao atingir `LIMITE_FOME` (diferente para Pulim e Rondor), o animal **morre**.

### 3.7 Fim de jogo
- O bioma só **morre quando não sobra nenhum ser vivo** na grade.
- Contam como vivos: Verdelim (qualquer fase), Pulim, Rondor e **ovos**. Sementes carregadas pelos Rondors não contam como seres vivos (mas brotam quando o Rondor morre).
- Tela final: dias sobrevividos, população máxima de cada espécie, recorde pessoal (por tamanho de grade).

### 3.8 Ordem de resolução de cada tick (determinística)
1. Incrementar fome e idade; decrementar recargas, contagem dos ovos e alcance das sementes.
2. **Mover** animais (ordem aleatória a cada tick para não favorecer ninguém).
3. **Plantar sementes** cujo alcance terminou (gera brotos; célula ocupada → vizinha livre).
4. **Pegar sementes**: Rondors que entram em célula com Verdelim adulta.
5. Resolver **predação** (Rondor × Pulim).
6. Resolver **alimentação** (Pulim × Verdelim).
7. Resolver **reprodução** (adultos, gera ovos).
8. **Chocar** ovos prontos (nascem filhotes).
9. Avançar **ciclo das plantas** (broto → adulta → murchando → morta) e **maturidade** dos filhotes.
10. Remover mortos por fome (sementes carregadas por Rondors mortos brotam no local).
11. Verificar fim de jogo e atualizar contador de dias.

## 4. Parâmetros configuráveis (`config.js`)

Todas as regras numéricas ficam centralizadas para facilitar o balanceamento e a adição de novas regras.

Os valores atualizados ficam em [`js/config.js`](js/config.js). Grupos: `TAMANHOS_GRADE`, `TICKS_POR_DIA`, `TICK_MS`, `VELOCIDADES`, `VIZINHANCA`, `SEMENTE` (alcance 1–6), `VERDELIM` (crescimento, vida, murcha, nutrição por fase), `PULIM` e `RONDOR` (limite de fome, recarga de reprodução, tempo para chocar, maturidade, `FOME_PARA_COMER`).

## 5. Experiência mobile first

- `<meta name="viewport" content="width=device-width, initial-scale=1">`, layout pensado primeiro para ~360px de largura.
- **Tela inicial**: escolha do tamanho da grade (Pequena 8×8, Média 12×12, Grande 16×16, Enorme 20×20). Trocar o tamanho durante a montagem pede confirmação, pois limpa a grade.
- A grade ocupa `min(largura, altura disponível)` e se mantém **quadrada**; nas grades maiores, células pequenas ganham **zoom com pinça** e arraste para manter alvos de toque confortáveis (~32px).
- **Barra de ferramentas inferior** (zona do polegar): selecionar Verdelim / Pulim / Rondor / Borracha, e botão **Iniciar**.
- Toque numa célula = coloca o personagem selecionado; arrastar o dedo = "pintar" várias células. **Um personagem por célula**; sem outro limite de quantidade.
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
| **4. Sementes** | Rondor pega semente, carrega por N casas, brota | Plantas reaparecem pelos caminhos dos Rondors |
| **5. Tempo e placar** | Contador de dias, velocidade, pausa, fim de jogo (nenhum ser vivo), recordes por grade | Partida completa do início ao fim |
| **6. Arte e animação** | Sprites originais (todas as fases), indicador de semente, animações de comer/nascer/brotar/murchar/morrer | Fases distinguíveis em telas pequenas |
| **7. Balanceamento** | Ajuste de parâmetros, gráfico simples de população por dia (opcional) | Configurações razoáveis duram vários dias |
| **8. Polimento** | Acessibilidade (contraste, rótulos), PWA/offline (opcional), tutorial rápido | Jogável offline no celular |

## 8. Decisões tomadas

- Plantas **não se reproduzem**; brotam a partir de **sementes carregadas apenas pelos Rondors**, formando uma dependência circular planta → presa → predador → planta.
- Plantas têm **tempo de vida**: murcham e morrem.
- **Ovos não podem ser comidos.**
- O bioma só morre quando **não sobra nenhum ser vivo**.
- **Filhotes** precisam de um tempo até poderem se reproduzir.
- **Sem limite** de personagens na montagem.
- **Tamanho da grade** escolhido entre opções pré-definidas.
- Semente carregada por **1 a 6 casas** (sorteado).
- Semente em célula ocupada vai para uma **célula vizinha livre**.
- Rondor que morre carregando semente faz ela **brotar onde morreu**.
- Brotos e plantas murchando **podem ser comidos**, mas alimentam menos.

Detalhes definidos na implementação (fáceis de mudar):

- Na montagem, cada célula aceita **um único personagem**: tocar onde já está a espécie selecionada a remove; tocar sobre outra espécie a substitui; arrastar só preenche células vazias. A distribuição aleatória usa apenas células vazias. (Durante a partida os animais continuam podendo se encontrar na mesma célula.)
- Cada Rondor preda **no máximo um Pulim por tick**; se vários Pulins estão numa célula com planta, **o mais faminto come**.
- O Rondor pega semente ao **entrar** numa célula com Verdelim adulta (parado não pega); cada casa andada consome o alcance.

## 9. Questões em aberto

Nenhuma no momento. A dependência circular (só o Rondor espalha sementes) evita o ciclo infinito Pulim + plantas: sem Rondors, as plantas não se renovam, murcham e o bioma acaba colapsando.

## 10. Andamento

**Primeira versão jogável implementada** (etapas 0 a 5 e uma primeira versão da etapa 6):

- Simulação completa seguindo a ordem da seção 3.8, coberta por testes (`npm test`).
- Tela inicial com tamanhos de grade e recordes; montagem por toque/arraste, borracha, distribuição aleatória; montagem salva por tamanho.
- Partida com contador de dias, pausa, velocidades 1×/2×/4×, tela final com picos de população e recorde.
- Personagens originais desenhados no canvas (broto/adulta/murchando, filhotes, ovos que tremem antes de chocar, semente no Rondor, animais famintos piscando) e efeitos visuais simples para comer, predar, nascer, brotar e morrer.

**Ajustes feitos no balanceamento** (valores em `config.js`): com os números iniciais do plano o bioma colapsava em ~20 dias; os valores atuais levam a ~40–60 dias com distribuições aleatórias.

**Observação de balanceamento:** a principal causa de colapso é o animal comer tudo o que encontra, mesmo sem fome. Existe a opção `FOME_PARA_COMER` em `PULIM` e `RONDOR` (0 = desligada, regra atual). Em simulações, a regra atual extinguiu os animais em ~35 dias; com Pulim 20 e Rondor 40, todas as partidas passaram de 2.000 dias. Fica como sugestão de regra a decidir.

**Pendente:**

- Zoom com pinça nas grades grandes (etapa 1).
- Animações mais ricas (etapa 6), gráfico de população (etapa 7), PWA/offline e tutorial (etapa 8).
