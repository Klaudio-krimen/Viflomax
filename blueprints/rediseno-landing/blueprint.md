# Rediseño de landing — Agua Viflomax — Blueprint

> Generado por The Architect el 2026-08-15
> Tipo: **cambio brownfield** sobre un repositorio Next.js existente (`D:\CLAUDEKODE\viflomax`)
> Runtime track: N/A — el runtime ya existe y está fijado en `package-lock.json` y `.nvmrc`
> Modo de emisión: bundle (13 pasos ≥ 12)
> Versión del blueprint: 1
> Versiones verificadas: N/A — **este cambio no agrega ninguna dependencia**. Ver §11.

---

## 1. Project Overview & Non-Goals

### Visión

Agua Viflomax vende agua purificada a domicilio en Maipú y Padre Hurtado, Región Metropolitana,
Chile. La home pública actual (`app/(public)/page.tsx`) funciona pero fue armada antes de que
existiera un handoff de diseño aprobado: usa una paleta improvisada (`#4db8e8` / `#1a6ba0`) que no
corresponde al logo real, manda al cliente a una página separada (`/pedir`) para hacer el pedido, y
no dice en ninguna parte a qué comunas llega.

Este cambio reemplaza esa home por la versión aprobada por el cliente: paleta derivada del logo real
en escalas 100–900, catálogo con filtro por categoría, sección "por qué elegirnos", sección de
cobertura explícita (Maipú y Padre Hurtado), **formulario de pedido inline** en la misma página en
lugar de `/pedir`, botón flotante de WhatsApp reutilizado tal cual, y una animación de gotas de agua
cayendo de fondo. El endpoint que recibe el pedido (`POST /api/pedidos/publico`) y todo el panel
`/admin` y `/chofer` quedan intactos: este cambio toca `(public)` y la config de Tailwind, nada más.

El objetivo de negocio es acortar el camino de "vi el producto" a "mandé el pedido" de dos páginas a
una, y que la página se vea como la marca real en vez de como un template genérico.

### Users

| Persona | Qué viene a hacer | Frecuencia |
|---|---|---|
| Cliente final de Maipú / Padre Hurtado | Ver precios, elegir un producto y dejar su pedido con dirección y teléfono | Una visita, un pedido |

No hay una persona nueva. El admin y el chofer siguen usando `/admin` y `/chofer`, cuyo público y
cuyas pantallas no cambian con este trabajo (solo heredan los tokens de color, §2).

### Goals — alcance de este cambio

1. La home pública muestra la identidad real de la marca: azul y verde del logo, en escalas
   completas, con contraste WCAG 2.2 AA en toda la superficie pública.
2. El visitante puede filtrar el catálogo por categoría sin recargar la página y llevar un producto
   al formulario con un clic.
3. El visitante completa y envía su pedido **sin salir de la home**, y termina en WhatsApp con el
   mensaje ya escrito.
4. La página dice explícitamente a qué comunas se entrega, y el formulario obliga a elegir una.
5. El flujo antiguo (`/pedir` + `OrderForm.tsx`) queda retirado, con redirección permanente y sin
   código muerto.

### Non-Goals — explícitamente fuera de alcance

**El builder no debe implementar nada de esta tabla**, aunque parezca un agregado chico mientras
trabaja en un paso vecino. Si un paso parece exigir un non-goal, eso es un defecto del blueprint:
detenerse y reportarlo, nunca ampliar el alcance.

| No se construye | Por qué no ahora | Revisitar cuando |
|---|---|---|
| Fotos reales de producto | El cliente todavía no las entrega; `ProductoImagen.tsx` ya cae a un placeholder de marca cuando el archivo no existe | El cliente envíe las fotos |
| Carrito multi-producto en el formulario inline | El diseño aprobado es un producto a la vez vía "Pedir este"; el `/pedir` viejo tenía carrito multi-ítem y se descarta a propósito por el flujo más simple | Feedback de usuarios lo pida de vuelta |
| Migración de base de datos o cambio de esquema | Nada acá toca el modelo de datos; el contrato de `/api/pedidos/publico` está congelado y se reutiliza tal cual | Un cambio futuro necesite campos nuevos en `Pedido` |
| Cambios de UI en `/admin` y `/chofer` más allá de los tokens heredados | Fuera de alcance: este cambio toca `(public)` más la config compartida de Tailwind | Un pase de diseño futuro apunte a las herramientas internas |
| Tests de render de componentes o E2E | No hay Testing Library ni Playwright instalados; agregarlos es una decisión de tooling más grande que este cambio, y este cambio tiene prohibido agregar paquetes | El equipo decida invertir en infraestructura de tests de UI |
| Deduplicar clientes en `/api/pedidos/publico` | El endpoint crea una fila `Cliente` nueva por pedido; es un tema anterior y ajeno a este rediseño | Un cambio futuro aborde la deduplicación de clientes |
| Reemplazar `public/logo.jpeg` | Lo consumen `app/icon.tsx`, `app/icon-192/route.tsx`, `app/icon-512/route.tsx` y `app/apple-icon.tsx` para los iconos PWA; tocarlo rompería superficies fuera de alcance | Un cambio futuro rehaga los iconos PWA |

### Interfaces mantenidas constantes

Estas son las que §9.1 prueba. No son "no-goals" sino contratos congelados:

| Interfaz | Garantía |
|---|---|
| `POST /api/pedidos/publico` | Cuerpo, validaciones, códigos 201/400/500 y forma de respuesta idénticos. El archivo no se edita. |
| `PRODUCTOS`, `CATEGORIAS`, `formatCLP` en `lib/productos.ts` | Nombres, precios y categorías finales. Solo se **agrega** `filtrarPorCategoria`. |
| `WHATSAPP_NUMERO`, `TIENE_WHATSAPP`, `linkWhatsApp`, `HORARIO` en `lib/contacto.ts` | Sin cambios. Solo `ZONA` cambia de texto. |
| Los 4 nombres de clase `viflomax-azul`, `viflomax-azul-oscuro`, `viflomax-verde`, `viflomax-verde-claro` | Siguen existiendo como alias; los 175 usos en 39 archivos no se editan. |

### Métricas de éxito

| Métrica | Objetivo | Cómo se mide |
|---|---|---|
| Pasos hasta enviar un pedido | De 2 páginas a 1 | Contar navegaciones: la home hace `POST /api/pedidos/publico` sin cambiar de ruta |
| Pedidos con `origen = 'web'` por semana | Mayor que la semana previa al deploy | `select count(*) from "Pedido" where origen = 'web' and creado_en > now() - interval '7 days'` |
| Contraste de texto en la superficie pública | 100% de los pares texto/fondo ≥ 4.5:1 (≥ 3:1 en texto grande) | La tabla medida de §7, más el pase manual de §20.1 |
| Peso del logo en el hero | < 150 KB en disco | `test $(wc -c < public/logo.png) -lt 153600` |

---

## 2. Tech Stack

**Este es un cambio brownfield. No hay elección de stack que hacer: cada capa ya existe y ya está
instalada.** Esta tabla documenta lo que hay, no lo que se elige. **Ningún pin nuevo se registra en
ninguna sección**: los majors que se citan acá —Next.js 14, React 18, TypeScript 5, Tailwind 3,
Prisma 5, NextAuth v4, Jest 29, Node 20— describen lo que **ya** está instalado y se leen de
`package-lock.json` y `.nvmrc`, que son la única fuente. §11 explica por qué no hay nada que fijar.

| Capa | Elección | Por qué ésta, sobre qué |
|---|---|---|
| Lenguaje / runtime | TypeScript sobre Node 20 (`.nvmrc` = `20`) — existente | Ya fijado por el repo; cambiarlo estaría fuera de alcance y rompería `/admin` y `/chofer` |
| Framework | Next.js 14 App Router — existente, ver lockfile | Ya en uso; el App Router es lo que permite mantener `PorQueElegirnos` y `Cobertura` como Server Components con cero JS de cliente |
| Estilos | Tailwind CSS 3 con `tailwind.config.ts` (config JS, no CSS-first) — existente | Ya en uso en 39 archivos. Se extiende su paleta; no se migra a la config CSS-first de Tailwind 4, que obligaría a tocar los 39 archivos |
| Capa de componentes | Componentes propios en `components/public/` — existente | No hay librería de componentes instalada y este cambio tiene prohibido agregar una. Los iconos son `<svg>` inline, igual que hoy en `app/(public)/page.tsx` |
| Base de datos | PostgreSQL — existente, sin tocar | Este cambio no lee ni escribe la base directamente; solo llama al endpoint congelado |
| ORM / acceso a datos | Prisma 5 — existente, sin tocar | `prisma generate` corre dentro de `npm run build` y solo lee `prisma/schema.prisma`; no necesita conexión viva |
| Auth | NextAuth v4 — existente, sin tocar | La home es pública; ningún paso de este cambio toca sesión ni middleware |
| Trabajo en background | Ninguno — existente | El pedido se crea en línea, en la request. Nada nuevo que encolar |
| Pagos | NOT APPLICABLE | El cobro es contra entrega, fuera del sitio |
| Almacenamiento de archivos | Cloudinary — existente, sin tocar | Solo lo usa `/chofer` para fotos de entrega |
| Email / notificaciones | WhatsApp vía `wa.me`, con `lib/contacto.ts` como única fuente del número — existente | Es el canal que el negocio ya usa; el formulario abre el link después del 201 |
| Hosting | Vercel — existente | Ya desplegado ahí; este cambio no altera el pipeline |
| Manejo de estado | React Context (`PedidoProvider`) — nuevo, pero con la API de React ya instalada | Una sola pieza de estado compartido (`productoSeleccionado`) entre dos secciones hermanas. Una librería de estado sería una dependencia nueva, que este cambio tiene prohibida |
| Gestor de paquetes | npm (`package-lock.json` presente, sin pnpm ni yarn) — existente | Es el lockfile que hay. Ningún paso ejecuta `npm install`: no hay nada que instalar |
| Tests | Jest 29 + ts-jest, `testEnvironment: jsdom` — existente | Ya configurado con el alias `@/`. Sin Testing Library, así que solo hay tests de funciones puras — ver §13 |
| Lint | ESLint con `next/core-web-vitals` — existente | Ya configurado y hoy pasa limpio |

### Compatibility check

Verificado contra `knowledge/stack-compatibility.md` — **ninguna fila de "Known-bad combinations"
aplica**. En particular:

- La fila *"linter que parsea CSS + motor de estilos CSS-first con at-rules propias"* **no aplica**:
  ESLint con `next/core-web-vitals` no parsea CSS, y este repo usa Tailwind 3 con config JS
  (`tailwind.config.ts`), no la sintaxis CSS-first de Tailwind 4. Comprobado empíricamente:
  `npx next lint` sale 0 con `app/globals.css` presente en el árbol.
- No hay dos proveedores de identidad, ni CSS-in-JS en runtime, ni dos sistemas de migración: este
  cambio no agrega ninguna de esas piezas porque no agrega ninguna pieza.

---

## 3. Directory Structure

Solo el subárbol que este cambio toca, más el bundle. Todo lo demás del repo (`app/admin/**`,
`app/chofer/**`, `app/api/**`, `prisma/**`, `scripts/**`) queda exactamente como está.

```
viflomax/                                  # raíz del repo — NO hay src/, el alias @/ apunta acá
  app/
    globals.css                            # EDITA paso 3 (keyframes nuevos) y paso 8 (borra .bubble)
    (public)/
      layout.tsx                           # EDITA paso 7 — pasa a montar SiteHeader + SiteFooter
      page.tsx                             # EDITA paso 13 — ensamblado final de la landing
      pedir/
        page.tsx                           # BORRA paso 13 (cutover)
      contacto/
        page.tsx                           # existente, no se toca — SiteHeader sigue enlazándolo
    api/pedidos/publico/route.ts           # CONGELADO — contrato de §5, nunca se edita
  components/
    public/
      SiteHeader.tsx                       # NUEVO paso 7
      SiteFooter.tsx                       # NUEVO paso 7
      Hero.tsx                             # REESCRIBE paso 8
      LluviaDeGotas.tsx                    # NUEVO paso 9 — renderer puro de gotas
      PedidoProvider.tsx                   # NUEVO paso 9 — Context 'use client'
      ProductGrid.tsx                      # REESCRIBE paso 10
      PorQueElegirnos.tsx                  # NUEVO paso 11 — Server Component
      Cobertura.tsx                        # NUEVO paso 11 — Server Component
      PedidoForm.tsx                       # NUEVO paso 12 — formulario inline 'use client'
      OrderForm.tsx                        # BORRA paso 13 (cutover)
      ProductoImagen.tsx                   # existente, se reutiliza tal cual dentro de ProductGrid
      WhatsAppFloat.tsx                    # existente, se reutiliza tal cual, montado en el layout
  lib/
    contacto.ts                            # EDITA paso 6 — solo la constante ZONA
    contacto.test.ts                       # NUEVO paso 6
    productos.ts                           # EDITA paso 6 — solo agrega filtrarPorCategoria
    productos.test.ts                      # NUEVO paso 6
    landing/                               # NUEVO — lógica pura de la landing, testeable con Jest
      gotas.ts                             # NUEVO paso 4 — LCG sembrado, sin Math.random
      gotas.test.ts                        # NUEVO paso 4
      mensaje-whatsapp.ts                  # NUEVO paso 5
      mensaje-whatsapp.test.ts             # NUEVO paso 5
      payload-pedido.ts                    # NUEVO paso 5 — arma el body de /api/pedidos/publico
      payload-pedido.test.ts               # NUEVO paso 5
      respuesta-pedido.ts                  # NUEVO paso 12 — interpreta 201 / 400 / 500
      respuesta-pedido.test.ts             # NUEVO paso 12
  public/
    logo.png                               # NUEVO paso 2 — versión optimizada, con alfa, < 150 KB
    logo.jpeg                              # existente, NO se toca — lo usan los iconos PWA
  tailwind.config.ts                       # EDITA paso 1 — escalas 100–900 + alias legacy
  tailwind.config.test.ts                  # NUEVO paso 1 — gate de los tokens
  next.config.mjs                          # EDITA paso 13 — agrega redirects(), conserva headers()
  jest.config.js                           # existente, sin cambios — ver §19.6
  .eslintrc.json                           # existente, sin cambios — ver §19.6
  tsconfig.json                            # existente, sin cambios — ver §19.6
  .nvmrc                                   # existente, sin cambios
  ROLES.md                                 # EDITA paso 13 — la línea 243 deja de documentar /pedir
  blueprints/
    rediseno-landing/                      # este bundle, versionado dentro del proyecto
      blueprint.md
      tasks.json
      epics/
        01-fundaciones.md
        02-interfaz-publica.md
      workspace/                           # el builder copia EL CONTENIDO de esta carpeta a la raíz
        CLAUDE.md
        AGENTS.md
        .claude/
          settings.json
          rules/landing-publica.md
          rules/contratos-congelados.md
          skills/agregar-seccion-landing/SKILL.md
```

**Reglas de frontera**

- `components/public/**` puede importar de `lib/**` y de otros componentes de `components/public/`.
  **Nunca** importa de `lib/db`, de `@prisma/client`, ni de `app/api/**`. El único canal hacia el
  servidor es `fetch('/api/pedidos/publico')`.
- `lib/landing/**` es lógica **pura**: sin React, sin `fetch`, sin `window`, sin `process.env`. Por
  eso se puede testear con Jest sin Testing Library, que es lo único que este repo tiene.
- `lib/contacto.ts` es la única fuente del número de teléfono y del horario. Ningún componente
  escribe un número literal.
- `app/api/pedidos/publico/route.ts` no se edita en ningún paso.
- Los Server Components (`PorQueElegirnos`, `Cobertura`) no llevan `'use client'` y se pasan **como
  children** al `PedidoProvider`, que sí es cliente. Pasar un Server Component como child de un
  Client Component lo mantiene renderizado en el servidor: es el patrón que permite envolver el
  catálogo y el formulario sin arrastrar esas dos secciones al bundle de cliente.

**Convención de resolución de módulos.** Este blueprint fija una: código de aplicación importa con
el alias `@/…`; los tests importan su módulo hermano con especificador relativo (`./gotas`).
La convención está reconciliada contra cada loader en §19.6, *Resolution convention matrix* — no se
repite aquí ni en ninguna otra sección.

**Un archivo dibujado en este árbol no se crea solo.** Cada archivo de arriba tiene exactamente uno
de dos orígenes, y el comentario en línea dice cuál: lo escribe un paso de §9 (y aparece en el array
`files` de esa tarea en `tasks.json`), o se emite bajo `workspace/` (§19) y llega a la raíz con la
copia guardada que corre antes del paso 1. Los archivos de configuración que los `Verify` necesitan
—`jest.config.js`, `.eslintrc.json`, `tsconfig.json`, `.nvmrc`— **ya existen y ya funcionan en este
repo**: no se emiten de nuevo. §19.6 lo documenta con la evidencia.

---

## 4. Data Model

**NOT APPLICABLE — este cambio reutiliza el esquema `Pedido` / `Cliente` / `Producto` existente y el
endpoint congelado `/api/pedidos/publico` sin modificarlos; no hay migración, ni tabla nueva, ni
columna nueva.**

Para que ningún paso tenga que adivinar, esto es lo que el endpoint congelado escribe cuando el
formulario nuevo hace su `POST` — es lectura de `app/api/pedidos/publico/route.ts`, no un diseño
nuevo:

| Escritura | Tabla | Notas |
|---|---|---|
| Una fila `Cliente` por pedido | `Cliente` | `tipo_cliente = 'nuevo'`, `activo = true`. La deduplicación es non-goal (§1) |
| Una fila `Pedido` | `Pedido` | `estado = 'nuevo'`, `origen = 'web'`, `numero_pedido = PED-<año>-<correlativo de 4 dígitos>` |
| Una fila `PedidoItem` por ítem | items del pedido | `precio_unitario` lo calcula `calcularPrecioItem` con `clienteTipo: 'detalle'` |

`productoId` en el cuerpo del request **es el nombre del producto**, que el servidor resuelve contra
la tabla `Producto` buscando coincidencia exacta de `nombre`. Por eso el `<select>` del formulario
nuevo usa `producto.nombre` como `value`, literal, sin slug ni transformación. Ese es el único punto
donde este cambio toca el modelo de datos, y lo toca de solo lectura.

**Sin migración, sin seed nuevo.** Ningún `Verify` de este build necesita una conexión a Postgres
viva. Es una decisión de alcance documentada, no un hueco: §13 explica qué queda sin cubrir por eso.

---

## 5. API Design

Este cambio **no agrega ni modifica ningún endpoint**. Consume uno solo, cuyo contrato está
congelado. Se transcribe entero acá porque el paso 5 y el paso 12 se miden contra él y no pueden
depender de leer el archivo del servidor.

### Convenciones (heredadas, no elegidas acá)

- Base path: `/api`
- Envelope de respuesta: `{ data: T | null, error: string | null }` — una sola forma, sin excepciones
- Validación: comprobaciones imperativas dentro del handler; no hay librería de esquemas en el repo
- Sin paginación, sin idempotencia, sin rate limit en este endpoint

### Ruta consumida

| Método | Path | Qué hace | Auth | Rate limit |
|---|---|---|---|---|
| POST | `/api/pedidos/publico` | Crea un `Cliente` y un `Pedido` con sus ítems desde el formulario público | pública | ninguno |

### `POST /api/pedidos/publico` — detalle completo

**Request body**

```ts
{
  nombre: string        // requerido, no vacío tras trim
  telefono: string      // requerido, no vacío tras trim
  email?: string        // opcional
  direccion: string     // requerido, no vacío tras trim
  comuna: string        // requerido, no vacío tras trim
  items: Array<{
    productoId: string  // = producto.nombre, se resuelve a UUID en el servidor
    cantidad: number    // > 0
  }>                    // requerido, al menos un ítem válido
  notas?: string        // opcional
}
```

**Respuestas**

| Status | Cuerpo | Cuándo |
|---|---|---|
| `201` | `{ data: { pedido_id: string, numero_pedido: string \| null }, error: null }` | Pedido creado |
| `400` | `{ data: null, error: 'Cuerpo de solicitud inválido' }` | El body no es JSON parseable |
| `400` | `{ data: null, error: 'Los campos nombre, teléfono, dirección y comuna son obligatorios' }` | Falta uno de los cuatro campos |
| `400` | `{ data: null, error: 'Se requiere al menos un producto' }` | `items` ausente o no es array |
| `400` | `{ data: null, error: 'Debes seleccionar al menos un producto con cantidad mayor a 0' }` | Ningún ítem con `cantidad > 0` |
| `400` | `{ data: null, error: 'No se encontraron los productos seleccionados' }` | Ningún nombre coincide con un `Producto` activo |
| `400` | `{ data: null, error: 'No se pudieron resolver los productos seleccionados' }` | Coincidencia parcial que termina vacía |
| `500` | `{ data: null, error: 'Error al crear el pedido' }` | La transacción falla |

**Efectos**: escribe las tres filas de §4 en una sola transacción. No manda emails ni encola trabajos.

**Consecuencias para este cambio**, que son lo que el paso 12 implementa:

1. `comuna` es obligatorio. El formulario nuevo **debe** enviarlo no vacío — de ahí el `<select>` con
   `Maipú`, `Padre Hurtado`, `Otra comuna`.
2. `email` y `notas` vacíos deben **omitirse** del body, no mandarse como `""`.
3. Solo `201` es éxito. Cualquier otro status muestra el `error` del cuerpo y **no** abre WhatsApp.

---

## 6. Frontend Architecture

### Rutas

| Ruta | Página | Fuente de datos | Auth |
|---|---|---|---|
| `/` | `app/(public)/page.tsx` — la landing rediseñada | `PRODUCTOS` y `CATEGORIAS` de `lib/productos.ts` (módulo estático); el pedido va por `fetch` a `/api/pedidos/publico` | pública |
| `/contacto` | `app/(public)/contacto/page.tsx` — existente, sin cambios | estática | pública |
| `/pedir` | **retirada en el paso 13** | — | redirección 308 permanente a `/#pedido` |

### Estrategia de renderizado

`/` se prerrenderiza como estática (hoy ya lo es: `next build` la lista como `○`). Nada en la página
consulta la base de datos en tiempo de render, así que **no se agrega ninguna directiva**: sin
`dynamic`, sin `revalidate`, sin `force-dynamic`. Mantenerla estática es un requisito, no un
accidente: es lo que hace que las gotas generadas en el servidor y las generadas al hidratar tengan
que coincidir, y por eso `lib/landing/gotas.ts` usa un LCG sembrado y no `Math.random()`.

### Jerarquía de componentes de `/`

