# Epic 01: Fundaciones

> Después de este epic existen los tokens de marca reales, el logo optimizado, los keyframes de la
> landing y toda la lógica pura que las secciones van a consumir — cada pieza con su test.

| | |
|---|---|
| **Epic id** | `01-fundaciones` |
| **Tareas** | `E1-T1` … `E1-T6` |
| **Depende de** | nada — se empieza acá |
| **Desbloquea** | `02-interfaz-publica` |
| **Paralelo con** | nada; es el primero |

No hace falta ningún otro archivo para completar este epic. Todo lo de abajo está repetido acá a
propósito.

---

## Contexto

**Este es un cambio brownfield sobre un repositorio Next.js que ya existe, ya está instalado y ya
tiene historia en git.** No hay scaffolding, no hay `npm install`, y **cero dependencias nuevas**:
todo lo que el código usa ya está en `package-lock.json`. Si algo parece necesitar un paquete, la
respuesta es reescribirlo con lo que hay.

Agua Viflomax vende agua purificada a domicilio en Maipú y Padre Hurtado. Este trabajo rediseña la
home pública según un handoff aprobado por el cliente.

## Stack

Next.js 14 App Router · TypeScript · Tailwind 3 (`tailwind.config.ts`, config JS) · PostgreSQL ·
Prisma 5 · NextAuth v4 · Vercel. Gestor de paquetes: **npm**. Runtime fijado en `.nvmrc` (Node 20).
Las versiones de dependencias están en `package-lock.json` — se leen de ahí, nunca se adivinan.

**No hay directorio `src/`.** `app/`, `components/`, `lib/` y `types/` cuelgan de la raíz, y el alias
`@/` apunta a la raíz.

| Tarea | Comando |
|---|---|
| Dev | `npm run dev` — http://localhost:3000 |
| Build (incluye `prisma generate` y el chequeo de tipos) | `npm run build` |
| Lint | `npm run lint` |
| Tests (todos) | `npx jest` |
| Tests (un archivo) | `npx jest lib/landing/gotas.test.ts` |

**Compuerta:** `npm run lint && npx jest && npm run build` pasa antes de marcar cualquier tarea de
este epic como hecha. **No existe un script `typecheck`**: el chequeo de tipos vive dentro de
`npm run build` y dentro de ts-jest.

Ninguna tarea de este epic necesita una base de datos corriendo, ni un servidor levantado, ni Docker.
`prisma generate` solo lee `prisma/schema.prisma`.

## Subárbol del directorio

Solo lo que este epic toca:

```
viflomax/
  app/
    globals.css              # existe — se le AGREGAN keyframes en E1-T3, no se le quita nada
  lib/
    productos.ts             # existe — solo se AGREGA filtrarPorCategoria en E1-T6
    productos.test.ts        # NUEVO en E1-T6
    contacto.ts              # existe — solo cambia la constante ZONA en E1-T6
    contacto.test.ts         # NUEVO en E1-T6
    landing/                 # NUEVO — logica pura, sin React, testeable con Jest
      gotas.ts               # NUEVO en E1-T4
      gotas.test.ts          # NUEVO en E1-T4
      mensaje-whatsapp.ts    # NUEVO en E1-T5
      mensaje-whatsapp.test.ts   # NUEVO en E1-T5
      payload-pedido.ts      # NUEVO en E1-T5
      payload-pedido.test.ts # NUEVO en E1-T5
  public/
    logo.png                 # NUEVO en E1-T2 — con alfa, bajo 150 KB
    logo.jpeg                # existe — NO SE TOCA, lo usan los iconos PWA
  tailwind.config.ts         # existe — se reemplaza el objeto colors.viflomax en E1-T1
  tailwind.config.test.ts    # NUEVO en E1-T1
```

Todo lo que quede fuera de este subárbol está fuera de alcance. Si una tarea parece exigir editar un
archivo que no está listado, detenerse y reportar: significa que la frontera del epic está mal.

## Modelo de datos tocado

Ninguno. Este epic **no** toca el esquema, ni corre migraciones, ni consulta la base. La única
relación con los datos es que los nombres de `PRODUCTOS` son la clave que el endpoint público
resuelve contra la tabla `Producto` — por eso no se cambian.

## Contratos

**Consumidos** — ya existen, no se reconstruyen:

