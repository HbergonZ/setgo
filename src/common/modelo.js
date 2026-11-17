// Dados dos treinos salvos de exemplo e funções puras de apoio, sem APIs do Vela, para rodar na pulseira e nos testes do Node.
// Cada exercício tem um tipo: 'reps' (repetições), 'tempo' (isometria em segundos) ou 'combo' (dois movimentos por série).

// Treinos de exemplo. Edite esta lista para usar os seus; os testes conferem as metas definidas aqui.
export var SALVOS = [
  { nome: 'Costa / Ombro', ex: [
    { nome: 'Puxador frente barra', series: 4, tipo: 'reps', reps: 12, descanso: 30 },
    { nome: 'Remada polia alta corda', series: 4, tipo: 'reps', reps: 12, descanso: 30 },
    { nome: 'Peck deck invertido', series: 4, tipo: 'reps', reps: 12, descanso: 30 },
    { nome: 'Desenvolv. maquina fechada', series: 4, tipo: 'reps', reps: 10, descanso: 30 },
    { nome: 'Elevacao lateral halteres', series: 4, tipo: 'reps', reps: 10, descanso: 30 },
    { nome: 'Elevacao frontal anilha', series: 3, tipo: 'reps', reps: 10, descanso: 30 },
    { nome: 'Banco lombar isometria', series: 3, tipo: 'tempo', seg: 30, descanso: 30 }
  ] },
  { nome: 'Perna / Biceps', ex: [
    { nome: 'Leg Press 45', series: 4, tipo: 'reps', reps: 15, descanso: 30 },
    { nome: 'Cadeira Extensora', series: 3, tipo: 'reps', reps: 12, descanso: 30 },
    { nome: 'Cadeira Flexora', series: 4, tipo: 'reps', reps: 12, descanso: 30 },
    { nome: 'Cadeira Abdutora', series: 4, tipo: 'reps', reps: 15, descanso: 30 },
    { nome: 'Panturrilha Vertical', series: 4, tipo: 'reps', reps: 15, descanso: 30 },
    { nome: 'Rosca alt + direta barra', series: 3, tipo: 'combo', a: 20, b: 10, descanso: 30 }
  ] },
  { nome: 'Peito / Triceps', ex: [
    { nome: 'Supino inclinado halteres', series: 4, tipo: 'reps', reps: 12, descanso: 30 },
    { nome: 'Peck deck', series: 4, tipo: 'reps', reps: 12, descanso: 30 },
    { nome: 'Supino Maquina', series: 4, tipo: 'reps', reps: 12, descanso: 30 },
    { nome: 'Triceps Polia', series: 4, tipo: 'reps', reps: 12, descanso: 30 },
    { nome: 'Triceps Banco', series: 4, tipo: 'reps', reps: 12, descanso: 30 },
    { nome: 'Prancha isometrica alta', series: 4, tipo: 'tempo', seg: 30, descanso: 30 }
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

// A fonte do firmware da Band 8 Pro não renderiza os acentos das sessões antigas.
export function nomeCompativel(nome) {
  return nome.replace(/[àáâãä]/g, 'a').replace(/[ÀÁÂÃÄ]/g, 'A')
    .replace(/[èéêë]/g, 'e').replace(/[ÈÉÊË]/g, 'E')
    .replace(/[ìíîï]/g, 'i').replace(/[ÌÍÎÏ]/g, 'I')
    .replace(/[òóôõö]/g, 'o').replace(/[ÒÓÔÕÖ]/g, 'O')
    .replace(/[ùúûü]/g, 'u').replace(/[ÙÚÛÜ]/g, 'U')
    .replace(/ç/g, 'c').replace(/Ç/g, 'C')
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

// Atualiza as metas de uma sessão salva sem apagar as séries já registradas.
export function atualizarSessaoSalva(sessao) {
  if (sessao.modo !== 'salvo') return sessao
  for (var i = 0; i < SALVOS.length; i++) {
    if (nomeCompativel(sessao.nome) !== SALVOS[i].nome) continue
    var atual = novaSessao(SALVOS[i], 'salvo')
    for (var j = 0; j < atual.ex.length; j++) {
      for (var k = 0; k < sessao.ex.length; k++) {
        if (nomeCompativel(sessao.ex[k].nome) === atual.ex[j].nome) {
          atual.done[j] = Math.max(0, Math.min(sessao.done[k], atual.ex[j].series))
          break
        }
      }
    }
    return atual
  }
  return sessao
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
