# Biomix — Plano Inicial de Desenvolvimento

Jogo web de sobrevivência de um bioma, feito **apenas com HTML, CSS e JavaScript** (sem frameworks, sem etapa de build), **mobile first**.
O objetivo do jogador é montar um ecossistema equilibrado e fazer o bioma sobreviver o **maior número de dias** possível.

---

## 1. Conceito

- Uma **área quadrada** (matriz N×N) representa o bioma.
- O jogador escolhe **quantos** personagens de cada espécie colocar e **em quais células**.
- Ao tocar em **Iniciar**, a simulação roda sozinha: os animais se movem aleatoriamente, comem, se reproduzem (ovos) e morrem de fome.
- Um contador mostra **quantos dias** o bioma sobreviveu. Quando o bioma colapsa, o jogo termina e o recorde é salvo.

## 2. Personagens (fictícios, com referência indireta)

| Papel | Nome provisório | Inspiração indireta | Visual sugerido |
|---|---|---|---|
| Planta (produtor) | **Verdelim** | plantinha / broto | broto arredondado, 2–3 folhas, carinha simples |
| Presa (herbívoro) | **Pulim** | coelho | corpo oval, orelhas longas curvadas, pés grandes, cor creme/lilás |
| Predador (carnívoro) | **Rondor** | raposa | corpo esguio, cauda volumosa, orelhas pontudas, cor laranja-ferrugem/azulada |

- Arte própria desenhada em **SVG inline** ou desenhada no **Canvas** (sem imagens de terceiros), garantindo que os personagens sejam originais.
- Cada personagem terá estados visuais: normal, com fome (cor esmaecida), ovo, morrendo (animação curta).

## 3. Regras do jogo (versão 1)

### 3.1 Tempo
- A simulação avança em **ticks** (turnos).
- **1 dia = `TICKS_POR_DIA` ticks** (ex.: 10). O contador de dias é o placar.
- Velocidade ajustável (1×, 2×, 4×) e botão de pausa.

### 3.2 Movimento
- A cada tick, cada **Pulim** e **Rondor** se move para uma célula vizinha aleatória (vizinhança de 4 ou 8 direções — configurável) ou permanece parado.
- Não sai dos limites da matriz (bordas são paredes).
- **Verdelim não se move** (premissa — ver questões em aberto).

### 3.3 Encontros (quando dois personagens ficam na mesma célula)
| Encontro | Resultado |
|---|---|
| Pulim + Verdelim | Pulim **come** a planta → planta some, fome do Pulim zera |
| Rondor + Pulim | Rondor **preda** o Pulim → Pulim morre, fome do Rondor zera |
| Pulim + Pulim | Geram um **ovo de Pulim** numa célula vizinha livre |
| Rondor + Rondor | Geram um **ovo de Rondor** numa célula vizinha livre |
| Rondor + Verdelim | Nada acontece (coexistem na célula) |

- "Encontrar" = **ocupar a mesma célula** após o movimento (definição inicial; alternativa: estar em células adjacentes).
- Para evitar explosão populacional, cada animal tem um **tempo de recarga de reprodução** após gerar um ovo.

### 3.4 Ovos
- O ovo fica parado e **choca após `TICKS_PARA_CHOCAR`** ticks, gerando um filhote da espécie.
- Se não houver célula livre ao redor, o ovo não é gerado.

### 3.5 Fome e morte
- Cada animal tem um contador de fome que aumenta 1 por tick.
- Se chegar a `LIMITE_FOME` (diferente para Pulim e Rondor) sem comer, o animal **morre**.

### 3.6 Fim de jogo
- Premissa inicial: o bioma **colapsa quando qualquer uma das três espécies é extinta** (ovos contam como espécie viva).
- Tela final: dias sobrevividos, população máxima de cada espécie, recorde pessoal.

### 3.7 Ordem de resolução de cada tick (determinística)
1. Incrementar fome e idade; decrementar recargas e contagem dos ovos.
2. Mover animais (ordem aleatória a cada tick para não favorecer ninguém).
3. Resolver predação (Rondor × Pulim).
4. Resolver alimentação (Pulim × Verdelim).
5. Resolver reprodução (geração de ovos).
6. Chocar ovos prontos.
7. Remover mortos por fome.
8. Verificar fim de jogo e atualizar contador de dias.

## 4. Parâmetros configuráveis (`config.js`)

Todas as regras numéricas ficam centralizadas para facilitar o balanceamento e a adição de novas regras:

```js
export const CONFIG = {
  TAMANHO_GRADE: 12,          // 8 a 20
  TICKS_POR_DIA: 10,
  VIZINHANCA: 8,              // 4 ou 8
  PULIM:  { LIMITE_FOME: 30, RECARGA_REPRODUCAO: 20, TICKS_PARA_CHOCAR: 15 },
  RONDOR: { LIMITE_FOME: 45, RECARGA_REPRODUCAO: 35, TICKS_PARA_CHOCAR: 25 },
  VERDELIM: { /* reservado p/ regras futuras (rebrota/propagação) */ },
  SEMENTE: null               // semente do gerador aleatório (null = aleatória)
};
```

## 5. Experiência mobile first

- `<meta name="viewport" content="width=device-width, initial-scale=1">`, layout pensado primeiro para ~360px de largura.
- A grade ocupa `min(largura, altura disponível)` e se mantém **quadrada**; células com tamanho mínimo de toque (~32px, com zoom/rolagem se a grade for grande).
- **Barra de ferramentas inferior** (zona do polegar): selecionar Verdelim / Pulim / Rondor / Borracha, e botão **Iniciar**.
- Toque numa célula = coloca o personagem selecionado; arrastar o dedo = "pintar" várias células.
- Contadores de cada espécie visíveis durante a montagem e durante o jogo.
- Opção "Distribuir aleatoriamente" (informa quantidades e o jogo posiciona).
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
│   ├── main.js          # inicialização e máquina de estados (montagem → jogando → pausado → fim)
│   ├── config.js        # parâmetros do jogo
│   ├── rng.js           # gerador aleatório com semente (ex.: mulberry32)
│   ├── grade.js         # matriz, vizinhança, células livres
│   ├── entidades.js     # Verdelim, Pulim, Rondor, Ovo (dados + fábricas)
│   ├── simulacao.js     # função tick(estado) → aplica as regras na ordem da seção 3.7
│   ├── renderizador.js  # desenho no <canvas> (sprites procedurais, animação entre ticks)
│   ├── entrada.js       # toques/cliques na grade (fase de montagem)
│   ├── interface.js     # barra de ferramentas, contadores, telas inicial/final
│   └── armazenamento.js # recorde e última configuração no localStorage
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
| **0. Base** | Estrutura de pastas, `index.html`, CSS mobile, grade vazia responsiva | Grade quadrada renderiza bem em 360px e no desktop |
| **1. Montagem** | Barra de ferramentas, colocar/remover personagens, contadores, distribuição aleatória | Usuário monta o bioma só com toques |
| **2. Simulação núcleo** | `tick()` com movimento, alimentação, predação, fome e morte | Testes das regras passando |
| **3. Reprodução** | Encontros entre iguais, ovos, chocagem, recarga | Populações crescem e caem de forma plausível |
| **4. Tempo e placar** | Contador de dias, velocidade, pausa, detecção de fim de jogo, recorde | Partida completa do início ao fim |
| **5. Arte e animação** | Sprites originais dos 3 personagens + ovo, animações de comer/nascer/morrer | Personagens distinguíveis em telas pequenas |
| **6. Balanceamento** | Ajuste de parâmetros, gráfico simples de população por dia (opcional) | Configurações razoáveis duram vários dias |
| **7. Polimento** | Acessibilidade (contraste, rótulos), PWA/offline (opcional), tutorial rápido | Jogável offline no celular |

## 8. Questões em aberto (para definir antes/durante o desenvolvimento)

1. **A planta se reproduz ou rebrota?** Sem isso, os Pulins tendem a esgotar as plantas e o bioma colapsa rápido. Sugestão: Verdelim se propaga para uma célula vizinha vazia com certa probabilidade por dia.
2. **A planta se move?** Premissa atual: não.
3. **Ovos podem ser comidos?** (ex.: Rondor come ovo de Pulim).
4. **Quando exatamente o bioma "morre"?** Extinção de qualquer espécie (premissa) ou só quando não sobra nenhum ser vivo?
5. **Quantos personagens cabem por célula?** Premissa: vários podem se cruzar na mesma célula; ovos ocupam uma célula sozinhos.
6. **Filhotes**: nascem adultos ou precisam crescer antes de poder se reproduzir?
7. **Limites de montagem**: quantidade máxima de personagens por espécie ou "orçamento" de pontos?
8. **Tamanho da grade**: fixo ou escolhido pelo jogador?

## 9. Próximos passos

- Validar este plano e responder às questões em aberto.
- Receber as regras adicionais e incorporá-las em `config.js` / `simulacao.js`.
- Iniciar pela Etapa 0.
