import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

// Carrega os mesmos módulos da pulseira sem transformar o build do Vela em ESM.
async function carregar(rel) {
  const fonte = await readFile(new URL(rel, import.meta.url), 'utf8')
  return import('data:text/javascript;base64,' + Buffer.from(fonte).toString('base64'))
}
const modelo = await carregar('../src/common/modelo.js')
const picker = await carregar('../src/common/picker.js')
const cargas = await carregar('../src/common/cargas.js')

test('metaEx e alvoEx cobrem reps, tempo e combo', () => {
  assert.equal(modelo.metaEx({ tipo: 'reps', series: 4, reps: 12 }), '4x12')
  assert.equal(modelo.metaEx({ tipo: 'tempo', series: 2, seg: 30 }), '2x 30s')
  assert.equal(modelo.metaEx({ tipo: 'combo', series: 3, a: 20, b: 10 }), '3x 20+10')
  assert.equal(modelo.alvoEx({ tipo: 'reps', reps: 12 }), '12 reps')
  assert.equal(modelo.alvoEx({ tipo: 'tempo', seg: 30 }), '30 seg')
  assert.equal(modelo.alvoEx({ tipo: 'combo', a: 20, b: 10 }), '20 + 10 reps')
})

test('novaSessao copia o treino e zera o progresso', () => {
  const treino = modelo.SALVOS[0]
  const s = modelo.novaSessao(treino, 'salvo')
  assert.equal(s.nome, treino.nome)
  assert.equal(s.modo, 'salvo')
  assert.equal(s.ex.length, treino.ex.length)
  assert.deepEqual(s.done, treino.ex.map(() => 0))
  s.ex[0].reps = 999
  assert.notEqual(treino.ex[0].reps, 999) // é cópia, não referência
})

test('exercicioFeito e treinoFeito', () => {
  const s = modelo.novaSessao({ nome: 'T', ex: [
    { tipo: 'reps', series: 2, reps: 10 },
    { tipo: 'tempo', series: 1, seg: 30 }
  ] }, 'avulso')
  assert.equal(modelo.treinoFeito(s), false)
  s.done = [2, 0]
  assert.equal(modelo.exercicioFeito(s, 0), true)
  assert.equal(modelo.exercicioFeito(s, 1), false)
  s.done = [2, 1]
  assert.equal(modelo.treinoFeito(s), true)
})

test('os 3 treinos salvos têm os exercícios esperados', () => {
  assert.equal(modelo.SALVOS.length, 3)
  assert.equal(modelo.SALVOS[0].ex.length, 7)
  assert.equal(modelo.SALVOS[1].ex.length, 6)
  assert.equal(modelo.SALVOS[2].ex.length, 6)
  assert.equal(modelo.SALVOS[0].ex[6].tipo, 'tempo')     // Banco lombar isometria
  assert.equal(modelo.SALVOS[1].ex[5].tipo, 'combo')     // Rosca alt + direta
  assert.deepEqual(modelo.SALVOS.map(t => t.ex.map(e => e.series)), [
    [4, 4, 4, 4, 4, 3, 3], [4, 3, 4, 4, 4, 3], [4, 4, 4, 4, 4, 4]
  ])
  assert.deepEqual(modelo.SALVOS.map(t => t.ex.map(modelo.alvoEx)), [
    ['12 reps', '12 reps', '12 reps', '10 reps', '10 reps', '10 reps', '30 seg'],
    ['15 reps', '12 reps', '12 reps', '15 reps', '15 reps', '20 + 10 reps'],
    ['12 reps', '12 reps', '12 reps', '12 reps', '12 reps', '30 seg']
  ])
  assert.equal(modelo.SALVOS[2].ex[5].tipo, 'tempo')
})

test('ajustar respeita limites e passo', () => {
  assert.equal(picker.ajustar(8, 'series', 1), 8)   // teto
  assert.equal(picker.ajustar(1, 'series', -1), 1)  // piso
  assert.equal(picker.ajustar(30, 'seg', 1), 35)    // passo 5
  assert.equal(picker.ajustar(10, 'seg', -1), 10)   // piso 10
})

test('montarEx monta por tipo com descanso de 30s', () => {
  const vals = { series: 3, reps: 12, seg: 40, a: 20, b: 10 }
  assert.deepEqual(picker.montarEx('Exercício 1', 'reps', vals), { nome: 'Exercício 1', series: 3, tipo: 'reps', descanso: 30, reps: 12 })
  assert.deepEqual(picker.montarEx('Exercício 2', 'tempo', vals), { nome: 'Exercício 2', series: 3, tipo: 'tempo', descanso: 30, seg: 40 })
  assert.deepEqual(picker.montarEx('Exercício 3', 'combo', vals), { nome: 'Exercício 3', series: 3, tipo: 'combo', descanso: 30, a: 20, b: 10 })
})

test('carga usa chave estavel, aceita kg e placas e migra valores antigos', () => {
  assert.equal(cargas.chaveCarga('Costa / Ombro', 'Puxador'), 'Costa / Ombro|Puxador')
  assert.equal(cargas.ajustarCarga(10, 0.5), 10.5)
  assert.equal(cargas.ajustarCarga(2, -5), 0)
  assert.equal(cargas.ajustarCarga(499, 5), 500)
  assert.equal(cargas.rotuloCarga(0), 'Sem carga')
  assert.equal(cargas.rotuloCarga(12.5), '12.5 kg')
  assert.equal(cargas.rotuloCarga(20), '20 kg')
  assert.deepEqual(cargas.lerCarga(12.5), { valor: 12.5, unidade: 'kg' })
  assert.deepEqual(cargas.criarCarga(8.4, 'placas'), { valor: 8, unidade: 'placas' })
  assert.equal(cargas.rotuloCarga({ valor: 1, unidade: 'placas' }), '1 placa')
  assert.equal(cargas.rotuloCarga({ valor: 8, unidade: 'placas' }), '8 placas')
})