| De | Interfaz | Garantía |
|---|---|---|
| `lib/productos.ts` | `PRODUCTOS`, `CATEGORIAS`, `formatCLP`, tipos `Producto` y `CategoriaId` | 9 productos: 4 `agua`, 3 `dispensadores`, 2 `extras`. Nombres y precios finales |
| `lib/contacto.ts` | `WHATSAPP_NUMERO`, `TIENE_WHATSAPP`, `TELEFONO_LEGIBLE`, `TELEFONO_HREF`, `linkWhatsApp`, `HORARIO` | Sin cambios. `linkWhatsApp(mensaje)` devuelve `''` si no hay número configurado |
| `app/api/pedidos/publico/route.ts` | `POST` con `{ nombre, telefono, email?, direccion, comuna, items: [{ productoId, cantidad }], notas? }` | **Congelado.** 201 con `{ data: { pedido_id, numero_pedido }, error: null }`; 400 y 500 con `{ data: null, error: string }`. `productoId` es el **nombre** del producto |

**Producidos** — el epic 02 depende de estas firmas exactas. Cambiar una lo rompe:

| Export | Firma | Lo usa |
|---|---|---|
| `lib/landing/gotas.ts` → `generarGotas` | `(semilla: number, cantidad: number, colorVar: string) => GotaEstilo[]` | `E2-T4`, `E2-T5` |
| `lib/landing/gotas.ts` → `GotaEstilo` | `{ left: number; duracion: number; retraso: number; opacidad: number; color: string }` | `E2-T3` |
| `lib/landing/mensaje-whatsapp.ts` → `construirMensajeWhatsApp` | `(datos: { producto: string; cantidad: number; nombre: string; telefono: string; direccion: string; comuna: string; notas?: string }) => string` | `E2-T6` |
| `lib/landing/payload-pedido.ts` → `construirPayloadPedido` | `(datos: { ...los mismos + email?: string }) => PayloadPedidoPublico` | `E2-T6` |
| `lib/productos.ts` → `filtrarPorCategoria` | `(productos: Producto[], filtro: 'todos' \| CategoriaId) => Producto[]` | `E2-T4` |
| `tailwind.config.ts` → clases | `bg-viflomax-azul-{100..900}`, `bg-viflomax-verde-{100..900}`, y los 4 alias viejos | todo el epic 02 |
| `app/globals.css` → clases | `.logo-float`, `.water-drop`, keyframes `logo-float` y `waterfall` | `E2-T2`, `E2-T3` |

## Convenciones que muerden en esta área

- **Los tests importan su módulo hermano con especificador relativo** (`import { generarGotas } from './gotas'`), que es el patrón de los 3 tests que ya existen en este repo y el único probado acá. El alias `@/` también está mapeado en `jest.config.js`, pero no se usa en tests.
- **`lib/landing/**` es puro:** sin React, sin `fetch`, sin `window`, sin `process.env`, sin `Math.random`, sin `Date.now`. Es lo único testeable en este repo, porque **no hay Testing Library instalada** y agregarla está fuera de alcance.
- **La home es estática y se hidrata.** Cualquier aleatoriedad durante el render provoca hydration mismatch. Por eso las gotas salen de un LCG sembrado.
- **Texto blanco sobre verde va siempre en `viflomax-verde-700` (`#3f6f31`, 5.95:1)**, nunca en `viflomax-verde` (`#6ab04c`, 2.65:1). Sobre azul: `-700` (6.65:1) o `-800` (9.57:1), nunca `viflomax-azul` (2.98:1).
- **Los 4 nombres de clase viejos** — `viflomax-azul`, `viflomax-azul-oscuro`, `viflomax-verde`, `viflomax-verde-claro` — se conservan como alias. Los usan 39 archivos de `/admin` y `/chofer` que **no se editan**.
- Los conteos del catálogo salen de contar el array literal de `lib/productos.ts`: **9 productos, 4 de `agua`, 3 de `dispensadores`, 2 de `extras`**. Si un test falla por conteo, se cuenta de nuevo en el archivo; no se ajusta el número a ojo.

Reglas completas del proyecto: `CLAUDE.md`. Reglas del área: `.claude/rules/landing-publica.md` y
`.claude/rules/contratos-congelados.md`. Los tres están en la raíz del proyecto — el builder los copió
ahí desde `workspace/` del bundle antes de la primera tarea.

---

## Tareas

Listadas en el mismo orden que `tasks.json`. Ese orden es el orden de construcción: se trabaja
de arriba hacia abajo y no se re-ordena por prioridad ni por lo que parezca rápido.

### `E1-T1` — Escalas de color y alias legacy en Tailwind

**Depende de:** nada · **Prioridad:** p0 — metadato para recortes de alcance, no un orden de ejecución

Reemplazar el objeto `colors.viflomax` de `tailwind.config.ts` por dos escalas anidadas 100–900 —`azul` y `verde`— más dos claves hermanas de compatibilidad. Tailwind aplana los objetos anidados con guiones, así que `bg-viflomax-azul` resuelve a `DEFAULT`, `bg-viflomax-azul-700` a la clave `700`, y `bg-viflomax-azul-oscuro` a la clave hermana; las claves hermanas no chocan con las numéricas.

