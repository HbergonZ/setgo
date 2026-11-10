# SetGo

A versão 0.2.6 (código 10) corrige a retomada do treino, atualiza as metas de Costa/Ombro e ajusta a navegação dos treinos salvos.

Contador de séries de treino que roda direto na Xiaomi Smart Band 8 Pro. É um Quick App em Vela JS (`.rpk`) e não depende do celular durante o treino.

## Funções

- **Menu:** `Treino avulso` (monta na hora, sem virar modelo salvo) ou `Treinos salvos` (os 3 treinos fixos).
- **Treino avulso:** adiciona exercícios escolhendo o tipo — `Reps`, `Tempo` (isometria em segundos) ou `Combo` (dois movimentos por série) — e os valores. Viram "Exercício 1", "Exercício 2"... Dá para adicionar mais com o treino já iniciado. Ao finalizar, é descartado.
- **Tela do exercício:** nome, série atual (`SERIE 2 de 4`), alvo (`12 reps`, `30 seg` ou `20 + 10 reps`), bolinhas de progresso e botão `CHECK`. O botão azul `DESFAZER` volta uma série.
- **Reps/Combo:** um `CHECK` fecha a série.
- **Tempo (isometria):** o `CHECK` inicia a contagem dos segundos e marca a série sozinho ao zerar (ou `Pronto` para marcar antes).
- **Exercício concluído:** a última série retorna diretamente à lista, sem abrir o próximo exercício. É possível reabrir o exercício concluído para desfazer uma série; seu botão principal mostra `VOLTAR`.
- **Descanso:** 30s por padrão entre as séries, com `+15s` e `Pular`, vibrando ao zerar.
- **Finalizar:** segure o botão `FINALIZAR` até a barra encher, para confirmar.
- O treino em andamento fica salvo (`@system.storage`); ao reabrir, o app retoma automaticamente sua lista com as marcações. O menu também oferece `CONTINUAR TREINO` enquanto há sessão ativa.
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

- A versão 0.2.3 usa textos sem acentos e a fonte padrão da pulseira. As versões com acentos falharam no aparelho físico; veja abaixo.
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
- Na 0.2.3, a montagem mantém uma área central de 136 unidades mesmo sem exercícios, para não concentrar tudo no topo. A mensagem vazia usa texto 18 em negrito, altura explícita e até três linhas. O botão `+ Adicionar` usa texto 18 em negrito e altura 38. Os seletores também usam negrito para melhorar a leitura no firmware real.

A revisão foi conferida com toques no emulador: abrir treino salvo, CHECK, +15s, Pular, desfazer, toque curto e pressão longa em FINALIZAR, OK, treino avulso, tipos Reps/Tempo/Combo, seletores +/−, Adicionar, Cancelar, INICIAR e Cancelar/Pronto na isometria. INICIAR permanece inativo enquanto não há exercícios.

### Acentos, til e cedilha

Um teste com a fonte padrão no emulador local Vela 5 renderizou corretamente `À â ê ô ã õ ç` e `Ação: á é í ó ú`. Portanto, não há uma limitação geral do texto Unicode no app. Esse resultado não confirma a cobertura da fonte do firmware da Smart Band 8 Pro: o emulador usa uma imagem de relógio Vela 5, embora tenha a resolução da pulseira.

A versão 0.2.1 mostrou quadradinhos na pulseira com a fonte padrão. A 0.2.2 incluiu Roboto Regular e Bold por `@font-face`: o emulador registrou o carregamento e exibiu os acentos, mas o usuário confirmou que não funcionou na pulseira. A foto também mostrou textos de montagem menores que os do emulador. O comportamento do emulador não valida as fontes desse firmware.

A versão 0.2.3 (código 7) remove os arquivos TTF e as declarações de fonte própria. Os textos voltam a usar ASCII. `nomeCompativel` também remove acentos apenas na apresentação de nomes de sessões antigas, mantendo os exercícios e o progresso gravados. Um teste de regressão cobre a retomada de uma sessão das versões acentuadas.

