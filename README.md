# SetGo

Contador de séries de treino que roda direto na Xiaomi Smart Band 8 Pro. É um Quick App em Vela JS (`.rpk`) e não depende do celular durante o treino.

## Funções

- **Menu:** `Treino avulso` (monta na hora, não salva) ou `Treinos salvos` (os 3 treinos fixos).
- **Treino avulso:** adiciona exercícios escolhendo o tipo — `Reps`, `Tempo` (isometria em segundos) ou `Combo` (dois movimentos por série) — e os valores. Viram "Exercício 1", "Exercício 2"... Dá para adicionar mais com o treino já iniciado. Ao finalizar, é descartado.
- **Tela do exercício:** nome, série atual (`SÉRIE 2 de 4`), alvo (`12 reps`, `30 seg` ou `20 + 10 reps`), bolinhas de progresso e botão `CHECK`. `desfazer` volta uma série.
- **Reps/Combo:** um `CHECK` fecha a série.
- **Tempo (isometria):** o `CHECK` inicia a contagem dos segundos e marca a série sozinho ao zerar (ou `Pronto` para marcar antes).
- **Descanso:** 30s por padrão entre as séries, com `+15s` e `Pular`, vibrando ao zerar.
- **Finalizar:** segure o botão `FINALIZAR` até a barra encher, para confirmar.
- O treino em andamento fica salvo (`@system.storage`); ao reabrir o app aparece `CONTINUAR TREINO`.
- Mantém a tela acesa durante o treino.

## Estrutura

| Caminho | Conteúdo |
|---|---|
| `src/common/modelo.js` | Treinos salvos e funções puras (meta, alvo, sessão). Testável no Node. |
| `src/common/picker.js` | Lógica do seletor (tipos, limites, montar exercício). Testável no Node. |
| `src/common/sessao.js` | Sessão em andamento (memória + storage). |
| `src/pages/index` | Menu. |
| `src/pages/salvos` | Lista dos treinos salvos. |
| `src/pages/builder` | Montagem do treino avulso. |
| `src/pages/treino` | Lista de exercícios do treino em andamento + finalizar. |
| `src/pages/exercicio` | Contador de séries, descanso e tempo. |
| `tests/modelo.test.mjs` | Testes das funções puras. |
| `tools/deploy.mjs` | Compila e instala na pulseira (página de debug do Mi Fitness). |
| `tools/gerar-icone.mjs` | Gera `src/common/icon.png`. |

## Comandos

```bash
npm install
npm test          # testes das funções puras
npm run build     # gera dist/dev.rea.setgo.debug.<versão>.rpk
npm run deploy    # compila e instala na pulseira (precisa do celular no adb)
```

## Observações

- Os textos usam acento/til/cedilha. Se a fonte do Quick App não renderizar algum, dá para trocar por ASCII (como foi preciso no Placar Tênis).
- `designWidth` é 192 (tela 336x480 da Band 8 Pro).
- Instalação pela página de debug do Mi Fitness, mesmo método do Placar Tênis (ver o README daquele projeto). A pulseira mantém o ícone da primeira instalação.