Los valores exactos, que no hay que deducir: `azul` = `100 #eaf6fc`, `200 #cdeaf7`, `300 #a3d9f0`, `400 #6dc2e3`, `DEFAULT #2f9fd6`, `600 #2380ac`, `700 #1a628a`, `800 #164a63`, `900 #0d2f40`. `verde` = `100 #eef9e6`, `200 #d9f0c7`, `300 #bce39c`, `400 #97cf6c`, `DEFAULT #6ab04c`, `600 #549140`, `700 #3f6f31`, `800 #2c4f23`, `900 #1c3216`. Más `'azul-oscuro': '#164a63'` y `'verde-claro': '#97cf6c'`.

`content`, `fontFamily` y `plugins` quedan como están. **Ninguno de los 39 archivos de `/admin` y `/chofer` que usan los alias se edita**: ese es el punto de conservarlos. El test va en la raíz e importa `./tailwind.config` con especificador relativo.

**Archivos**

- `tailwind.config.ts` — editar — solo `theme.extend.colors.viflomax`
- `tailwind.config.test.ts` — nuevo — en la raíz, importa `./tailwind.config`

**Aceptación**

Copiados literalmente del array `acceptance` de esta tarea en `tasks.json`. Cada uno lo
decide un comando de abajo, en esta máquina, durante el build.

1. **WHEN** `npx jest tailwind.config.test.ts` runs **THE SYSTEM SHALL** exit 0 with 0 failed and 0 skipped.
2. **WHEN** the test reads `theme.extend.colors.viflomax.azul` **THE SYSTEM SHALL** find the nine keys `100`, `200`, `300`, `400`, `DEFAULT`, `600`, `700`, `800`, `900`, with `DEFAULT` equal to `#2f9fd6` and `800` equal to `#164a63`.
3. **WHEN** the test reads `theme.extend.colors.viflomax.verde` **THE SYSTEM SHALL** find the same nine keys, with `DEFAULT` equal to `#6ab04c`, `400` equal to `#97cf6c` and `700` equal to `#3f6f31`.
4. **WHEN** the test reads the legacy sibling keys **THE SYSTEM SHALL** find `azul-oscuro` equal to `#164a63` and `verde-claro` equal to `#97cf6c`, so `bg-viflomax-azul-oscuro` and `bg-viflomax-verde-claro` keep resolving in the 39 files that already use them.
5. **WHEN** `npm run lint` runs **THE SYSTEM SHALL** exit 0 with zero errors and zero warnings.
6. **WHEN** `npm run build` runs **THE SYSTEM SHALL** exit 0.

**Verificar** — todos los comandos, en orden, desde la raíz del proyecto. Cada uno sale 0
cuando esta tarea está correcta; que el último salga 0 es lo que la deja hecha.

```bash
npx jest tailwind.config.test.ts
npm run lint
npm run build
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T1: escalas de color viflomax y alias legacy"
git tag step-01-tokens-color
git ls-files --error-unmatch tailwind.config.ts tailwind.config.test.ts   # expect: exit 0 — ya commiteados
```

Correr ambos después de que el último comando de `Verificar` salga 0, antes de empezar la
tarea siguiente. La etiqueta es el objetivo de rollback de esta tarea y lo que cuenta la
compuerta final del build. Nunca inventar la etiqueta: se copia el campo `checkpoint`.

### `E1-T2` — Logo optimizado con transparencia

**Depende de:** nada · **Prioridad:** p0 — metadato para recortes de alcance, no un orden de ejecución

Producir `public/logo.png`: el logo real con fondo transparente, bajo 150 KB, para que el hero lo sirva por `next/image` sobre el gradiente sin una caja blanca detrás. El origen es `design_handoff_landing_redesign/assets/logo.png`, que pesa 1 520 376 bytes y **no puede embarcarse así**: sería el LCP de la home.

**La optimización es un sub-paso manual** — `sips`, `magick`, `pngquant`, Squoosh, lo que haya— porque este repo no tiene librería de imágenes y este cambio no puede agregar una. Si no baja de 150 KB sin verse mal, bajar a PNG paletizado con `tRNS` (el comprobador lo acepta) o reducir el ancho: el hero lo muestra a unos 320 px, así que 800 px sobran.

`public/logo.jpeg` **no se toca ni se reemplaza**: lo consumen `app/icon.tsx`, `app/icon-192/route.tsx`, `app/icon-512/route.tsx` y `app/apple-icon.tsx`, y además es JPEG sin alfa, así que sobre el gradiente mostraría un rectángulo blanco.

El comprobador `scripts-check-logo.cjs` lo escribe **la primera línea del bloque `Verificar`**, con un heredoc: ahí se crea, ahí se corre y ahí se borra, y la última línea comprueba que ya no está. Por eso figura en la lista de archivos de esta tarea aunque no sobreviva al paso. Su contenido, que es exactamente lo que el heredoc escribe:

```js
const fs = require('fs')
const b = fs.readFileSync('public/logo.png')
const fail = (m) => { console.error('FALLA:', m); process.exit(1) }
if (b.length >= 153600) fail('pesa ' + b.length + ' bytes, el limite es 153600')
if (b.toString('latin1', 1, 4) !== 'PNG') fail('no es un PNG')
const ancho = b.readUInt32BE(16)
const tipoColor = b[25]
if (ancho < 600) fail('ancho ' + ancho + 'px, minimo 600')
const tieneTRNS = b.includes(Buffer.from('tRNS', 'latin1'))
if (!(tipoColor === 4 || tipoColor === 6 || (tipoColor === 3 && tieneTRNS))) {
  fail('tipo de color ' + tipoColor + ' sin canal alfa ni tRNS')
}
console.log('OK', b.length, 'bytes,', ancho + 'px, tipo de color', tipoColor)
```

**Archivos**

- `public/logo.png` — nuevo — con canal alfa, bajo 153600 bytes, al menos 600 px de ancho
- `scripts-check-logo.cjs` — nuevo y temporal — lo escribe el heredoc de la primera línea del `Verificar` y lo borra la penúltima; no queda en el repo

**Aceptación**

Copiados literalmente del array `acceptance` de esta tarea en `tasks.json`. Cada uno lo
decide un comando de abajo, en esta máquina, durante el build.

1. **WHEN** `test -f public/logo.png` runs **THE SYSTEM SHALL** exit 0.
2. **WHEN** the size check reads `public/logo.png` **THE SYSTEM SHALL** report fewer than 153600 bytes.
3. **WHEN** the PNG header check reads the IHDR chunk **THE SYSTEM SHALL** report colour type 4 or 6, or colour type 3 accompanied by a `tRNS` chunk, so the mark keeps a transparent background over the hero gradient.
4. **WHEN** the PNG header check reads the IHDR width **THE SYSTEM SHALL** report at least 600 pixels, so the mark is not a thumbnail upscaled in the hero.
5. **WHEN** `git check-ignore -q public/logo.png` runs **THE SYSTEM SHALL** exit 1, meaning no ignore pattern excludes the new asset.
6. **WHEN** `test -f public/logo.jpeg` runs **THE SYSTEM SHALL** exit 0, because `app/icon.tsx`, `app/icon-192/route.tsx`, `app/icon-512/route.tsx` and `app/apple-icon.tsx` still serve it.

**Verificar** — todos los comandos, en orden, desde la raíz del proyecto. Cada uno sale 0
cuando esta tarea está correcta; que el último salga 0 es lo que la deja hecha.

```bash
cat > scripts-check-logo.cjs <<'EOF'
const fs = require('fs')
const b = fs.readFileSync('public/logo.png')
const fail = (m) => { console.error('FALLA:', m); process.exit(1) }
if (b.length >= 153600) fail('pesa ' + b.length + ' bytes, el limite es 153600')
if (b.toString('latin1', 1, 4) !== 'PNG') fail('no es un PNG')
const ancho = b.readUInt32BE(16)
const tipoColor = b[25]
if (ancho < 600) fail('ancho ' + ancho + 'px, minimo 600')
const tieneTRNS = b.includes(Buffer.from('tRNS', 'latin1'))
if (!(tipoColor === 4 || tipoColor === 6 || (tipoColor === 3 && tieneTRNS))) {
  fail('tipo de color ' + tipoColor + ' sin canal alfa ni tRNS')
}
console.log('OK', b.length, 'bytes,', ancho + 'px, tipo de color', tipoColor)
EOF
test -f public/logo.png
test -f public/logo.jpeg
node scripts-check-logo.cjs
git check-ignore -q public/logo.png; test $? -eq 1
rm -f scripts-check-logo.cjs
test ! -e scripts-check-logo.cjs
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T2: logo optimizado con alfa para el hero"
git tag step-02-logo-optimizado
git ls-files --error-unmatch public/logo.png   # expect: exit 0 — ya commiteado
```

Correr ambos después de que el último comando de `Verificar` salga 0, antes de empezar la
tarea siguiente. La etiqueta es el objetivo de rollback de esta tarea y lo que cuenta la
compuerta final del build. Nunca inventar la etiqueta: se copia el campo `checkpoint`.

### `E1-T3` — Keyframes, gota y guardia de movimiento reducido

**Depende de:** `E1-T1` · **Prioridad:** p0 — metadato para recortes de alcance, no un orden de ejecución

Agregar a `app/globals.css` los dos pares keyframe/clase de la landing y el bloque de movimiento reducido. **Solo se agrega: no se borra nada en esta tarea.**

