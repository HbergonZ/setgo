import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'

async function carregar(rel) {
  const fonte = await readFile(new URL(rel, import.meta.url), 'utf8')
  return import('data:text/javascript;base64,' + Buffer.from(fonte).toString('base64'))
}
const modelo = await carregar('../src/common/modelo.js')
const picker = await carregar('../src/common/picker.js')
const cargas = await carregar('../src/common/cargas.js')
const ux = await readFile(new URL('../src/pages/index/index.ux', import.meta.url), 'utf8')
const script = ux.match(/<script>([\s\S]*?)<\/script>/)[1]
  .replace(/^import .*$/gm, '').replace('export default', 'globalThis.pagina =')

function abrir(salvo, opcoes = {}) {
  let agora = 0
  let id = 0
  const timers = new Map()
  const dados = { setgo_sessao: salvo, setgo_cargas: opcoes.cargas }
  const leituras = []
  const contexto = vm.createContext({
    ...modelo, ...picker, ...cargas,
    storage: {
      get({ key, success, fail }) {
        const concluir = () => opcoes.falhaLeitura ? fail() : success(dados[key])
        leituras.push(concluir)
        if (!opcoes.leituraAdiada) concluir()
      },
      set({ key, value }) { dados[key] = value },
      delete({ key }) { delete dados[key] }
    },
    vibrator: { vibrate() {} }, brightness: { setKeepScreenOn() {} },
    Date: { now: () => agora },
    setInterval(fn) { timers.set(++id, fn); return id },
    clearInterval(id) { timers.delete(id) }
  })
  vm.runInContext(script, contexto)
  const pagina = contexto.pagina
  Object.assign(pagina, pagina.private)
  pagina.onInit()
  return {
    pagina, dados, timers, concluirLeitura: () => { for (const concluir of leituras) concluir() },
    passar(ms) { agora += ms; for (const fn of [...timers.values()]) fn() }
  }
}

function avulso(p, tipo = 'reps', series = 2) {
  p.irBuilder()
  p.abrirPickerBuilder()
  p.setTipo(tipo)
  p.vals.series = series
  p.vals.seg = 10
  p.addPicker()
  p.iniciarAvulso()
  p.abrirExercicio(0)
}

test('treino salvo: abrir, marcar, pular descanso e desfazer', () => {
  const { pagina: p } = abrir()
  p.irSalvos()
  p.abrirSalvo(0)
  assert.equal(p.treinoView.length, 7)
  p.abrirExercicio(0)
  p.checar()
  assert.equal(p.vista, 'descanso')
  assert.equal(p.ativo.done[0], 1)
  p.mais15()
  assert.equal(p.restNum, 45)
  p.pularRest()
  p.desfazer()
  assert.equal(p.vista, 'exercicio')
  assert.equal(p.ativo.done[0], 0)
})

test('ultima serie de isometria volta para a lista ao zerar', () => {
  const { pagina: p, passar, timers } = abrir()
  avulso(p, 'tempo', 1)
  p.checar()
  assert.equal(p.vista, 'tempo')
  passar(10000)
  assert.equal(p.vista, 'treino')
  assert.equal(p.exFim, true)
  assert.equal(p.ativo.done[0], 1)
  assert.equal(timers.size, 0)
})

test('Pronto encerra isometria e inicia descanso entre series', () => {
  const { pagina: p } = abrir()
  avulso(p, 'tempo')
  p.checar()
  p.prontoTempo()
  assert.equal(p.vista, 'descanso')
  p.pularRest()
  p.checar()
  p.prontoTempo()
  assert.equal(p.vista, 'treino')
  assert.equal(p.exFim, true)
})

test('sessao persiste e continua depois de reabrir', () => {
  const { pagina: p, dados } = abrir()
  avulso(p)
  p.checar()
  p.onDestroy()
  const { pagina: reaberta } = abrir(dados.setgo_sessao)
  assert.equal(reaberta.temSessao, true)
  reaberta.continuar()
  assert.equal(reaberta.vista, 'treino')
  assert.equal(reaberta.treinoView[0].prog, '1/2')
})

