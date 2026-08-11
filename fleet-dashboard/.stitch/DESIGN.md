# Design System: Vibrant Fleet Dashboard
**Project ID:** 4153089219629023253

## 0. Relación con Viflomax

Este es el registro **Fleet Ops / Admin** — la herramienta que usa el equipo de despacho para monitorear la flota de reparto en tiempo real desde una oficina. Es deliberadamente distinto del `DESIGN.md` raíz de Viflomax, que rige la PWA de choferes en campo (verde/azul apagado, sin gradientes, alto contraste para sol directo).

Aquí el usuario está sentado frente a una pantalla grande, monitoreando múltiples vehículos a la vez: la prioridad es **densidad de información con jerarquía visual clara**, no legibilidad bajo sol. Por eso este sistema permite gradientes, glassmorphism y una paleta más saturada — herramientas que el DESIGN.md raíz prohíbe para el contexto de campo, pero que aquí comunican estado en vivo (vehículo en ruta, alerta, entrega completada) de un vistazo.

## 1. Visual Theme & Atmosphere

**Creative North Star:** "Torre de control." La flota se siente viva: un mapa con marcadores pulsantes, tarjetas KPI con gradientes profundos, y glassmorphism en los overlays flotantes evocan un centro de operaciones moderno, no una hoja de cálculo. El azul profundo transmite autoridad operativa; el verde esmeralda y el ámbar dorado funcionan como semáforo de estado (en ruta / atención / completado) sin depender solo de texto.

**Density:** Media-alta — tarjetas KPI compactas, tabla de manifiesto densa, sidebar de navegación siempre visible.

**Mood:** Confiado, en tiempo real, ligeramente premium (gradientes + blur), nunca ruidoso — el color siempre tiene un rol funcional.

## 2. Color Palette & Roles

| Nombre | Hex | Rol |
|---|---|---|
| Azul Profundo (Primary) | `#002f6c` | Navegación activa, CTAs primarios, gradiente de tarjeta hero |
| Azul Contenedor (Primary Container) | `#224583` | Fin del gradiente primario, fondos de íconos activos |
| Azul Claro (On-Primary) | `#aec6ff` | Texto/íconos sobre fondo primario oscuro |
| Verde Esmeralda (Secondary) | `#006d43` | Estado "en ruta" / positivo, marcador de mapa activo, barra de progreso principal |
| Verde Profundo (Secondary Dark) | `#005232` | Texto sobre contenedor secundario |
| Verde Menta (Secondary Container) | `#75f8b3` / `#78fbb6` / `#59de9b` | Fondos de barras/gráficos de tendencia positiva |
| Ámbar Dorado (Tertiary) | `#fbbc00` | Estado "atención"/idle, acentos secundarios de KPI |
| Ámbar Oscuro (Tertiary Dark) | `#c39100` | Texto sobre contenedor terciario |
| Ámbar Suave (Tertiary Dim) | `#ffdfa0` | Fondos de badges de advertencia |
| Rojo Error | `#ba1a1a` | Marcador de mapa "alerta"/retraso, badges de error |
| Rojo Contenedor | `#ffdad6` | Fondo de badge de error, `#93000a` como texto sobre él |
| Superficie Base | `#fbf9f8` | Fondo general de la app |
| Superficie Contenedor Bajo | `#f5f3f3` | Fondo de sidebar, inputs |
| Superficie Contenedor | `#eae8e7` / `#efeded` | Fondos de sección secundaria |
| Superficie Más Baja | `#ffffff` | Cards, tabla, modales |
| Texto Principal (On-Surface) | `#1b1c1c` | Cuerpo de texto |
| Texto sobre Fondo Azul | `#001b44` / `#001a42` | Headings sobre superficies claras con tinte azul |

## 3. Typography Rules

- **Headlines (h1, h2, h3):** Manrope — geométrica, autoritativa, para títulos de sección y valores de KPI grandes.
- **Body / UI / Datos tabulares:** Inter — alta legibilidad para texto denso (tabla de manifiesto, labels, metadata).
- **Jerarquía:** Los valores de KPI usan Manrope en tamaño grande (peso 600-700) sin contenedor propio, apoyados por una label pequeña en Inter uppercase.

## 4. Component Stylings

* **Buttons:** `rounded-xl`. Primary = fondo `#002f6c` sólido, texto blanco, peso bold. Secondary = fondo `surface-container-low` (`#f5f3f3`), texto `on-surface-variant`.
* **Cards/Containers:** `rounded-xl` (12px), fondo `#ffffff` (surface-container-lowest), `shadow-sm` en reposo. Las tarjetas hero/CTA usan gradiente `from-primary to-primary-container` con texto blanco y un blur decorativo (`bg-white/5 blur-3xl`) en una esquina.
* **Inputs/Búsqueda:** `rounded-full` (pill), fondo `surface-container-low`, sin borde, ring azul al 20% en focus.
* **Badges/Chips:** `rounded-full`, texto extrabold uppercase pequeño (10px), color de fondo = contenedor semántico (verde/ámbar/rojo según estado).
* **Avatares:** `rounded-full`, borde 2px `primary-container`.
* **Mapa en vivo:** overlay flotante con `backdrop-blur-md`, fondo `surface/80`, borde `border-white/20`, `shadow-lg`. Marcadores como círculos `rounded-full` de 24px con borde blanco 2px y `shadow-lg`: azul = en ruta, verde = completado, rojo = alerta. Un punto verde `animate-pulse` indica actualización en vivo.
* **Barras de progreso:** `rounded-full`, track `bg-white/10`, fill en el color semántico correspondiente (verde = en camino, ámbar dim = idle).
* **Tabla (Fleet Driver Manifest):** fondo blanco, `rounded-xl`, `shadow-sm`, filas con avatar + badge de estado; sin líneas divisorias duras, se apoya en padding generoso.

## 5. Layout Principles

- Sidebar de navegación fija a la izquierda, íconos + label, ítem activo en `rounded-xl` con fondo `primary-container`.
- Contenido principal en grid: fila de tarjetas KPI ("Network Pulse") + mapa en vivo arriba, tabla de manifiesto de choferes abajo a ancho completo.
- Espaciado generoso entre secciones (24px+), padding interno de card 24px (`p-6`).
- Gradientes y blur reservados para elementos "flotantes" o de alto impacto (hero KPI, overlay de mapa) — el resto de la UI permanece plana para no competir visualmente.
