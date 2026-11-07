// Lógica pura do seletor de exercício do treino avulso (sem APIs do Vela), testável no Node.

// Linhas de stepper por tipo: cada par é [chave, rótulo].
export var LINHAS = {
  reps: [['series', 'Séries'], ['reps', 'Reps']],
  tempo: [['series', 'Séries'], ['seg', 'Segundos']],
  combo: [['series', 'Séries'], ['a', 'Reps 1'], ['b', 'Reps 2']]
}

// Limites de cada campo: mínimo, máximo e passo.
export var LIMITES = {
  series: { min: 1, max: 8, st: 1 },
  reps: { min: 1, max: 30, st: 1 },
  seg: { min: 10, max: 180, st: 5 },
  a: { min: 1, max: 40, st: 1 },
  b: { min: 1, max: 40, st: 1 }
}

export function valoresPadrao() {
  return { series: 3, reps: 12, seg: 30, a: 20, b: 10 }
}

export function ajustar(valor, chave, delta) {
  var c = LIMITES[chave]
  var v = valor + delta * c.st
  if (v < c.min) v = c.min
  if (v > c.max) v = c.max
  return v
}

// Monta o exercício a partir do tipo e dos valores escolhidos. descanso fixo de 30s.
export function montarEx(nome, tipo, vals) {
  var e = { nome: nome, series: vals.series, tipo: tipo, descanso: 30 }
  if (tipo === 'reps') e.reps = vals.reps
  else if (tipo === 'tempo') e.seg = vals.seg
  else { e.a = vals.a; e.b = vals.b }
  return e
}
