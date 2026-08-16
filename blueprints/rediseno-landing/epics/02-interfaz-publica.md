# Epic 02: Interfaz pública

> Después de este epic la home es la landing aprobada: shell nuevo, hero con logo flotante, catálogo
> con filtro, secciones de confianza y cobertura, formulario de pedido inline — y `/pedir` retirado
> con redirección permanente.

| | |
|---|---|
| **Epic id** | `02-interfaz-publica` |
| **Tareas** | `E2-T1` … `E2-T7` |
| **Depende de** | `01-fundaciones` |
| **Desbloquea** | nada — es el último |
| **Paralelo con** | nada |

No hace falta ningún otro archivo para completar este epic. Todo lo de abajo está repetido acá a
propósito.

---

## Contexto

**Este es un cambio brownfield sobre un repositorio Next.js que ya existe, ya está instalado y ya
tiene historia en git.** No hay scaffolding, no hay `npm install`, y **cero dependencias nuevas**:
todo lo que el código usa ya está en `package-lock.json`. **No hay librería de iconos y no se instala
ninguna**: los iconos son `<svg>` inline, igual que en el `page.tsx` actual.

Agua Viflomax vende agua purificada a domicilio en Maipú y Padre Hurtado. Este epic construye la
home aprobada por el cliente y retira el flujo de pedido antiguo.

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
| Tests (un archivo) | `npx jest lib/landing/respuesta-pedido.test.ts` |

**Compuerta:** `npm run lint && npx jest && npm run build` pasa antes de marcar cualquier tarea de
este epic como hecha. **No existe un script `typecheck`**: el chequeo de tipos vive dentro de
`npm run build`.

**Sin Testing Library en este repo, no se pueden montar componentes en un test.** Por eso las
compuertas de este epic son `npm run build` —que prueba que todo importa, tipa y prerrenderiza— más
greps estructurales sobre el archivo, y cada criterio dice explícitamente que el medio es el grep. Es
una cobertura más débil que un test de render y está documentada como tal, no disfrazada.

Ninguna tarea de este epic necesita una base de datos corriendo, ni un servidor levantado, ni Docker.

## Subárbol del directorio

Solo lo que este epic toca:

```
viflomax/
  app/
    globals.css                    # existe — E2-T2 BORRA de acá .bubble y @keyframes float
    (public)/
      layout.tsx                   # existe — E2-T1 lo reescribe para montar el shell
      page.tsx                     # existe — E2-T7 lo reescribe con el ensamblado final
      pedir/page.tsx               # existe — E2-T7 lo BORRA
      contacto/page.tsx            # existe — NO se toca; SiteHeader lo sigue enlazando
  components/
    public/
      SiteHeader.tsx               # NUEVO en E2-T1
      SiteFooter.tsx               # NUEVO en E2-T1
      Hero.tsx                     # existe — E2-T2 lo reescribe entero
      LluviaDeGotas.tsx            # NUEVO en E2-T3
      PedidoProvider.tsx           # NUEVO en E2-T3
      ProductGrid.tsx              # existe — E2-T4 lo reescribe entero
      PorQueElegirnos.tsx          # NUEVO en E2-T5
      Cobertura.tsx                # NUEVO en E2-T5
      PedidoForm.tsx               # NUEVO en E2-T6
      OrderForm.tsx                # existe — E2-T7 lo BORRA
      ProductoImagen.tsx           # existe — se REUTILIZA tal cual dentro de ProductGrid
      WhatsAppFloat.tsx            # existe — se REUTILIZA tal cual, montado en el layout
  lib/
    landing/respuesta-pedido.ts    # NUEVO en E2-T6
    landing/respuesta-pedido.test.ts   # NUEVO en E2-T6
  next.config.mjs                  # existe — E2-T7 le AGREGA redirects(), conserva headers()
```

Todo lo que quede fuera de este subárbol está fuera de alcance. **`app/api/pedidos/publico/route.ts`
no se edita nunca.** Si una tarea parece exigirlo, detenerse y reportar.

## Modelo de datos tocado

| Entidad | Campos que este epic lee o escribe | Notas |
|---|---|---|
| `Cliente` | los escribe el endpoint congelado: `nombre`, `telefono`, `email`, `direccion`, `comuna` | El formulario los recoge; el servidor los persiste. **Este epic no consulta la base** |
| `Pedido` | los escribe el endpoint: `numero_pedido`, `estado`, `origen`, `monto_total`, `notas` | `origen` queda en `'web'`. La respuesta 201 devuelve `numero_pedido` para mostrarlo |

Sin migración, sin columna nueva, sin seed. La única relación con los datos es que `productoId` en el
cuerpo del `POST` es el **nombre** del producto, que el servidor resuelve contra `Producto.nombre`.

## Contratos

**Consumidos** — ya existen, no se reconstruyen:

| De | Interfaz | Garantía |
|---|---|---|
| `01-fundaciones` | `generarGotas(semilla, cantidad, colorVar): GotaEstilo[]` | Determinista por semilla. `GotaEstilo` es `{ left, duracion, retraso, opacidad, color }` |
| `01-fundaciones` | `construirMensajeWhatsApp(datos): string` | 6 líneas con notas, 5 sin ellas |
| `01-fundaciones` | `construirPayloadPedido(datos): PayloadPedidoPublico` | El cuerpo exacto que el endpoint acepta, con `email` y `notas` vacíos omitidos |
| `01-fundaciones` | `filtrarPorCategoria(productos, filtro): Producto[]` | Array nuevo, no muta la entrada. `'todos'` devuelve los 9 |
| `01-fundaciones` | Clases `.logo-float` y `.water-drop` en `app/globals.css` | `.water-drop` lee la custom property `--drop-op` |
| `01-fundaciones` | Clases `bg-viflomax-azul-{100..900}` y `bg-viflomax-verde-{100..900}` | Más los 4 alias viejos |
| `01-fundaciones` | `public/logo.png` | Con canal alfa, bajo 150 KB, al menos 600 px de ancho |
| repo existente | `lib/contacto.ts`: `TIENE_WHATSAPP`, `linkWhatsApp`, `TELEFONO_LEGIBLE`, `TELEFONO_HREF`, `HORARIO`, `ZONA` | `linkWhatsApp` devuelve `''` si no hay número |
| repo existente | `components/public/ProductoImagen.tsx`, `components/public/WhatsAppFloat.tsx` | Se reutilizan sin tocar |
| repo existente | `POST /api/pedidos/publico` | **Congelado.** 201 = éxito; cualquier otro status muestra `error` y **no** abre WhatsApp |