```css
@keyframes logo-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-14px); }
}

.logo-float {
  animation: logo-float 5s ease-in-out infinite;
}

@keyframes waterfall {
  0%       { transform: translateY(-10%) rotate(45deg); opacity: 0; }
  10%, 90% { opacity: var(--drop-op, 0.3); }
  100%     { transform: translateY(110vh) rotate(45deg); opacity: 0; }
}

.water-drop {
  position: absolute;
  top: -5%;
  width: 10px;
  height: 14px;
  border-radius: 50% 50% 50% 0;
  animation-name: waterfall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  will-change: transform, opacity;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .logo-float,
  .water-drop {
    animation: none;
  }
}
```

`left`, `animation-duration`, `animation-delay`, `--drop-op` y `background` los aporta cada gota por `style` inline desde el array de `generarGotas`. **La rotación de 45° va dentro de los keyframes** porque la animación anima `transform`: declararla como `transform` estático de la clase la haría desaparecer apenas arranca.

**No borrar `.bubble` ni `@keyframes float` acá.** Su último consumidor es el `Hero.tsx` viejo, vivo hasta `E2-T2`.

**Archivos**

- `app/globals.css` — editar — solo agregando; `.bubble` y `@keyframes float` se quedan hasta `E2-T2`

**Aceptación**

Copiados literalmente del array `acceptance` de esta tarea en `tasks.json`. Cada uno lo
decide un comando de abajo, en esta máquina, durante el build.

1. **WHEN** `npm run build` runs **THE SYSTEM SHALL** exit 0, proving Tailwind compiled `app/globals.css` with no CSS syntax error.
2. **WHEN** `grep` searches `app/globals.css` **THE SYSTEM SHALL** find `@keyframes logo-float` and the literal `translateY(-14px)`.
3. **WHEN** `grep` searches `app/globals.css` **THE SYSTEM SHALL** find a `.logo-float` rule whose animation shorthand carries `5s`, `ease-in-out` and `infinite`.
4. **WHEN** `grep` searches `app/globals.css` **THE SYSTEM SHALL** find `@keyframes waterfall` carrying `rotate(45deg)` inside the transform of both the 0% and the 100% stop, and `translateY(110vh)` at the 100% stop.
5. **WHEN** `grep` searches `app/globals.css` **THE SYSTEM SHALL** find a `.water-drop` rule carrying `border-radius: 50% 50% 50% 0`, `width: 10px`, `height: 14px` and `animation-name: waterfall`.
6. **WHEN** `grep` searches `app/globals.css` **THE SYSTEM SHALL** find a `prefers-reduced-motion: reduce` block that sets `animation: none` and names both `.logo-float` and `.water-drop`.

**Verificar** — todos los comandos, en orden, desde la raíz del proyecto. Cada uno sale 0
cuando esta tarea está correcta; que el último salga 0 es lo que la deja hecha.

```bash
grep -q '@keyframes logo-float' app/globals.css
grep -q 'translateY(-14px)' app/globals.css
grep -q 'animation: logo-float 5s ease-in-out infinite' app/globals.css
grep -q '@keyframes waterfall' app/globals.css
grep -q 'translateY(-10%) rotate(45deg)' app/globals.css
grep -q 'translateY(110vh) rotate(45deg)' app/globals.css
grep -q 'border-radius: 50% 50% 50% 0' app/globals.css
grep -q 'width: 10px' app/globals.css
grep -q 'height: 14px' app/globals.css
grep -q 'animation-name: waterfall' app/globals.css
grep -q 'prefers-reduced-motion: reduce' app/globals.css
grep -A4 'prefers-reduced-motion: reduce' app/globals.css | grep -q 'animation: none'
npm run build
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T3: keyframes logo-float y waterfall con guardia de movimiento reducido"
git tag step-03-keyframes-motion
```

Correr ambos después de que el último comando de `Verificar` salga 0, antes de empezar la
tarea siguiente. La etiqueta es el objetivo de rollback de esta tarea y lo que cuenta la
compuerta final del build. Nunca inventar la etiqueta: se copia el campo `checkpoint`.

### `E1-T4` — Generador determinista de gotas

**Depende de:** nada · **Prioridad:** p0 — metadato para recortes de alcance, no un orden de ejecución

Crear el módulo puro que produce el array de gotas. **Determinista por semilla**: la home se prerrenderiza estática y se hidrata, así que con `Math.random()` el servidor y el cliente producirían valores distintos y React reportaría un hydration mismatch.

