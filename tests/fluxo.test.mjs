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
const ux = await readFile(new URL('../src/pages/index/index.ux', import.meta.url), 'utf8')
const script = ux.match(/<script>([\s\S]*?)<\/script>/)[1]
  .replace(/^import .*$/gm, '').replace('export default', 'globalThis.pagina =')

function abrir(salvo) {
  let agora = 0
  let id = 0
  const timers = new Map()
  const dados = { setgo_sessao: salvo }
  const contexto = vm.createContext({
    ...modelo, ...picker,
    storage: {
      get({ key, success }) { success(dados[key]) },
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
    pagina, dados, timers,
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

test('ultima serie de isometria sai do cronometro ao zerar', () => {
  const { pagina: p, passar, timers } = abrir()
  avulso(p, 'tempo', 1)
  p.checar()
  assert.equal(p.vista, 'tempo')
  passar(10000)
  assert.equal(p.vista, 'exercicio')
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
  assert.equal(p.vista, 'exercicio')
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
  const salvo = JSON.stringify({ nome: 'Peito / Tríceps', modo: 'salvo',
    ex: [{ nome: 'Elevação de braços', tipo: 'reps', series: 3, reps: 12, descanso: 30 }], done: [1] })
  const { pagina: p } = abrir(salvo)
  p.continuar()
  assert.equal(p.ativoNome, 'Peito / Triceps')
  assert.equal(p.treinoView[0].nome, 'Elevacao de bracos')
  assert.equal(p.treinoView[0].prog, '1/3')
  p.abrirExercicio(0)
  assert.equal(p.exNome, 'Elevacao de bracos')
  assert.equal(p.ativo.done[0], 1)
})