**Producidos** — nada fuera de este epic depende de ellos: es el último.

## Convenciones que muerden en esta área

- **Server Component por defecto.** `'use client'` solo con estado, efectos o handlers, y en la hoja. En este epic lo llevan exactamente tres archivos: `PedidoProvider.tsx`, `ProductGrid.tsx` y `PedidoForm.tsx`.
- **Un Server Component pasado como *child* de un Client Component sigue renderizando en el servidor.** Así es como `PorQueElegirnos` y `Cobertura` viven dentro de `PedidoProvider` con cero JS de cliente. **No convertirlos a cliente "para que anden".**
- **Nada de `Math.random()` ni `Date.now()` durante el render.** La home es estática y se hidrata. Las gotas se calculan **a nivel de módulo**, con una línea que empieza en la columna 0 y una semilla literal.
- **Texto blanco sobre verde va siempre en `bg-viflomax-verde-700` (5.95:1)**, nunca en `bg-viflomax-verde` (2.65:1). Sobre azul: `-700` (6.65:1) o `-800` (9.57:1), nunca `bg-viflomax-azul` (2.98:1). El hero conserva su capa `bg-black/30`, sin la cual **ningún** texto del hero pasa AA, ni siquiera el `<h1>`: 2.65:1 sobre la parada verde.
- **El número de teléfono no se escribe literal en ningún componente.** Sale de `lib/contacto.ts`, y hay greps que lo cazan en `E2-T1` y `E2-T6`.
- **Todo elemento interactivo es nativo** — `<button>`, `<a>`, `<input>`, `<select>` — con foco visible (`focus-visible:ring-2 focus-visible:ring-viflomax-azul-700`). Nunca `<div onClick>`.
- Decoración (blobs, gotas, iconos) siempre con `aria-hidden="true"`. Anclas de destino con `scroll-mt-24`, para que el header sticky no las tape.
- **El ancla `#pedido` no existe hasta `E2-T7`.** `E2-T1`, `E2-T2` y `E2-T4` la enlazan igual: es deliberado, no rompe nada, y "arreglarla" apuntándola a `/pedir` reintroduce la ruta que se retira.

Reglas completas del proyecto: `CLAUDE.md`. Reglas del área: `.claude/rules/landing-publica.md` y
`.claude/rules/contratos-congelados.md`. Los tres están en la raíz del proyecto.

---

## Tareas

Listadas en el mismo orden que `tasks.json`. Ese orden es el orden de construcción: se trabaja
de arriba hacia abajo y no se re-ordena por prioridad ni por lo que parezca rápido.

### `E2-T1` — Shell del sitio: header y footer

**Depende de:** `E1-T1` · **Prioridad:** p0 — metadato para recortes de alcance, no un orden de ejecución

Sacar el header y el footer que hoy viven inline en `app/(public)/layout.tsx` a dos componentes propios, con la paleta nueva y sin enlaces a la página que se retira.

`SiteHeader` lleva la barra de contacto (`HORARIO` + `TELEFONO_LEGIBLE` de `lib/contacto.ts`, condicionada a `TIENE_WHATSAPP`, sobre `bg-viflomax-azul-800` con texto blanco: 9.57:1) y el nav sticky con el wordmark y los enlaces `Productos` (`#productos`), `Contacto` (`/contacto`) y el CTA `Pedir ahora` (`#pedido`, en `bg-viflomax-verde-700`: 5.95:1). `SiteFooter` usa el mismo fondo y muestra `ZONA`, `HORARIO`, `TELEFONO_LEGIBLE` y el enlace discreto a `/login`.

Ambos son Server Components: **no llevan `'use client'`**. Con dos enlaces más un CTA no hace falta menú hamburguesa a 375 px — la fila usa `flex-wrap` con `gap-4` y texto `text-sm`.

**El ancla `#pedido` todavía no existe: la sección llega en `E2-T7`.** Es deliberado. Un ancla sin destino no rompe el build ni el lint, y "arreglarla" apuntándola a `/pedir` reintroduce la ruta que este cambio retira.

**Archivos**

- `components/public/SiteHeader.tsx` — nuevo — Server Component
- `components/public/SiteFooter.tsx` — nuevo — Server Component
- `app/(public)/layout.tsx` — editar — monta los dos y borra el header y el footer inline; `<WhatsAppFloat />` se queda donde está

**Aceptación**

Copiados literalmente del array `acceptance` de esta tarea en `tasks.json`. Cada uno lo
decide un comando de abajo, en esta máquina, durante el build.