`GotaEstilo` es `{ left: number; duracion: number; retraso: number; opacidad: number; color: string }`. El generador es un LCG clásico, `s = (s * 9301 + 49297) % 233280`, con `next()` devolviendo `s / 233280`. Por gota consume cuatro valores **en este orden**: `left` (0–100, redondeado a 2 decimales), `duracion` (4–9 s), `retraso` (−9–0 s, negativo para que la lluvia arranque ya poblada en el primer paint) y `opacidad` (0.15–0.4). `color` es el `colorVar` recibido, sin transformar.

**Prohibido en este archivo:** `Math.random`, `Date.now`, `useEffect`, cualquier lectura de `process.env`. El test afirma el valor ancla con `toBeCloseTo(49.04, 2)`, no con igualdad estricta, para que ni siquiera dependa de la representación en punto flotante.

**Archivos**

- `lib/landing/gotas.ts` — nuevo — exporta `GotaEstilo` y `generarGotas`
- `lib/landing/gotas.test.ts` — nuevo — importa `./gotas`

**Aceptación**

Copiados literalmente del array `acceptance` de esta tarea en `tasks.json`. Cada uno lo
decide un comando de abajo, en esta máquina, durante el build.

1. **WHEN** `npx jest lib/landing/gotas.test.ts` runs **THE SYSTEM SHALL** exit 0 with 0 failed and 0 skipped.
2. **WHEN** `generarGotas(7, 16, 'x')` is called twice in the same process **THE SYSTEM SHALL** return two deeply equal arrays, proving the generator is seeded and never calls `Math.random`.
3. **WHEN** `generarGotas(7, 16, 'x')` is called **THE SYSTEM SHALL** return exactly 16 items, every one with `left` between 0 and 100 inclusive.
4. **WHEN** `generarGotas(7, 16, 'x')` is called **THE SYSTEM SHALL** return every item with `duracion` between 4 and 9, `retraso` between -9 and 0, and `opacidad` between 0.15 and 0.4.
5. **WHEN** `generarGotas(7, 16, 'x')[0].left` is read **THE SYSTEM SHALL** equal 49.04 to two decimal places, the value the LCG `(s * 9301 + 49297) % 233280` yields from seed 7.
6. **WHEN** `generarGotas(11, 16, 'x')` is compared with `generarGotas(7, 16, 'x')` **THE SYSTEM SHALL** return a different array, proving the seed is honoured rather than ignored.

**Verificar** — todos los comandos, en orden, desde la raíz del proyecto. Cada uno sale 0
cuando esta tarea está correcta; que el último salga 0 es lo que la deja hecha.

```bash
npx jest lib/landing/gotas.test.ts
npm run lint
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T4: generador determinista de gotas con LCG sembrado"
git tag step-04-gotas
```

Correr ambos después de que el último comando de `Verificar` salga 0, antes de empezar la
tarea siguiente. La etiqueta es el objetivo de rollback de esta tarea y lo que cuenta la
compuerta final del build. Nunca inventar la etiqueta: se copia el campo `checkpoint`.

### `E1-T5` — Constructores puros del pedido

**Depende de:** nada · **Prioridad:** p0 — metadato para recortes de alcance, no un orden de ejecución

Los dos módulos puros que arman lo que el formulario de `E2-T6` va a enviar. Van aparte del componente a propósito: son lo único de ese flujo que este repo puede testear, porque no hay Testing Library instalada.

`construirMensajeWhatsApp(datos)` devuelve las líneas unidas con salto de línea, en este orden: `Hola! Quiero hacer un pedido de Agua Viflomax:`, `Producto: <producto> x<cantidad>`, `Nombre: <nombre>`, `Teléfono: <telefono>`, `Dirección: <direccion>, <comuna>` y `Notas: <notas>`. **La sexta línea solo aparece si `notas` tiene contenido tras `trim()`**; si no, el string tiene exactamente cinco líneas y no contiene la subcadena `Notas:`.

`construirPayloadPedido(datos)` devuelve exactamente el cuerpo que el endpoint congelado acepta: `{ nombre, telefono, direccion, comuna, items: [{ productoId, cantidad }] }`, con `email` y `notas` **omitidos** —no como string vacío— cuando vienen vacíos, y con `productoId` igual al nombre del producto tal como aparece en `PRODUCTOS`, sin slug ni `encodeURIComponent`. Todos los strings se recortan con `trim()` antes de entrar al payload.

**Archivos**

- `lib/landing/mensaje-whatsapp.ts` — nuevo — `construirMensajeWhatsApp`
- `lib/landing/mensaje-whatsapp.test.ts` — nuevo — importa `./mensaje-whatsapp`
- `lib/landing/payload-pedido.ts` — nuevo — `construirPayloadPedido` y el tipo `PayloadPedidoPublico`
- `lib/landing/payload-pedido.test.ts` — nuevo — importa `./payload-pedido`

**Aceptación**

Copiados literalmente del array `acceptance` de esta tarea en `tasks.json`. Cada uno lo
decide un comando de abajo, en esta máquina, durante el build.