test('finalizar exige segurar e OK descarta sessao', () => {
  const { pagina: p, passar, dados } = abrir()
  avulso(p)
  p.onBackPress()
  p.holdStart()
  passar(500)
  p.holdEnd()
  assert.equal(p.vista, 'treino')
  p.holdStart()
  passar(1500)
  assert.equal(p.vista, 'concluido')
  p.voltarMenu()
  assert.equal(p.temSessao, false)
  assert.equal(dados.setgo_sessao, undefined)
})

test('retomar sessao das versoes acentuadas mostra nomes legiveis sem perder progresso', () => {
  const sessao = modelo.novaSessao(modelo.SALVOS[2], 'salvo')
  sessao.nome = 'Peito / Tríceps'
  sessao.ex[2].nome = 'Supino Máquina'
  sessao.done[2] = 1
  const { pagina: p } = abrir(JSON.stringify(sessao))
  p.continuar()
  assert.equal(p.ativoNome, 'Peito / Triceps')
  assert.equal(p.treinoView[2].nome, 'Supino Maquina')
  assert.equal(p.treinoView[2].prog, '1/4')
  p.abrirExercicio(2)
  assert.equal(p.exNome, 'Supino Maquina')
  assert.equal(p.ativo.done[2], 1)
})

test('treino salvo retoma automaticamente e reabrir pela lista nao zera marcacoes', () => {
  const { pagina: p, dados } = abrir()
  p.abrirSalvo(0)
  p.abrirExercicio(0)
  for (let i = 0; i < 4; i++) {
    p.checar()
    if (p.vista === 'descanso') p.pularRest()
  }
  p.onHide()
  p.onDestroy()
  const { pagina: reaberta } = abrir(dados.setgo_sessao)
  assert.equal(reaberta.vista, 'treino')
  assert.equal(reaberta.treinoView[0].feito, true)
  assert.equal(reaberta.treinoView[0].prog, '4/4')
  reaberta.onBackPress()
  assert.equal(reaberta.vista, 'salvos')
  reaberta.abrirSalvo(0)
  assert.equal(reaberta.ativo.done[0], 4)
  assert.equal(reaberta.vista, 'treino')
  reaberta.onBackPress()
  reaberta.onBackPress()
  assert.equal(reaberta.vista, 'menu')
})

test('todas as series marcadas permanecem ate confirmar FINALIZAR', () => {
  const s = modelo.novaSessao(modelo.SALVOS[1], 'salvo')
  s.done = s.ex.map(e => e.series)
  const { pagina: p, dados } = abrir(JSON.stringify(s))
  assert.equal(p.vista, 'treino')
  assert.equal(p.temSessao, true)
  assert.equal(p.treinoView.every(e => e.feito), true)
  p.finalizar()
  p.onHide()
  p.onDestroy()
  const { pagina: reaberta } = abrir(dados.setgo_sessao)
  assert.equal(reaberta.temSessao, false)
  assert.equal(reaberta.vista, 'menu')
})

test('sessao antiga recebe novas metas preservando o numero de series feitas', () => {
  const s = modelo.novaSessao(modelo.SALVOS[0], 'salvo')
  s.ex[1].series = 2
  s.ex[6].series = 2
  s.done[1] = 2
  s.done[6] = 1
  const { pagina: p } = abrir(JSON.stringify(s))
  assert.equal(p.treinoView[1].prog, '2/4')
  assert.equal(p.treinoView[1].feito, false)
  assert.equal(p.treinoView[6].prog, '1/3')
  assert.equal(p.ativo.ex[6].tipo, 'tempo')
  assert.equal(p.ativo.ex[6].seg, 30)
})