1. **WHEN** `npm run lint` and `npm run build` run **THE SYSTEM SHALL** exit 0 on both, with zero lint errors and zero lint warnings.
2. **WHEN** `app/(public)/layout.tsx` is read **THE SYSTEM SHALL** contain exactly one `<SiteHeader />` and one `<SiteFooter />`, and SHALL NOT contain any inline `<header` or `<footer` markup.
3. **WHEN** `grep` searches `components/public/SiteHeader.tsx` and `components/public/SiteFooter.tsx` for the digit sequence `569` **THE SYSTEM SHALL** find no match, because every contact value comes from `lib/contacto.ts`.
4. **WHEN** `grep` searches `components/public/SiteHeader.tsx`, `components/public/SiteFooter.tsx` and `app/(public)/layout.tsx` for `/pedir` **THE SYSTEM SHALL** find no match: the shell links to `#pedido` and `#productos`, never to the page being retired.
5. **WHEN** `grep` searches `components/public/SiteHeader.tsx` for the CTA class **THE SYSTEM SHALL** find `bg-viflomax-verde-700`, the only green that carries white text at 5.95:1.
6. **WHEN** `npx jest` runs **THE SYSTEM SHALL** exit 0 with 0 failed and 0 skipped, so the gates of steps 1 and 4 to 6 still pass.

**Verificar** — todos los comandos, en orden, desde la raíz del proyecto. Cada uno sale 0
cuando esta tarea está correcta; que el último salga 0 es lo que la deja hecha.

```bash
grep -c '<SiteHeader />' 'app/(public)/layout.tsx' | grep -qx 1
grep -c '<SiteFooter />' 'app/(public)/layout.tsx' | grep -qx 1
grep -q '<header' 'app/(public)/layout.tsx'; test $? -eq 1
grep -q '<footer' 'app/(public)/layout.tsx'; test $? -eq 1
grep -q '569' components/public/SiteHeader.tsx components/public/SiteFooter.tsx; test $? -eq 1
grep -q '/pedir' components/public/SiteHeader.tsx components/public/SiteFooter.tsx; test $? -eq 1
grep -q '/pedir' 'app/(public)/layout.tsx'; test $? -eq 1
grep -q 'bg-viflomax-verde-700' components/public/SiteHeader.tsx
npm run lint
npm run build
npx jest
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T1: SiteHeader y SiteFooter montados en el layout publico"
git tag step-07-shell-sitio
git ls-files --error-unmatch components/public/SiteHeader.tsx components/public/SiteFooter.tsx   # expect: exit 0
```

Correr ambos después de que el último comando de `Verificar` salga 0, antes de empezar la
tarea siguiente. La etiqueta es el objetivo de rollback de esta tarea y lo que cuenta la
compuerta final del build. Nunca inventar la etiqueta: se copia el campo `checkpoint`.

### `E2-T2` — Hero nuevo y limpieza del CSS muerto

**Depende de:** `E1-T1`, `E1-T2`, `E1-T3`, `E2-T1` · **Prioridad:** p0 — metadato para recortes de alcance, no un orden de ejecución

Reescribir el hero con el diseño aprobado y borrar el CSS que se queda sin consumidor en el mismo momento.

Es un Server Component (sin `'use client'`): gradiente diagonal `bg-gradient-to-br from-viflomax-azul-900 via-viflomax-azul to-viflomax-verde`, **una capa `bg-black/30` encima del gradiente y debajo del contenido** (sin ella **ningún** texto del hero pasa AA — el blanco queda en 2.65:1 sobre la parada verde, por debajo hasta del umbral de 3:1 del texto grande, así que ni el `<h1>` se salva; con ella, 5.03:1), dos blobs decorativos `rounded-full bg-white/10 blur-3xl` con `aria-hidden="true"`, el tag `Distribución en Maipú y Padre Hurtado`, el `<h1>` `text-5xl md:text-7xl font-extrabold`, el subtítulo, y dos CTA: `Pedir ahora` (`#pedido`, `bg-viflomax-verde-700`) y `Ver productos` (`#productos`, borde blanco).

El logo va con `next/image`: `src="/logo.png"`, `width` y `height` explícitos, `priority`, `alt="Agua Viflomax"`, dentro de un contenedor con la clase `logo-float`.

El `Hero.tsx` viejo era el último consumidor de `.bubble`. **Borrar `.bubble` y `@keyframes float` de `app/globals.css` acá** —y no antes— es lo que evita dejar el hero anterior sin animación durante cinco tareas.

**Archivos**

- `components/public/Hero.tsx` — reescribir por completo — Server Component
- `app/globals.css` — editar — borrar `@keyframes float` y la regla `.bubble`

**Aceptación**

Copiados literalmente del array `acceptance` de esta tarea en `tasks.json`. Cada uno lo
decide un comando de abajo, en esta máquina, durante el build.

1. **WHEN** `npm run lint` and `npm run build` run **THE SYSTEM SHALL** exit 0 on both, with zero lint errors and zero lint warnings.
2. **WHEN** `grep -r` searches the `app` and `components` trees for `bubble` **THE SYSTEM SHALL** find no match, so the dead class and its keyframes are gone along with their last consumer.
3. **WHEN** `components/public/Hero.tsx` is read **THE SYSTEM SHALL** import `Image` from `next/image` and render `/logo.png` with explicit `width`, `height` and `priority`.
4. **WHEN** `components/public/Hero.tsx` is read **THE SYSTEM SHALL** apply the `logo-float` class to the logo wrapper.
5. **WHEN** `components/public/Hero.tsx` is read **THE SYSTEM SHALL** contain a `bg-black/30` layer, the scrim that lifts all white text in the hero over the lightest gradient stop to 5.03:1 - without it not even the `<h1>` clears 3:1.
6. **WHEN** `grep` searches `components/public/Hero.tsx` for `/pedir` **THE SYSTEM SHALL** find no match: both hero CTAs are in-page anchors.

**Verificar** — todos los comandos, en orden, desde la raíz del proyecto. Cada uno sale 0
cuando esta tarea está correcta; que el último salga 0 es lo que la deja hecha.

```bash
grep -rq 'bubble' app components; test $? -eq 1
grep -q "from 'next/image'" components/public/Hero.tsx
grep -q '/logo.png' components/public/Hero.tsx
grep -q 'priority' components/public/Hero.tsx
grep -q 'logo-float' components/public/Hero.tsx
grep -q 'bg-black/30' components/public/Hero.tsx
grep -q '/pedir' components/public/Hero.tsx; test $? -eq 1
npm run lint
npm run build
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T2: hero nuevo con logo flotante y limpieza de .bubble"
git tag step-08-hero
```

