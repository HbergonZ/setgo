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

export function lerCarga(registro) {
  if (registro && typeof registro === 'object') {
    var unidade = registro.unidade === 'placas' ? 'placas' : 'kg'
    var valor = unidade === 'placas'
      ? Math.max(0, Math.min(500, Math.round(Number(registro.valor) || 0)))
      : normalizarCarga(registro.valor)
    return { valor: valor, unidade: unidade }
  }
  return { valor: normalizarCarga(registro), unidade: 'kg' }
}

export function criarCarga(valor, unidade) {
  var carga = lerCarga({ valor: valor, unidade: unidade })
  return carga.valor > 0 ? carga : null
}

export function ajustarCarga(valor, delta) {
  return normalizarCarga(normalizarCarga(valor) + delta)
}

export function rotuloCarga(registro) {
  var carga = lerCarga(registro)
  var n = carga.valor
  if (n === 0) return 'Sem carga'
  if (carga.unidade === 'placas') return String(n) + (n === 1 ? ' placa' : ' placas')
  return (n % 1 === 0 ? String(n) : n.toFixed(1)) + ' kg'
}