test('leitura atrasada nao permite sobrescrever a sessao ao tocar em outro treino', () => {
  const s = modelo.novaSessao(modelo.SALVOS[0], 'salvo')
  s.done[0] = 3
  const salvo = JSON.stringify(s)
  const { pagina: p, dados, concluirLeitura } = abrir(salvo, { leituraAdiada: true })
  p.abrirSalvo(1)
  p.irBuilder()
  p.iniciarAvulso()
  assert.equal(dados.setgo_sessao, salvo)
  assert.equal(p.vista, 'menu')
  concluirLeitura()
  assert.equal(p.carregandoSessao, false)
  assert.equal(p.vista, 'treino')
  assert.equal(p.ativo.done[0], 3)
})

test('falha de leitura libera a navegacao e voltar no avulso retorna ao menu', () => {
  const { pagina: p } = abrir(undefined, { falhaLeitura: true })
  assert.equal(p.carregandoSessao, false)
  avulso(p)
  p.onBackPress()
  p.onBackPress()
  assert.equal(p.vista, 'menu')
})

test('reps e combo voltam para a lista sem avancar ao proximo exercicio', () => {
  for (const tipo of ['reps', 'combo']) {
    const { pagina: p, dados, timers } = abrir()
    avulso(p, tipo, 1)
    p.abrirPickerTreino()
    p.addPicker()
    p.abrirExercicio(0)
    p.checar()
    assert.equal(p.vista, 'treino')
    assert.equal(p.curEx, 0)
    assert.equal(p.ativo.done[0], 1)
    assert.equal(p.ativo.done[1], 0)
    assert.equal(p.treinoView[0].feito, true)
    assert.equal(JSON.parse(dados.setgo_sessao).done[0], 1)
    assert.equal(timers.size, 0)
    p.abrirExercicio(0)
    assert.equal(p.exBotao, 'VOLTAR')
    p.desfazer()
    assert.equal(p.ativo.done[0], 0)
    assert.equal(p.exFim, false)
    assert.equal(p.exBotao, 'CHECK')
  }
})

test('carga de treino salvo persiste separada da sessao ate ser alterada', () => {
  const { pagina: p, dados } = abrir()
  p.irSalvos()
  p.abrirSalvo(0)
  p.abrirExercicio(0)
  assert.equal(p.exCarga, 'CARGA')
  p.abrirCarga()
  p.cargaMais5()
  p.cargaMaisMenor()
  p.salvarCarga()
  assert.equal(p.exCarga, '5.5 kg')
  assert.match(p.treinoView[0].prog, /5\.5 kg/)
  const salvas = dados.setgo_cargas
  p.finalizar()
  p.voltarMenu()
  assert.equal(dados.setgo_cargas, salvas)

  const { pagina: reaberta } = abrir(undefined, { cargas: salvas })
  reaberta.irSalvos()
  reaberta.abrirSalvo(0)
  reaberta.abrirExercicio(0)
  assert.equal(reaberta.exCarga, '5.5 kg')
  reaberta.abrirCarga()
  reaberta.cargaMenos5()
  reaberta.cargaMenosMenor()
  reaberta.salvarCarga()
  assert.equal(reaberta.exCarga, 'CARGA')
})

test('exercicio salvo aceita placas com passos inteiros e persiste a unidade', () => {
  const { pagina: p, dados } = abrir()
  p.irSalvos()
  p.abrirSalvo(1)
  p.abrirExercicio(0)
  p.abrirCarga()
  p.selecionarPlacas()
  p.cargaMais5()
  p.cargaMaisMenor()
  p.cargaMaisMenor()
  assert.equal(p.cargaRotulo, '7 placas')
  p.salvarCarga()
  assert.equal(p.exCarga, '7 placas')
  assert.match(p.treinoView[0].prog, /7 placas/)

  const registro = Object.values(JSON.parse(dados.setgo_cargas))[0]
  assert.deepEqual(registro, { valor: 7, unidade: 'placas' })
})

test('treino avulso nao oferece edicao de carga', () => {
  const { pagina: p } = abrir()
  avulso(p)
  p.abrirCarga()
  assert.equal(p.vista, 'exercicio')
})