Correr ambos después de que el último comando de `Verificar` salga 0, antes de empezar la
tarea siguiente. La etiqueta es el objetivo de rollback de esta tarea y lo que cuenta la
compuerta final del build. Nunca inventar la etiqueta: se copia el campo `checkpoint`.

### `E2-T3` — Lluvia de gotas y contexto de pedido

**Depende de:** `E1-T3`, `E1-T4` · **Prioridad:** p0 — metadato para recortes de alcance, no un orden de ejecución

Los dos componentes compartidos que las secciones de `E2-T4` a `E2-T6` necesitan.

`LluviaDeGotas` es un renderer puro: recibe `{ gotas: GotaEstilo[] }` y emite un `<span className="water-drop">` por gota, con `left`, `animationDuration`, `animationDelay`, `background` y la custom property `--drop-op` en `style` inline. Va envuelto en un contenedor `absolute inset-0 overflow-hidden pointer-events-none` con `aria-hidden="true"`. **No lleva `'use client'`, ni `useEffect`, ni `Math.random`**: recibe el array ya calculado y solo lo pinta, así que renderiza idéntico en el servidor y al hidratar.

`PedidoProvider` es `'use client'` y exporta el provider más el hook `usePedido`, que expone `{ productoSeleccionado, setProductoSeleccionado }`. `usePedido` **lanza un `Error` con nombre** cuando se llama fuera del provider, en vez de devolver `undefined` y fallar más tarde con un mensaje que no dice nada.

**Archivos**

- `components/public/LluviaDeGotas.tsx` — nuevo — sin `'use client'`, renderer puro
- `components/public/PedidoProvider.tsx` — nuevo — `'use client'`, exporta `PedidoProvider` y `usePedido`

**Aceptación**

Copiados literalmente del array `acceptance` de esta tarea en `tasks.json`. Cada uno lo
decide un comando de abajo, en esta máquina, durante el build.

1. **WHEN** `npm run lint` and `npm run build` run **THE SYSTEM SHALL** exit 0 on both, with zero lint errors and zero lint warnings.
2. **WHEN** `components/public/PedidoProvider.tsx` is read **THE SYSTEM SHALL** begin with the `'use client'` directive and export both `PedidoProvider` and `usePedido`.
3. **WHEN** `grep` searches `components/public/PedidoProvider.tsx` for `throw new Error` **THE SYSTEM SHALL** find the guard `usePedido` raises when it is called outside `PedidoProvider`.
4. **WHEN** `grep` searches `components/public/LluviaDeGotas.tsx` for `use client`, `useEffect` and `Math.random` **THE SYSTEM SHALL** find none of the three, so the component renders identically on the server and on the client.
5. **WHEN** `grep` searches `components/public/LluviaDeGotas.tsx` **THE SYSTEM SHALL** find both `water-drop` and `--drop-op`, the class and the custom property the `waterfall` keyframes read.
6. **WHEN** `grep` searches `components/public/LluviaDeGotas.tsx` **THE SYSTEM SHALL** find `aria-hidden`, because the rain is decoration and must not reach assistive technology.

**Verificar** — todos los comandos, en orden, desde la raíz del proyecto. Cada uno sale 0
cuando esta tarea está correcta; que el último salga 0 es lo que la deja hecha.

```bash
head -1 components/public/PedidoProvider.tsx | grep -q "use client"
grep -q 'export function PedidoProvider' components/public/PedidoProvider.tsx
grep -q 'export function usePedido' components/public/PedidoProvider.tsx
grep -q 'throw new Error' components/public/PedidoProvider.tsx
grep -q 'use client' components/public/LluviaDeGotas.tsx; test $? -eq 1
grep -q 'useEffect' components/public/LluviaDeGotas.tsx; test $? -eq 1
grep -q 'Math.random' components/public/LluviaDeGotas.tsx; test $? -eq 1
grep -q 'water-drop' components/public/LluviaDeGotas.tsx
grep -q -- '--drop-op' components/public/LluviaDeGotas.tsx
grep -q 'aria-hidden' components/public/LluviaDeGotas.tsx
npm run lint
npm run build
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T3: LluviaDeGotas y PedidoProvider"
git tag step-09-lluvia-provider
git ls-files --error-unmatch components/public/LluviaDeGotas.tsx components/public/PedidoProvider.tsx   # expect: exit 0
```

Correr ambos después de que el último comando de `Verificar` salga 0, antes de empezar la
tarea siguiente. La etiqueta es el objetivo de rollback de esta tarea y lo que cuenta la
compuerta final del build. Nunca inventar la etiqueta: se copia el campo `checkpoint`.

### `E2-T4` — Catálogo con filtro, lluvia y salto al formulario

**Depende de:** `E1-T6`, `E2-T3` · **Prioridad:** p0 — metadato para recortes de alcance, no un orden de ejecución

Reescribir el catálogo para que use la función pura de `E1-T6`, la lluvia de `E2-T3` y el contexto en vez de navegar a `/pedir`. Sigue siendo `'use client'`: las pills de filtro usan `useState` y la acción de la tarjeta llama a `setProductoSeleccionado`.

Cambios respecto de la versión actual: el filtrado pasa por `filtrarPorCategoria(PRODUCTOS, filtro)` y **no queda ningún `PRODUCTOS.filter` inline**; el array de gotas se calcula a nivel de módulo con una línea que empieza en la columna 0, `const GOTAS_PRODUCTOS = generarGotas(7, 16, '#a3d9f0')` (azul-300 sobre el fondo blanco de la sección); la acción de la tarjeta deja de ser un `<Link href="/pedir?producto=…">` y pasa a ser un `<button>` que hace `setProductoSeleccionado(producto.nombre)` y navega al ancla `#pedido`; el CTA de la tarjeta y el badge usan `bg-viflomax-verde-700` con `hover:bg-viflomax-verde-800`.

