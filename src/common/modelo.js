// Dados dos treinos salvos e funções puras de apoio, sem APIs do Vela, para rodar na pulseira e nos testes do Node.
// Cada exercício tem um tipo: 'reps' (repetições), 'tempo' (isometria em segundos) ou 'combo' (dois movimentos por série).

export var SALVOS = [
  { nome: 'Costa / Ombro', ex: [
    { nome: 'Puxador frente barra', series: 4, tipo: 'reps', reps: 12, descanso: 30 },
    { nome: 'Remada polia alta corda', series: 2, tipo: 'reps', reps: 12, descanso: 30 },
    { nome: 'Peck deck invertido', series: 4, tipo: 'reps', reps: 12, descanso: 30 },
    { nome: 'Desenvolv. máquina fechada', series: 4, tipo: 'reps', reps: 10, descanso: 30 },
    { nome: 'Elevação lateral halteres', series: 4, tipo: 'reps', reps: 10, descanso: 30 },
    { nome: 'Elevação frontal anilha', series: 3, tipo: 'reps', reps: 10, descanso: 30 },
    { nome: 'Banco lombar isometria', series: 2, tipo: 'tempo', seg: 30, descanso: 30 }
  ] },
  { nome: 'Perna / Bíceps', ex: [
    { nome: 'Leg Press 45', series: 4, tipo: 'reps', reps: 15, descanso: 30 },
    { nome: 'Cadeira Extensora', series: 3, tipo: 'reps', reps: 12, descanso: 30 },
    { nome: 'Cadeira Flexora', series: 4, tipo: 'reps', reps: 12, descanso: 30 },
    { nome: 'Cadeira Abdutora', series: 4, tipo: 'reps', reps: 15, descanso: 30 },
    { nome: 'Panturrilha Vertical', series: 4, tipo: 'reps', reps: 15, descanso: 30 },
    { nome: 'Rosca alt + direta barra', series: 3, tipo: 'combo', a: 20, b: 10, descanso: 30 }
  ] },
  { nome: 'Peito / Tríceps', ex: [
    { nome: 'Supino inclinado halteres', series: 4, tipo: 'reps', reps: 12, descanso: 30 },
    { nome: 'Peck deck', series: 4, tipo: 'reps', reps: 12, descanso: 30 },
    { nome: 'Supino Máquina', series: 4, tipo: 'reps', reps: 12, descanso: 30 },
    { nome: 'Tríceps Polia', series: 4, tipo: 'reps', reps: 12, descanso: 30 },
    { nome: 'Tríceps Banco', series: 4, tipo: 'reps', reps: 12, descanso: 30 },
    { nome: 'Prancha isométrica alta', series: 4, tipo: 'tempo', seg: 30, descanso: 30 }
  ] }
]

// Texto curto do alvo (usado na lista): "4x12", "2x 30s" ou "3x 20+10".
export function metaEx(e) {
  if (e.tipo === 'tempo') return e.series + 'x ' + e.seg + 's'
  if (e.tipo === 'combo') return e.series + 'x ' + e.a + '+' + e.b
  return e.series + 'x' + e.reps
}

// Texto do alvo na tela do exercício: "12 reps", "30 seg" ou "20 + 10 reps".
export function alvoEx(e) {
  if (e.tipo === 'tempo') return e.seg + ' seg'
  if (e.tipo === 'combo') return e.a + ' + ' + e.b + ' reps'
  return e.reps + ' reps'
}

// Cria uma sessão de treino a partir de um treino (salvo ou avulso), com cópia própria e contagem zerada.
export function novaSessao(treino, modo) {
  return {
    nome: treino.nome,
    modo: modo,
    ex: JSON.parse(JSON.stringify(treino.ex)),
    done: treino.ex.map(function () { return 0 })
  }
}

export function exercicioFeito(sessao, i) {
  return sessao.done[i] >= sessao.ex[i].series
}

export function treinoFeito(sessao) {
  if (!sessao || !sessao.ex || !sessao.done) return false
  for (var i = 0; i < sessao.ex.length; i++) {
    if (sessao.done[i] < sessao.ex[i].series) return false
  }
  return true
}