```
app/(public)/layout.tsx            (server)
├── SiteHeader                     (server) — barra de contacto + nav sticky
├── main
│   └── app/(public)/page.tsx      (server)
│       ├── Hero                   (server) — logo con next/image, gradiente + scrim
│       └── PedidoProvider         ('use client') ── frontera de cliente
│           ├── ProductGrid        ('use client') — pills de filtro + tarjetas + LluviaDeGotas
│           ├── PorQueElegirnos    (server, pasado como child → sigue en el servidor)
│           ├── Cobertura          (server, pasado como child → sigue en el servidor)
│           └── section#pedido
│               └── PedidoForm     ('use client') — formulario inline
├── SiteFooter                     (server)
└── WhatsAppFloat                  (server) — existente, sin cambios
```

`PorQueElegirnos` y `Cobertura` van **dentro** del `PedidoProvider` porque el orden visual aprobado
los pone entre el catálogo y el formulario, y el provider tiene que abarcar a ambos extremos. Pasarlos
como children desde un Server Component los mantiene renderizados en el servidor con cero JS de
cliente: es el comportamiento documentado del App Router, y el paso 11 lo verifica con un grep que
exige que ninguno de los dos archivos lleve `'use client'`.

### Manejo de estado

| Estado | Dónde vive | Por qué ahí |
|---|---|---|
| `productoSeleccionado: string \| null` | `PedidoProvider` (Context) | Es el único dato que cruza de `ProductGrid` a `PedidoForm`. Un Context de React no agrega dependencias; una librería de estado sí |
| Filtro de categoría | `useState` local en `ProductGrid` | No lo necesita nadie más |
| Campos del formulario | `useState` local en `PedidoForm` | Idem — sacarlos al Context sería estado global sin lector |
| Resultado del envío | `useState` local en `PedidoForm`, derivado con `interpretarRespuestaPedido` | La decisión 201/400/500 es lógica pura y se testea aparte |

**Deliberadamente fuera del estado global:** el catálogo (es un módulo estático), los datos de
contacto (son constantes de `lib/contacto.ts`) y las gotas (son deterministas por semilla).

### Estados de carga, vacío y error

| Superficie | Cargando | Vacío | Error |
|---|---|---|---|
| `ProductGrid` | ninguno — los datos son estáticos | Si un filtro no deja productos, muestra "No hay productos en esta categoría" en vez de una grilla vacía | ninguno posible |
| Foto de producto | `next/image` sin placeholder | `ProductoImagen` cae al placeholder de marca cuando falta el archivo — es el caso real hoy | mismo placeholder vía `onError` |
| `PedidoForm` | botón deshabilitado con "Enviando pedido…" | ninguno | Panel rojo con el `error` textual de la API; WhatsApp no se abre |
| `PedidoForm` éxito | — | — | Panel verde con `numero_pedido`, y el link de WhatsApp solo si `TIENE_WHATSAPP` |

---

## 7. Design System

Todos los valores son literales, tomados del handoff aprobado
(`design_handoff_landing_redesign/README.md` y el CSS del prototipo). No hay ningún "azul cálido" ni
"espaciado medio" en esta sección.

### Colores

Se escriben en `tailwind.config.ts` como dos escalas anidadas más dos claves hermanas de
compatibilidad. Los nombres de clase resultantes están en la columna derecha.

| Token | Hex | Clase Tailwind | Uso |
|---|---|---|---|
| `viflomax.azul.100` | `#eaf6fc` | `bg-viflomax-azul-100` | Fondo de la sección de cobertura |
| `viflomax.azul.200` | `#cdeaf7` | `bg-viflomax-azul-200` | Bordes suaves, chips inactivos |
| `viflomax.azul.300` | `#a3d9f0` | `bg-viflomax-azul-300` | Gotas sobre fondo blanco |
| `viflomax.azul.400` | `#6dc2e3` | `bg-viflomax-azul-400` | Gotas sobre fondo `azul-100` |
| `viflomax.azul.DEFAULT` (500) | `#2f9fd6` | `bg-viflomax-azul` | Superficies e iconos — **nunca texto blanco encima** |
| `viflomax.azul.600` | `#2380ac` | `bg-viflomax-azul-600` | Hover de superficies azules |
| `viflomax.azul.700` | `#1a628a` | `bg-viflomax-azul-700` | Botones secundarios con texto blanco |
| `viflomax.azul.800` | `#164a63` | `bg-viflomax-azul-800` | Barra de contacto, footer, títulos oscuros |
| `viflomax.azul.900` | `#0d2f40` | `bg-viflomax-azul-900` | Inicio del gradiente del hero |
| `viflomax.verde.100` | `#eef9e6` | `bg-viflomax-verde-100` | Fondo de tarjetas de confianza |
| `viflomax.verde.200` | `#d9f0c7` | `bg-viflomax-verde-200` | Bordes suaves |
| `viflomax.verde.300` | `#bce39c` | `bg-viflomax-verde-300` | Detalles decorativos |
| `viflomax.verde.400` | `#97cf6c` | `bg-viflomax-verde-400` | Hover claro |
| `viflomax.verde.DEFAULT` (500) | `#6ab04c` | `bg-viflomax-verde` | Bordes, iconos, parada del gradiente — **nunca texto blanco encima** |
| `viflomax.verde.600` | `#549140` | `bg-viflomax-verde-600` | Solo texto grande sobre verde |
| `viflomax.verde.700` | `#3f6f31` | `bg-viflomax-verde-700` | **Todos los CTA y badges con texto blanco** |
| `viflomax.verde.800` | `#2c4f23` | `bg-viflomax-verde-800` | Hover de los CTA |
| `viflomax.verde.900` | `#1c3216` | `bg-viflomax-verde-900` | Texto verde muy oscuro |

**Alias legacy** — claves hermanas, no parte de las escalas. Existen para que los 175 usos repartidos
en 39 archivos de `/admin` y `/chofer` sigan compilando sin editar ninguno:

| Clase que ya existe en el repo | Resuelve a | Hex nuevo | Hex viejo |
|---|---|---|---|
| `viflomax-azul` | `viflomax.azul.DEFAULT` | `#2f9fd6` | `#4db8e8` |
| `viflomax-azul-oscuro` | clave hermana `azul-oscuro` = `viflomax.azul[800]` | `#164a63` | `#1a6ba0` |
| `viflomax-verde` | `viflomax.verde.DEFAULT` | `#6ab04c` | `#6ab04c` (sin cambio) |
| `viflomax-verde-claro` | clave hermana `verde-claro` = `viflomax.verde[400]` | `#97cf6c` | `#7ec850` |

Fondo de página: blanco puro `#ffffff` en toda la superficie pública. Sin crema ni beige.
Verde de WhatsApp: `#25D366`, fijo de marca, ya correcto en `WhatsAppFloat.tsx`, intocable.

### Contraste — medido, no estimado

Ratios calculados con la fórmula WCAG 2.2 (luminancia relativa sRGB, `(L1+0.05)/(L2+0.05)`).

| Par | Ratio | Veredicto |
|---|---|---|
| `#ffffff` sobre `#164a63` (azul-800) — barra de contacto, footer | **9.57:1** | ✅ AA y AAA |
| `#ffffff` sobre `#1a628a` (azul-700) — botón secundario | **6.65:1** | ✅ AA |
| `#ffffff` sobre `#3f6f31` (verde-700) — CTA principal, badges | **5.95:1** | ✅ AA |
| `#ffffff` sobre `#549140` (verde-600) | **3.82:1** | ⚠️ solo texto grande (≥ 24px, o ≥ 18.66px bold) |
| `#ffffff` sobre `#2f9fd6` (azul-500) | **2.98:1** | ❌ **prohibido para texto** |
| `#ffffff` sobre `#6ab04c` (verde-500) | **2.65:1** | ❌ **prohibido para texto** |
| `#ffffff` sobre el punto más claro del gradiente del hero **con el scrim `bg-black/30`** | **5.03:1** | ✅ AA |

**Las tres reglas que salen de esta tabla, y que §9 hace cumplir:**

1. Texto blanco sobre verde va **siempre** en `viflomax-verde-700`. Nunca en `viflomax-verde`.
2. Texto blanco sobre azul va en `viflomax-azul-700` o `viflomax-azul-800`. Nunca en `viflomax-azul`.
3. El hero conserva el gradiente aprobado (`azul-900 → azul-500 → verde-500`) y lleva **encima** una
   capa `bg-black/30` bajo el contenido. **El scrim es estructural, no un retoque: sin él no pasa
   ningún texto del hero, ni siquiera el `<h1>`.** En la parada verde el blanco queda en 2.65:1, por
   debajo incluso del umbral de 3:1 que aplica al texto grande, y el subtítulo `text-xl` y el tag
   `text-sm` necesitan 4.5:1. Con el scrim, el peor punto del gradiente sube a 5.03:1 y los tres
   pasan AA. Quitar la capa reprueba el hero entero.

### Tipografía

| Rol | Familia | Tamaño / interlineado | Peso |
|---|---|---|---|
| Hero H1 | `font-nunito` (var `--font-nunito`, ya cableada en `app/layout.tsx`) | `text-5xl md:text-7xl` con `leading-tight` | `font-extrabold` |
| H2 de sección | `font-nunito` | `text-3xl md:text-4xl` | `font-bold` |
| H3 de tarjeta | `font-nunito` | `text-xl` | `font-bold` |
| Subtítulo del hero | por defecto del sistema | `text-xl md:text-2xl` | normal |
| Cuerpo | por defecto del sistema | `text-sm` / `text-base` con `leading-relaxed` | normal |
| Precio | `font-nunito` | `text-2xl` | `font-extrabold` |

**Carga de fuentes:** sin cambios. `next/font` ya inyecta `--font-nunito` y `--font-outfit` desde
`app/layout.tsx`. **Este cambio no agrega ninguna fuente** — el handoff pedía 58px para el H1 y se
usa la escala responsiva que ya existe (`text-5xl md:text-7xl`) en vez de un px fijo.

### Espaciado, radio, elevación

- Escala de espaciado: la de Tailwind por defecto. Secciones a `py-16`, contenedor `max-w-6xl mx-auto px-6`.
- Radio: `rounded-full` en botones, pills de filtro y badges; `rounded-2xl` (16px) en tarjetas; el
  card del formulario de pedido `rounded-2xl`.
- Sombras: tarjetas `shadow-sm` en reposo y `hover:shadow-lg`; el card del formulario `shadow-md`.
- Ancho máximo de contenido: `max-w-6xl` (72rem). Breakpoints: los de Tailwind (`sm` 640, `md` 768,
  `lg` 1024).

### Motion

Dos animaciones, ambas definidas en `app/globals.css` en el paso 3, ambas con literales fijos:

| Animación | Keyframe | Parámetros |
|---|---|---|
| Flotado del logo del hero | `logo-float` | `5s ease-in-out infinite`, desplazamiento `translateY(-14px)` en el 50% |
| Lluvia de gotas | `waterfall` | `linear infinite`; por gota: `animation-duration` 4–9s, `animation-delay` negativo (arranque escalonado desde el primer paint), `--drop-op` 0.15–0.4 |

Geometría de la gota: `10px × 14px`, `border-radius: 50% 50% 50% 0`, rotada `45deg`. **La rotación va
dentro de los keyframes**, no como `transform` estático de la clase: una animación que anima
`transform` sobrescribiría un `rotate` declarado aparte, y la gota quedaría sin rotar durante toda la
animación.

**`prefers-reduced-motion: reduce` apaga las dos**, con un bloque literal en `app/globals.css` que
pone `animation: none` en `.logo-float` y `.water-drop`. Es un criterio de aceptación del paso 3, no
una intención.

### Estilo de componente

Superficies blancas con bordes de 1px muy suaves y sombra mínima; el color entra por bloques
saturados (hero, cobertura, CTA) y no por el fondo, que se queda blanco. Las esquinas son generosas
(16px en tarjetas, completamente redondeadas en cualquier cosa clickeable pequeña). El movimiento es
ambiental —gotas, el logo flotando— y nunca reacciona al scroll ni entra al camino de una
interacción. Si un componente nuevo necesita un color que no está en la tabla de arriba, o texto
blanco sobre `viflomax-verde`, no pertenece a este sistema.

---

## 8. Authentication & Authorization

**NOT APPLICABLE — la superficie que este cambio toca es enteramente pública y anónima.**

La home, el catálogo y el formulario de pedido no tienen cuentas, sesión ni roles: el visitante llega,
elige y envía. `POST /api/pedidos/publico` es deliberadamente público y así se queda (§5, contrato
congelado).

El repo sí tiene autenticación —NextAuth v4 protegiendo `/admin` y `/chofer` vía `middleware.ts`—
pero **ningún paso de §9 la toca**: no se edita `middleware.ts`, ni `lib/auth/**`, ni ninguna ruta
autenticada. El único cruce es que `middleware.ts` corre sobre `/` con su matcher actual, y eso ya
funciona hoy; el rediseño no cambia ese comportamiento y `npm run build` lo comprueba en cada paso.

---

## 9. BUILD ORDER

**Esta es la sección que el blueprint existe para producir.** Todo lo anterior es contexto; esto es
el set de instrucciones.

### Las reglas de un paso

1. **Un paso, una sentada.** Máximo 5 archivos y máximo 6 criterios de aceptación. Si se pasa, se
   parte en dos.
2. **Todo paso lleva los cuatro campos:** `Do`, `Done when`, `Verify`, `Checkpoint`, en ese orden y
   siempre.
3. **`Checkpoint` es un bloque de shell literal**, no una frase: commitea y etiqueta. La etiqueta es
   el objetivo de rollback del paso siguiente.
4. **"Se ve bien" está prohibido.** Igual que *funciona*, *está implementado*, *renderiza correcto*.
5. **`Verify` es shell literal**, copiable, con el resultado esperado en un comentario, y **sale 0
   cuando el paso está correcto**. Si el resultado correcto de un comando es un exit distinto de 0,
   se envuelve en una aserción del código exacto (`cmd; test $? -eq 1`), nunca en un `!` pelado: un
   error de uso también sale distinto de 0 y haría que el gate pase por la razón equivocada.
6. **Un paso no está listo hasta que sus `Verify` pasan y los de los pasos anteriores siguen
   pasando.**
7. **Nunca saltarse un paso.** Si el paso 7 se traba: detenerse y reportar, no empezar el 8.
8. **Ningún `Verify` puede depender de lo que produce su propio `Checkpoint`.** Al correr el
   `Verify`, los archivos del paso están escritos pero sin commitear, el árbol está sucio y la
   etiqueta no existe. Cualquier aserción sobre estado commiteado va **dentro del bloque
   `Checkpoint`**, después del commit, o en §20.1.
9. **Ningún paso introduce un requisito que rompa retroactivamente el `Verify` de un paso anterior.**
   Este build no agrega validación de entorno, ni reglas de lint, ni restricciones de esquema, así
   que la superficie de esta regla es chica; el único caso real es el CSS muerto `.bubble`, que se
   borra en el **paso 8**, el mismo paso que elimina a su último consumidor, y no antes.

### Sobre las etiquetas de checkpoint en este repositorio

**Este repo ya trae 16 etiquetas `step-*` de un build anterior** (`git tag -l 'step-*' | wc -l`
devolvió `16` antes del paso 1: `step-01-baseline-migraciones` … `step-16-retencion-purga`). Por eso:

- Las 13 etiquetas de este build usan slugs propios, así que ninguna colisiona con las existentes.
- **§20.1 verifica las 13 etiquetas por nombre, una por una, nunca contándolas.** Un
  `git tag -l 'step-*' | wc -l` daría 29 y fallaría siempre, por una razón que no tiene nada que ver
  con el código.

### Una tarea, una unidad — la regla de conteo

> **Un paso de §9 = una tarea en `tasks.json` = un bloque de tarea en un archivo de epic.**

13 pasos → 13 tareas → 13 bloques repartidos entre los epics. La cantidad de epics se **deriva** del
conteo de pasos: al menos `ceil(13 ÷ 9) = 2`, como máximo `floor(13 ÷ 5) = 2`. Para 13 pasos la
única división legal es **exactamente 2 epics**, y la costura natural es la frontera de capa:
primero todo lo que no es interfaz (tokens, asset, CSS, módulos puros con sus tests), después toda
la interfaz pública y el cutover.

| Epic | Pasos | Nombre |
|---|---|---|
| `01-fundaciones` | 1–6 | Tokens, logo, keyframes y la lógica pura testeable |
| `02-interfaz-publica` | 7–13 | Shell, secciones, pedido inline y cutover |

### Step map

| # | Paso | Depende de | Toca | Gate |
|---|---|---|---|---|
| 1 | Tokens de color y alias legacy | — | `tailwind.config.ts`, `tailwind.config.test.ts` | `npx jest tailwind.config.test.ts` |
| 2 | Logo optimizado con alfa | — | `public/logo.png` | check de bytes y de cabecera PNG |
| 3 | Keyframes y motion | 1 | `app/globals.css` | `npm run build` + greps sobre el CSS |
| 4 | Generador determinista de gotas | — | `lib/landing/gotas.ts` + test | `npx jest lib/landing/gotas.test.ts` |
| 5 | Constructores puros del pedido | — | `lib/landing/mensaje-whatsapp.ts`, `lib/landing/payload-pedido.ts` + tests | `npx jest` sobre ambos |
| 6 | Filtro de catálogo y zona | — | `lib/productos.ts`, `lib/contacto.ts` + tests | `npx jest lib/productos.test.ts lib/contacto.test.ts` |
| 7 | Shell del sitio | 1 | `SiteHeader.tsx`, `SiteFooter.tsx`, `app/(public)/layout.tsx` | `npm run build` |
| 8 | Hero nuevo y limpieza de CSS muerto | 1, 2, 3, 7 | `Hero.tsx`, `app/globals.css` | `npm run build` + grep de `bubble` |
| 9 | Lluvia de gotas y contexto de pedido | 3, 4 | `LluviaDeGotas.tsx`, `PedidoProvider.tsx` | `npm run build` |
| 10 | Catálogo con filtro y lluvia | 6, 9 | `ProductGrid.tsx` | `npm run build` + greps |
| 11 | Secciones de confianza y cobertura | 6, 9 | `PorQueElegirnos.tsx`, `Cobertura.tsx` | `npm run build` + greps |
| 12 | Formulario de pedido inline | 5, 9 | `respuesta-pedido.ts` + test, `PedidoForm.tsx` | `npx jest lib/landing/respuesta-pedido.test.ts` |
| 13 | Cutover: ensamblado, redirect y borrado | 8, 10, 11, 12 | `page.tsx`, `next.config.mjs`, 2 borrados | `npm run build` + greps de ausencia |

Los pasos 1, 2, 4, 5 y 6 no dependen entre sí: son cinco ramas paralelizables desde el inicio. El
paso 3 depende del 1 solo porque el CSS nuevo se lee junto a los tokens que el paso 1 introduce.

---

#### Paso 1 — Escalas de color y alias legacy en Tailwind

**Do**

Reemplazar el objeto `colors.viflomax` de `tailwind.config.ts` por las dos escalas 100–900 de §7 más
las dos claves hermanas de compatibilidad. `content`, `fontFamily` y `plugins` quedan como están.

- `tailwind.config.ts` — editar solo `theme.extend.colors.viflomax`
- `tailwind.config.test.ts` — **nuevo**, en la raíz del repo, importa `./tailwind.config` con
  especificador relativo (la convención de tests de §19.6) y afirma los tokens

Forma exacta del objeto, para que no haya que deducirla:

```ts
viflomax: {
  azul: {
    100: '#eaf6fc', 200: '#cdeaf7', 300: '#a3d9f0', 400: '#6dc2e3',
    DEFAULT: '#2f9fd6',
    600: '#2380ac', 700: '#1a628a', 800: '#164a63', 900: '#0d2f40',
  },
  verde: {
    100: '#eef9e6', 200: '#d9f0c7', 300: '#bce39c', 400: '#97cf6c',
    DEFAULT: '#6ab04c',
    600: '#549140', 700: '#3f6f31', 800: '#2c4f23', 900: '#1c3216',
  },
  'azul-oscuro': '#164a63',
  'verde-claro': '#97cf6c',
}
```

Tailwind aplana los objetos anidados con guiones, así que `bg-viflomax-azul` resuelve a `DEFAULT`,
`bg-viflomax-azul-700` a la clave `700`, y `bg-viflomax-azul-oscuro` a la clave hermana. Las claves
hermanas no chocan con las numéricas. **Ninguno de los 39 archivos que usan los alias se edita.**

**Done when**

- [ ] WHEN `npx jest tailwind.config.test.ts` runs THE SYSTEM SHALL exit 0 with 0 failed and 0 skipped.
- [ ] WHEN the test reads `theme.extend.colors.viflomax.azul` THE SYSTEM SHALL find the nine keys `100`, `200`, `300`, `400`, `DEFAULT`, `600`, `700`, `800`, `900`, with `DEFAULT` equal to `#2f9fd6` and `800` equal to `#164a63`.
- [ ] WHEN the test reads `theme.extend.colors.viflomax.verde` THE SYSTEM SHALL find the same nine keys, with `DEFAULT` equal to `#6ab04c`, `400` equal to `#97cf6c` and `700` equal to `#3f6f31`.
- [ ] WHEN the test reads the legacy sibling keys THE SYSTEM SHALL find `azul-oscuro` equal to `#164a63` and `verde-claro` equal to `#97cf6c`, so `bg-viflomax-azul-oscuro` and `bg-viflomax-verde-claro` keep resolving in the 39 files that already use them.
- [ ] WHEN `npm run lint` runs THE SYSTEM SHALL exit 0 with zero errors and zero warnings.
- [ ] WHEN `npm run build` runs THE SYSTEM SHALL exit 0.

**Verify**

```bash
npx jest tailwind.config.test.ts   # expect: exit 0, 0 failed, 0 skipped
npm run lint                       # expect: exit 0, "No ESLint warnings or errors"
npm run build                      # expect: exit 0
```

**Checkpoint**

```bash
git add -A && git commit -m "step 1: escalas de color viflomax y alias legacy"
git tag step-01-tokens-color
git ls-files --error-unmatch tailwind.config.ts tailwind.config.test.ts   # expect: exit 0 — ya commiteados
# rollback si el paso 2 sale mal: git reset --hard step-01-tokens-color
```

---

#### Paso 2 — Logo optimizado con transparencia

**Do**

Producir `public/logo.png`: el logo real con fondo transparente, por debajo de 150 KB, para que el
hero lo sirva por `next/image` sobre el gradiente sin una caja blanca detrás.

- `public/logo.png` — **nuevo**
- `scripts-check-logo.cjs` — **nuevo y temporal**: lo escribe el heredoc de la primera línea del
  bloque `Verify` y lo borra la penúltima. Figura acá porque un `Verify` no puede ejecutar un archivo
  que ningún paso escribe

El origen es `design_handoff_landing_redesign/assets/logo.png`, que pesa 1 520 376 bytes (1.45 MB) y
**no puede embarcarse así**: sería el LCP de la home. **La optimización es un sub-paso manual** —
`sips`, `magick`, `pngquant`, Squoosh o la herramienta que el builder tenga— porque este repo no
tiene ninguna librería de imágenes y este cambio no puede agregar una. El gate no es la herramienta:
es el archivo en disco.