`ProductoImagen` se sigue usando tal cual para la foto. Si el filtro no deja productos, se muestra el texto `No hay productos en esta categoría` en lugar de una grilla en blanco. La sección conserva su `id="productos"`.

**Archivos**

- `components/public/ProductGrid.tsx` — reescribir por completo — sigue siendo `'use client'`

**Aceptación**

Copiados literalmente del array `acceptance` de esta tarea en `tasks.json`. Cada uno lo
decide un comando de abajo, en esta máquina, durante el build.

1. **WHEN** `npm run lint` and `npm run build` run **THE SYSTEM SHALL** exit 0 on both, with zero lint errors and zero lint warnings.
2. **WHEN** `grep` searches `components/public/ProductGrid.tsx` **THE SYSTEM SHALL** find `filtrarPorCategoria` imported from `@/lib/productos` and SHALL NOT find any `PRODUCTOS.filter` call.
3. **WHEN** `grep` searches `components/public/ProductGrid.tsx` for a line starting with `const GOTAS_PRODUCTOS = generarGotas(` at column 0 **THE SYSTEM SHALL** find it, proving the drop array is built once at module scope and is therefore identical on the server render and on hydration.
4. **WHEN** `grep` searches `components/public/ProductGrid.tsx` for `/pedir` **THE SYSTEM SHALL** find no match: the card action calls `setProductoSeleccionado` and moves to `#pedido`.
5. **WHEN** `grep` searches `components/public/ProductGrid.tsx` **THE SYSTEM SHALL** find `bg-viflomax-verde-700` on the card action and on the badge, the two white-on-green surfaces that need 5.95:1.
6. **WHEN** the active filter yields no product **THE SYSTEM SHALL** render the empty-state text instead of an empty grid, which `grep` confirms by finding the literal `No hay productos en esta categoría`.

**Verificar** — todos los comandos, en orden, desde la raíz del proyecto. Cada uno sale 0
cuando esta tarea está correcta; que el último salga 0 es lo que la deja hecha.

```bash
grep -q 'filtrarPorCategoria' components/public/ProductGrid.tsx
grep -q "from '@/lib/productos'" components/public/ProductGrid.tsx
grep -q 'PRODUCTOS.filter' components/public/ProductGrid.tsx; test $? -eq 1
grep -q '^const GOTAS_PRODUCTOS = generarGotas(' components/public/ProductGrid.tsx
grep -q '/pedir' components/public/ProductGrid.tsx; test $? -eq 1
grep -q 'setProductoSeleccionado' components/public/ProductGrid.tsx
grep -q 'id="productos"' components/public/ProductGrid.tsx
grep -q 'bg-viflomax-verde-700' components/public/ProductGrid.tsx
grep -q 'No hay productos en esta categoría' components/public/ProductGrid.tsx
npm run lint
npm run build
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T4: catalogo con filtro puro, lluvia determinista y salto a #pedido"
git tag step-10-product-grid
```

Correr ambos después de que el último comando de `Verificar` salga 0, antes de empezar la
tarea siguiente. La etiqueta es el objetivo de rollback de esta tarea y lo que cuenta la
compuerta final del build. Nunca inventar la etiqueta: se copia el campo `checkpoint`.

### `E2-T5` — Secciones de confianza y cobertura

**Depende de:** `E1-T6`, `E2-T3` · **Prioridad:** p1 — metadato para recortes de alcance, no un orden de ejecución

Las dos secciones nuevas del diseño aprobado, **ambas Server Components con cero JavaScript de cliente**.

`PorQueElegirnos` son tres columnas icono + título + texto: agua purificada, entrega el mismo día, precio justo. **Los iconos son `<svg>` inline**, exactamente tres, igual que hoy en `app/(public)/page.tsx`: no hay librería de iconos instalada y este cambio tiene prohibido agregar paquetes.

`Cobertura` va sobre `bg-viflomax-azul-100`, con `LluviaDeGotas` de fondo, el texto de zona tomado de `ZONA` (`lib/contacto.ts`) y dos badges, `Maipú` y `Padre Hurtado`. Calcula su lluvia a nivel de módulo, en la columna 0: `const GOTAS_COBERTURA = generarGotas(23, 20, '#6dc2e3')` — azul-400, que es el que se lee sobre `azul-100`. **Semilla distinta de la del catálogo** (7) para que las dos lluvias no queden espejadas.

Ninguno de los dos lleva `'use client'`. En `E2-T7` van dentro de `<PedidoProvider>` **como children**, lo que los mantiene renderizados en el servidor.

**Archivos**

- `components/public/PorQueElegirnos.tsx` — nuevo — Server Component, 3 `<svg>` inline
- `components/public/Cobertura.tsx` — nuevo — Server Component, lluvia con semilla 23

**Aceptación**

Copiados literalmente del array `acceptance` de esta tarea en `tasks.json`. Cada uno lo
decide un comando de abajo, en esta máquina, durante el build.

