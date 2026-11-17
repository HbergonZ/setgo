// Cargas persistentes dos exercicios fixos. Mantidas fora da sessao ativa para
// sobreviverem a FINALIZAR e serem reaproveitadas no proximo treino.

export function chaveCarga(treino, exercicio) {
  return treino + '|' + exercicio
}

export function normalizarCarga(valor) {
  var n = Number(valor)
  if (!isFinite(n)) return 0
  n = Math.round(n * 2) / 2
  return Math.max(0, Math.min(500, n))
}

export function ajustarCarga(valor, delta) {
  return normalizarCarga(normalizarCarga(valor) + delta)
}

export function rotuloCarga(valor) {
  var n = normalizarCarga(valor)
  if (n === 0) return 'Sem carga'
  return (n % 1 === 0 ? String(n) : n.toFixed(1)) + ' kg'
}
