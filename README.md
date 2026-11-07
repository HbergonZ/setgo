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
| `src/pages/index/index.ux` | Todas as telas, navegação interna, sessão no storage, descanso e isometria. |
| `tests/modelo.test.mjs` | Testes das funções puras. |
| `tests/fluxo.test.mjs` | Testes dos métodos da página com storage e relógio simulados. |
| `tools/deploy.mjs` | Compila e instala na pulseira (página de debug do Mi Fitness). |
| `tools/gerar-icone.mjs` | Gera `src/common/icon.png`. |

## Comandos

```bash
npm install
npm test          # testes das funções puras e dos fluxos de treino
npm start         # emulador oficial Vela, com recompilação ao salvar
npm run build     # gera dist/dev.rea.setgo.debug.<versão>.rpk
npm run deploy    # compila e instala na pulseira (precisa do celular no adb)
```

## Observações

- A versão 0.2.1 inclui acentos, til e cedilha nos textos da interface e nos nomes dos treinos. A renderização na pulseira está em validação; veja abaixo.
- `designWidth` é 192 (tela 336x480 da Band 8 Pro).
- Instalação pela página de debug do Mi Fitness, mesmo método do Placar Tênis (ver o README daquele projeto). A pulseira mantém o ícone da primeira instalação.

## Validação no emulador

O dispositivo virtual local `Vela_Virtual_Device` usa a resolução 336x480. Mantenha apenas uma instância de `aiot start` por projeto: processos concorrentes disputam os arquivos temporários e a instalação. Espere o primeiro menu aparecer; o runtime pode demorar cerca de dez segundos após iniciar o app.

Se o recarregamento ficar preso após parar o app, encerre a sessão de desenvolvimento e o emulador, e inicie novamente. Esse problema também ocorreu com a compilação válida durante os testes locais.

As telas usam classes CSS simples para evitar que os estilos de estados se misturem no runtime. As listas e suas linhas têm altura explícita, conforme a [documentação do Vela](https://iot.mi.com/vela/quickapp/en/components/container/list.html). O seletor e os botões cabem na largura de 192 unidades do projeto.

Para voltar, deslize da borda esquerda para a direita. Para finalizar um treino, mantenha FINALIZAR pressionado por 1,5 segundo e toque em OK.

Os testes automatizados cobrem treino salvo, descanso, desfazer, retomada pelo storage, conclusão da isometria e confirmação ao segurar. A vibração e o comportamento na Band 8 Pro ainda precisam de validação no aparelho físico.

### Proporção dos controles

As medidas abaixo usam o `designWidth` de 192 unidades:

- FINALIZAR: 154×32, texto 16, fundo discreto e barra de confirmação de 4 unidades; mantém a confirmação de 1,5 segundo.
- CHECK, PROXIMO e VOLTAR: 144×38, texto 20; o contador continua como informação principal.
- INICIAR e OK: altura 36, texto 18. Os botões em pares têm altura 34.
- Menu: botões 172×48, texto 20. Os marcadores menores acomodam até oito séries.
- As listas de exercícios ganharam o espaço liberado pelos botões menores.

A revisão foi conferida com toques no emulador: abrir treino salvo, CHECK, +15s, Pular, desfazer, toque curto e pressão longa em FINALIZAR, OK, treino avulso, tipos Reps/Tempo/Combo, seletores +/−, Adicionar, Cancelar, INICIAR e Cancelar/Pronto na isometria. INICIAR permanece inativo enquanto não há exercícios.

### Acentos, til e cedilha

Um teste com a fonte padrão no emulador local Vela 5 renderizou corretamente `À â ê ô ã õ ç` e `Ação: á é í ó ú`. Portanto, não há uma limitação geral do texto Unicode no app. Esse resultado não confirma a cobertura da fonte do firmware da Smart Band 8 Pro: o emulador usa uma imagem de relógio Vela 5, embora tenha a resolução da pulseira.

O teste inicial substituiu somente os rótulos dos dois botões do menu. A versão 0.2.1 aplica os caracteres aos textos reais: `SÉRIE`, `EXERCÍCIO FEITO`, `PRÓXIMO`, `CONCLUÍDO`, `Séries`, `Segure a posição`, `Elevação`, `Máquina`, `Bíceps` e `Tríceps`, entre outros. O pacote para teste na pulseira é `dist/dev.rea.setgo.debug.0.2.1.rpk` (código de versão 5).

No Mi Fitness, selecione o arquivo `dev_rea_setgo.rpk` da pasta `Xiaomi-band` após executar o deploy. Abra um treino salvo novo ou monte um novo treino avulso para conferir os nomes: uma sessão retomada mantém os nomes gravados antes da atualização. Confira também o seletor (`Séries`) e o cronômetro (`Segure a posição`). Os testes automatizados e a compilação passaram; a exibição no aparelho físico ainda depende dessa conferência.

No envio da versão 0.2.1 pelo celular conectado, o arquivo foi selecionado e o Mi Fitness retornou `发送文件成功` (arquivo enviado com sucesso). Essa mensagem confirma o envio, mas não a renderização dos caracteres na tela da pulseira.

Se os caracteres não aparecerem no aparelho, o próximo caminho a avaliar é uma fonte incluída no app. O compilador instalado reconhece `@font-face` e `font-family`, mas o carregamento dessa fonte ainda precisa ser validado no firmware da pulseira. Não é necessário alterar o firmware para o teste de texto.