1. **WHEN** `npm run lint` and `npm run build` run **THE SYSTEM SHALL** exit 0 on both, with zero lint errors and zero lint warnings.
2. **WHEN** `grep` searches `components/public/PorQueElegirnos.tsx` and `components/public/Cobertura.tsx` for `use client` **THE SYSTEM SHALL** find no match, so both stay Server Components and ship zero client JavaScript.
3. **WHEN** `grep -c` counts `<svg` in `components/public/PorQueElegirnos.tsx` **THE SYSTEM SHALL** report 3, one inline icon per column, with no icon-library import anywhere in the file.
4. **WHEN** `components/public/Cobertura.tsx` is read **THE SYSTEM SHALL** render the two coverage badges `Maipú` and `Padre Hurtado` and SHALL take its zone line from `ZONA` in `lib/contacto.ts`.
5. **WHEN** `grep` searches `components/public/Cobertura.tsx` for a line starting with `const GOTAS_COBERTURA = generarGotas(` at column 0 **THE SYSTEM SHALL** find it, so this section's rain is built once at module scope with its own seed.
6. **WHEN** `grep` searches both files for `from 'lucide-react'` or any other icon-package import **THE SYSTEM SHALL** find no match, because this change adds zero npm packages.

**Verificar** — todos los comandos, en orden, desde la raíz del proyecto. Cada uno sale 0
cuando esta tarea está correcta; que el último salga 0 es lo que la deja hecha.

```bash
grep -q 'use client' components/public/PorQueElegirnos.tsx components/public/Cobertura.tsx; test $? -eq 1
grep -c '<svg' components/public/PorQueElegirnos.tsx | grep -qx 3
grep -qE "from '(lucide-react|react-icons|@heroicons)" components/public/PorQueElegirnos.tsx components/public/Cobertura.tsx; test $? -eq 1
grep -q 'Padre Hurtado' components/public/Cobertura.tsx
grep -q 'Maipú' components/public/Cobertura.tsx
grep -q 'ZONA' components/public/Cobertura.tsx
grep -q '^const GOTAS_COBERTURA = generarGotas(' components/public/Cobertura.tsx
npm run lint
npm run build
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T5: secciones PorQueElegirnos y Cobertura"
git tag step-11-secciones-confianza
git ls-files --error-unmatch components/public/PorQueElegirnos.tsx components/public/Cobertura.tsx   # expect: exit 0
```

Correr ambos después de que el último comando de `Verificar` salga 0, antes de empezar la
tarea siguiente. La etiqueta es el objetivo de rollback de esta tarea y lo que cuenta la
compuerta final del build. Nunca inventar la etiqueta: se copia el campo `checkpoint`.

### `E2-T6` — Formulario de pedido inline

**Depende de:** `E1-T5`, `E2-T3` · **Prioridad:** p0 — metadato para recortes de alcance, no un orden de ejecución

El formulario que reemplaza a `/pedir`, más el módulo puro que decide qué hacer con la respuesta de la API.

`interpretarRespuestaPedido(status, cuerpo)` es donde vive la regla del contrato: **solo `201` es éxito**. Con 201 devuelve `{ ok: true, numeroPedido }`; con cualquier otro status devuelve `{ ok: false, mensaje }` usando el `error` del cuerpo, y si ese `error` viene nulo o vacío cae a `Error al enviar el pedido. Intenta nuevamente.`. Está separado del componente porque es la única forma de testear esa decisión en este repo.

El formulario tiene, en este orden: `nombre`, `telefono`, `email` (opcional), `direccion`, el `<select>` de `comuna` con exactamente `Maipú`, `Padre Hurtado` y `Otra comuna` (requerido), el `<select>` de producto (las 9 opciones de `PRODUCTOS`, con `value={producto.nombre}` literal), `cantidad` (número, mínimo 1) y `notas` (opcional). El producto se inicializa desde `usePedido().productoSeleccionado` y se re-sincroniza cuando ese valor cambia.

Al enviar: arma el body con `construirPayloadPedido`, hace `fetch('/api/pedidos/publico', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })`, y pasa `res.status` y el JSON a `interpretarRespuestaPedido`. Con `ok: true`, panel verde con el `numeroPedido` y —**solo si `TIENE_WHATSAPP`**— `window.open(linkWhatsApp(construirMensajeWhatsApp(datos)), '_blank', 'noopener,noreferrer')`. Con `TIENE_WHATSAPP` en `false` el pedido igual quedó guardado y solo se muestra el mensaje de éxito. Con `ok: false`, panel rojo con `mensaje` y **no** se abre WhatsApp.

El panel de resultado lleva `role="status"` con `aria-live="polite"`, y cada input su `<label htmlFor>`. **Ningún número de teléfono literal en este archivo.**

**Archivos**

- `lib/landing/respuesta-pedido.ts` — nuevo — `interpretarRespuestaPedido` y el tipo `ResultadoPedido`
- `lib/landing/respuesta-pedido.test.ts` — nuevo — importa `./respuesta-pedido`
- `components/public/PedidoForm.tsx` — nuevo — `'use client'`

**Aceptación**

Copiados literalmente del array `acceptance` de esta tarea en `tasks.json`. Cada uno lo
decide un comando de abajo, en esta máquina, durante el build.

1. **WHEN** `npx jest lib/landing/respuesta-pedido.test.ts` runs **THE SYSTEM SHALL** exit 0 with 0 failed and 0 skipped.
2. **WHEN** `interpretarRespuestaPedido` receives status 201 with `{ data: { pedido_id, numero_pedido }, error: null }` **THE SYSTEM SHALL** return an object with `ok` true carrying `numero_pedido` as `numeroPedido`.
3. **WHEN** `interpretarRespuestaPedido` receives status 400 with `error` equal to `Los campos nombre, teléfono, dirección y comuna son obligatorios` **THE SYSTEM SHALL** return an object with `ok` false whose `mensaje` is that exact string, which is the branch that skips WhatsApp.
4. **WHEN** `interpretarRespuestaPedido` receives status 500 with `error` equal to `Error al crear el pedido`, or any non-201 status with a null or blank `error`, **THE SYSTEM SHALL** return `ok` false with a non-empty `mensaje`.
5. **WHEN** `grep` searches `components/public/PedidoForm.tsx` **THE SYSTEM SHALL** find `construirPayloadPedido`, `construirMensajeWhatsApp`, `interpretarRespuestaPedido`, `linkWhatsApp` and `TIENE_WHATSAPP`, and SHALL find no literal digit sequence `569`.
6. **WHEN** `grep` searches `components/public/PedidoForm.tsx` **THE SYSTEM SHALL** find the three comuna options `Maipú`, `Padre Hurtado` and `Otra comuna`, and a `required` attribute on the comuna select.

