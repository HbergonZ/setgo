// Compila o app e instala na Band 8 Pro pela página de debug escondida do Mi Fitness.
// Uso: npm run deploy [-- --no-build] [-- --uninstall] [-- --serial <id>]
//      npm run deploy -- --only-uninstall [--package <pacote>]   (remove o app da pulseira e para)
// Fluxo adaptado de github.com/mhdbaselar/xiaomi-band-development (MIT), reescrito em Node para Windows.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const tmp = join(raiz, '.tmp')
const args = process.argv.slice(2)
const semBuild = args.includes('--no-build')
const soDesinstalar = args.includes('--only-uninstall')
const desinstalar = soDesinstalar || args.includes('--uninstall')
const iPacote = args.indexOf('--package')
const iSerial = args.indexOf('--serial')

const espera = (ms) => new Promise((r) => setTimeout(r, ms))
const rodar = (cmd, a, opts = {}) => execFileSync(cmd, a, { encoding: 'utf8', shell: process.platform === 'win32' && cmd.endsWith('.bat'), ...opts })

function falhar(msg) {
  console.error('ERRO: ' + msg)
  process.exit(1)
}

// --- Celular ---
let serial = iSerial >= 0 ? args[iSerial + 1] : process.env.PHONE_SERIAL
if (!serial) {
  const lista = rodar('adb', ['devices']).split(/\r?\n/).filter((l) => /\tdevice$/.test(l) && !l.startsWith('emulator'))
  if (!lista.length) falhar('nenhum celular no adb. Ligue a depuração USB e aceite a autorização na tela.')
  serial = lista[0].split('\t')[0]
}
const adb = (...a) => rodar('adb', ['-s', serial, ...a])
const pkg = iPacote >= 0 ? args[iPacote + 1] : JSON.parse(readFileSync(join(raiz, 'src', 'manifest.json'), 'utf8')).package
console.log(`==> Celular: ${serial}\n==> Pacote: ${pkg}`)

const apk = adb('shell', 'pm', 'path', 'com.xiaomi.wearable').split(/\r?\n/)[0].replace('package:', '').trim()
if (!apk) falhar('Mi Fitness (com.xiaomi.wearable) não está instalado. A versão chinesa (.chn) não serve.')

// --- Build ---
if (!semBuild && !soDesinstalar) {
  console.log('==> Compilando...')
  // O aiot às vezes falha com EBUSY ao apagar a pasta temporária (VS Code observando); uma nova tentativa resolve.
  const versao = JSON.parse(readFileSync(join(raiz, 'src', 'manifest.json'), 'utf8')).versionName
  const rpkEsperado = join(raiz, 'dist', `${pkg}.debug.${versao}.rpk`)
  for (let tentativa = 1; ; tentativa++) {
    const inicio = Date.now()
    try {
      rodar('npm', ['run', 'build'], { cwd: raiz, stdio: 'pipe', shell: true })
      break
    } catch (e) {
      // O aiot gera o .rpk e só depois falha ao apagar C:devREA.temp_<projeto> (EBUSY no Windows).
      if (/EBUSY/.test(e.stderr || '') && existsSync(rpkEsperado) && statSync(rpkEsperado).mtimeMs >= inicio - 1000) {
        console.log('    (aiot falhou ao limpar a pasta temporária, mas o .rpk foi gerado)')
        break
      }
      if (tentativa >= 3) falhar('build falhou 3 vezes:\n' + (e.stdout || '') + (e.stderr || ''))
      console.log('==> Build falhou; tentando de novo...')
      await espera(3000)
    }
  }
}
const rpks = existsSync(join(raiz, 'dist')) ? readdirSync(join(raiz, 'dist')).filter((f) => f.endsWith('.rpk')).sort() : []
if (!rpks.length) falhar('nenhum .rpk em dist/')
const rpk = join(raiz, 'dist', rpks[rpks.length - 1])
const nomeRpk = pkg.replace(/\./g, '_') + '.rpk'
console.log('==> RPK: ' + rpk)

// --- launch.dex ---
const dexCelular = '/data/local/tmp/launch.dex'
let temDex = true
try { adb('shell', `test -f ${dexCelular} && echo ok`).includes('ok') || (temDex = false) } catch { temDex = false }
if (!temDex) {
  console.log('==> Gerando launch.dex...')
  const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || join(process.env.LOCALAPPDATA || homedir(), 'Android', 'Sdk')
  const ultimo = (dir) => readdirSync(dir).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).pop()
  const androidJar = join(sdk, 'platforms', ultimo(join(sdk, 'platforms')), 'android.jar')
  const d8 = join(sdk, 'build-tools', ultimo(join(sdk, 'build-tools')), process.platform === 'win32' ? 'd8.bat' : 'd8')
  mkdirSync(join(tmp, 'classes'), { recursive: true })
  rodar('javac', ['-source', '8', '-target', '8', '-nowarn', '-bootclasspath', androidJar, '-d', join(tmp, 'classes'), join(raiz, 'tools', 'LaunchFragment.java')], { stdio: 'pipe' })
  rodar(d8, [join(tmp, 'classes', 'LaunchFragment.class'), '--output', tmp], { stdio: 'pipe' })
  adb('push', join(tmp, 'classes.dex'), dexCelular)
}

