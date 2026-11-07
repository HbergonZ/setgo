// Guarda a sessão de treino em andamento: em memória (compartilhada entre as páginas) e no storage, para retomar.
import storage from '@system.storage'

var CHAVE = 'sessao_v1'
var sessao = null

export function definir(s) {
  sessao = s
  persistir()
}

export function obter() {
  return sessao
}

export function persistir() {
  if (!sessao) return
  try {
    storage.set({ key: CHAVE, value: JSON.stringify(sessao) })
  } catch (e) {}
}

export function limpar() {
  sessao = null
  try {
    storage.delete({ key: CHAVE })
  } catch (e) {}
}

// Carrega a sessão salva e chama pronto(sessao) com o objeto ou null.
export function carregar(pronto) {
  if (sessao) {
    pronto(sessao)
    return
  }
  try {
    storage.get({
      key: CHAVE,
      success: function (texto) {
        var s = null
        try { s = texto ? JSON.parse(texto) : null } catch (e) { s = null }
        sessao = s && s.ex ? s : null
        pronto(sessao)
      },
      fail: function () { sessao = null; pronto(null) }
    })
  } catch (e) {
    pronto(null)
  }
}
