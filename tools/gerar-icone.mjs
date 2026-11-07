// Gera src/common/icon.png (96x96): disco laranja com um haltere escuro, sem dependências externas.
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

const T = 96, c = T / 2, R = 44
const LARANJA = [255, 122, 46]
const ESCURO = [24, 15, 0]

// Desenho do haltere (coordenadas da imagem), em torno do centro.
function haltere(x, y) {
  const dy = Math.abs(y - c)
  const barra = dy <= 5 && x >= 28 && x <= 68
  const placaE = x >= 24 && x <= 33 && dy <= 17
  const placaD = x >= 63 && x <= 72 && dy <= 17
  const pontaE = x >= 17 && x <= 24 && dy <= 11
  const pontaD = x >= 72 && x <= 79 && dy <= 11
  return barra || placaE || placaD || pontaE || pontaD
}

const linhas = []
for (let y = 0; y < T; y++) {
  const linha = [0]
  for (let x = 0; x < T; x++) {
    const d = Math.hypot(x + 0.5 - c, y + 0.5 - c)
    const alfa = Math.max(0, Math.min(1, R - d + 0.5))
    const cor = haltere(x, y) ? ESCURO : LARANJA
    linha.push(cor[0], cor[1], cor[2], Math.round(alfa * 255))
  }
  linhas.push(Buffer.from(linha))
}

const crc = (buf) => { let c = ~0; for (const b of buf) { c ^= b; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)) } return ~c >>> 0 }
const bloco = (tipo, dados) => {
  const t = Buffer.concat([Buffer.from(tipo), dados])
  const len = Buffer.alloc(4); len.writeUInt32BE(dados.length)
  const cc = Buffer.alloc(4); cc.writeUInt32BE(crc(t))
  return Buffer.concat([len, t, cc])
}
const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(T, 0); ihdr.writeUInt32BE(T, 4); ihdr[8] = 8; ihdr[9] = 6
writeFileSync(new URL('../src/common/icon.png', import.meta.url), Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  bloco('IHDR', ihdr), bloco('IDAT', deflateSync(Buffer.concat(linhas))), bloco('IEND', Buffer.alloc(0))
]))