O pacote atual é `dist/dev.rea.setgo.debug.0.2.3.rpk`. No Mi Fitness, selecione `dev_rea_setgo.rpk` da pasta `Xiaomi-band` após o deploy. Feche e reabra o SetGo para conferir a montagem vazia, o seletor, a lista e a retomada de sessão. A proporção final dos textos deve ser validada na pulseira; não há alteração de firmware.

A 0.2.3 passou nos 12 testes, compilou e foi enviada pelo Mi Fitness, que retornou `发送文件成功`. O emulador mostrou a mensagem vazia em três linhas e o botão Adicionar ampliado; a confirmação das proporções na pulseira permanece pendente.

### Ajustes da versão 0.2.4

- Os cartões de treinos salvos reservam larguras próprias para nome e quantidade, separadas por 14 unidades, para não depender do espaçamento flexível do firmware.
- O seletor reserva 56 unidades para o valor, usa fonte 22 e uma única linha. Os botões +/− têm fonte em negrito, e as linhas mantêm altura fixa, inclusive para valores de três dígitos como 180 segundos.
- DESFAZER é um botão azul de 130×32 com texto 16 em negrito. FINALIZAR e CHECK mantêm suas medidas.
- A última série retorna automaticamente à lista em Reps, Combo e Tempo. Um exercício já concluído continua acessível para desfazer; VOLTAR abre a lista.

O pacote é `dist/dev.rea.setgo.debug.0.2.4.rpk` (código 8). Os 13 testes cobrem o novo retorno à lista, persistência do progresso, desfazer após reabrir e os fluxos de isometria. A proporção dos controles ainda deve ser conferida na pulseira após o envio.

O emulador confirmou o seletor Reps/Combo sem quebra dos valores, o novo botão DESFAZER e o retorno automático à lista ao marcar a última série. Os toques em +/− e DESFAZER também foram conferidos. O Mi Fitness confirmou o envio da 0.2.4 com `发送文件成功`.

### Retomada e treinos na versão 0.2.6

Abrir novamente o mesmo treino salvo retoma sua sessão, em vez de criar uma cópia zerada. A leitura inicial do storage termina antes de permitir iniciar outra sessão. O progresso é salvo a cada alteração e reforçado ao ocultar/destruir a página. Mesmo com todos os exercícios marcados, a sessão permanece disponível até confirmar FINALIZAR; a confirmação apaga o registro, e ocultar a tela de conclusão não o recria.

O gesto voltar segue `exercício → lista de exercícios → treinos salvos → menu` nos treinos fixos. No avulso, a lista volta ao menu. Continua existindo uma única sessão em andamento: escolher um treino diferente ou iniciar outro avulso a substitui.

Costa/Ombro passa a ter Remada polia alta corda **4×12** e Banco lombar isometria **3×30 segundos**. Os demais exercícios seguem a lista conferida do usuário; Perna/Bíceps mantém o Combo de **3×(20+10)**, e Peito/Tríceps mantém a prancha de **4×30 segundos**. Tempo e Combo continuam disponíveis no avulso. Uma sessão fixa antiga recebe as novas metas preservando a quantidade de séries já registradas por exercício.

O pacote é `dist/dev.rea.setgo.debug.0.2.6.rpk`. Os testes cobrem saída/retomada, reabertura pela lista, sessão inteiramente marcada, leitura atrasada, atualização das metas antigas e a navegação de volta, além dos fluxos anteriores.

Os 18 testes passaram. No emulador, concluir o Puxador em 4/4, voltar aos treinos salvos e reabrir Costa/Ombro manteve a marcação. Após encerrar os processos do emulador e iniciá-lo novamente, a sessão abriu automaticamente com o mesmo 4/4. O Mi Fitness confirmou o envio da 0.2.6 (`发送文件成功`); a retomada no firmware da pulseira ainda deve ser conferida pelo usuário.