`public/logo.jpeg` (104 639 bytes) **no se toca ni se reemplaza**: lo consumen `app/icon.tsx`,
`app/icon-192/route.tsx`, `app/icon-512/route.tsx` y `app/apple-icon.tsx`, todos fuera de alcance.
Además es JPEG, sin canal alfa, así que sobre el gradiente del hero mostraría un rectángulo blanco:
por eso hace falta un PNG nuevo y no sirve reutilizar el que ya está.

**Done when**

- [ ] WHEN `test -f public/logo.png` runs THE SYSTEM SHALL exit 0.
- [ ] WHEN the size check reads `public/logo.png` THE SYSTEM SHALL report fewer than 153600 bytes.
- [ ] WHEN the PNG header check reads the IHDR chunk THE SYSTEM SHALL report colour type 4 or 6, or colour type 3 accompanied by a `tRNS` chunk, so the mark keeps a transparent background over the hero gradient.
- [ ] WHEN the PNG header check reads the IHDR width THE SYSTEM SHALL report at least 600 pixels, so the mark is not a thumbnail upscaled in the hero.
- [ ] WHEN `git check-ignore -q public/logo.png` runs THE SYSTEM SHALL exit 1, meaning no ignore pattern excludes the new asset.
- [ ] WHEN `test -f public/logo.jpeg` runs THE SYSTEM SHALL exit 0, because `app/icon.tsx`, `app/icon-192/route.tsx`, `app/icon-512/route.tsx` and `app/apple-icon.tsx` still serve it.

**Verify**

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

test -f public/logo.png                             # expect: exit 0
test -f public/logo.jpeg                            # expect: exit 0 — los iconos PWA lo siguen usando
node scripts-check-logo.cjs                         # expect: exit 0, imprime OK
git check-ignore -q public/logo.png; test $? -eq 1  # git sale 1 = no ignorado -> esta linea sale 0
rm -f scripts-check-logo.cjs
test ! -e scripts-check-logo.cjs                    # expect: exit 0 — el temporal no queda en el repo
```

El comprobador lo escribe **la primera línea de este mismo bloque**, con un heredoc: ahí se crea, ahí
se corre y ahí se borra, y la última línea comprueba que ya no está. Por eso `scripts-check-logo.cjs`
figura en la lista de archivos del paso aunque no sobreviva a él: un `Verify` no puede ejecutar un
archivo que ningún paso escribe. El contenido de arriba es exactamente lo que el heredoc deja en
disco.

**Checkpoint**

```bash
git add -A && git commit -m "step 2: logo optimizado con alfa para el hero"
git tag step-02-logo-optimizado
git ls-files --error-unmatch public/logo.png   # expect: exit 0 — ya commiteado
# rollback: git reset --hard step-02-logo-optimizado
```

---

#### Paso 3 — Keyframes, gota y respeto por `prefers-reduced-motion`

**Do**

Agregar a `app/globals.css` los dos pares keyframe/clase de §7 y el bloque de movimiento reducido.

- `app/globals.css` — editar, **solo agregando**

**No se borra `.bubble` ni `@keyframes float` en este paso.** Su último consumidor es el `Hero.tsx`
viejo, que sigue vivo hasta el paso 8; borrarlos acá dejaría el hero actual sin animación durante
cinco pasos. El paso 8 los elimina, que es el paso que elimina al consumidor.

Contenido a agregar, literal:

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

`left`, `animation-duration`, `animation-delay`, `--drop-op` y `background` los aporta cada gota por
`style` inline, desde el array que devuelve `generarGotas` (paso 4). La rotación de 45° vive **dentro
de los keyframes** porque la animación anima `transform`: declararla como `transform` estático de la
clase la haría desaparecer apenas arranca la animación.

**Done when**

- [ ] WHEN `npm run build` runs THE SYSTEM SHALL exit 0, proving Tailwind compiled `app/globals.css` with no CSS syntax error.
- [ ] WHEN `grep` searches `app/globals.css` THE SYSTEM SHALL find `@keyframes logo-float` and the literal `translateY(-14px)`.
- [ ] WHEN `grep` searches `app/globals.css` THE SYSTEM SHALL find a `.logo-float` rule whose animation shorthand carries `5s`, `ease-in-out` and `infinite`.
- [ ] WHEN `grep` searches `app/globals.css` THE SYSTEM SHALL find `@keyframes waterfall` carrying `rotate(45deg)` inside the transform of both the 0% and the 100% stop, and `translateY(110vh)` at the 100% stop.
- [ ] WHEN `grep` searches `app/globals.css` THE SYSTEM SHALL find a `.water-drop` rule carrying `border-radius: 50% 50% 50% 0`, `width: 10px`, `height: 14px` and `animation-name: waterfall`.
- [ ] WHEN `grep` searches `app/globals.css` THE SYSTEM SHALL find a `prefers-reduced-motion: reduce` block that sets `animation: none` and names both `.logo-float` and `.water-drop`.

**Verify**

```bash
grep -q '@keyframes logo-float' app/globals.css                            # expect: exit 0
grep -q 'translateY(-14px)' app/globals.css                                # expect: exit 0
grep -q 'animation: logo-float 5s ease-in-out infinite' app/globals.css    # expect: exit 0
grep -q '@keyframes waterfall' app/globals.css                             # expect: exit 0
grep -q 'translateY(-10%) rotate(45deg)' app/globals.css                   # expect: exit 0
grep -q 'translateY(110vh) rotate(45deg)' app/globals.css                  # expect: exit 0
grep -q 'border-radius: 50% 50% 50% 0' app/globals.css                     # expect: exit 0
grep -q 'width: 10px' app/globals.css                                      # expect: exit 0
grep -q 'height: 14px' app/globals.css                                     # expect: exit 0
grep -q 'animation-name: waterfall' app/globals.css                        # expect: exit 0
grep -q 'prefers-reduced-motion: reduce' app/globals.css                   # expect: exit 0
grep -A4 'prefers-reduced-motion: reduce' app/globals.css | grep -q 'animation: none'   # expect: exit 0
npm run build                                                              # expect: exit 0
```

**Checkpoint**

```bash
git add -A && git commit -m "step 3: keyframes logo-float y waterfall con guardia de movimiento reducido"
git tag step-03-keyframes-motion
# rollback: git reset --hard step-03-keyframes-motion
```

---

#### Paso 4 — Generador determinista de gotas

**Do**

Crear el módulo puro que produce el array de gotas. **Determinista por semilla**: la home se
prerrenderiza estática y se hidrata en el cliente, así que si las gotas salieran de `Math.random()`
el servidor y el cliente producirían valores distintos y React reportaría un hydration mismatch.

- `lib/landing/gotas.ts` — **nuevo**. Exporta el tipo `GotaEstilo` y
  `generarGotas(semilla: number, cantidad: number, colorVar: string): GotaEstilo[]`
- `lib/landing/gotas.test.ts` — **nuevo**, importa `./gotas`

`GotaEstilo` es `{ left: number; duracion: number; retraso: number; opacidad: number; color: string }`.
El generador es un LCG clásico, `s = (s * 9301 + 49297) % 233280`, con `next()` devolviendo
`s / 233280`. Por gota consume cuatro valores en este orden: `left` (0–100, redondeado a 2
decimales), `duracion` (4–9 s), `retraso` (−9–0 s, negativo para que la lluvia arranque ya poblada
en el primer paint) y `opacidad` (0.15–0.4). `color` es el `colorVar` recibido, sin transformar.

**Prohibido en este archivo:** `Math.random`, `Date.now`, `useEffect`, cualquier lectura de
`process.env`. Es lógica pura y por eso se puede testear con el Jest que este repo ya tiene.

**Done when**

- [ ] WHEN `npx jest lib/landing/gotas.test.ts` runs THE SYSTEM SHALL exit 0 with 0 failed and 0 skipped.
- [ ] WHEN `generarGotas(7, 16, 'x')` is called twice in the same process THE SYSTEM SHALL return two deeply equal arrays, proving the generator is seeded and never calls `Math.random`.
- [ ] WHEN `generarGotas(7, 16, 'x')` is called THE SYSTEM SHALL return exactly 16 items, every one with `left` between 0 and 100 inclusive.
- [ ] WHEN `generarGotas(7, 16, 'x')` is called THE SYSTEM SHALL return every item with `duracion` between 4 and 9, `retraso` between -9 and 0, and `opacidad` between 0.15 and 0.4.
- [ ] WHEN `generarGotas(7, 16, 'x')[0].left` is read THE SYSTEM SHALL equal 49.04 to two decimal places, the value the LCG `(s * 9301 + 49297) % 233280` yields from seed 7.
- [ ] WHEN `generarGotas(11, 16, 'x')` is compared with `generarGotas(7, 16, 'x')` THE SYSTEM SHALL return a different array, proving the seed is honoured rather than ignored.

**Verify**

```bash
npx jest lib/landing/gotas.test.ts   # expect: exit 0, 0 failed, 0 skipped
npm run lint                         # expect: exit 0, "No ESLint warnings or errors"
```

**Checkpoint**

```bash
git add -A && git commit -m "step 4: generador determinista de gotas con LCG sembrado"
git tag step-04-gotas
# rollback: git reset --hard step-04-gotas
```

---

#### Paso 5 — Constructores puros del pedido

**Do**

Crear los dos módulos puros que arman lo que el formulario del paso 12 va a enviar. Van aparte del
componente a propósito: son lo único de ese flujo que este repo puede testear, porque no hay Testing
Library instalada (§13) y agregarla es non-goal (§1).

- `lib/landing/mensaje-whatsapp.ts` — **nuevo**. `construirMensajeWhatsApp(datos): string`
- `lib/landing/mensaje-whatsapp.test.ts` — **nuevo**, importa `./mensaje-whatsapp`
- `lib/landing/payload-pedido.ts` — **nuevo**. `construirPayloadPedido(datos): PayloadPedidoPublico`
- `lib/landing/payload-pedido.test.ts` — **nuevo**, importa `./payload-pedido`

`construirMensajeWhatsApp` recibe
`{ producto: string; cantidad: number; nombre: string; telefono: string; direccion: string; comuna: string; notas?: string }`
y devuelve las líneas unidas con salto de línea, en este orden exacto:

```
Hola! Quiero hacer un pedido de Agua Viflomax:
Producto: <producto> x<cantidad>
Nombre: <nombre>
Teléfono: <telefono>
Dirección: <direccion>, <comuna>
Notas: <notas>
```

La sexta línea **solo aparece si `notas` tiene contenido tras `trim()`**; si no, el string tiene
exactamente cinco líneas y no contiene la subcadena `Notas:`.

`construirPayloadPedido` recibe los mismos datos más `email?` y devuelve exactamente el cuerpo que
§5 congela: `{ nombre, telefono, direccion, comuna, items: [{ productoId, cantidad }] }`, con
`email` y `notas` **omitidos** —no como string vacío— cuando vienen vacíos, y con `productoId` igual
al nombre del producto tal como aparece en `PRODUCTOS`, sin slug ni `encodeURIComponent`. Todos los
strings se recortan con `trim()` antes de entrar al payload.

Los literales de los tests están reconciliados en §19.6, *Byte-exact artifact reconciliation*.

**Done when**

- [ ] WHEN `npx jest lib/landing/mensaje-whatsapp.test.ts lib/landing/payload-pedido.test.ts` runs THE SYSTEM SHALL exit 0 with 0 failed and 0 skipped.
- [ ] WHEN `construirMensajeWhatsApp` receives the fixture with `notas` THE SYSTEM SHALL return exactly `Hola! Quiero hacer un pedido de Agua Viflomax:` then a newline, `Producto: Recarga 20 Litros x2` then a newline, `Nombre: Ana Pérez` then a newline, `Teléfono: +56 9 1234 5678` then a newline, `Dirección: Av. Ejemplo 123, Maipú` then a newline, and `Notas: Dejar en conserjería`.
- [ ] WHEN `construirMensajeWhatsApp` receives the same fixture with `notas` absent or blank THE SYSTEM SHALL return a string of exactly 5 lines that does not contain the substring `Notas:`.
- [ ] WHEN `construirPayloadPedido` receives a filled form THE SYSTEM SHALL return an object whose keys are exactly `nombre`, `telefono`, `direccion`, `comuna` and `items`, with `items[0].productoId` equal to the product name as it appears in `PRODUCTOS` and `items[0].cantidad` a number greater than 0.
- [ ] WHEN `construirPayloadPedido` receives an empty `email` or an empty `notas` THE SYSTEM SHALL omit those keys from the returned object rather than sending an empty string.
- [ ] WHEN `construirPayloadPedido` receives `comuna` equal to `Otra comuna` THE SYSTEM SHALL pass it through verbatim, because `/api/pedidos/publico` answers 400 when `comuna` is blank.

**Verify**

```bash
npx jest lib/landing/mensaje-whatsapp.test.ts   # expect: exit 0, 0 failed, 0 skipped
npx jest lib/landing/payload-pedido.test.ts     # expect: exit 0, 0 failed, 0 skipped
npm run lint                                    # expect: exit 0, "No ESLint warnings or errors"
```

**Checkpoint**

```bash
git add -A && git commit -m "step 5: constructores puros de mensaje y payload de pedido"
git tag step-05-constructores-pedido
# rollback: git reset --hard step-05-constructores-pedido
```

---

#### Paso 6 — Filtro de catálogo y zona de cobertura

**Do**

Extraer el filtrado de categoría a una función pura testeable, y corregir la única constante de
`lib/contacto.ts` que el diseño aprobado cambia.

- `lib/productos.ts` — editar: **solo agregar** `filtrarPorCategoria`. `PRODUCTOS`, `CATEGORIAS`,
  `formatCLP`, los nombres, los precios y las categorías **no se tocan**
- `lib/productos.test.ts` — **nuevo**, importa `./productos`
- `lib/contacto.ts` — editar: `ZONA` pasa de `'Maipú y comunas cercanas'` a `'Maipú y Padre Hurtado'`.
  `HORARIO` **se queda tal cual** en `'Lun a Sáb · 9:00 – 19:00 hrs'` — el handoff decía "Lunes a
  viernes" y el horario real del negocio manda
- `lib/contacto.test.ts` — **nuevo**, importa `./contacto`

La firma es
`filtrarPorCategoria(productos: Producto[], filtro: 'todos' | CategoriaId): Producto[]`: devuelve un
array nuevo, nunca muta la entrada, y con `'todos'` devuelve todos los productos en su orden
original. Los conteos de abajo salen de contar el array literal de `lib/productos.ts`: 9 productos en
total, 4 con `categoria: 'agua'`, 3 con `'dispensadores'`, 2 con `'extras'`.

**Done when**

- [ ] WHEN `npx jest lib/productos.test.ts lib/contacto.test.ts` runs THE SYSTEM SHALL exit 0 with 0 failed and 0 skipped.
- [ ] WHEN `filtrarPorCategoria(PRODUCTOS, 'todos')` is called THE SYSTEM SHALL return all 9 products in their original order.
- [ ] WHEN `filtrarPorCategoria(PRODUCTOS, 'agua')` is called THE SYSTEM SHALL return exactly 4 products, every one of them with `categoria` equal to `agua`.
- [ ] WHEN `filtrarPorCategoria(PRODUCTOS, 'dispensadores')` and `filtrarPorCategoria(PRODUCTOS, 'extras')` are called THE SYSTEM SHALL return exactly 3 and exactly 2 products respectively.
- [ ] WHEN `filtrarPorCategoria` returns THE SYSTEM SHALL have returned a new array and SHALL NOT have mutated `PRODUCTOS`, whose length stays 9.
- [ ] WHEN `ZONA` is read from `lib/contacto.ts` THE SYSTEM SHALL equal `Maipú y Padre Hurtado`, and `HORARIO` SHALL still equal `Lun a Sáb · 9:00 – 19:00 hrs`.

**Verify**

```bash
npx jest lib/productos.test.ts   # expect: exit 0, 0 failed, 0 skipped
npx jest lib/contacto.test.ts    # expect: exit 0, 0 failed, 0 skipped
npm run lint                     # expect: exit 0, "No ESLint warnings or errors"
npm run build                    # expect: exit 0 — lib/productos.ts lo importan /admin y /chofer
```

**Checkpoint**

```bash
git add -A && git commit -m "step 6: filtrarPorCategoria y zona de cobertura Maipu/Padre Hurtado"
git tag step-06-filtros-catalogo
# rollback: git reset --hard step-06-filtros-catalogo
```

---

#### Paso 7 — Shell del sitio: header y footer

**Do**

Sacar el header y el footer que hoy viven inline en el layout a dos componentes propios, con la
paleta nueva y sin enlaces a la página que se retira.

- `components/public/SiteHeader.tsx` — **nuevo**. Barra de contacto (`HORARIO` + `TELEFONO_LEGIBLE`
  desde `lib/contacto.ts`, condicionada a `TIENE_WHATSAPP`, sobre `bg-viflomax-azul-800` con texto
  blanco: 9.57:1), nav sticky con el wordmark y los enlaces `Productos` (`#productos`), `Contacto`
  (`/contacto`) y el CTA `Pedir ahora` (`#pedido`, en `bg-viflomax-verde-700`: 5.95:1)
- `components/public/SiteFooter.tsx` — **nuevo**. Mismo fondo `viflomax-azul-800`, con `ZONA`,
  `HORARIO`, `TELEFONO_LEGIBLE` y el enlace discreto a `/login`
- `app/(public)/layout.tsx` — editar: importa y monta los dos, y **borra** el `<header>` y el
  `<footer>` inline. `<WhatsAppFloat />` se queda exactamente donde está

Ambos son Server Components: no llevan `'use client'`. Con dos enlaces más un CTA no hace falta menú
hamburguesa a 375 px — la fila de nav usa `flex-wrap` con `gap-4` y texto `text-sm`, y el pase de
viewport a 375 px está en la lista de §20.1.

**El ancla `#pedido` todavía no existe: la sección llega en el paso 13.** Es deliberado. Un ancla sin
destino no rompe el build ni el lint, y "arreglarla" apuntándola a `/pedir` reintroduce la ruta que
este cambio retira.

**Done when**

- [ ] WHEN `npm run lint` and `npm run build` run THE SYSTEM SHALL exit 0 on both, with zero lint errors and zero lint warnings.
- [ ] WHEN `app/(public)/layout.tsx` is read THE SYSTEM SHALL contain exactly one `<SiteHeader />` and one `<SiteFooter />`, and SHALL NOT contain any inline `<header` or `<footer` markup.
- [ ] WHEN `grep` searches `components/public/SiteHeader.tsx` and `components/public/SiteFooter.tsx` for the digit sequence `569` THE SYSTEM SHALL find no match, because every contact value comes from `lib/contacto.ts`.
- [ ] WHEN `grep` searches `components/public/SiteHeader.tsx`, `components/public/SiteFooter.tsx` and `app/(public)/layout.tsx` for `/pedir` THE SYSTEM SHALL find no match: the shell links to `#pedido` and `#productos`, never to the page being retired.
- [ ] WHEN `grep` searches `components/public/SiteHeader.tsx` for the CTA class THE SYSTEM SHALL find `bg-viflomax-verde-700`, the only green that carries white text at 5.95:1.
- [ ] WHEN `npx jest` runs THE SYSTEM SHALL exit 0 with 0 failed and 0 skipped, so the gates of steps 1 and 4 to 6 still pass.

**Verify**

```bash
grep -c '<SiteHeader />' 'app/(public)/layout.tsx' | grep -qx 1     # expect: exit 0 — exactamente uno
grep -c '<SiteFooter />' 'app/(public)/layout.tsx' | grep -qx 1     # expect: exit 0 — exactamente uno
grep -q '<header' 'app/(public)/layout.tsx'; test $? -eq 1          # 1 = sin match -> esta linea sale 0
grep -q '<footer' 'app/(public)/layout.tsx'; test $? -eq 1          # 1 = sin match -> esta linea sale 0
grep -q '569' components/public/SiteHeader.tsx components/public/SiteFooter.tsx; test $? -eq 1
grep -q '/pedir' components/public/SiteHeader.tsx components/public/SiteFooter.tsx; test $? -eq 1
grep -q '/pedir' 'app/(public)/layout.tsx'; test $? -eq 1   # el header viejo tenia 2 enlaces; este paso los borra
grep -q 'bg-viflomax-verde-700' components/public/SiteHeader.tsx    # expect: exit 0
npm run lint                                                        # expect: exit 0
npm run build                                                       # expect: exit 0
npx jest                                                            # expect: exit 0, 0 failed, 0 skipped
```

**Checkpoint**

```bash
git add -A && git commit -m "step 7: SiteHeader y SiteFooter montados en el layout publico"
git tag step-07-shell-sitio
git ls-files --error-unmatch components/public/SiteHeader.tsx components/public/SiteFooter.tsx   # expect: exit 0
# rollback: git reset --hard step-07-shell-sitio
```

---

#### Paso 8 — Hero nuevo y limpieza del CSS muerto

**Do**

Reescribir el hero con el diseño aprobado y borrar el CSS que se queda sin consumidor en el mismo
momento.

- `components/public/Hero.tsx` — reescribir por completo
- `app/globals.css` — editar: **borrar** `@keyframes float` y la regla `.bubble`

El hero es un Server Component (sin `'use client'`): gradiente diagonal
`bg-gradient-to-br from-viflomax-azul-900 via-viflomax-azul to-viflomax-verde`, **una capa
`bg-black/30` encima del gradiente y debajo del contenido** (§7: sin ella **ningún** texto del hero
pasa AA — en la parada verde el blanco queda en 2.65:1, por debajo hasta del umbral de 3:1 del texto
grande, así que ni el `<h1>` se salva; con ella, 5.03:1), dos blobs decorativos
`rounded-full bg-white/10 blur-3xl` con `aria-hidden="true"`, el tag
`Distribución en Maipú y Padre Hurtado`, el `<h1>` `text-5xl md:text-7xl font-extrabold`, el
subtítulo, y dos CTA: `Pedir ahora` (`#pedido`, `bg-viflomax-verde-700`) y `Ver productos`
(`#productos`, borde blanco).

El logo va con `next/image`: `src="/logo.png"`, `width` y `height` explícitos, `priority`, `alt="Agua
Viflomax"`, dentro de un contenedor con la clase `logo-float` del paso 3.

El `Hero.tsx` viejo era el último consumidor de `.bubble`. Borrar la clase acá —y no en el paso 3—
es lo que evita dejar el hero anterior sin animación durante cinco pasos.

**Done when**