1. **WHEN** `npx jest lib/landing/mensaje-whatsapp.test.ts lib/landing/payload-pedido.test.ts` runs **THE SYSTEM SHALL** exit 0 with 0 failed and 0 skipped.
2. **WHEN** `construirMensajeWhatsApp` receives the fixture with `notas` **THE SYSTEM SHALL** return exactly `Hola! Quiero hacer un pedido de Agua Viflomax:` then a newline, `Producto: Recarga 20 Litros x2` then a newline, `Nombre: Ana Pérez` then a newline, `Teléfono: +56 9 1234 5678` then a newline, `Dirección: Av. Ejemplo 123, Maipú` then a newline, and `Notas: Dejar en conserjería`.
3. **WHEN** `construirMensajeWhatsApp` receives the same fixture with `notas` absent or blank **THE SYSTEM SHALL** return a string of exactly 5 lines that does not contain the substring `Notas:`.
4. **WHEN** `construirPayloadPedido` receives a filled form **THE SYSTEM SHALL** return an object whose keys are exactly `nombre`, `telefono`, `direccion`, `comuna` and `items`, with `items[0].productoId` equal to the product name as it appears in `PRODUCTOS` and `items[0].cantidad` a number greater than 0.
5. **WHEN** `construirPayloadPedido` receives an empty `email` or an empty `notas` **THE SYSTEM SHALL** omit those keys from the returned object rather than sending an empty string.
6. **WHEN** `construirPayloadPedido` receives `comuna` equal to `Otra comuna` **THE SYSTEM SHALL** pass it through verbatim, because `/api/pedidos/publico` answers 400 when `comuna` is blank.

**Verificar** — todos los comandos, en orden, desde la raíz del proyecto. Cada uno sale 0
cuando esta tarea está correcta; que el último salga 0 es lo que la deja hecha.

```bash
npx jest lib/landing/mensaje-whatsapp.test.ts
npx jest lib/landing/payload-pedido.test.ts
npm run lint
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T5: constructores puros de mensaje y payload de pedido"
git tag step-05-constructores-pedido
```

Correr ambos después de que el último comando de `Verificar` salga 0, antes de empezar la
tarea siguiente. La etiqueta es el objetivo de rollback de esta tarea y lo que cuenta la
compuerta final del build. Nunca inventar la etiqueta: se copia el campo `checkpoint`.

### `E1-T6` — Filtro de catálogo y zona de cobertura

**Depende de:** nada · **Prioridad:** p0 — metadato para recortes de alcance, no un orden de ejecución

Extraer el filtrado de categoría a una función pura testeable, y corregir la única constante de `lib/contacto.ts` que el diseño aprobado cambia.

La firma es `filtrarPorCategoria(productos: Producto[], filtro: 'todos' | CategoriaId): Producto[]`: devuelve un array nuevo, nunca muta la entrada, y con `'todos'` devuelve todos los productos en su orden original. **`PRODUCTOS`, `CATEGORIAS`, `formatCLP`, los nombres, los precios y las categorías no se tocan.**

Los conteos de los criterios salen de contar el array literal de `lib/productos.ts`: 9 productos, 4 con `categoria: 'agua'`, 3 con `'dispensadores'`, 2 con `'extras'`. Si un test falla por conteo, se cuenta de nuevo en el archivo; no se ajusta el número a ojo.

En `lib/contacto.ts` cambia **una sola línea**: `ZONA` pasa de `'Maipú y comunas cercanas'` a `'Maipú y Padre Hurtado'`. **`HORARIO` se queda tal cual** en `'Lun a Sáb · 9:00 – 19:00 hrs'`: el handoff decía "Lunes a viernes" y el horario real del negocio manda.

**Archivos**

- `lib/productos.ts` — editar — solo agregar `filtrarPorCategoria`
- `lib/productos.test.ts` — nuevo — importa `./productos`
- `lib/contacto.ts` — editar — solo la constante `ZONA`
- `lib/contacto.test.ts` — nuevo — importa `./contacto`

**Aceptación**

Copiados literalmente del array `acceptance` de esta tarea en `tasks.json`. Cada uno lo
decide un comando de abajo, en esta máquina, durante el build.