**Verificar** — todos los comandos, en orden, desde la raíz del proyecto. Cada uno sale 0
cuando esta tarea está correcta; que el último salga 0 es lo que la deja hecha.

```bash
npx jest lib/landing/respuesta-pedido.test.ts
grep -q 'construirPayloadPedido' components/public/PedidoForm.tsx
grep -q 'construirMensajeWhatsApp' components/public/PedidoForm.tsx
grep -q 'interpretarRespuestaPedido' components/public/PedidoForm.tsx
grep -q 'linkWhatsApp' components/public/PedidoForm.tsx
grep -q 'TIENE_WHATSAPP' components/public/PedidoForm.tsx
grep -q '569' components/public/PedidoForm.tsx; test $? -eq 1
grep -q 'Otra comuna' components/public/PedidoForm.tsx
grep -q 'Padre Hurtado' components/public/PedidoForm.tsx
grep -q "'/api/pedidos/publico'" components/public/PedidoForm.tsx
npm run lint
npm run build
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T6: formulario de pedido inline e interprete de respuesta"
git tag step-12-pedido-form
git ls-files --error-unmatch components/public/PedidoForm.tsx lib/landing/respuesta-pedido.ts   # expect: exit 0
```

Correr ambos después de que el último comando de `Verificar` salga 0, antes de empezar la
tarea siguiente. La etiqueta es el objetivo de rollback de esta tarea y lo que cuenta la
compuerta final del build. Nunca inventar la etiqueta: se copia el campo `checkpoint`.

### `E2-T7` — Cutover: ensamblado, redirección y retiro de /pedir

**Depende de:** `E2-T2`, `E2-T4`, `E2-T5`, `E2-T6` · **Prioridad:** p0 — metadato para recortes de alcance, no un orden de ejecución

La tarea de cutover. Ensambla la landing, redirige la ruta vieja y borra su código en **un solo commit**, para que en ningún momento existan dos caminos de pedido.

El ensamblado de `app/(public)/page.tsx`, en este orden: `<Hero />`, y luego `<PedidoProvider>` envolviendo `<ProductGrid />`, `<PorQueElegirnos />`, `<Cobertura />` y la `<section id="pedido" className="scroll-mt-24">` con `<PedidoForm />`. **`PorQueElegirnos` y `Cobertura` se pasan como children desde este Server Component**, que es lo que los mantiene renderizados en el servidor pese a estar dentro de un Client Component.

En `next.config.mjs` se **agrega** la clave `redirects()`, conservando `headers()` intacta:

```js
async redirects() {
  return [
    { source: '/pedir', destination: '/#pedido', permanent: true },
  ]
},
```

Y se borran `app/(public)/pedir/page.tsx` (con su directorio, que queda vacío) y `components/public/OrderForm.tsx`.

**`ROLES.md` también se actualiza en esta tarea.** Su línea 243 documenta `/pedir` como ruta viva, y al estar fuera de `app/` y `components/` ningún grep del build la ve: hay que reemplazar esa referencia por la sección `#pedido` de la home. Es la única documentación del repo que menciona la ruta retirada.

**Si el bloque `Verificar` falla, el rollback es `git reset --hard step-12-pedido-form`**, que devuelve el árbol al estado anterior al cutover con `/pedir` vivo. Es la única tarea del build donde el rollback recupera código borrado.

**Archivos**

- `app/(public)/page.tsx` — reescribir — ensamblado final
- `next.config.mjs` — editar — agregar `redirects()`, conservar `headers()`
- `ROLES.md` — editar — la línea que documenta `/pedir` pasa a apuntar a la sección `#pedido` de la home
- `app/(public)/pedir/page.tsx` — BORRAR — junto con el directorio `app/(public)/pedir/`
- `components/public/OrderForm.tsx` — BORRAR

**Aceptación**

Copiados literalmente del array `acceptance` de esta tarea en `tasks.json`. Cada uno lo
decide un comando de abajo, en esta máquina, durante el build.

1. **WHEN** `npm run lint` and `npm run build` run **THE SYSTEM SHALL** exit 0 on both, with zero lint errors and zero lint warnings.
2. **WHEN** `app/(public)/page.tsx` is read **THE SYSTEM SHALL** render `Hero`, then `PedidoProvider` wrapping `ProductGrid`, `PorQueElegirnos`, `Cobertura` and a `section` with `id="pedido"` holding `PedidoForm`.
3. **WHEN** `test ! -e app/(public)/pedir/page.tsx` and `test ! -e components/public/OrderForm.tsx` run **THE SYSTEM SHALL** exit 0 on both, so the retired flow is deleted and not merely unlinked.
4. **WHEN** `next.config.mjs` is read **THE SYSTEM SHALL** contain a `redirects()` key returning `source` `/pedir`, `destination` `/#pedido` and `permanent` true, and SHALL still contain the pre-existing `headers()` key with `Permissions-Policy`.
5. **WHEN** `grep -r` searches the `app` and `components` trees for `/pedir`, and `grep` searches `ROLES.md`, **THE SYSTEM SHALL** find no match in either, so neither a link nor the route documentation survives the retirement.
6. **WHEN** `npx jest` runs **THE SYSTEM SHALL** exit 0 with 0 failed and 0 skipped, so every gate from steps 1, 4, 5, 6 and 12 still passes.

**Verificar** — todos los comandos, en orden, desde la raíz del proyecto. Cada uno sale 0
cuando esta tarea está correcta; que el último salga 0 es lo que la deja hecha.