- [ ] WHEN `npm run lint` and `npm run build` run THE SYSTEM SHALL exit 0 on both, with zero lint errors and zero lint warnings.
- [ ] WHEN `grep -r` searches the `app` and `components` trees for `bubble` THE SYSTEM SHALL find no match, so the dead class and its keyframes are gone along with their last consumer.
- [ ] WHEN `components/public/Hero.tsx` is read THE SYSTEM SHALL import `Image` from `next/image` and render `/logo.png` with explicit `width`, `height` and `priority`.
- [ ] WHEN `components/public/Hero.tsx` is read THE SYSTEM SHALL apply the `logo-float` class to the logo wrapper.
- [ ] WHEN `components/public/Hero.tsx` is read THE SYSTEM SHALL contain a `bg-black/30` layer, the scrim that lifts all white text in the hero over the lightest gradient stop to 5.03:1 - without it not even the `<h1>` clears 3:1.
- [ ] WHEN `grep` searches `components/public/Hero.tsx` for `/pedir` THE SYSTEM SHALL find no match: both hero CTAs are in-page anchors.

**Verify**

```bash
grep -rq 'bubble' app components; test $? -eq 1        # 1 = sin match -> esta linea sale 0
grep -q "from 'next/image'" components/public/Hero.tsx # expect: exit 0
grep -q '/logo.png' components/public/Hero.tsx         # expect: exit 0
grep -q 'priority' components/public/Hero.tsx          # expect: exit 0
grep -q 'logo-float' components/public/Hero.tsx        # expect: exit 0
grep -q 'bg-black/30' components/public/Hero.tsx       # expect: exit 0
grep -q '/pedir' components/public/Hero.tsx; test $? -eq 1
npm run lint                                           # expect: exit 0
npm run build                                          # expect: exit 0
```

**Checkpoint**

```bash
git add -A && git commit -m "step 8: hero nuevo con logo flotante y limpieza de .bubble"
git tag step-08-hero
# rollback: git reset --hard step-08-hero
```

---

#### Paso 9 — Lluvia de gotas y contexto de pedido

**Do**

Los dos componentes compartidos que las secciones de los pasos 10 a 12 necesitan.

- `components/public/LluviaDeGotas.tsx` — **nuevo**. Renderer puro: recibe
  `{ gotas: GotaEstilo[] }` y emite un `<span class="water-drop">` por gota, con `left`,
  `animationDuration`, `animationDelay`, `background` y la custom property `--drop-op` en `style`
  inline. Envuelto en un contenedor `absolute inset-0 overflow-hidden pointer-events-none` con
  `aria-hidden="true"`
- `components/public/PedidoProvider.tsx` — **nuevo**, `'use client'`. Exporta `PedidoProvider` y el
  hook `usePedido`, que expone `{ productoSeleccionado, setProductoSeleccionado }`

`LluviaDeGotas` **no lleva `'use client'`, ni `useEffect`, ni `Math.random`**: recibe el array ya
calculado y solo lo pinta, así que renderiza idéntico en el servidor y al hidratar. `usePedido`
lanza un `Error` con nombre cuando se llama fuera del provider, en vez de devolver `undefined` y
fallar más tarde con un mensaje que no dice nada.

**Done when**

- [ ] WHEN `npm run lint` and `npm run build` run THE SYSTEM SHALL exit 0 on both, with zero lint errors and zero lint warnings.
- [ ] WHEN `components/public/PedidoProvider.tsx` is read THE SYSTEM SHALL begin with the `'use client'` directive and export both `PedidoProvider` and `usePedido`.
- [ ] WHEN `grep` searches `components/public/PedidoProvider.tsx` for `throw new Error` THE SYSTEM SHALL find the guard `usePedido` raises when it is called outside `PedidoProvider`.
- [ ] WHEN `grep` searches `components/public/LluviaDeGotas.tsx` for `use client`, `useEffect` and `Math.random` THE SYSTEM SHALL find none of the three, so the component renders identically on the server and on the client.
- [ ] WHEN `grep` searches `components/public/LluviaDeGotas.tsx` THE SYSTEM SHALL find both `water-drop` and `--drop-op`, the class and the custom property the `waterfall` keyframes read.
- [ ] WHEN `grep` searches `components/public/LluviaDeGotas.tsx` THE SYSTEM SHALL find `aria-hidden`, because the rain is decoration and must not reach assistive technology.

**Verify**

```bash
head -1 components/public/PedidoProvider.tsx | grep -q "use client"        # expect: exit 0
grep -q 'export function PedidoProvider' components/public/PedidoProvider.tsx   # expect: exit 0
grep -q 'export function usePedido' components/public/PedidoProvider.tsx        # expect: exit 0
grep -q 'throw new Error' components/public/PedidoProvider.tsx             # expect: exit 0
grep -q 'use client' components/public/LluviaDeGotas.tsx; test $? -eq 1    # 1 = sin match -> sale 0
grep -q 'useEffect' components/public/LluviaDeGotas.tsx; test $? -eq 1     # 1 = sin match -> sale 0
grep -q 'Math.random' components/public/LluviaDeGotas.tsx; test $? -eq 1   # 1 = sin match -> sale 0
grep -q 'water-drop' components/public/LluviaDeGotas.tsx                   # expect: exit 0
grep -q -- '--drop-op' components/public/LluviaDeGotas.tsx                 # expect: exit 0
grep -q 'aria-hidden' components/public/LluviaDeGotas.tsx                  # expect: exit 0
npm run lint                                                               # expect: exit 0
npm run build                                                              # expect: exit 0
```

**Checkpoint**

```bash
git add -A && git commit -m "step 9: LluviaDeGotas y PedidoProvider"
git tag step-09-lluvia-provider
git ls-files --error-unmatch components/public/LluviaDeGotas.tsx components/public/PedidoProvider.tsx   # expect: exit 0
# rollback: git reset --hard step-09-lluvia-provider
```

---

#### Paso 10 — Catálogo con filtro, lluvia y salto al formulario

**Do**

Reescribir el catálogo para que use la función pura del paso 6, la lluvia del paso 9 y el contexto en
vez de navegar a `/pedir`.

- `components/public/ProductGrid.tsx` — reescribir por completo

Sigue siendo `'use client'` (las pills de filtro usan `useState` y la acción de la tarjeta llama a
`setProductoSeleccionado`). Cambios respecto de la versión actual:

- El filtrado pasa por `filtrarPorCategoria(PRODUCTOS, filtro)`; **no queda ningún
  `PRODUCTOS.filter` inline**
- El array de gotas se calcula **a nivel de módulo**, con una línea que empieza en la columna 0:
  `const GOTAS_PRODUCTOS = generarGotas(7, 16, '#a3d9f0')` — azul-300 sobre el fondo blanco de la
  sección. A nivel de módulo, no dentro del componente, porque el módulo se evalúa una vez por
  proceso y la semilla garantiza el mismo array en servidor y cliente
- La acción de la tarjeta deja de ser un `<Link href="/pedir?producto=…">` y pasa a ser un `<button>`
  que hace `setProductoSeleccionado(producto.nombre)` y luego navega al ancla `#pedido`
- El CTA de la tarjeta y el badge usan `bg-viflomax-verde-700` con `hover:bg-viflomax-verde-800`
- `ProductoImagen` se sigue usando tal cual para la foto
- Si el filtro no deja productos, se muestra un texto de vacío en lugar de una grilla en blanco

**Done when**

- [ ] WHEN `npm run lint` and `npm run build` run THE SYSTEM SHALL exit 0 on both, with zero lint errors and zero lint warnings.
- [ ] WHEN `grep` searches `components/public/ProductGrid.tsx` THE SYSTEM SHALL find `filtrarPorCategoria` imported from `@/lib/productos` and SHALL NOT find any `PRODUCTOS.filter` call.
- [ ] WHEN `grep` searches `components/public/ProductGrid.tsx` for a line starting with `const GOTAS_PRODUCTOS = generarGotas(` at column 0 THE SYSTEM SHALL find it, proving the drop array is built once at module scope and is therefore identical on the server render and on hydration.
- [ ] WHEN `grep` searches `components/public/ProductGrid.tsx` for `/pedir` THE SYSTEM SHALL find no match: the card action calls `setProductoSeleccionado` and moves to `#pedido`.
- [ ] WHEN `grep` searches `components/public/ProductGrid.tsx` THE SYSTEM SHALL find `bg-viflomax-verde-700` on the card action and on the badge, the two white-on-green surfaces that need 5.95:1.
- [ ] WHEN the active filter yields no product THE SYSTEM SHALL render the empty-state text instead of an empty grid, which `grep` confirms by finding the literal `No hay productos en esta categoría`.

**Verify**

```bash
grep -q "filtrarPorCategoria" components/public/ProductGrid.tsx                     # expect: exit 0
grep -q "from '@/lib/productos'" components/public/ProductGrid.tsx                  # expect: exit 0
grep -q 'PRODUCTOS.filter' components/public/ProductGrid.tsx; test $? -eq 1         # 1 = sin match -> sale 0
grep -q '^const GOTAS_PRODUCTOS = generarGotas(' components/public/ProductGrid.tsx  # expect: exit 0
grep -q '/pedir' components/public/ProductGrid.tsx; test $? -eq 1                   # 1 = sin match -> sale 0
grep -q 'setProductoSeleccionado' components/public/ProductGrid.tsx                 # expect: exit 0
grep -q 'id="productos"' components/public/ProductGrid.tsx                          # expect: exit 0 — el ancla que enlazan el header y el hero
grep -q 'bg-viflomax-verde-700' components/public/ProductGrid.tsx                   # expect: exit 0
grep -q 'No hay productos en esta categoría' components/public/ProductGrid.tsx      # expect: exit 0
npm run lint                                                                        # expect: exit 0
npm run build                                                                       # expect: exit 0
```

**Checkpoint**

```bash
git add -A && git commit -m "step 10: catalogo con filtro puro, lluvia determinista y salto a #pedido"
git tag step-10-product-grid
# rollback: git reset --hard step-10-product-grid
```

---

#### Paso 11 — Secciones de confianza y cobertura

**Do**

Las dos secciones nuevas del diseño aprobado, ambas Server Components con cero JavaScript de cliente.

- `components/public/PorQueElegirnos.tsx` — **nuevo**. Tres columnas icono + título + texto: agua
  purificada, entrega el mismo día, precio justo. **Los iconos son `<svg>` inline**, igual que hoy en
  `app/(public)/page.tsx`: no hay librería de iconos instalada en este repo y este cambio tiene
  prohibido agregar paquetes
- `components/public/Cobertura.tsx` — **nuevo**. Fondo `bg-viflomax-azul-100`, `LluviaDeGotas` de
  fondo con su propia semilla, el texto de zona tomado de `ZONA` (`lib/contacto.ts`) y dos badges,
  `Maipú` y `Padre Hurtado`

`Cobertura` calcula su lluvia a nivel de módulo, en la columna 0:
`const GOTAS_COBERTURA = generarGotas(23, 20, '#6dc2e3')` — azul-400, que es el que se lee sobre
`azul-100`. Semilla distinta de la del catálogo para que las dos lluvias no queden espejadas.

Ninguno de los dos lleva `'use client'`. Van dentro del `PedidoProvider` en el paso 13 **como
children**, lo que los mantiene renderizados en el servidor.

**Done when**

- [ ] WHEN `npm run lint` and `npm run build` run THE SYSTEM SHALL exit 0 on both, with zero lint errors and zero lint warnings.
- [ ] WHEN `grep` searches `components/public/PorQueElegirnos.tsx` and `components/public/Cobertura.tsx` for `use client` THE SYSTEM SHALL find no match, so both stay Server Components and ship zero client JavaScript.
- [ ] WHEN `grep -c` counts `<svg` in `components/public/PorQueElegirnos.tsx` THE SYSTEM SHALL report 3, one inline icon per column, with no icon-library import anywhere in the file.
- [ ] WHEN `components/public/Cobertura.tsx` is read THE SYSTEM SHALL render the two coverage badges `Maipú` and `Padre Hurtado` and SHALL take its zone line from `ZONA` in `lib/contacto.ts`.
- [ ] WHEN `grep` searches `components/public/Cobertura.tsx` for a line starting with `const GOTAS_COBERTURA = generarGotas(` at column 0 THE SYSTEM SHALL find it, so this section's rain is built once at module scope with its own seed.
- [ ] WHEN `grep` searches both files for `from 'lucide-react'` or any other icon-package import THE SYSTEM SHALL find no match, because this change adds zero npm packages.

**Verify**

```bash
grep -q 'use client' components/public/PorQueElegirnos.tsx components/public/Cobertura.tsx; test $? -eq 1
grep -c '<svg' components/public/PorQueElegirnos.tsx | grep -qx 3                     # expect: exit 0 — 3 iconos
grep -qE "from '(lucide-react|react-icons|@heroicons)" components/public/PorQueElegirnos.tsx components/public/Cobertura.tsx; test $? -eq 1
grep -q 'Padre Hurtado' components/public/Cobertura.tsx                               # expect: exit 0
grep -q 'Maipú' components/public/Cobertura.tsx                                       # expect: exit 0
grep -q "ZONA" components/public/Cobertura.tsx                                        # expect: exit 0
grep -q '^const GOTAS_COBERTURA = generarGotas(' components/public/Cobertura.tsx       # expect: exit 0
npm run lint                                                                          # expect: exit 0
npm run build                                                                         # expect: exit 0
```

**Checkpoint**

```bash
git add -A && git commit -m "step 11: secciones PorQueElegirnos y Cobertura"
git tag step-11-secciones-confianza
git ls-files --error-unmatch components/public/PorQueElegirnos.tsx components/public/Cobertura.tsx   # expect: exit 0
# rollback: git reset --hard step-11-secciones-confianza
```

---

#### Paso 12 — Formulario de pedido inline

**Do**

El formulario que reemplaza a `/pedir`, más el módulo puro que decide qué hacer con la respuesta de
la API.

- `lib/landing/respuesta-pedido.ts` — **nuevo**.
  `interpretarRespuestaPedido(status: number, cuerpo: { data: { numero_pedido?: string | null } | null; error: string | null }): ResultadoPedido`,
  donde `ResultadoPedido` es
  `{ ok: true; numeroPedido: string | null } | { ok: false; mensaje: string }`
- `lib/landing/respuesta-pedido.test.ts` — **nuevo**, importa `./respuesta-pedido`
- `components/public/PedidoForm.tsx` — **nuevo**, `'use client'`

`interpretarRespuestaPedido` es donde vive la regla de §5: **solo `201` es éxito**. Con 201 devuelve
`{ ok: true, numeroPedido }`; con cualquier otro status devuelve `{ ok: false, mensaje }` usando el
`error` del cuerpo, y si ese `error` viene nulo o vacío cae a
`Error al enviar el pedido. Intenta nuevamente.`. Está separado del componente porque es la única
forma de testear esa decisión en este repo: no hay Testing Library (§13).

El formulario tiene, en este orden: `nombre`, `telefono`, `email` (opcional), `direccion`, el
`<select>` de `comuna` con exactamente `Maipú`, `Padre Hurtado` y `Otra comuna` (requerido, sin
opción vacía preseleccionada válida), el `<select>` de producto (las 9 opciones de `PRODUCTOS`, con
`value={producto.nombre}` literal), `cantidad` (número, mínimo 1) y `notas` (opcional). El producto
se inicializa desde `usePedido().productoSeleccionado` y se re-sincroniza cuando ese valor cambia.

Al enviar: arma el body con `construirPayloadPedido`, hace `fetch('/api/pedidos/publico', { method:
'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })`, y pasa
`res.status` y el JSON a `interpretarRespuestaPedido`.

- `ok: true` → panel verde con el `numeroPedido`, y **solo si `TIENE_WHATSAPP`** abre
  `linkWhatsApp(construirMensajeWhatsApp(datos))` con `window.open(url, '_blank', 'noopener,noreferrer')`.
  Con `TIENE_WHATSAPP` en `false` el pedido igual quedó guardado y solo se muestra el mensaje de
  éxito, replicando cómo `WhatsAppFloat.tsx` ya se autocensura
- `ok: false` → panel rojo con `mensaje`, y **no** se abre WhatsApp

**Ningún número de teléfono literal en este archivo**: el link sale de `linkWhatsApp` y la condición
de `TIENE_WHATSAPP`, ambos de `lib/contacto.ts`.

**Done when**

- [ ] WHEN `npx jest lib/landing/respuesta-pedido.test.ts` runs THE SYSTEM SHALL exit 0 with 0 failed and 0 skipped.
- [ ] WHEN `interpretarRespuestaPedido` receives status 201 with `{ data: { pedido_id, numero_pedido }, error: null }` THE SYSTEM SHALL return an object with `ok` true carrying `numero_pedido` as `numeroPedido`.
- [ ] WHEN `interpretarRespuestaPedido` receives status 400 with `error` equal to `Los campos nombre, teléfono, dirección y comuna son obligatorios` THE SYSTEM SHALL return an object with `ok` false whose `mensaje` is that exact string, which is the branch that skips WhatsApp.
- [ ] WHEN `interpretarRespuestaPedido` receives status 500 with `error` equal to `Error al crear el pedido`, or any non-201 status with a null or blank `error`, THE SYSTEM SHALL return `ok` false with a non-empty `mensaje`.
- [ ] WHEN `grep` searches `components/public/PedidoForm.tsx` THE SYSTEM SHALL find `construirPayloadPedido`, `construirMensajeWhatsApp`, `interpretarRespuestaPedido`, `linkWhatsApp` and `TIENE_WHATSAPP`, and SHALL find no literal digit sequence `569`.
- [ ] WHEN `grep` searches `components/public/PedidoForm.tsx` THE SYSTEM SHALL find the three comuna options `Maipú`, `Padre Hurtado` and `Otra comuna`, and a `required` attribute on the comuna select.

**Verify**

```bash
npx jest lib/landing/respuesta-pedido.test.ts                                  # expect: exit 0, 0 failed, 0 skipped
grep -q 'construirPayloadPedido' components/public/PedidoForm.tsx              # expect: exit 0
grep -q 'construirMensajeWhatsApp' components/public/PedidoForm.tsx            # expect: exit 0
grep -q 'interpretarRespuestaPedido' components/public/PedidoForm.tsx          # expect: exit 0
grep -q 'linkWhatsApp' components/public/PedidoForm.tsx                        # expect: exit 0
grep -q 'TIENE_WHATSAPP' components/public/PedidoForm.tsx                      # expect: exit 0
grep -q '569' components/public/PedidoForm.tsx; test $? -eq 1                  # 1 = sin match -> sale 0
grep -q 'Otra comuna' components/public/PedidoForm.tsx                         # expect: exit 0
grep -q 'Padre Hurtado' components/public/PedidoForm.tsx                       # expect: exit 0
grep -q "'/api/pedidos/publico'" components/public/PedidoForm.tsx              # expect: exit 0
npm run lint                                                                   # expect: exit 0
npm run build                                                                  # expect: exit 0
```

**Checkpoint**

```bash
git add -A && git commit -m "step 12: formulario de pedido inline e interprete de respuesta"
git tag step-12-pedido-form
git ls-files --error-unmatch components/public/PedidoForm.tsx lib/landing/respuesta-pedido.ts   # expect: exit 0
# rollback: git reset --hard step-12-pedido-form
```

---

#### Paso 13 — Cutover: ensamblado, redirección y retiro de `/pedir`

**Do**

El paso de cutover de §9.1. Ensambla la landing, redirige la ruta vieja y borra su código en **un
solo commit**, para que en ningún momento existan dos caminos de pedido.

- `app/(public)/page.tsx` — reescribir con el ensamblado de §6
- `next.config.mjs` — editar: agregar la clave `redirects()`. La clave `headers()` existente, con su
  `Permissions-Policy: geolocation=(self)`, **se conserva intacta** — la usa `/chofer`
- `app/(public)/pedir/page.tsx` — **borrar** (y el directorio `app/(public)/pedir/` queda vacío, se
  borra también)
- `components/public/OrderForm.tsx` — **borrar**
- `ROLES.md` — editar: su línea 243 documenta `/pedir` como ruta viva y queda fuera del alcance de
  todo grep del build por estar fuera de `app/` y `components/`. Se reemplaza esa referencia por la
  sección `#pedido` de la home

El `redirects()` a agregar, literal:

```js
async redirects() {
  return [
    { source: '/pedir', destination: '/#pedido', permanent: true },
  ]
},
```

El ensamblado de `page.tsx`, en este orden: `<Hero />`, y luego `<PedidoProvider>` envolviendo
`<ProductGrid />`, `<PorQueElegirnos />`, `<Cobertura />` y la
`<section id="pedido">` con `<PedidoForm />`. `PorQueElegirnos` y `Cobertura` se pasan como children
desde este Server Component, que es lo que los mantiene renderizados en el servidor pese a estar
dentro de un Client Component.

**Done when**

- [ ] WHEN `npm run lint` and `npm run build` run THE SYSTEM SHALL exit 0 on both, with zero lint errors and zero lint warnings.
- [ ] WHEN `app/(public)/page.tsx` is read THE SYSTEM SHALL render `Hero`, then `PedidoProvider` wrapping `ProductGrid`, `PorQueElegirnos`, `Cobertura` and a `section` with `id="pedido"` holding `PedidoForm`.
- [ ] WHEN `test ! -e app/(public)/pedir/page.tsx` and `test ! -e components/public/OrderForm.tsx` run THE SYSTEM SHALL exit 0 on both, so the retired flow is deleted and not merely unlinked.
- [ ] WHEN `next.config.mjs` is read THE SYSTEM SHALL contain a `redirects()` key returning `source` `/pedir`, `destination` `/#pedido` and `permanent` true, and SHALL still contain the pre-existing `headers()` key with `Permissions-Policy`.
- [ ] WHEN `grep -r` searches the `app` and `components` trees for `/pedir`, and `grep` searches `ROLES.md`, THE SYSTEM SHALL find no match in either, so neither a link nor the route documentation survives the retirement.
- [ ] WHEN `npx jest` runs THE SYSTEM SHALL exit 0 with 0 failed and 0 skipped, so every gate from steps 1, 4, 5, 6 and 12 still passes.

**Verify**

```bash
test ! -e 'app/(public)/pedir/page.tsx'                     # expect: exit 0 — borrado
test ! -e components/public/OrderForm.tsx                   # expect: exit 0 — borrado
grep -q 'PedidoProvider' 'app/(public)/page.tsx'            # expect: exit 0
grep -q 'id="pedido"' 'app/(public)/page.tsx'               # expect: exit 0
grep -q 'PorQueElegirnos' 'app/(public)/page.tsx'           # expect: exit 0
grep -q 'Cobertura' 'app/(public)/page.tsx'                 # expect: exit 0
grep -q 'async redirects()' next.config.mjs                 # expect: exit 0
grep -q "source: '/pedir'" next.config.mjs                  # expect: exit 0
grep -q "destination: '/#pedido'" next.config.mjs           # expect: exit 0
grep -q 'async headers()' next.config.mjs                   # expect: exit 0 — la clave previa sigue
grep -q 'Permissions-Policy' next.config.mjs                # expect: exit 0 — la clave previa sigue
grep -rq '/pedir' app components; test $? -eq 1             # 1 = sin match -> esta linea sale 0
grep -q '/pedir' ROLES.md; test $? -eq 1                    # 1 = sin match -> esta linea sale 0
npm run lint                                                # expect: exit 0
npm run build                                               # expect: exit 0
npx jest                                                    # expect: exit 0, 0 failed, 0 skipped
```