1. **WHEN** `npx jest lib/productos.test.ts lib/contacto.test.ts` runs **THE SYSTEM SHALL** exit 0 with 0 failed and 0 skipped.
2. **WHEN** `filtrarPorCategoria(PRODUCTOS, 'todos')` is called **THE SYSTEM SHALL** return all 9 products in their original order.
3. **WHEN** `filtrarPorCategoria(PRODUCTOS, 'agua')` is called **THE SYSTEM SHALL** return exactly 4 products, every one of them with `categoria` equal to `agua`.
4. **WHEN** `filtrarPorCategoria(PRODUCTOS, 'dispensadores')` and `filtrarPorCategoria(PRODUCTOS, 'extras')` are called **THE SYSTEM SHALL** return exactly 3 and exactly 2 products respectively.
5. **WHEN** `filtrarPorCategoria` returns **THE SYSTEM SHALL** have returned a new array and SHALL NOT have mutated `PRODUCTOS`, whose length stays 9.
6. **WHEN** `ZONA` is read from `lib/contacto.ts` **THE SYSTEM SHALL** equal `Maipú y Padre Hurtado`, and `HORARIO` SHALL still equal `Lun a Sáb · 9:00 – 19:00 hrs`.

**Verificar** — todos los comandos, en orden, desde la raíz del proyecto. Cada uno sale 0
cuando esta tarea está correcta; que el último salga 0 es lo que la deja hecha.

```bash
npx jest lib/productos.test.ts
npx jest lib/contacto.test.ts
npm run lint
npm run build
```

**Checkpoint**

```bash
git add -A && git commit -m "E1-T6: filtrarPorCategoria y zona de cobertura Maipu/Padre Hurtado"
git tag step-06-filtros-catalogo
```

Correr ambos después de que el último comando de `Verificar` salga 0, antes de empezar la
tarea siguiente. La etiqueta es el objetivo de rollback de esta tarea y lo que cuenta la
compuerta final del build. Nunca inventar la etiqueta: se copia el campo `checkpoint`.

---

## Aceptación del epic

El epic está hecho cuando las 6 tareas están `done` **y**:

1. **WHEN** `npx jest` runs **THE SYSTEM SHALL** exit 0 with 0 failed and 0 skipped across all 9 suites — the 3 that already existed plus the 6 this epic adds.
2. **WHEN** `npm run build` runs **THE SYSTEM SHALL** exit 0, proving the retokenised Tailwind config and the new CSS compile and that the 39 files using the legacy aliases still resolve.

```bash
npm run lint && npx jest && npm run build
```

Desde la raíz del proyecto. Los dos criterios los deciden esos comandos: nada acá espera a una
persona ni a un servicio externo.

## Trampas

- **Borrar `.bubble` de `app/globals.css` en `E1-T3`.** No. Su último consumidor es el `Hero.tsx`
  viejo, que sigue vivo hasta `E2-T2`; borrarlo acá deja el hero actual sin animación durante cinco
  tareas. `E2-T2` lo elimina.
- **Cambiar `HORARIO` en `lib/contacto.ts` para que coincida con el handoff.** El handoff dice
  "Lunes a viernes" y el horario real del negocio es `'Lun a Sáb · 9:00 – 19:00 hrs'`. Solo cambia
  `ZONA`.
- **Reemplazar `public/logo.jpeg` por el PNG nuevo.** Lo consumen `app/icon.tsx`,
  `app/icon-192/route.tsx`, `app/icon-512/route.tsx` y `app/apple-icon.tsx`. El PNG se **agrega**.
- **Usar `Math.random()` en `generarGotas` "porque es decoración".** Rompe la hidratación de una
  página estática. El LCG sembrado es el requisito, y `E1-T4` lo testea en las dos direcciones.
- **Instalar un optimizador de imágenes como dependencia para `E1-T2`.** La optimización es un paso
  manual; la compuerta mide el archivo en disco, no el proceso que lo produjo.
- **Renombrar un producto de `PRODUCTOS`.** El endpoint resuelve por coincidencia exacta de nombre
  contra la base: renombrar rompe todos los pedidos web.

## Antes de seguir

- [ ] Las 6 tareas están `done` en `tasks.json` — ninguna quedó `in_progress`.
- [ ] Pasó **cada** comando `verify` de cada tarea, no solo el primero.
- [ ] No se editó ningún comando `verify`, y ninguno se saltó porque un archivo no existía.
- [ ] **Cada tarea tiene su etiqueta de checkpoint en git** — `git tag -l 'step-0*'` las muestra.
      Ojo: este repo ya trae 16 etiquetas `step-*` de un build anterior, así que se verifica por
      nombre (`step-01-tokens-color` … `step-06-filtros-catalogo`), nunca contando.
- [ ] `npm run lint && npx jest && npm run build` pasa limpio desde la raíz del proyecto.
- [ ] Cada contrato "Producido" existe con la firma indicada.
- [ ] No se modificó ningún archivo fuera del subárbol.
- [ ] `.env.example` no necesitó cambios: **este cambio no agrega ninguna variable de entorno**.
- [ ] `package.json` y `package-lock.json` **no cambiaron**: cero dependencias nuevas.
- [ ] Un commit por tarea, cada uno prefijado con su id, cada uno seguido de su etiqueta.