// --- Envia o RPK e abre a página de debug ---
adb('shell', 'mkdir', '-p', '/sdcard/Xiaomi-band')
adb('push', rpk, '/sdcard/Xiaomi-band/' + nomeRpk)
// A automação da tela só funciona com o celular acordado e desbloqueado.
adb('shell', 'input', 'keyevent', 'KEYCODE_WAKEUP')
if (/KeyguardStateMonitor\s+mIsShowing=true/.test(adb('shell', 'dumpsys', 'window'))) {
  falhar('o celular está bloqueado. Desbloqueie a tela e rode de novo.')
}
console.log('==> Abrindo a página de debug do Mi Fitness...')
const saida = adb('shell', `CLASSPATH=${dexCelular} app_process / LaunchFragment ${apk}`)
if (!saida.includes('SUCCESS')) falhar('não abriu a página de debug: ' + saida)
await espera(4000)

// Procura um elemento na tela pelo texto (ou classe) e devolve o centro dele.
function achar(regex) {
  adb('shell', 'uiautomator', 'dump', '/sdcard/ui_tmp.xml')
  const xml = adb('shell', 'cat', '/sdcard/ui_tmp.xml')
  const m = xml.match(new RegExp(regex.source + '[^>]*?bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"'))
  if (!m) return null
  return [Math.round((+m[1] + +m[3]) / 2), Math.round((+m[2] + +m[4]) / 2)]
}
// Procura o elemento por alguns segundos (diálogos e teclado demoram a aparecer) e toca nele.
async function tocar(regex, descricao) {
  let p = null
  for (let i = 0; i < 6 && !p; i++) {
    p = achar(regex)
    if (!p) await espera(1000)
  }
  if (!p) falhar(`não achei "${descricao}" na tela do celular`)
  adb('shell', 'input', 'tap', String(p[0]), String(p[1]))
  await espera(1500)
}

console.log('==> Digitando o nome do pacote...')
// Às vezes o primeiro toque chega antes da página responder e o diálogo não abre; tenta até 3 vezes.
let campo = null
for (let tentativa = 0; tentativa < 3 && !campo; tentativa++) {
  await tocar(/text="click to input package name"/, 'click to input package name')
  campo = achar(/class="android.widget.EditText"/)
}
if (!campo) falhar('o diálogo do nome do pacote não abriu')
function textoDoCampo() {
  adb('shell', 'uiautomator', 'dump', '/sdcard/ui_tmp.xml')
  const m = adb('shell', 'cat', '/sdcard/ui_tmp.xml').match(/text="([^"]*)"[^>]*class="android.widget.EditText"/)
  return m ? m[1] : null
}
// Digita e confere; se o teclado ainda não estava pronto, limpa o campo e tenta de novo.
let digitado = null
for (let tentativa = 0; tentativa < 3 && digitado !== pkg; tentativa++) {
  adb('shell', 'input', 'tap', String(campo[0]), String(campo[1]))
  await espera(1000)
  adb('shell', 'input', 'keyevent', '123', ...Array(40).fill('67'))
  // Alguns teclados Samsung põem um espaço depois do primeiro ponto; só apaga se o espaço apareceu.
  adb('shell', 'input', 'text', pkg.slice(0, pkg.indexOf('.')))
  await espera(200)
  adb('shell', 'input', 'keyevent', '56')
  await espera(300)
  if ((textoDoCampo() || '').endsWith(' ')) adb('shell', 'input', 'keyevent', '67')
  adb('shell', 'input', 'text', pkg.slice(pkg.indexOf('.') + 1))
  await espera(600)
  digitado = textoDoCampo()
}
if (digitado !== pkg) falhar(`o campo mostra "${digitado}", esperado "${pkg}"`)
await tocar(/text="OK"/, 'OK')

if (desinstalar) {
  console.log('==> Desinstalando a versão anterior...')
  await tocar(/text="uninstall third app"/, 'uninstall third app')
  await espera(4000)
}
if (soDesinstalar) {
  console.log('==> Pronto. Confira se o app sumiu da lista da pulseira.')
  process.exit(0)
}
await tocar(/text="install third app"/, 'install third app')
console.log(`\n==> No celular, escolha o arquivo ${nomeRpk} na pasta Xiaomi-band.`)
console.log('    O Mi Fitness envia o app para a pulseira depois disso.')