**Checkpoint**

```bash
git add -A && git commit -m "step 13: cutover — landing ensamblada, redirect de /pedir y retiro de OrderForm"
git tag step-13-cutover-landing
git ls-files --error-unmatch 'app/(public)/page.tsx' next.config.mjs   # expect: exit 0
git ls-files 'app/(public)/pedir/' components/public/OrderForm.tsx | wc -l | grep -qx 0   # expect: exit 0 — ya no rastreados
# rollback: git reset --hard step-12-pedido-form
```

---

### 9.1 Parity and cutover

Esto **no** es una migración de framework, de base de datos ni de servicio, pero **sí hay un cutover
real**: se retira el flujo `/pedir` + `OrderForm.tsx` y lo reemplaza el formulario inline. Esta
subsección queda dimensionada a ese radio de impacto y no a uno mayor.

#### Parity set

El comportamiento que se mantiene constante es uno solo, y es el que el negocio no puede perder:

| # | Comportamiento mantenido | Cómo se prueba la paridad | Tolerancia |
|---|---|---|---|
| 1 | Un pedido válido crea exactamente una fila `Pedido` vía `POST /api/pedidos/publico`, y el usuario llega a WhatsApp con el mensaje ya escrito | `npx jest lib/landing/payload-pedido.test.ts` prueba que el cuerpo enviado tiene exactamente las claves que §5 congela, con `productoId` igual al nombre del producto; `npx jest lib/landing/respuesta-pedido.test.ts` prueba que solo 201 abre la rama de éxito; `npx jest lib/landing/mensaje-whatsapp.test.ts` prueba el texto byte a byte | Coincidencia exacta en las tres |
| 2 | `comuna` llega no vacío al endpoint | El `<select>` requerido del paso 12 más el criterio de `construirPayloadPedido` que pasa `Otra comuna` sin transformar | Coincidencia exacta |
| 3 | Un cliente que llega a `/pedir` desde un enlace viejo termina en el formulario | Redirección 308 verificada en §20.1 con `next start` + `curl` | Coincidencia exacta |

**Sin período de sombra.** Hay un solo endpoint y nunca se toca: el `OrderForm` viejo y el
`PedidoForm` nuevo producen cuerpos válidos contra el mismo contrato congelado, y el nuevo es un
subconjunto del viejo (un ítem en vez de N). No hay dos implementaciones del servidor que comparar,
así que un shadow run no observaría nada que estos tres tests no observen.

#### Cutover

**Un solo paso, sin fases.** El paso 13 ensambla la página, agrega la redirección y borra el código
viejo en el mismo commit. No hay canary: es un sitio de marketing sin cuentas ni sesiones, así que no
existe una cohorte a la que exponer el cambio ni estado de usuario que pueda quedar a medio migrar.

| Fase | Qué cambia | A quién afecta | Reversible por | Verify |
|---|---|---|---|---|
| Cutover (paso 13) | Landing nueva, `/pedir` redirigido, `OrderForm.tsx` borrado | Todo visitante nuevo | `git reset --hard step-12-pedido-form` | El bloque `Verify` del paso 13 |
| Post-deploy | El deploy de Vercel promueve `main` | Todo visitante | Rollback de deploy en Vercel al build anterior | §20.1, línea de la redirección 308 |

**El kill switch** es el rollback estándar de este build: `git reset --hard step-12-pedido-form`
devuelve el árbol al estado anterior al cutover, con `/pedir` vivo y el `OrderForm` intacto. En
producción, el rollback es promover el deploy anterior desde el panel de Vercel; toma alrededor de un
minuto y no requiere rebuild. Se anota acá explícitamente, y no solo en la lista genérica de
rollbacks, porque este es el único paso donde el rollback recupera código borrado.

#### Abort criteria

- [ ] WHEN the `Verify` block of step 13 fails on any line THE SYSTEM SHALL be reset to `step-12-pedido-form` rather than debugged forward.
- [ ] WHEN `npm run build` stops exiting 0 after the cutover THE SYSTEM SHALL be reset to `step-12-pedido-form`, because a landing that does not build cannot be deployed at all.
- [ ] WHEN the 308 redirect check in §20.1 does not return 308 THE SYSTEM SHALL block the deploy, because inbound links and search results still point at `/pedir`.

#### Data migration

**NOT APPLICABLE — no se mueve ningún dato.** El esquema, las filas y el endpoint son los mismos
antes y después; solo cambia qué componente arma el cuerpo del request.

#### Decommission

**El decomiso es el paso de cutover mismo**, no un pendiente futuro: `app/(public)/pedir/page.tsx` y
`components/public/OrderForm.tsx` se borran en el paso 13, en el mismo commit que crea la
redirección. No queda nada que mantener en paralelo, y por eso no hay una fila de "decommission" con
fecha en la tabla de arriba. Lo que **sí** sobrevive al build y va a la lista de lanzamiento de
§20.1: confirmar en Vercel que la redirección 308 responde en el dominio de producción antes de
anunciar el cambio.

---

## 10. Environment Setup

**Este es un repositorio brownfield ya clonado, ya instalado y ya inicializado en git.** No hay
scaffolding, no hay `npm install` de dependencias nuevas, y no hay ninguna variable de entorno nueva.
Esta sección documenta el punto de partida y el bootstrap mínimo del cambio.

### Prerequisites

| Herramienta | Versión | Check |
|---|---|---|
| Node.js | 20, fijado en `.nvmrc` | `node -v` |
| npm | el que trae Node 20 | `npm -v` |
| git | cualquiera reciente | `git --version` |
| Un optimizador de PNG que preserve alfa | cualquiera: `sips`, `magick`, `pngquant`, o Squoosh en el navegador | Solo lo necesita el paso 2, y el gate mide el archivo, no la herramienta |

**No hace falta Docker, ni una base de datos corriendo, ni un servidor de desarrollo levantado.**
Ningún `Verify` de los 13 pasos abre una conexión a Postgres ni arranca `next dev`: `npm run build`
corre `prisma generate`, que solo lee `prisma/schema.prisma`. Es una decisión de alcance documentada
(§4, §13), no un hueco.

### Accounts to create first

Ninguna. Este cambio no integra ningún servicio nuevo. Las cuentas que el proyecto ya usa —Vercel,
la base de datos, Cloudinary— ya están configuradas y ninguna se toca.

### Environment variables

**Este cambio introduce cero variables de entorno.** La tabla lista las que ya existen y que la
superficie tocada lee, con la columna "Requerida desde el paso" que §9 rule 9 exige: todas dicen
`0`, es decir, ya deben estar antes del paso 1, que es la situación real de una máquina de trabajo
en este proyecto.