```bash
test ! -e 'app/(public)/pedir/page.tsx'
test ! -e components/public/OrderForm.tsx
grep -q 'PedidoProvider' 'app/(public)/page.tsx'
grep -q 'id="pedido"' 'app/(public)/page.tsx'
grep -q 'PorQueElegirnos' 'app/(public)/page.tsx'
grep -q 'Cobertura' 'app/(public)/page.tsx'
grep -q 'async redirects()' next.config.mjs
grep -q "source: '/pedir'" next.config.mjs
grep -q "destination: '/#pedido'" next.config.mjs
grep -q 'async headers()' next.config.mjs
grep -q 'Permissions-Policy' next.config.mjs
grep -rq '/pedir' app components; test $? -eq 1
grep -q '/pedir' ROLES.md; test $? -eq 1
npm run lint
npm run build
npx jest
```

**Checkpoint**

```bash
git add -A && git commit -m "E2-T7: cutover — landing ensamblada, redirect de /pedir y retiro de OrderForm"
git tag step-13-cutover-landing
git ls-files --error-unmatch 'app/(public)/page.tsx' next.config.mjs   # expect: exit 0
git ls-files 'app/(public)/pedir/' components/public/OrderForm.tsx | wc -l | grep -qx 0   # expect: exit 0 — ya no rastreados
```

Correr ambos después de que el último comando de `Verificar` salga 0, antes de empezar la
tarea siguiente. La etiqueta es el objetivo de rollback de esta tarea y lo que cuenta la
compuerta final del build. Nunca inventar la etiqueta: se copia el campo `checkpoint`.

---

## Aceptación del epic

El epic está hecho cuando las 7 tareas están `done` **y**:

1. **WHEN** `npm run build` runs after the cutover **THE SYSTEM SHALL** exit 0 and still emit `/` as a statically prerendered route, proving the seeded rain and the server children survived the client boundary.
2. **WHEN** `grep -r` searches the `app` and `components` trees for `/pedir` and for `bubble` **THE SYSTEM SHALL** find no match for either, proving the retired flow and the dead CSS are gone rather than merely unlinked.

```bash
npm run lint && npx jest && npm run build
grep -rq '/pedir' app components; test $? -eq 1
grep -rq 'bubble' app components; test $? -eq 1
```

Desde la raíz del proyecto. Los dos criterios los deciden esos comandos. **La prueba del pedido real
contra la base y el chequeo de la redirección 308 contra un servidor levantado NO son compuertas de
build**: están en la lista de lanzamiento de `blueprint.md` §20.1, porque el pedido real necesita una
base de datos viva y esa dependencia queda deliberadamente fuera de las compuertas de las tareas.

## Trampas

- **Poner `'use client'` en `app/(public)/page.tsx` o en el layout "para que sea más fácil".**
  Arrastra toda la landing al bundle de cliente y anula el motivo por el que `PorQueElegirnos` y
  `Cobertura` existen como Server Components.
- **Calcular las gotas dentro del componente o en un `useEffect`.** Con `useEffect` aparecen después
  de hidratar, con parpadeo, y obligan a que `Cobertura` sea cliente. La línea va en la columna 0, a
  nivel de módulo, y los greps de `E2-T4` y `E2-T5` lo exigen así.
- **Apuntar el CTA del header a `/pedir` porque `#pedido` "todavía no existe".** Es exactamente lo
  que `E2-T1` prohíbe, y su `verify` falla si `/pedir` aparece en el header o el footer.
- **Usar `bg-viflomax-verde` con texto blanco** porque es el verde de marca. Son 2.65:1: reprueba AA
  por mucho. El escalón para texto blanco es `-700`.
- **Borrar `headers()` de `next.config.mjs` al agregar `redirects()`.** La cabecera
  `Permissions-Policy: geolocation=(self)` la usa `/chofer`, que está fuera de alcance. El `verify`
  de `E2-T7` la comprueba.
- **Instalar `lucide-react` para los 3 iconos de `PorQueElegirnos`.** Cero dependencias nuevas es una
  restricción dura; el grep de `E2-T5` la hace cumplir.
- **Mandar `email: ''` o `notas: ''` en el cuerpo del pedido.** `construirPayloadPedido` los omite a
  propósito; el formulario no debe re-armar el cuerpo por su cuenta.
- **Abrir WhatsApp antes de tener el 201.** El orden es: `POST`, leer el status, y recién con 201
  abrir el link. Con cualquier otro status se muestra el `error` y no se abre nada.

## Antes de seguir

- [ ] Las 7 tareas están `done` en `tasks.json` — ninguna quedó `in_progress`.
- [ ] Pasó **cada** comando `verify` de cada tarea, no solo el primero.
- [ ] No se editó ningún comando `verify`, y ninguno se saltó porque un archivo no existía.
- [ ] **Cada tarea tiene su etiqueta de checkpoint en git**, verificada por nombre
      (`step-07-shell-sitio` … `step-13-cutover-landing`) y nunca contando: este repo ya trae 16
      etiquetas `step-*` de un build anterior.
- [ ] `npm run lint && npx jest && npm run build` pasa limpio desde la raíz del proyecto.
- [ ] No se modificó ningún archivo fuera del subárbol, y `app/api/pedidos/publico/route.ts` está
      intacto (`git diff main -- app/api/` no muestra nada).
- [ ] `.env.example` no necesitó cambios: este cambio no agrega ninguna variable de entorno.
- [ ] `package.json` y `package-lock.json` **no cambiaron**: cero dependencias nuevas.
- [ ] Un commit por tarea, cada uno prefijado con su id, cada uno seguido de su etiqueta.
- [ ] Se pasó a la lista de lanzamiento de `blueprint.md` §20.1: pedido real contra la base,
      redirección 308, pases de teclado, lector de pantalla, zoom 200% y movimiento reducido.