| Variable | Para qué | Dónde se obtiene | Requerida desde el paso | ¿Secreta? |
|---|---|---|---|---|
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Número de WhatsApp que `lib/contacto.ts` normaliza. **Tiene fallback en el código**, así que su ausencia no rompe ningún gate | `.env.local` del proyecto | 0 — opcional, con fallback | no |
| `DATABASE_URL` | Cadena de conexión que Prisma usa en runtime | `.env` / `.env.local` del proyecto, o el panel de la base | 0 — ya presente | sí |
| `SHADOW_DATABASE_URL` | Solo la lee el CLI de Prisma en `migrate dev`. Este build no migra | `.env` del proyecto | 0 — no la usa este cambio | sí |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET` | Sesión de `/admin` y `/chofer`, fuera de alcance | `.env.local` del proyecto | 0 — ya presentes | sí |
| `CLOUDINARY_*`, `NEXT_PUBLIC_CLOUDINARY_*` | Fotos de entrega en `/chofer`, fuera de alcance | `.env.local` del proyecto | 0 — ya presentes | sí (las no `NEXT_PUBLIC_`) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `RESEND_API_KEY`, `NOTIFICATION_EMAIL` | Opcionales, fuera de alcance | `.env.local` del proyecto | 0 — ya presentes | sí |

`.env`, `.env.local` y `.env*.local` están ignorados por el `.gitignore` que ya existe y **así se
quedan**. `.env.example` está commiteado. Este cambio no le agrega ninguna clave porque no agrega
ninguna variable.

**Cómo se cargan.** El único punto de este build donde una variable de entorno se lee es
`lib/contacto.ts`, con `process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || FALLBACK_WHATSAPP`. Y en cada uno
de los tres contextos en que se ejecuta, la carga ya está resuelta sin agregar nada:

| Contexto | Quién carga el entorno | Consecuencia |
|---|---|---|
| `npm run build` / `npm run dev` | Next.js lee `.env`, `.env.local` automáticamente al arrancar | Nada que agregar |
| `npx jest …` | Jest hereda el `process.env` del shell; `NEXT_PUBLIC_WHATSAPP_NUMBER` puede no estar | **No importa**: `lib/contacto.ts` tiene fallback, y `lib/landing/**` no lee ninguna variable. Verificado: la suite base pasa 29 tests sin exportar nada |
| `prisma generate` dentro de `npm run build` | No necesita `DATABASE_URL`: solo lee `prisma/schema.prisma` | Nada que agregar |

**Ningún script standalone forma parte de este build.** El único que existe en el repo,
`scripts/purgar-ubicaciones.mjs`, ya carga su entorno con `node --env-file=.env` en su propio script
de npm, está fuera de alcance y ningún `Verify` lo invoca.

### Files that must be committed

Contrastado, archivo por archivo, contra los 16 patrones del `.gitignore` que este repo ya tiene
(`.next/`, `out/`, `build/`, `node_modules/`, `.env.local`, `.env*.local`, `.env`, `*.tsbuildinfo`,
`next-env.d.ts`, `public/sw.js`, `public/workbox-*.js`, `.DS_Store`, `Thumbs.db`, `.vercel`,
`__pycache__/`, `.venv/`, `dist/`, `npm-debug.log*`, `yarn-*.log*`, `/lib/generated/prisma`).
Comprobado con `git check-ignore -q` sobre cada ruta antes de escribir este blueprint: **las diez
salieron 1, es decir, ninguna está ignorada.**

| Archivo | Por qué se commitea | Línea de excepción en el ignore file |
|---|---|---|
| `tailwind.config.ts`, `tailwind.config.test.ts` | Tokens de marca y su gate | — no lo matchea ningún patrón |
| `app/globals.css` | Keyframes de la landing | — no lo matchea ningún patrón |
| `public/logo.png` | Asset del hero. `public/sw.js` y `public/workbox-*.js` sí están ignorados, pero **ninguno de esos dos patrones matchea `logo.png`** | — no lo matchea ningún patrón |
| `lib/landing/**`, `lib/productos.ts`, `lib/contacto.ts` y sus tests | Lógica y gates. Ojo: `/lib/generated/prisma` está ignorado, pero es una ruta anclada distinta | — no lo matchea ningún patrón |
| `components/public/**` | Los componentes nuevos | — no lo matchea ningún patrón |
| `next.config.mjs`, `app/(public)/page.tsx`, `app/(public)/layout.tsx` | Ensamblado y redirección | — no lo matchea ningún patrón |
| `CLAUDE.md`, `AGENTS.md`, `.claude/settings.json`, `.claude/rules/**`, `.claude/skills/**` | Configuración de agente que la copia de §19 deja en la raíz | — no lo matchea ningún patrón |
| `blueprints/rediseno-landing/**` | Este bundle vive dentro del proyecto | — no lo matchea ningún patrón; ya hay un `blueprints/…/tasks.json` rastreado en el repo |

**Orden de los archivos que gobiernan a otros comandos.** En un repo greenfield habría que crear el
ignore file antes del primer commit. Acá **el `.gitignore` ya está rastreado en `HEAD` desde hace
muchos commits**, igual que `.eslintrc.json`, `jest.config.js` y `tsconfig.json`: los cuatro archivos
que cambian lo que ven los comandos posteriores ya están en su lugar antes de la primera línea del
bootstrap. No hay ninguno que este build entregue tarde, y ningún paso de §9 crea o modifica un
ignore file.

### Bootstrap

```bash
# Todo esto corre desde la raíz del repo: D:\CLAUDEKODE\viflomax
# Orden que importa: el .gitignore, el tsconfig, el .eslintrc y el jest.config YA existen y ya están
# commiteados -> repo ya inicializado con historia -> copia guardada de workspace/ -> gate base.
# No hay install: este cambio no agrega ni una dependencia.

# 1. El repositorio ya existe y ya tiene historia (rama main, 16 etiquetas step-* previas).
#    La guardia es defensiva y no-op: NUNCA inicializa nada acá.
git rev-parse --git-dir >/dev/null 2>&1 || git init -b main   # no-op en este repo: ya es un repo git
git rev-parse --verify HEAD >/dev/null                        # expect: exit 0 — ya hay commits, no hace falta uno inicial

# 2. Copia guardada del workspace del bundle a la raíz del proyecto.
#    Idempotente: si CLAUDE.md ya está, no copia nada y sale 0 igual. Se puede correr dos veces.
[ -f CLAUDE.md ] || cp -R blueprints/rediseno-landing/workspace/. .
test -f CLAUDE.md && test -f AGENTS.md && test -f .claude/settings.json   # expect: exit 0 — copia completa

# 3. Dependencias: nada que instalar. Se confirma que el árbol ya está instalado.
test -d node_modules   # expect: exit 0. Si falla (y solo entonces): npm ci

# 4. Gate base ANTES del paso 1. Los tres deben salir 0 en el repo intacto.
npm run lint   # expect: exit 0, "No ESLint warnings or errors"
npx jest       # expect: exit 0 — 3 suites, 29 tests, 0 failed, 0 skipped (estado base medido)
npm run build  # expect: exit 0
```

**Por qué la copia es no-clobber y por qué su guardia sale 0.** Bootstrap es lo primero que
re-ejecuta un builder atascado, así que correrlo dos veces es un camino soportado, no un accidente.
`[ -f CLAUDE.md ]` sale 0 cuando el archivo está —entonces `||` corta y no se copia nada— y sale 1
cuando no está, ejecutando la copia, que sale 0. **Las dos ramas salen 0**, incluso bajo `set -e`.
Se usa esta forma y no `cp -Rn` porque `cp -Rn` sale **1 en BSD/macOS** cuando omite un archivo
existente, que es exactamente el caso para el que se puso la guardia.

**Qué archivos nunca se sobrescriben:** todos los que algún paso edita. Es una garantía estructural,
no una promesa: `workspace/` contiene **solo** `CLAUDE.md`, `AGENTS.md` y `.claude/**`, y ningún
paso de §9 toca ninguno de esos. `package.json`, `package-lock.json`, `tailwind.config.ts`,
`app/globals.css`, `next.config.mjs` y todo `lib/` y `components/` **no existen dentro de
`workspace/`**, así que la copia no puede pisarlos ni siquiera si se corre sin guardia.

Ningún comando de este bloque es interactivo, ninguno abre un prompt de TTY y ninguno depende de red.

---

## 11. Dependencies

**No hay dependencias nuevas. Este cambio agrega cero paquetes: toda capacidad que usa ya existe en
`package-lock.json`.** Por eso no hay ningún pin que registrar, ninguna URL de registry que citar y
ninguna fecha de verificación que anotar. No se corrió `stack-researcher` porque no había nada que
investigar. **Ningún pin nuevo se escribe en ninguna sección de este blueprint**: los majors que §2
cita —Next.js 14, React 18, TypeScript 5, Tailwind 3, Prisma 5, NextAuth v4, Jest 29, Node 20— son
descripciones de lo ya instalado, verificadas contra `package.json` y `.nvmrc` al escribir esto. La
versión exacta de cualquier paquete se lee de `package-lock.json`, nunca se adivina.

### Runtime

| Package | Version | Source | Checked | Installed by | Purpose |
|---|---|---|---|---|---|
| — | — | — | — | — | **Ninguno. Este cambio no agrega ninguna dependencia de runtime.** |

Las capacidades que el código nuevo usa y de dónde salen, todas ya instaladas:

| Capacidad usada | Viene de | Ya instalado |
|---|---|---|
| Context API, `useState` | `react` | sí — ver lockfile |
| Server/Client Components, `next/image`, `next/link`, `redirects()` | `next` | sí — ver lockfile |
| Clases utilitarias y tokens de color | `tailwindcss` | sí — ver lockfile |
| `fetch` | runtime de Node 20 y del navegador | nativo, sin paquete |
| Iconos | `<svg>` inline escritos a mano | sin paquete, a propósito (§1 non-goals) |
| Formato de moneda | `Intl.NumberFormat` en `formatCLP`, que ya existe | nativo, sin paquete |

### Development

| Package | Version | Source | Checked | Installed by | Purpose |
|---|---|---|---|---|---|
| — | — | — | — | — | **Ninguno. Este cambio no agrega ninguna dependencia de desarrollo.** |

Las herramientas que los `Verify` invocan y que ya están instaladas: `jest` + `ts-jest` +
`jest-environment-jsdom` (los 9 tests de este build), `eslint` + `eslint-config-next` (`npm run
lint`), `typescript` (chequeo de tipos dentro de `next build` y dentro de ts-jest), `prisma`
(`prisma generate` dentro de `npm run build`).

**Traceabilidad de instalación: N/A por construcción.** La regla "todo pin de §11 debe ser instalado
por algún paso" se satisface de forma vacía: hay cero filas, así que hay cero paquetes sin instalador.
Ningún paso de §9 contiene un `npm install`, un `npm add` ni un `npx create-*`, y eso es
verificable: `grep -rn "npm install\|npm add\|npm i " blueprints/rediseno-landing/` no devuelve
ninguna línea dentro de un bloque `Do` o `Verify`.

### Deliberately not used

| Rechazado | En su lugar | Por qué |
|---|---|---|
| `lucide-react` / `react-icons` / `@heroicons/react` | `<svg>` inline, como ya hace `app/(public)/page.tsx` | Cero dependencias nuevas es una restricción dura de este cambio. Son 3 iconos en `PorQueElegirnos` y 1 en `ProductoImagen`; un paquete de iconos para eso es peso y superficie de suministro |
| `zustand` / `jotai` / Redux | React Context (`PedidoProvider`) | Hay exactamente un dato compartido entre dos secciones hermanas. Context es API de React ya instalada |
| `@testing-library/react` | Tests de funciones puras en `lib/landing/**` | Instalarla es una decisión de tooling más grande que este cambio (§1 non-goals). La lógica del formulario se extrae a módulos puros justamente para que sea testeable sin ella |
| `framer-motion` | CSS keyframes en `app/globals.css` | Dos animaciones ambientales, ambas declarativas y ambas apagables con `prefers-reduced-motion`. No hace falta un motor de animación |
| `sharp` / `imagemin` como dependencia del repo | Optimización manual del logo en el paso 2 | Una dependencia permanente para una operación que ocurre una vez. El gate mide el archivo resultante, no el proceso |
| Migrar a la config CSS-first de Tailwind 4 | Seguir con `tailwind.config.ts` de Tailwind 3 | Obligaría a revisar los 175 usos en 39 archivos de `/admin` y `/chofer`, que están fuera de alcance |

---

## 12. Deployment Strategy

### Hosting

Vercel, sin cambios. Este cambio **no toca** la configuración de despliegue: mismo proyecto, misma
región, mismo plan, mismo comando de build (`npm run build`, que es `prisma generate && next build`),
mismo directorio de salida (`.next`, gestionado por el adaptador de Next). La única modificación a
`next.config.mjs` es la clave `redirects()` del paso 13, que Vercel aplica en el edge sin
configuración adicional.

### Environments

| Entorno | Rama | URL | Base de datos | Modo de terceros |
|---|---|---|---|---|
| Local | — | `http://localhost:3000` | la de `.env.local` | número de WhatsApp real, con fallback en código |
| Preview | cualquier PR | URL automática de Vercel | la de `.env.local` de Vercel | igual |
| Producción | `main` | el dominio del proyecto en Vercel | la de producción | igual |

### CI/CD

El pipeline es el de Vercel: push a la rama → build → deploy. **La compuerta de aceptación de §20.1
es la misma lista que corre localmente**; si un check está en §20.1 está en el gate, sin excepciones.
Este cambio no agrega etapas nuevas al pipeline, porque agregar CI propio sería infraestructura nueva
y no está en el alcance.

### Release and rollback

- **Promoción:** merge a `main` → Vercel despliega automáticamente.
- **Rollback:** promover el deploy anterior desde el panel de Vercel. Toma alrededor de un minuto y
  no requiere rebuild. En el árbol local, `git reset --hard step-12-pedido-form` deshace el cutover.
- **Migraciones:** ninguna. Este cambio no toca el esquema (§4), así que no hay orden que respetar
  entre migración y deploy de código — que es justamente la parte peligrosa que este cambio evita.

### Domain, DNS, TLS

Sin cambios: mismo dominio, mismo certificado, mismos registros. La **única** regla de redirección
nueva es la de aplicación, `/pedir → /#pedido` con 308 permanente, declarada en `next.config.mjs` y
no en DNS. Se verifica en §20.1 contra un `next start` local antes de desplegar, y de nuevo contra el
dominio de producción en la lista de lanzamiento.

---

## 13. Testing Strategy

**Los tests existen para que las condiciones "Done when" de §9 sean comprobables.** Este repo tiene
Jest 29 con ts-jest y `testEnvironment: jsdom`, con el alias `@/` ya mapeado, y **no** tiene Testing
Library ni Playwright. Esa limitación es lo que da forma a toda esta sección — y es también la razón
por la que la lógica del formulario vive en `lib/landing/**` y no dentro del componente.

| Capa | Framework | Qué cubre | Dónde | Cuándo corre |
|---|---|---|---|---|
| Unitaria | Jest 29 + ts-jest | Funciones puras: generación de gotas, texto de WhatsApp, cuerpo del request, interpretación de la respuesta, filtro de catálogo, constantes de contacto, tokens de color | `lib/landing/*.test.ts`, `lib/productos.test.ts`, `lib/contacto.test.ts`, `tailwind.config.test.ts` | En el `Verify` de los pasos 1, 4, 5, 6, 12; entera en 7, 13 y §20.1 |
| Compilación / tipos | `npm run build` (`prisma generate && next build`) | Que todo importe, que todo tipe y que la página siga prerrenderizándose | todo el árbol | En el `Verify` de los pasos 1, 3, 6 a 13 |
| Lint | `npm run lint` (`next lint` con `next/core-web-vitals`) | Reglas de React y de Next: `<img>` sin `next/image`, `<a>` interno sin `next/link`, hooks mal usados | `app/`, `components/`, `lib/`, `pages/`, `src/` | En el `Verify` de los 13 pasos |
| Integración contra base de datos | **ninguna** | — | — | — |
| E2E | **ninguna** | — | — | — |

Los tests unitarios nuevos son **7 archivos**, contados uno por uno de las listas de archivos de §9:
`tailwind.config.test.ts`, `lib/landing/gotas.test.ts`, `lib/landing/mensaje-whatsapp.test.ts`,
`lib/landing/payload-pedido.test.ts`, `lib/landing/respuesta-pedido.test.ts`,
`lib/productos.test.ts` y `lib/contacto.test.ts`. Se suman a los 3 que ya existen
(`lib/precios/calcular.test.ts`, `lib/ubicaciones.test.ts`, `lib/utils/indexeddb-upgrade.test.ts`),
que este cambio no toca y que deben seguir pasando en cada paso.

### Flujos críticos a cubrir E2E

El flujo crítico es uno: **elegir un producto, completar el formulario, recibir el 201 y llegar a
WhatsApp**. No se cubre con un test E2E porque no hay runner E2E instalado, y agregarlo es non-goal
(§1). Se cubre por partes:

1. El cuerpo enviado — `lib/landing/payload-pedido.test.ts`, contra el contrato literal de §5.
2. La decisión sobre la respuesta — `lib/landing/respuesta-pedido.test.ts`, 201 contra 400 contra 500.
3. El texto de WhatsApp — `lib/landing/mensaje-whatsapp.test.ts`, byte a byte.
4. El cableado entre los tres y el DOM — **pase manual**, en la lista de lanzamiento de §20.1, con
   pasos concretos y un resultado observable en la base de datos.

### Test data

Fixtures literales dentro de cada archivo de test. **Ningún test toca la base de datos, ningún test
levanta un servidor y ningún test hace red**, así que no hay base de datos de test que crear, sembrar
ni resetear, y no hay estado mutable compartido entre tests. Es por eso que §19.6 no emite ningún
`docker-compose.yml`: no hay servicio que aprovisionar.

### Lo que deliberadamente no se testea

- **El render de los componentes.** Sin Testing Library no se puede montar un componente React en
  este repo. Los gates de los pasos 7 a 13 son, en consecuencia, `npm run build` (que prueba que todo
  compila, tipa y prerrenderiza) más greps estructurales sobre el archivo, y cada criterio dice
  explícitamente que el medio es el grep. Es una cobertura más débil que un test de render, y se
  documenta como tal en vez de disfrazarla.
- **El endpoint `/api/pedidos/publico`.** Está congelado y fuera de alcance; testearlo exigiría una
  Postgres viva, que este build decidió no requerir.
- **La animación de las gotas en un navegador real.** Lo que sí se testea es lo que causa los bugs:
  que el array sea determinista, que es lo que evita el hydration mismatch.
- **El contraste, automáticamente.** No hay axe instalado. Los ratios de §7 están calculados a mano y
  la verificación es el pase manual de §15 y §20.1.

---

## 14. Security & Secrets

| Preocupación | Control | Implementado en |
|---|---|---|
| Almacenamiento de secretos | Variables de entorno de Vercel y `.env.local` local, nunca en el repo. **Este cambio no agrega ningún secreto** | `.gitignore` ya ignora `.env`, `.env.local`, `.env*.local` |
| Rotación de secretos | Procedimiento existente del proyecto; sin cambios | panel de Vercel |
| Validación de entrada | El servidor valida `nombre`, `telefono`, `direccion`, `comuna` no vacíos y al menos un ítem con `cantidad > 0`, y responde 400. El formulario valida en cliente **además**, nunca en lugar de | `app/api/pedidos/publico/route.ts` (congelado), `components/public/PedidoForm.tsx` |
| Codificación de salida / XSS | React escapa todo el texto interpolado. **Ningún componente de este cambio usa `dangerouslySetInnerHTML`** | todos los componentes de `components/public/` |
| Inyección SQL | Prisma con consultas parametrizadas; este cambio no escribe SQL ni construye consultas | `app/api/pedidos/publico/route.ts` (congelado) |
| AuthN / AuthZ | NOT APPLICABLE en la superficie tocada — la landing es pública y anónima (§8). El middleware existente sigue protegiendo `/admin` y `/chofer` sin cambios | `middleware.ts`, sin tocar |
| CSRF | El endpoint es público por diseño, sin sesión ni cookie de autorización, así que no hay privilegio que un CSRF pueda robar. No se agrega token | — |
| Rate limiting / abuso | **Ninguno, igual que antes.** El endpoint público ya podía recibir pedidos basura y este cambio no lo empeora ni lo mejora. Queda anotado en el registro de riesgos (§20.2) | — |
| Verificación de webhooks | NOT APPLICABLE — este cambio no recibe webhooks | — |
| Auditoría de dependencias | `npm audit` cuando se toque el lockfile. **Este cambio no toca el lockfile**, así que la superficie de suministro es exactamente la de antes | — |
| Cabeceras de seguridad | `Permissions-Policy: geolocation=(self)`, ya presente. **El paso 13 la conserva explícitamente** al agregar `redirects()`, y su `Verify` lo comprueba con un grep | `next.config.mjs` |
| Manejo de PII | El formulario recoge nombre, teléfono, dirección y comuna, y opcionalmente email: exactamente los mismos campos que el `OrderForm` que reemplaza. Se envían por HTTPS al endpoint y se guardan en `Cliente`. **Ningún campo nuevo, ninguna retención nueva** | `components/public/PedidoForm.tsx` |
| Higiene de logs | El código nuevo no hace `console.log` de datos del formulario ni del payload | `components/public/PedidoForm.tsx` |
| Datos que cruzan a WhatsApp | El mensaje prellenado lleva nombre, teléfono, dirección y comuna del propio usuario, a un chat que el propio usuario abre y envía. No se manda a un tercero sin su acción | `lib/landing/mensaje-whatsapp.ts` |

**Reglas duras**

- Ningún secreto se commitea, se imprime en un log, se manda a un tracker de errores ni se embebe en
  el bundle del cliente. `NEXT_PUBLIC_WHATSAPP_NUMBER` **sí** llega al navegador, y eso es correcto y
  deliberado: es un número comercial público. Cualquier otra variable que lo hiciera sería un bug.
- El número de teléfono se lee **solo** desde `lib/contacto.ts`. Un literal en un componente es un
  fallo de revisión, y hay un grep que lo caza en los pasos 7 y 12.
- El contrato de `/api/pedidos/publico` no se relaja para que el formulario nuevo sea más cómodo. Si
  el formulario no puede satisfacerlo, el que cambia es el formulario.

Este proyecto no maneja datos de salud, financieros ni de menores. Sí maneja datos personales de
clientes chilenos bajo la Ley 19.628; este cambio **no altera qué se recoge, cuánto se retiene ni
quién lo ve**, así que no crea obligaciones nuevas bajo ese régimen.

---

## 15. Accessibility

**Objetivo: WCAG 2.2 nivel AA** en la superficie pública que este cambio toca.

### Requisitos base

| Requisito | Regla en este cambio |
|---|---|
| HTML semántico | `SiteHeader` usa `<header>` + `<nav>`, `SiteFooter` usa `<footer>`, el contenido va en `<main>` (ya en el layout). Un solo `<h1>`, el del hero; cada sección abre con `<h2>` y las tarjetas usan `<h3>` |
| Teclado | Todo elemento interactivo es `<button>`, `<a>`, `<input>` o `<select>` nativo. **Nada de `<div onClick>`.** El botón "Pedir este" del catálogo es un `<button>` real, alcanzable con Tab |
| Foco visible | Anillo de foco visible en todo elemento enfocable, con `focus-visible:ring-2 focus-visible:ring-viflomax-azul-700 focus-visible:ring-offset-2`: 6.65:1 contra blanco, muy por encima del 3:1 exigido. **Nunca `outline-none` sin reemplazo** |
| Contraste | La tabla medida de §7 ya lo satisface: 5.95:1 en los CTA verdes, 9.57:1 en el header y el footer, 5.03:1 en el texto del hero gracias al scrim |
| Formularios | Cada input lleva `<label htmlFor>` programático. Los errores son **texto**, en el panel rojo, nunca solo color. El panel de resultado lleva `role="status"` con `aria-live="polite"` |
| Imágenes | El logo del hero lleva `alt="Agua Viflomax"`. Los blobs decorativos, la lluvia de gotas y los `<svg>` de icono llevan `aria-hidden="true"` |
| Movimiento | `prefers-reduced-motion: reduce` apaga `logo-float` y `water-drop`, con el bloque literal del paso 3 y un criterio de aceptación que lo comprueba |
| Zoom / reflujo | Usable a 200% de zoom y a 320 px de ancho sin scroll horizontal. Contenedores con `max-w-6xl mx-auto px-6`, grillas con `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, nav con `flex-wrap` |
| Regiones vivas | El resultado del envío se anuncia por `aria-live="polite"` en vez de aparecer en silencio |

### Adiciones de WCAG 2.2 que más se olvidan

| SC | Cómo se cumple acá |
|---|---|
| 2.4.11 Focus Not Obscured | El header es `sticky top-0`. La sección `#pedido` lleva `scroll-mt-24` para que el salto desde "Pedir este" no deje el campo enfocado debajo del header |
| 2.5.7 Dragging Movements | No hay ninguna interacción de arrastre en esta landing |
| 2.5.8 Target Size | Botones y pills con `py-2.5 px-5` como mínimo, muy por encima de 24×24 px |
| 3.3.7 Redundant Entry | El producto elegido en el catálogo llega **preseleccionado** al formulario vía el contexto: no se vuelve a pedir |
| 3.3.8 Accessible Authentication | NOT APPLICABLE — la landing no tiene autenticación |

### Verificación

**No hay comando automático de accesibilidad en este repo, y este cambio no puede agregar uno:** no
hay axe, ni Playwright, ni Testing Library instalados, y agregarlos es non-goal explícito (§1). Decir
lo contrario sería inventar un gate que no existe. Lo que sí se verifica automáticamente:

```bash
npm run lint   # expect: exit 0 — next/core-web-vitals incluye eslint-plugin-jsx-a11y,
               # que caza alt faltante, aria inválido y handlers en elementos no interactivos
grep -A4 'prefers-reduced-motion: reduce' app/globals.css | grep -q 'animation: none'   # expect: exit 0
```

El resto son pases manuales, en la lista de lanzamiento de §20.1: recorrido completo con teclado,
una pasada con lector de pantalla sobre el flujo de pedido, y una pasada a 200% de zoom en 320 px de
ancho. Las revisiones automáticas capturan alrededor de un tercio de los problemas reales; acá
capturan menos, y por eso los pases manuales son obligatorios antes del lanzamiento y no opcionales.

---

## 16. Observability & Cost

### Instrumentación

| Señal | Herramienta | Qué captura | Quién la mira |
|---|---|---|---|
| Errores | Ninguna herramienta dedicada instalada — es el estado previo del proyecto y este cambio no lo altera | — | — |
| Logs | Runtime logs de Vercel | Errores no capturados en las rutas de API, incluido el 500 de `/api/pedidos/publico` | El mantenedor, cuando algo se reporta |
| Métricas | Vercel Analytics si está habilitado en el proyecto | Vistas de página y Web Vitals de `/` | El mantenedor |
| Uptime | Ninguno | — | — |

**Esto es honesto sobre el estado real: el proyecto no tiene tracker de errores, y agregarlo sería
una dependencia nueva, prohibida en este cambio.** Queda anotado como riesgo en §20.2 y como
candidato de "qué construir después" en §20.4.

### Las métricas que importan para este cambio

| Métrica | Objetivo | Alertar en |
|---|---|---|
| Pedidos con `origen = 'web'` por semana | Mayor que la semana previa al deploy | Cero pedidos web en 7 días tras el deploy: señal de que el formulario se rompió en producción |
| Tasa de 400 sobre `/api/pedidos/publico` | Menor al 5% de los POST | Más del 20%: el formulario está mandando cuerpos inválidos |
| LCP de `/` en móvil | Bajo 2.5 s | Sobre 4 s: casi seguro el logo del hero. Por eso el paso 2 tiene un límite duro de 150 KB |
| Errores 500 sobre `/api/pedidos/publico` | Cero | Cualquiera: la transacción está fallando |

Las dos primeras se consultan directo contra la base:

```sql
select count(*) from "Pedido" where origen = 'web' and creado_en > now() - interval '7 days';
```

### Health check

Este cambio **no agrega un endpoint de salud**. La comprobación operativa es la línea de §20.1 que
levanta `next start` y confirma que `/` responde 200 y que `/pedir` responde 308. Un endpoint de
salud que además verifique la base es trabajo real y candidato de §20.4, no de este cambio.

### Modelo de costos

| Servicio | Free tier | Costo al volumen actual | Costo a 10× | Precipicio a vigilar |
|---|---|---|---|---|
| Vercel | Hobby | Sin cambio | Sin cambio | Este cambio no agrega funciones serverless ni rutas dinámicas: `/` sigue prerrenderizada estática |
| Base de datos | el plan actual | Sin cambio | Sin cambio | Una fila `Cliente` por pedido (non-goal de dedup) hace crecer la tabla más rápido que los pedidos |
| Optimización de imágenes de Vercel | incluida | Una sola imagen nueva | Igual | `next/image` sobre `/logo.png` cuenta como transformación; es una sola y se cachea |

**Costo mensual estimado del cambio: US$ 0.** No agrega servicios, ni funciones, ni almacenamiento,
ni dependencias. El único delta de infraestructura es un asset estático de menos de 150 KB y una
regla de redirección que Vercel resuelve en el edge.

---

## 17. Model Routing

**NOT APPLICABLE — este proyecto no llama a ningún LLM en runtime.**

---

## 18. Skills to Use During Build

Ninguna skill es obligatoria. Si una no está disponible, el builder usa la guía de este blueprint,
anota el reemplazo en una línea y sigue. Los nombres y comandos de instalación están copiados
literalmente de `knowledge/skills-registry.md` — no se inventó ninguno.

| Skill | Pasos de §9 | Qué aporta ahí | Install |
|---|---|---|---|
| `frontend-design` | 7, 8, 10, 11, 12 | Calidad de layout y jerarquía visual en los componentes nuevos, dentro de los tokens ya fijados en §7. **Auto-activa: se nombra en prosa, no con barra** | `/plugin marketplace add anthropics/skills` y luego `/plugin install example-skills@anthropic-agent-skills` |
| `emil-design-eng` | 3, 8 | Curvas de easing y presupuestos de duración para `logo-float` y `waterfall`. Hay que darle una pregunta concreta: con un pedido vago devuelve genéricos. **Auto-activa** | `npx skills@latest add emilkowalski/skills` |
| `ui-ux-pro-max` | 7, 10, 11 | Segunda opinión sobre espaciado y estilo de componente. **Los valores de §7 mandan sobre cualquier sugerencia suya**: la paleta ya está aprobada por el cliente. **Auto-activa** | `/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill` y luego `/plugin install ui-ux-pro-max@ui-ux-pro-max-skill` |
| `/claude-seo-ai:audit` | después del paso 13, antes del deploy | La home es la superficie de marketing del negocio; el rediseño cambia todos sus encabezados y su copy. Es un comando de barra real | `/plugin marketplace add Hainrixz/claude-seo-ai`, luego `/plugin install claude-seo-ai@claude-seo-ai`, luego `/reload-plugins` |

**Ninguna de estas skills puede agregar una dependencia.** Si una sugiere instalar un paquete, la
sugerencia se descarta: cero dependencias nuevas es una restricción dura de este cambio (§1, §11).

---

## 19. Agent Workspace

El proyecto queda con su propia configuración de agente. **Este repo no tiene hoy ni `CLAUDE.md` ni
`AGENTS.md` ni `.claude/`**: los cuatro archivos de abajo son los primeros que recibe, así que la
copia los *crea* — no hay nada con qué fusionar, y ninguna instrucción de este blueprint dice
"fusionar con el existente".

Se emiten como archivos reales bajo `workspace/` en el bundle:

```
blueprints/rediseno-landing/workspace/
├── CLAUDE.md                                      # §19.1
├── AGENTS.md                                      # §19.2
└── .claude/
    ├── settings.json                              # §19.3
    ├── skills/agregar-seccion-landing/SKILL.md    # §19.4
    ├── rules/landing-publica.md                   # §19.5
    └── rules/contratos-congelados.md              # §19.5
```

`workspace/` refleja exactamente el layout del repo, así que la ruta de un archivo bajo `workspace/`
es su ruta en el proyecto. El builder copia **el contenido de esa carpeta** a la raíz con la línea
guardada de §10:

```bash
[ -f CLAUDE.md ] || cp -R blueprints/rediseno-landing/workspace/. .   # idempotente: sale 0 con o sin copia
```

**Qué archivos no se sobrescriben nunca: todos los que algún paso edita.** No es una promesa, es
estructural — `workspace/` contiene únicamente `CLAUDE.md`, `AGENTS.md` y `.claude/**`, y ningún paso
de §9 toca ninguno de los tres. `package.json`, `package-lock.json`, `tailwind.config.ts`,
`app/globals.css`, `next.config.mjs`, `lib/**` y `components/**` **no existen dentro de
`workspace/`**, así que ni siquiera una copia sin guardia podría pisarlos. Es la razón por la que
aquí no hace falta la variante "copiar y regenerar".

**La guardia sale 0 en la ruta que guarda.** `[ -f CLAUDE.md ]` sale 0 si el archivo está y 1 si no
está, y en el segundo caso ejecuta el `cp`, que sale 0. Las dos ramas terminan en 0, también bajo
`set -e`. No se usa `cp -Rn`: en BSD/macOS sale **1** cuando omite un archivo existente, es decir,
falla exactamente en la segunda corrida, que es el escenario para el que existiría la guardia.

**Todo lo que se emite acá pasa las compuertas del propio proyecto.** La copia ocurre antes del paso
1, así que el primer `npm run lint` del paso 1 ya ve estos archivos. Se comprueba en §19.6 con
evidencia de por qué cada herramienta que camina el árbol no los rompe.

**`.claude/commands/` no se emite, en ningún modo.** Un comando de barra solo dispara cuando un
humano lo tipea, y un builder autónomo no tipea nada. Todo flujo repetible va a
`.claude/skills/<nombre>/SKILL.md` (§19.4), que activa por intención.

### 19.1 `CLAUDE.md`

```markdown
# Agua Viflomax

Sistema de pedidos de agua purificada a domicilio en Maipú y Padre Hurtado. Landing pública con
pedido inline, más panel `/admin` y app de `/chofer`.

## Comandos

| Tarea | Comando |
|---|---|
| Dev server | `npm run dev` — http://localhost:3000 |
| Build (incluye `prisma generate` y el chequeo de tipos) | `npm run build` |
| Lint | `npm run lint` |
| Tests (todos) | `npx jest` |
| Tests (un archivo) | `npx jest lib/landing/gotas.test.ts` |
| Instalar (solo si falta `node_modules`) | `npm ci` |

**Compuerta:** `npm run lint && npx jest && npm run build` tiene que pasar antes de marcar cualquier
tarea como hecha. No hay script `typecheck`: el chequeo de tipos vive dentro de `npm run build` y
dentro de ts-jest.

La versión de Node está fijada en `.nvmrc` (20). Las versiones de dependencias están en
`package-lock.json` — se leen de ahí, nunca se adivinan.

## Stack

Next.js 14 App Router · TypeScript · Tailwind 3 (`tailwind.config.ts`) · PostgreSQL · Prisma 5 ·
NextAuth v4 · Vercel. Gestor de paquetes: **npm**. Sin `src/`: `app/`, `components/`, `lib/` y
`types/` cuelgan de la raíz, y el alias `@/` apunta a la raíz.

## Arquitectura

**Camino de una request real.** Visitante → `app/(public)/page.tsx` (Server Component) → `<Hero />`
(server) y `<PedidoProvider>` (client) envolviendo `<ProductGrid />` (client), `<PorQueElegirnos />`
y `<Cobertura />` (server, pasados como children) y `<PedidoForm />` (client) → al enviar,
`fetch('/api/pedidos/publico')` → `app/api/pedidos/publico/route.ts` → `lib/db.ts` (Prisma) →
PostgreSQL. La respuesta 201 trae `numero_pedido`, y recién entonces se abre `wa.me`.

**Fronteras.** Cruzar una de éstas al revés rompe el build:

| Capa | Puede importar de | Nunca debe |
|---|---|---|
| `app/**` (rutas) | `components`, `lib` | Consultar la base fuera de `app/api/**` |
| `components/public/**` | `lib/**`, otros `components/public/**` | Importar `lib/db`, `@prisma/client` o `app/api/**` |
| `lib/landing/**` | nada del proyecto | Importar React, tocar `window`, `fetch` o `process.env` |
| `app/api/**` | `lib/**` | Importar nada de `components/` |

**Dónde vive cada cosa.**

| Tema | Fuente única de verdad |
|---|---|
| Catálogo, precios, nombres de producto | `lib/productos.ts` — los nombres son la clave que el endpoint resuelve contra la base |
| Teléfono, WhatsApp, horario, zona | `lib/contacto.ts` — **nunca escribir un número literal en un componente** |
| Tokens de color y tipografía | `tailwind.config.ts` — sin hex sueltos en componentes |
| Animaciones de la landing | `app/globals.css` — `logo-float` y `waterfall` |
| Lógica pura de la landing | `lib/landing/**` — sin React, testeable con Jest |
| Esquema de datos | `prisma/schema.prisma` |

## Reglas de código

1. **Server Components por defecto.** `'use client'` solo con estado, efectos o handlers, y siempre
   lo más cerca de la hoja posible. Un Server Component pasado como *child* de un Client Component
   sigue renderizando en el servidor: es el patrón que usa `app/(public)/page.tsx`.
2. **Alias `@/` hacia la raíz** en código de aplicación. En los tests, importar el módulo hermano con
   especificador relativo (`./gotas`), que es el patrón de los tests que ya existen.
3. **Nada de aleatoriedad en el render.** La home es estática y se hidrata; `Math.random()` o
   `Date.now()` durante el render provocan hydration mismatch. Las gotas usan un LCG sembrado
   (`lib/landing/gotas.ts`) y se calculan a nivel de módulo.
4. **Todo elemento interactivo es un elemento nativo** — `<button>`, `<a>`, `<input>`, `<select>`.
   Nunca `<div onClick>`.
5. **Validar en el borde y en el servidor.** La validación de cliente se suma a la del endpoint,
   nunca la reemplaza.
6. **Sin dependencias nuevas sin discutirlo primero.** Los iconos son `<svg>` inline. Si algo parece
   necesitar un paquete, primero se busca en lo que ya está instalado.
7. **Sin archivos barril.** Importar desde el módulo de origen.
8. **Máximo 300 líneas por componente.** Más largo significa que hay que partirlo.

## Sistema de diseño

Los tokens se definen una sola vez en `tailwind.config.ts`; los componentes usan nombres de token.

| Rol | Valor | Se usa para |
|---|---|---|
| Azul de marca | `#2f9fd6` (`viflomax-azul`) | Superficies e iconos. **Nunca texto blanco encima: 2.98:1** |
| Azul texto blanco | `#1a628a` (`viflomax-azul-700`) | Botones secundarios, anillo de foco — 6.65:1 |
| Azul oscuro | `#164a63` (`viflomax-azul-800`) | Header, footer, títulos — 9.57:1 |
| Verde de marca | `#6ab04c` (`viflomax-verde`) | Bordes, iconos, gradiente. **Nunca texto blanco encima: 2.65:1** |
| Verde de CTA | `#3f6f31` (`viflomax-verde-700`) | **Todos los botones y badges con texto blanco** — 5.95:1 |
| Fondo | `#ffffff` | Toda la superficie pública |
| WhatsApp | `#25D366` | Solo el botón flotante — color fijo de marca |

- **Tipografía:** títulos `font-nunito` (`--font-nunito`); cuerpo, la del sistema. H1
  `text-5xl md:text-7xl`, H2 `text-3xl md:text-4xl`, H3 `text-xl`.
- **Radio:** `rounded-full` en botones, pills y badges; `rounded-2xl` en tarjetas.
- **Sombra:** `shadow-sm` en reposo, `hover:shadow-lg` en tarjetas.
- **Movimiento:** `logo-float` 5s ease-in-out; `waterfall` 4–9s linear. Ambos se apagan con
  `prefers-reduced-motion: reduce`. Solo `transform` y `opacity`.
- **Layout:** `max-w-6xl mx-auto px-6`, secciones a `py-16`, mobile-first.

## Entorno

| Variable | Requerida | La usa | Origen |
|---|---|---|---|
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | no — hay fallback en el código | `lib/contacto.ts` | `.env.local` |
| `DATABASE_URL` | sí, en runtime | `lib/db.ts` | `.env.local` |
| `NEXTAUTH_URL`, `NEXTAUTH_SECRET` | sí, para `/admin` y `/chofer` | NextAuth | `.env.local` |
| `CLOUDINARY_*` | sí, para fotos de entrega | `/chofer` | `.env.local` |

`.env.example` está commiteado. `.env`, `.env.local` y `.env*.local` nunca.

## Reglas diferidas

Leer el archivo que corresponda antes de editar esa área:

| Archivo | Aplica a |
|---|---|
| `.claude/rules/landing-publica.md` | `components/public/**`, `lib/landing/**`, `app/(public)/**` |
| `.claude/rules/contratos-congelados.md` | `app/api/pedidos/publico/**`, `lib/productos.ts`, `lib/contacto.ts` |

## Innegociable

1. **`app/api/pedidos/publico/route.ts` no se edita.** Su contrato está congelado; si el cliente no
   lo satisface, el que cambia es el cliente.
2. **Los nombres y precios de `lib/productos.ts` no se cambian.** El endpoint resuelve el producto
   por coincidencia exacta de nombre contra la base: renombrar rompe todos los pedidos.
3. **El número de teléfono no se escribe literal en ninguna parte.** Sale de `lib/contacto.ts`.
4. **Cero dependencias nuevas sin una razón en el mensaje del commit.**
5. **Texto blanco sobre verde va siempre en `viflomax-verde-700`**, nunca en `viflomax-verde`.
6. Nunca commitear secretos, `.env` ni salida de build.
7. Nunca editar archivos generados (`lib/generated/prisma`, `public/sw.js`, `public/workbox-*.js`).
8. Nunca marcar una tarea como hecha con una compuerta en rojo.
```

### 19.2 `AGENTS.md`

```markdown
# Agua Viflomax — instrucciones para agentes

Sistema de pedidos de agua purificada a domicilio (Maipú y Padre Hurtado): landing pública con
pedido inline, panel `/admin` y app de `/chofer`. Next.js 14 App Router · TypeScript · Tailwind 3 ·
Prisma 5 · PostgreSQL. Gestor de paquetes: **npm**. Sin `src/`; el alias `@/` apunta a la raíz.

## Comandos

| Tarea | Comando |
|---|---|
| Dev server | `npm run dev` — http://localhost:3000 |
| Build (incluye `prisma generate` y tipos) | `npm run build` |
| Lint | `npm run lint` |
| Tests (todos) | `npx jest` |
| Tests (un archivo) | `npx jest lib/landing/gotas.test.ts` |

**Compuerta:** `npm run lint && npx jest && npm run build` pasa antes de marcar algo como hecho.

## Innegociable

1. `app/api/pedidos/publico/route.ts` no se edita: su contrato está congelado.
2. Los nombres y precios de `lib/productos.ts` no se cambian: el endpoint resuelve por nombre exacto.
3. El número de teléfono nunca se escribe literal; sale de `lib/contacto.ts`.
4. Cero dependencias nuevas sin una razón en el mensaje del commit.
5. Texto blanco sobre verde va siempre en `viflomax-verde-700`, nunca en `viflomax-verde`.
6. Nunca commitear secretos ni `.env`; nunca editar archivos generados.
7. Nunca marcar una tarea como hecha con una compuerta en rojo.

Arquitectura completa, fronteras de importación y tokens de diseño: ver `CLAUDE.md` en este mismo
directorio, que es la fuente canónica.
```

### 19.3 `.claude/settings.json`

Cubre **todos** los comandos que aparecen en los 13 bloques `Verify` de §9, en el bootstrap de §10 y
en la compuerta de §20.1. Indentación de 2 espacios y comillas dobles, que es el estilo de los JSON
que este repo ya tiene (`package.json`, `tsconfig.json`, `.eslintrc.json`).

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run lint)",
      "Bash(npm run build)",
      "Bash(npm run dev:*)",
      "Bash(npm test:*)",
      "Bash(npm ci)",
      "Bash(npx jest:*)",
      "Bash(npx next lint:*)",
      "Bash(npx next build:*)",
      "Bash(npx next start:*)",
      "Bash(npx prisma generate)",
      "Bash(node:*)",
      "Bash(grep:*)",
      "Bash(test:*)",
      "Bash(head:*)",
      "Bash(wc:*)",
      "Bash(curl:*)",
      "Bash(cp:*)",
      "Bash(cat:*)",
      "Bash(echo:*)",
      "Bash(sleep:*)",
      "Bash(kill:*)",
      "Bash(rm -f:*)",
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git tag:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(git ls-files:*)",
      "Bash(git check-ignore:*)",
      "Bash(git rev-parse:*)"
    ],
    "deny": [
      "Read(./.env)",
      "Read(./.env.local)",
      "Read(./.env.*.local)",
      "Bash(git push:*)",
      "Bash(git reset --hard:*)",
      "Bash(npx prisma migrate:*)",
      "Bash(npx prisma db push:*)"
    ]
  }
}
```

`git reset --hard` está **denegado a propósito** aunque §9 lo nombre como rollback: es la única
operación destructiva de este build y debe pasar por confirmación humana. `prisma migrate` y
`prisma db push` están denegados porque este cambio no migra nada (§4) y una migración accidental
contra la base real sería el peor resultado posible de una sesión desatendida.

### 19.4 Project skills

Una sola skill, porque hay exactamente un flujo repetible en este proyecto que valga la pena
codificar: agregar otra sección a la landing respetando la frontera Server/Client que este cambio
establece.

Archivo: `.claude/skills/agregar-seccion-landing/SKILL.md`

````markdown
---
name: agregar-seccion-landing
description: Usar al agregar una sección nueva a la landing pública de Viflomax (app/(public)/page.tsx) — por ejemplo testimonios, preguntas frecuentes o una promoción. Fija la frontera Server/Client, el uso de tokens de color con contraste válido y la lluvia de gotas determinista. Disparadores típicos - "agregar una sección", "nueva sección en la home", "sumar testimonios a la landing".
---

# Agregar una sección a la landing

## Cuándo usarla

Cuando haya que sumar un bloque nuevo a `app/(public)/page.tsx`. No aplica a `/admin`, a `/chofer`
ni a páginas que no sean la home.

## Pasos

1. Crear `components/public/<NombreSeccion>.tsx`. **Sin `'use client'` salvo que la sección tenga
   estado, efectos o handlers.** La mayoría no los tiene.
2. Estructura: `<section id="<ancla>" className="py-16">` con un contenedor
   `max-w-6xl mx-auto px-6`, un `<h2 className="font-nunito text-3xl md:text-4xl font-bold">` y el
   contenido.
3. Colores solo con tokens. Si la sección lleva texto blanco sobre color, usar
   `bg-viflomax-verde-700` o `bg-viflomax-azul-700` / `-800`. **Nunca `bg-viflomax-verde` ni
   `bg-viflomax-azul` con texto blanco:** 2.65:1 y 2.98:1, ambos reprueban AA.
4. Si lleva lluvia de fondo: `const GOTAS_<SECCION> = generarGotas(<semilla>, <cantidad>, '<color>')`
   **a nivel de módulo, en la columna 0**, y pasarlo a `<LluviaDeGotas gotas={...} />`. Semilla
   distinta de las que ya se usan (7 en el catálogo, 23 en cobertura). Nunca `Math.random()`.
5. Iconos: `<svg>` inline con `aria-hidden="true"`. No instalar una librería de iconos.
6. Montarla en `app/(public)/page.tsx` en la posición que corresponda. Si va entre el catálogo y el
   formulario, va **dentro** de `<PedidoProvider>`, como child: sigue siendo Server Component.
7. Si es un destino de enlace, agregar `scroll-mt-24` para que el header sticky no tape el ancla.

## Verificar

```bash
grep -q 'use client' components/public/<NombreSeccion>.tsx; test $? -eq 1   # solo si es Server Component
npm run lint    # expect: exit 0
npm run build   # expect: exit 0
npx jest        # expect: exit 0, 0 failed, 0 skipped
```

## No hacer

- No agregar dependencias. Ni de iconos, ni de animación, ni de carrusel.
- No usar `Math.random()` ni `Date.now()` durante el render: la home es estática y se hidrata.
- No escribir un número de teléfono literal; usar `lib/contacto.ts`.
- No poner `'use client'` en la página ni en el layout para "que sea más fácil": arrastra toda la
  landing al bundle de cliente.
````

| Skill | Dispara con | Qué automatiza |
|---|---|---|
| `agregar-seccion-landing` | "agregar una sección", "nueva sección en la home", "sumar testimonios a la landing" | La frontera Server/Client, los tokens con contraste válido, la lluvia determinista y el montaje en la página |

### 19.5 `.claude/rules/*.md`

Dos archivos con frontmatter `paths:`, para que las convenciones carguen solo al editar esa área.

Archivo: `.claude/rules/landing-publica.md`

```markdown
---
description: Convenciones de la landing pública — frontera Server/Client, contraste y determinismo
paths:
  - "components/public/**"
  - "lib/landing/**"
  - "app/(public)/**"
---

- **Server Component por defecto.** `'use client'` solo con `useState`, `useEffect` o handlers de
  evento, y siempre en la hoja. Hoy solo lo llevan `PedidoProvider`, `ProductGrid`, `PedidoForm` y
  `ProductoImagen`.
- Un Server Component pasado como *child* de un Client Component **sigue renderizando en el
  servidor**. Así es como `PorQueElegirnos` y `Cobertura` viven dentro de `PedidoProvider` con cero
  JS de cliente. No convertirlos a cliente "para que anden".
- **Nada de `Math.random()` ni `Date.now()` durante el render.** La home es estática y se hidrata; la
  lluvia usa `generarGotas(semilla, cantidad, color)` de `lib/landing/gotas.ts`, invocada **a nivel
  de módulo** con una semilla literal.
- **`lib/landing/**` es puro:** sin React, sin `fetch`, sin `window`, sin `process.env`. Es lo único
  que este repo puede testear, porque no hay Testing Library instalada. Toda lógica del formulario
  que valga la pena verificar se extrae acá primero.
- **Contraste, sin excepciones.** Texto blanco sobre verde va en `bg-viflomax-verde-700` (5.95:1);
  sobre azul, en `bg-viflomax-azul-700` (6.65:1) o `-800` (9.57:1). `bg-viflomax-verde` (2.65:1) y
  `bg-viflomax-azul` (2.98:1) **nunca** llevan texto blanco.
- El hero conserva su capa `bg-black/30` entre el gradiente y el contenido: sin ella **ningún** texto
  del hero pasa AA, ni siquiera el `<h1>` — el blanco queda en 2.65:1 sobre la parada verde.
- **Todo elemento interactivo es nativo** — `<button>`, `<a>`, `<input>`, `<select>` — con foco
  visible (`focus-visible:ring-2 focus-visible:ring-viflomax-azul-700`). Nunca `<div onClick>` ni
  `outline-none` sin reemplazo.
- Decoración (blobs, gotas, iconos) siempre con `aria-hidden="true"`.
- Anclas de destino con `scroll-mt-24`, para que el header sticky no las tape (WCAG 2.4.11).
- **Cero dependencias nuevas.** Iconos: `<svg>` inline. Animación: keyframes en `app/globals.css`.
- Toda animación nueva se apaga dentro del bloque `@media (prefers-reduced-motion: reduce)` de
  `app/globals.css`. Ese bloque lo crea el paso 3 del build; si todavía no está, se crea junto con la
  primera animación.
```

Archivo: `.claude/rules/contratos-congelados.md`

```markdown
---
description: Contratos que no se editan — endpoint público de pedidos, catálogo y datos de contacto
paths:
  - "app/api/pedidos/publico/**"
  - "lib/productos.ts"
  - "lib/contacto.ts"
---

- **`app/api/pedidos/publico/route.ts` no se edita.** Es el contrato del que dependen la landing y el
  panel. Si el cliente no lo satisface, el que cambia es el cliente.
- El cuerpo del `POST` es exactamente
  `{ nombre, telefono, email?, direccion, comuna, items: [{ productoId, cantidad }], notas? }`.
  `nombre`, `telefono`, `direccion` y `comuna` son obligatorios y no vacíos tras `trim()`; con
  cualquiera vacío el endpoint responde **400**.
- **`productoId` es el nombre del producto**, no un id ni un slug: el servidor lo resuelve buscando
  coincidencia exacta contra `Producto.nombre` en la base. Nada de `encodeURIComponent` ni de
  normalizar mayúsculas en el valor enviado.
- `email` y `notas` vacíos se **omiten** del cuerpo; no se mandan como string vacío.
- **Solo `201` es éxito.** Trae `{ data: { pedido_id, numero_pedido }, error: null }`. Cualquier otro
  status muestra el `error` del cuerpo y **no** abre WhatsApp.
- **Los nombres, precios y categorías de `PRODUCTOS` no se cambian.** Renombrar un producto rompe la
  resolución del endpoint contra la base y con eso todos los pedidos web.
- Lo único que se agregó a `lib/productos.ts` es `filtrarPorCategoria`, que es pura y no muta la
  entrada. `formatCLP` ya existía: se reutiliza, no se reimplementa.
- **`lib/contacto.ts` es la única fuente del teléfono, del horario y de la zona.** Ningún componente
  escribe un número literal. `TIENE_WHATSAPP` es la condición que decide si se muestra cualquier
  cosa relacionada con WhatsApp; con `false`, el pedido igual se guarda y solo se muestra el mensaje
  de éxito.
- `HORARIO` es `'Lun a Sáb · 9:00 – 19:00 hrs'` y refleja el horario real del negocio: no se cambia
  para que coincida con un texto de diseño.
```

### 19.6 Verify-critical config and local infrastructure

**No se emite ningún archivo de configuración nuevo, y eso no es un hueco: es que ya están todos, y
funcionando.** Este es un repo brownfield con su tooling montado hace muchos commits. La paridad de
`Verify` se satisface con lo que ya hay, y esto es la evidencia archivo por archivo — medida
corriendo los comandos, no deducida.

| Archivo | Ruta en el proyecto | Qué `Verify` lo necesitan | Qué aporta | Exclusión del bundle |
|---|---|---|---|---|
| `jest.config.js` | raíz | pasos 1, 4, 5, 6, 7, 12, 13 y §20.1 | Ya trae el transform `ts-jest` para `.ts`/`.tsx`, `testEnvironment: jsdom`, y `moduleNameMapper` `^@/(.*)$` → `<rootDir>/$1`. **Ningún paquete que este blueprint use tiene resolución no trivial**: `lib/landing/**` es puro TypeScript sin dependencias, y `tailwind.config.ts` solo importa un tipo, que se borra al compilar | n/a — el `testMatch` por defecto solo toma `*.test.*`, `*.spec.*` y `__tests__/`, y el bundle bajo `blueprints/` no contiene ninguno: solo `.md` y `.json`. Verificado: la corrida base recogió exactamente 3 suites, las del repo |
| `.eslintrc.json` | raíz | los 13 pasos y §20.1 | `next/core-web-vitals`, que incluye `eslint-plugin-jsx-a11y` y las reglas de imágenes y enlaces de Next | n/a — `next lint` solo recorre `app/`, `components/`, `lib/`, `pages/` y `src/` por defecto. Nunca mira `blueprints/` |
| `tsconfig.json` | raíz | los pasos que corren `npm run build`, y ts-jest, que lo hereda | `strict: true`, `paths` `@/*` → `./*`, `moduleResolution: bundler`, `jsx: preserve` | n/a — su `include` es `**/*.ts` y `**/*.tsx`, y el bundle no contiene ni un `.ts` ni un `.tsx`: `workspace/` solo lleva `.md` y un `.json` |
| `.nvmrc` | raíz | ninguno directamente; fija Node 20 para todos | La versión del runtime | n/a — no camina el árbol |
| `postcss.config.js`, `tailwind.config.ts` | raíz | pasos 1, 3 y todos los que corren `npm run build` | Compilación de Tailwind. `content` está acotado a `./app/**/*.{ts,tsx}` y `./components/**/*.{ts,tsx}` | n/a — esos dos globs **no alcanzan `blueprints/`** ni por accidente |

**No hay archivo de golden ni fixture que emitir**, porque los literales byte a byte viven dentro de
los archivos de test que los pasos 5 y 12 escriben (y que aparecen en sus listas de `files`), no en
archivos separados. Están reconciliados en la última tabla de esta subsección.

**No hay `docker-compose.yml` que emitir**, porque **ningún `Verify` de los 13 pasos necesita un
servicio**: ni base de datos, ni caché, ni cola. Se comprobó comando por comando: los 13 bloques
`Verify` contienen únicamente `npx jest`, `npm run lint`, `npm run build`, `grep`, `test`, `head`,
`node` sobre un archivo local y `git check-ignore`. La única línea de todo el blueprint que levanta
un proceso es la comprobación del 308 en §20.1, y usa `next start` sobre el build ya hecho, sin base
de datos.

**Toda ruta que aparece en un `Verify` está creada o editada por un paso.** Contrastadas las dos
listas extrayendo cada ruta de los 112 comandos `Verify` de los 13 pasos: **26 rutas distintas**.
**25** las crea o las edita un paso de §9 y figuran en el `files` de esa tarea en `tasks.json` —
incluido `scripts-check-logo.cjs`, el comprobador temporal que el propio bloque `Verify` del paso 2
escribe con un heredoc antes de ejecutarlo. La **1** restante es `public/logo.jpeg`, que ningún paso
edita a propósito: el paso 2 solo comprueba que sigue ahí, porque los cuatro archivos `app/icon*` la
consumen. **Cero rutas huérfanas.**

**Y en el sentido inverso: 7 archivos que los pasos editan no aparecen como ruta en ningún `Verify`**
— `tailwind.config.ts`, `lib/productos.ts`, `lib/contacto.ts` y los cuatro módulos de
`lib/landing/*.ts`. No es un hueco y no hace falta agregar greps: cada uno lo ejercita su archivo de
test hermano, que sí es una ruta nombrada (`tailwind.config.test.ts` importa `./tailwind.config`,
`lib/landing/gotas.test.ts` importa `./gotas`, y así con los demás), y además todos pasan por
`npm run lint` y `npm run build`. Se verifica el efecto, no el nombre del archivo.

#### Resolution convention matrix

**La convención, dicha una sola vez:** el código de aplicación importa con el alias **`@/…`** desde la
raíz del repo; **los archivos de test importan su módulo hermano con especificador relativo sin
extensión** (`./gotas`, `./productos`, `./tailwind.config`).

| Contexto | Comando que lo ejercita | La convención ahí | Config y ajuste literal que la hace funcionar |
|---|---|---|---|
| Código de aplicación | `npm run build` | `import { PRODUCTOS } from '@/lib/productos'` | `tsconfig.json` — `"paths": { "@/*": ["./*"] }` con `"moduleResolution": "bundler"`. **Verificado:** `npx next build` sale 0 hoy con este mismo patrón en 39 archivos |
| Archivos de test | `npx jest lib/landing/gotas.test.ts` | `import { generarGotas } from './gotas'` | `jest.config.js` — el transform `ts-jest` resuelve el hermano relativo con las `moduleFileExtensions` por defecto de Jest, que incluyen `ts`. **Verificado:** los 3 tests que ya existen usan exactamente esta forma y `npx jest` sale 0 con 29 tests. El `moduleNameMapper` `^@/(.*)$` también está, así que el alias funcionaría; **se usa igual la forma relativa porque es la única probada en este repo** |
| Scripts standalone | — | **Este cambio no agrega ningún script standalone.** El único del repo, `scripts/purgar-ubicaciones.mjs`, está fuera de alcance y ningún `Verify` lo invoca | n/a — sin contexto que reconciliar. El comprobador temporal del paso 2 es CommonJS puro (`scripts-check-logo.cjs`, extensión `.cjs`, solo `require('fs')`) y **no importa nada del proyecto**, así que no participa de ninguna convención de resolución |
| Build / bundle | `npm run build` | Igual que el código de aplicación: el compilador de Next reescribe `@/` según `tsconfig.json` | `tsconfig.json` — mismos `paths`. **Verificado:** el build sale 0 y emite `/` como página estática |
| Lint (resuelve imports) | `npm run lint` | Ambas formas | `.eslintrc.json` — `next/core-web-vitals` toma los `paths` de `tsconfig.json`. **Verificado:** `npx next lint` sale 0 |

Ningún contexto necesita un ajuste distinto del de los otros: no hay ninguna condición de export, ni
entry point solo-bundler, ni binario nativo, ni paso de codegen en juego, porque **este cambio no
agrega ningún paquete**. Es la consecuencia útil de la restricción de cero dependencias.

#### Cross-artifact value reconciliation

Valores que aparecen en dos o más artefactos emitidos. Cada uno tiene **una** fuente que lo decide, y
la columna `Comparado` dice `sí` solo donde se abrió cada aparición y se cotejaron los caracteres.

| Valor compartido | Fuente única que lo decide | Valor literal | Dónde más aparece | Comparado |
|---|---|---|---|---|
| Ruta del logo del hero | el archivo que crea el paso 2 | `public/logo.png`, servido como `/logo.png` | §3 árbol · §9 paso 2 (`Do`, 4 criterios, 4 líneas de `Verify`) · §9 paso 8 (`Do`, criterio, `Verify`) · §20.1 · `.claude/skills` no lo menciona | sí |
| Logo de los iconos PWA | los cuatro archivos de `app/icon*` que ya existen | `public/logo.jpeg` | §1 non-goals · §3 árbol · §9 paso 2 (`Do`, criterio, `Verify`) | sí |
| Ancla del formulario | `app/(public)/page.tsx`, paso 13 | `#pedido` — atributo `id="pedido"` | §6 jerarquía · §9 pasos 7, 8, 10, 13 · `next.config.mjs` `destination: '/#pedido'` · §19.4 skill | sí |
| Ancla del catálogo | `components/public/ProductGrid.tsx`, paso 10 | `#productos` — atributo `id="productos"` | §9 pasos 7, 8 · §19.1 | sí |
| Ruta retirada | `next.config.mjs`, paso 13 | `/pedir` | §1 · §3 · §6 · §9.1 · §9 pasos 7, 8, 10, 13 · §12 · §20.1 | sí |
| Endpoint del pedido | `app/api/pedidos/publico/route.ts` (congelado) | `/api/pedidos/publico` | §4 · §5 · §6 · §9.1 · §9 pasos 5, 12 · §13 · §14 · §19.1 · §19.5 | sí |
| Alias verde de CTA | `tailwind.config.ts`, paso 1 | `#3f6f31`, clase `bg-viflomax-verde-700` | §7 tabla de tokens y de contraste · §9 pasos 1, 7, 10 · §15 · §19.1 · §19.5 · §19.4 | sí |
| Alias azul oscuro | `tailwind.config.ts`, paso 1 | `#164a63`, clases `bg-viflomax-azul-800` y `bg-viflomax-azul-oscuro` | §7 tabla de tokens, alias y contraste · §9 paso 1 (criterio y `Verify`) · §9 paso 7 · §19.1 | sí |
| Clase de la gota | `app/globals.css`, paso 3 | `water-drop` | §7 motion · §9 pasos 3, 9 · §19.5 | sí |
| Custom property de opacidad | `app/globals.css`, paso 3 | `--drop-op` | §7 motion · §9 pasos 3, 9 | sí |
| Clase de flotado del logo | `app/globals.css`, paso 3 | `logo-float` | §7 motion · §9 pasos 3, 8 · §15 · §19.1 | sí |
| Límite de peso del logo | §1 métricas | `153600` bytes | §1 · §9 paso 2 (criterio, `Verify`, comprobador) · §16 · §20.1 | sí |
| Ruta del bundle | este archivo | `blueprints/rediseno-landing/` | §3 · §10 Bootstrap · §19 · §20.1 | sí |
| Comando de tests | `package.json` (existente, no se toca) | `npx jest` — y `npm test` es su alias vía el script `test` | §9 los 13 pasos · §13 · §19.1 · §19.2 · §19.3 allowlist · §20.1 | sí |
| Puerto del chequeo de redirección | §20.1 | `3100` | §20.1, tres apariciones en la misma línea | sí |
| Etiquetas de checkpoint | §9, un `git tag` por paso | `step-01-tokens-color` … `step-13-cutover-landing` | §9 los 13 `Checkpoint` · `tasks.json` campo `checkpoint` · los dos epics · §20.1 | sí |
| Comprobador temporal del logo | el heredoc del `Verify` del paso 2 | `scripts-check-logo.cjs` | §9 paso 2 (`Do`, heredoc, 2 líneas de `Verify`, lista de archivos) · `tasks.json` `E1-T2` `verify` y `files` · `epics/01-fundaciones.md` | sí |
| Documentación de la ruta retirada | `ROLES.md`, editado por el paso 13 | `ROLES.md` | §9 paso 13 (`Do`, `Verify`) · `tasks.json` `E2-T7` `verify` y `files` · `epics/02-interfaz-publica.md` | sí |

**El contrato entre artefactos se ejercita en el paso más temprano donde ambos lados existen.** Los
dos casos reales de este build:

- `public/logo.png` lo produce el paso 2 y lo consume el paso 8. **El paso 2 no se limita a crearlo:
  lo abre y le lee la cabecera PNG**, comprobando bytes, ancho y canal alfa. Un logo opaco o
  demasiado pesado falla en el paso 2, no seis pasos después, cuando ya está dentro del hero.
- Las clases de `app/globals.css` (paso 3) y sus consumidores (pasos 8, 9). El paso 9 es el primero
  donde existen los dos lados de `water-drop` y `--drop-op`, y su `Verify` los comprueba en el
  componente; el paso 3 ya los había comprobado en el CSS.

No hay ningún ejecutable ni entry point publicado en este cambio: la salida es una página web, y la
compuerta que la *ejecuta* de verdad es la línea de `next start` + `curl` de §20.1.

#### Byte-exact artifact reconciliation

Los literales que algún `Verify` compara carácter por carácter. Los dos primeros los **ejecuté**
sobre el runtime real antes de escribir este blueprint; el resultado está en la columna 5.

| Artefacto byte-exacto | Lo escribe | Se compara primero en | Reglas del blueprint que lo restringen | Llamada del runtime que lo produce | Ambos confirmados |
|---|---|---|---|---|---|
| Mensaje de WhatsApp **con** notas, en `lib/landing/mensaje-whatsapp.test.ts` | paso 5 | paso 5 | §5: `comuna` obligatorio y por eso va en la línea de dirección, tras coma y espacio · §9 paso 5 `Do`: seis líneas, en ese orden, unidas con salto de línea · §7: sin formateo de moneda en el mensaje, así que no interviene `Intl` | Concatenación de plantillas más `Array.join('\n')`. **Ejecutado en Node:** devuelve `Hola! Quiero hacer un pedido de Agua Viflomax:` + salto + `Producto: Recarga 20 Litros x2` + salto + `Nombre: Ana Pérez` + salto + `Teléfono: +56 9 1234 5678` + salto + `Dirección: Av. Ejemplo 123, Maipú` + salto + `Notas: Dejar en conserjería`, 6 líneas. **Sin dependencia de versión**: no hay excepción, ni formato numérico, ni fecha, ni locale — solo concatenación, idéntica en cualquier motor JS | sí |
| Mensaje de WhatsApp **sin** notas, mismo archivo | paso 5 | paso 5 | §9 paso 5 `Do`: la línea `Notas:` se omite cuando `notas` está vacío tras `trim()` | **Ejecutado en Node:** 5 líneas, sin la subcadena `Notas:` | sí |
| `generarGotas(7, 16, 'x')[0].left` = `49.04`, en `lib/landing/gotas.test.ts` | paso 4 | paso 4 | §9 paso 4 `Do`: LCG `(s * 9301 + 49297) % 233280`, `left` es el primer valor consumido, 0–100, redondeado a 2 decimales | **Ejecutado en Node:** `(7*9301+49297) % 233280 = 114404`; `114404/233280 = 0.4904…`; `Math.round(0.4904…*10000)/100 = 49.04`. Aritmética entera exacta en float64, **idéntica en todo motor JS**. El test la afirma con `toBeCloseTo(49.04, 2)`, no con igualdad estricta, para que ni siquiera dependa de la representación | sí |
| Cadena de error de 400, en `lib/landing/respuesta-pedido.test.ts` | paso 12 | paso 12 | §5: el endpoint devuelve literalmente `Los campos nombre, teléfono, dirección y comuna son obligatorios`. **Leída del código congelado de `app/api/pedidos/publico/route.ts`**, no de memoria | No la produce ningún runtime: la produce el propio código del repo, que este cambio no toca. El test la usa como *entrada* del intérprete, no como salida esperada de un motor | sí |

**Ningún literal de este build proviene de un runtime.** No hay mensajes de excepción, ni trazas, ni
formatos de fecha, ni ordenamientos de claves, ni colación, ni `Intl` dentro de una aserción
byte-exacta. `formatCLP` sí usa `Intl.NumberFormat('es-CL')`, cuya salida **depende de la versión de
ICU** — y por eso **ningún criterio de aceptación ni ningún `Verify` de este blueprint afirma su
salida**. Es una omisión deliberada, no un olvido.

---

## 20. Acceptance Gate, Risks & Decision Log

### 20.1 Global acceptance gate

El cambio está **hecho** cuando cada comando de abajo sale 0, y no antes.

```bash
# Precondición del checkout: este repo es brownfield y .env está gitignoreado.
test -f .env.local || test -f .env    # expect: exit 0 — DATABASE_URL tiene que existir para el build
test -d node_modules                  # expect: exit 0. Si falla: npm ci

npm run lint    # expect: exit 0, "No ESLint warnings or errors"
npx jest        # expect: exit 0, 0 failed, 0 skipped
npm run build   # expect: exit 0

# Estado final del cutover — cada línea sale 0 cuando el cambio está correcto
test $(wc -c < public/logo.png) -lt 153600            # expect: exit 0 — logo bajo 150 KB
test ! -e 'app/(public)/pedir/page.tsx'               # expect: exit 0 — retirado
test ! -e components/public/OrderForm.tsx             # expect: exit 0 — retirado
grep -rq '/pedir' app components; test $? -eq 1       # 1 = sin match -> sale 0. 2 seria error de grep y falla
grep -rq 'bubble' app components; test $? -eq 1       # 1 = sin match -> sale 0
grep -q "source: '/pedir'" next.config.mjs            # expect: exit 0
grep -q 'Permissions-Policy' next.config.mjs          # expect: exit 0 — la cabecera previa sobrevivio
grep -A4 'prefers-reduced-motion: reduce' app/globals.css | grep -q 'animation: none'   # expect: exit 0

# La redireccion, ejercitada de verdad contra un servidor real (no un grep de config)
npm run build && npx next start -p 3100 & echo $! > .next-start.pid
sleep 10
test "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3100/)" = 200          # expect: exit 0
test "$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3100/pedir)" = 308     # expect: exit 0 — 308 = permanente
kill "$(cat .next-start.pid)" && rm -f .next-start.pid

# Las 13 etiquetas de checkpoint, POR NOMBRE. Nunca contando: este repo ya trae 16 step-* previas.
for t in step-01-tokens-color step-02-logo-optimizado step-03-keyframes-motion step-04-gotas \
         step-05-constructores-pedido step-06-filtros-catalogo step-07-shell-sitio step-08-hero \
         step-09-lluvia-provider step-10-product-grid step-11-secciones-confianza \
         step-12-pedido-form step-13-cutover-landing; do
  git rev-parse -q --verify "refs/tags/$t" >/dev/null || { echo "FALTA la etiqueta $t"; exit 1; }
done   # expect: exit 0, sin salida

# Todo archivo que §10 declara commiteado, rastreado en un checkout limpio.
# UNA ruta por invocacion, para que el fallo sea del archivo y no del comando.
for p in tailwind.config.ts tailwind.config.test.ts app/globals.css public/logo.png \
         public/logo.jpeg lib/landing/gotas.ts lib/landing/mensaje-whatsapp.ts \
         lib/landing/payload-pedido.ts lib/landing/respuesta-pedido.ts lib/productos.ts \
         lib/contacto.ts components/public/SiteHeader.tsx components/public/SiteFooter.tsx \
         components/public/Hero.tsx components/public/LluviaDeGotas.tsx \
         components/public/PedidoProvider.tsx components/public/ProductGrid.tsx \
         components/public/PorQueElegirnos.tsx components/public/Cobertura.tsx \
         components/public/PedidoForm.tsx next.config.mjs CLAUDE.md AGENTS.md \
         .claude/settings.json; do
  git ls-files --error-unmatch "$p" >/dev/null || { echo "NO rastreado: $p"; exit 1; }
  git check-ignore -q "$p"; test $? -eq 1 || { echo "IGNORADO: $p"; exit 1; }
done   # expect: exit 0. check-ignore: 1 = no ignorado (correcto) · 128 = error de uso, y ahi falla
```

Más estas compuertas manuales, cada una revisada una vez antes de lanzar:

- [ ] El bloque Bootstrap de §10 se corrió **una segunda vez** sobre el árbol ya inicializado,
      **salió 0** y no cambió nada que importe: `package.json` sigue listando todas las dependencias
      y el comando siguiente sigue encontrando sus binarios. Esto prueba que la copia guardada de
      `workspace/` aguanta, y que la guardia no falla justo en el caso que guarda.
- [ ] Los comandos `lint`, `jest` y `build` de arriba se corrieron **desde la raíz del proyecto, con
      el bundle presente** en `blueprints/rediseno-landing/`. Las exclusiones de §19.6 son lo que
      impide que las configs del bundle rompan a las del proyecto.
- [ ] Cada fila de la tabla *Cross-artifact value reconciliation* de §19.6 dice `Comparado: sí`.
- [ ] Cada fila de la tabla *Byte-exact artifact reconciliation* de §19.6 dice `Ambos confirmados: sí`.
- [ ] **Paridad de §9.1, prueba de punta a punta, una vez, a mano contra la base real:** abrir `/`,
      hacer clic en "Pedir este" de un producto, confirmar que llega preseleccionado al formulario,
      completar los campos con `comuna = Padre Hurtado`, enviar, y comprobar que aparece el
      `numero_pedido` en pantalla, que WhatsApp abre con el mensaje de 6 líneas, y que
      `select count(*) from "Pedido" where origen = 'web'` **subió exactamente en 1**.
- [ ] Enviar el formulario con la comuna vacía y confirmar que se muestra el error textual de la API
      y que **WhatsApp no se abre**.
- [ ] Recorrido completo con **solo teclado** por el flujo de pedido: cada control alcanzable, foco
      visible en todos, sin trampas de foco, y el campo enfocado nunca tapado por el header sticky.
- [ ] Una pasada con **lector de pantalla** sobre el flujo de pedido, confirmando que el panel de
      resultado se anuncia (`aria-live`) y que la lluvia de gotas **no** se anuncia.
- [ ] Pasada a **200% de zoom** y a **320 px de ancho**: sin scroll horizontal, sin texto cortado, y
      el header a 375 px muestra los dos enlaces y el CTA sin desbordar.
- [ ] Pasada con el sistema en **`prefers-reduced-motion: reduce`**: ni el logo flota ni caen gotas.
- [ ] Cada non-goal de §1 sigue **sin construir** — en particular: sin carrito multi-producto, sin
      migración, sin paquete nuevo (`git diff --stat main -- package.json package-lock.json` no
      muestra cambios).
- [ ] La redirección 308 de `/pedir` responde también en el **dominio de producción**, después del
      deploy.
- [ ] Un rollback de deploy se ejerció una vez a propósito en un preview de Vercel.

**Ninguna advertencia se ignora.** Una advertencia tolerada se vuelve permanente, y la próxima
advertencia de verdad se esconde adentro.

### 20.2 Risk register

| Riesgo | Probabilidad | Impacto | Señal temprana | Mitigación |
|---|---|---|---|---|
| El remapeo de los alias legacy cambia el color de `/admin` y `/chofer` de formas no previstas (`azul-oscuro` pasa de `#1a6ba0` a `#164a63`; `verde-claro` de `#7ec850` a `#97cf6c`) | **Alta** — va a pasar, es el efecto buscado | Bajo | Cualquier pantalla interna se ve más oscura o más teal tras el paso 1 | Es la decisión confirmada: los 39 archivos heredan el color de marca real sin editarlos. El contraste **mejora** (`#1a6ba0` daba 5.75:1 con blanco; `#164a63` da 9.57:1). Si una pantalla interna queda mal, se corrige ahí, no revirtiendo el token |
| La optimización manual del logo no baja de 150 KB sin perder calidad visible | Media | Medio | El comprobador del paso 2 falla, o el logo se ve con bandas | Bajar a PNG paletizado con `tRNS` (el comprobador lo acepta) o reducir el ancho: el hero lo muestra a ~320 px, así que 800 px de ancho sobran. El gate mide bytes, ancho y alfa, así que no se puede "pasar" con un archivo degradado a 200 px |
| Hydration mismatch por las gotas | Baja | Alto — rompe la página en consola y en producción | Warning de hydration en la consola del navegador tras el paso 10 u 11 | El LCG sembrado y el cálculo a nivel de módulo son exactamente la mitigación, y el paso 4 la testea (determinismo, semilla honrada). El paso 9 prohíbe por grep `Math.random` y `useEffect` en `LluviaDeGotas` |
| El formulario nuevo manda un cuerpo que el endpoint congelado rechaza con 400 | Media | Alto — no entra ningún pedido | Tasa de 400 alta en los logs de Vercel tras el deploy | `construirPayloadPedido` está testeado contra el contrato literal de §5, incluyendo la omisión de `email`/`notas` vacíos y el paso verbatim de `comuna`. Además, la compuerta manual de §20.1 hace un pedido real antes de anunciar el cambio |
| El pase de accesibilidad se salta porque no hay comando automático | **Media** | Alto — obligación legal y usuarios excluidos | Nadie marca las casillas de §20.1 | Están escritas como compuertas manuales explícitas y numeradas, no como "revisar accesibilidad". `next lint` con `jsx-a11y` captura la capa automática; el resto es obligatorio antes del lanzamiento |
| Sin tracker de errores, un fallo en producción del formulario pasa inadvertido | Media | Alto | Cero pedidos web durante una semana | Es una carencia previa del proyecto, no de este cambio, y agregarlo sería una dependencia nueva. Queda como el primer ítem de §20.4, y la métrica de §16 ("cero pedidos web en 7 días") es la señal barata mientras tanto |
| El endpoint público sigue sin rate limit y el formulario ahora es más fácil de encontrar | Baja | Medio | Pedidos basura en `/admin` | Riesgo preexistente que este cambio no empeora en naturaleza, solo en exposición. Anotado acá a propósito; mitigarlo es trabajo de otro cambio (§20.4) |
| El builder "arregla" el ancla `#pedido` del paso 7 apuntándola a `/pedir` | Media | Medio — reintroduce la ruta que se retira | Aparece `/pedir` en `SiteHeader.tsx` | El `Do` del paso 7 lo dice explícitamente y su `Verify` tiene un grep que falla si `/pedir` aparece en el header o el footer |

### 20.3 Decision log

| # | Decisión | Alternativa rechazada | Por qué | Se revertiría si |
|---|---|---|---|---|
| 1 | Cero dependencias nuevas | Instalar `lucide-react` para los iconos y Testing Library para testear los componentes | Restricción dura del encargo, y bien fundada: es un rediseño de una landing, no una inversión en tooling. Cada paquete es peso, superficie de suministro y una decisión que alguien tendrá que mantener | El equipo decida invertir en infraestructura de tests de UI; ahí entra Testing Library primero, no los iconos |
| 2 | Escalas 100–900 con los 4 nombres viejos como alias | Renombrar las clases en los 39 archivos que las usan | 175 ediciones en `/admin` y `/chofer`, que están fuera de alcance, para cero beneficio funcional. Los alias hacen que hereden el color de marca real sin tocar una línea | Un pase de diseño futuro apunte a las herramientas internas; ahí conviene migrar a los nombres de escala |
| 3 | Texto blanco solo sobre `verde-700` y `azul-700`/`-800` | Usar `viflomax-verde` en los CTA, como hace el código actual | 2.65:1 reprueba AA por mucho, y §7 exige AA. La paleta aprobada **no cambia**: cambia qué escalón lleva texto encima, que es justamente para lo que existe una escala | Nunca por estética. Solo si el estándar de contraste cambiara |
| 4 | Scrim `bg-black/30` en el hero | Oscurecer las paradas del gradiente hasta que el blanco pase AA | El gradiente `azul-900 → azul-500 → verde-500` es el aprobado por el cliente. El scrim conserva el diseño y sube **todo el texto del hero** de 2.65:1 a 5.03:1 — sin él ni el `<h1>` alcanza el 3:1 del texto grande | El cliente apruebe un gradiente más oscuro; ahí el scrim se saca y se recalculan los ratios |
| 5 | LCG sembrado calculado a nivel de módulo | `Math.random()` dentro de un `useEffect` en el cliente | El `useEffect` "funciona" pero hace que las gotas aparezcan después de la hidratación, con un parpadeo, y obliga a que el componente sea cliente. El LCG mantiene `Cobertura` como Server Component y renderiza igual en ambos lados | La página deje de ser estática |
| 6 | Lógica del pedido extraída a `lib/landing/**` | Todo dentro de `PedidoForm.tsx` | Sin Testing Library, la lógica dentro del componente es **intesteable** en este repo. Extraída, tres decisiones críticas —cuerpo, respuesta, mensaje— quedan cubiertas por Jest | Se instale Testing Library; ahí la extracción sigue siendo buena, solo deja de ser obligatoria |
| 7 | Formulario de un producto a la vez | Conservar el carrito multi-ítem del `OrderForm` viejo | Es el diseño aprobado por el cliente y es el flujo que "Pedir este" implica. El endpoint acepta N ítems, así que volver atrás no requiere tocar el servidor | Los usuarios pidan varios productos por pedido con frecuencia |
| 8 | Cutover en un solo paso, sin canary | Desplegar la landing nueva y retirar `/pedir` en dos entregas | Un sitio de marketing sin cuentas no tiene cohorte a la que exponer el cambio ni estado a medio migrar. Dos entregas dejarían dos caminos de pedido vivos, que es peor | El sitio adquiera usuarios con sesión y estado |
| 9 | Verificar las 13 etiquetas por nombre en vez de contarlas | `git tag -l 'step-*' \| wc -l` igual a 13 | El repo ya trae 16 etiquetas `step-*` de un build anterior: el conteo daría 29 y fallaría siempre por una razón ajena al código | El repo se limpie de etiquetas viejas, cosa que nadie debería hacer |
| 10 | React Context para `productoSeleccionado` | Un query param (`?producto=…`) como usaba `/pedir` | El formulario ahora está en la misma página: un query param forzaría una navegación y perdería el scroll suave al ancla | El estado compartido crezca más allá de un valor |
| 11 | 2 epics para 13 pasos | 3 epics, como sugería el mapa inicial | La regla de conteo de §9 deriva la cantidad de epics del total de pasos: para 13, entre `ceil(13÷9)=2` y `floor(13÷5)=2`. Exactamente 2 es la única división legal, y 3 daría un epic de menos de 5 pasos | El alcance crezca a 15 pasos o más |

### 20.4 What to build next

Los cuatro primeros, en orden, cada uno con su disparador de §1:

1. **Fotos reales de producto.** Disparador: el cliente las entrega. `ProductoImagen.tsx` ya cae al
   placeholder, así que es dejar los archivos en `public/productos/` con los nombres que
   `lib/productos.ts` ya declara — cero código.
2. **Tracker de errores.** Disparador: el primer fallo del formulario en producción que nadie notó.
   Es la carencia más cara de §20.2 y hoy no hay ninguna señal automática.
3. **Rate limit en `/api/pedidos/publico`.** Disparador: el primer lote de pedidos basura en
   `/admin`. Ahora que el formulario es más visible, la exposición sube.
4. **Infraestructura de tests de UI** (Testing Library, y quizá Playwright). Disparador: el equipo
   decida invertir. Convertiría los greps estructurales de los pasos 7 a 13 en tests reales de render
   y permitiría cubrir el flujo de pedido de punta a punta.

---

*Fin del blueprint. El orden de construcción es §9. Se termina cuando §20.1 está en verde.*
