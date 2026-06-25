# LogiCosto — Sistema de Diseño (v3)

> **Estado:** Decisiones confirmadas en sesión de identidad visual.
> **Verificado contra Figma el 2026-06-25** (archivo *LogiCosto-Panel*, fileKey
> `ip38yfasaFYrtSwooyI0ZQ`). El cambio mayor de esta revisión es el logo: el
> isotipo evolucionó del rombo "El Sello" al **monograma "LC" en placa** (ver §1).
> Este documento es la fuente de verdad del sistema de diseño de la plataforma.
> Complementa `especificacion_pdf.md` (diseño del documento) y
> `LogiCosto_Arquitectura_Tecnica.md` (stack técnico).

---

## 1. Logo

### Concepto
**Monograma "LC" en placa** — una placa cuadrada marina con las iniciales **L** y
**C** en blanco, separadas por un divisor vertical. La placa evoca la puerta de un
contenedor y la placa/sello aduanal; el divisor segmenta el monograma como una
identificación de carga. Las iniciales usan letterforms redondeadas (mismo
carácter que el wordmark Outfit) para tensionar contra la rigidez de la placa.

> **Reemplaza** al concepto anterior *"El Sello"* (rombo rotado 45° con nervios de
> contenedor y L en negativo), descartado en la sesión de identidad visual. Ver
> §10 Registro de cambios.

### Isotipo
- Forma base: cuadrado con esquinas redondeadas (`rx` proporcional), no rotado
- Relleno de la placa: marino `#1A2B4A` (Marino-800), con una franja lateral
  izquierda en marino más oscuro que le da profundidad de "canto" de placa
- Monograma: **L** en blanco, **C** en eléctrico `#2E7CF6` (Eléctrico-600)
- Divisor: línea vertical fina centrada que separa L de C
- Trazos redondeados (`stroke-linecap: round`, `stroke-linejoin: round`)

### Lockup horizontal
Isotipo + wordmark en una fila: placa **LC** a la izquierda, **Logi**Costo a la
derecha (ver §2). Es la presentación por defecto en cabecera y sidebar expandido.

### Variante sobre fondo oscuro
- Placa invierte a blanco (`fill: white`)
- L en `#1A2B4A`; C mantiene el eléctrico (`#2E7CF6`) o sube a `#5BA3FF` si el
  fondo es muy oscuro, para preservar contraste
- "Costo" en el wordmark sube a `#5BA3FF` para mantener contraste

### Tamaños mínimos
| Uso | Tamaño de la placa |
|-----|-------------------|
| Display / hero | 96px |
| Navbar / header | 48px (tamaño actual en Figma) |
| Sidebar colapsado | 44px |
| Favicon / app icon | 30–32px (placa + "LC" sin wordmark) |

> **Estado de assets:** en Figma el lockup vive en el grupo `125:90`
> (frame *Panel de inicio*, node `2:2`), aplanado como imagen. Falta exportar el
> isotipo como SVG vectorial en sus variantes — ver §7.

---

## 2. Wordmark

- **Tipografía:** Outfit (Google Fonts)
- **Peso:** 500 (Medium) — mismo peso para ambas palabras
- **Split de color:** `Logi` en `#1A2B4A` · `Costo` en `#2E7CF6`
- **Tracking:** default (sin letter-spacing adicional)
- **Uso mínimo recomendado:** 14px

```html
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&display=swap" rel="stylesheet">
```

```css
.logicosto-wordmark {
  font-family: 'Outfit', sans-serif;
  font-weight: 500;
}
.logicosto-wordmark .logi  { color: #1A2B4A; }
.logicosto-wordmark .costo { color: #2E7CF6; }
```

---

## 3. Tipografía del sistema

Outfit se usa como fuente única del sistema — tanto en el wordmark como en la
interfaz. Escala de pesos:

| Rol | Peso | Uso |
|-----|------|-----|
| Display / título de página | 600 | Encabezados principales |
| Subtítulo / label prominente | 500 | Sección headers, nav |
| Cuerpo | 400 | Texto de interfaz, campos, descripciones |

**Escala de tamaños (base 16px):**
- `xs`: 12px — etiquetas, metadatos, timestamps
- `sm`: 14px — labels de formulario, texto secundario
- `base`: 16px — cuerpo principal
- `lg`: 18px — subtítulos de sección
- `xl`: 22px — títulos de página
- `2xl`: 28px+ — display / hero

---

## 4. Paleta de colores

### Escalas de marca

**Marino** — color principal
| Stop | Hex | Uso |
|------|-----|-----|
| 50 | `#E8EDF5` | Fondos muy sutiles |
| 100 | `#C2CFE3` | Fondos de hover en contexto marino |
| 200 | `#8FAAC8` | Bordes de énfasis secundario |
| 400 | `#4E6F96` | Texto secundario sobre fondo claro |
| 600 | `#2A4470` | Bordes fuertes, texto medio |
| **800** | **`#1A2B4A`** | **Main — fondo de ícono, texto de peso** |
| 900 | `#0E1929` | Texto sobre fondo oscuro |

**Eléctrico** — acento primario
| Stop | Hex | Uso |
|------|-----|-----|
| 50 | `#E6F0FE` | Fondo de categoría Vehículo, estados info |
| 100 | `#B8D4FC` | Bordes info |
| 200 | `#7AACF9` | Bordes de énfasis info |
| 400 | `#5BA3FF` | Acento en dark mode, hover |
| **600** | **`#2E7CF6`** | **Main — "Costo" en wordmark, CTAs primarios** |
| 800 | `#1A5CC4` | Hover de CTA, texto info |
| 900 | `#0D3A8A` | Texto info sobre fondo claro |

**Ámbar** — acento complementario
| Stop | Hex | Uso |
|------|-----|-----|
| 50 | `#FEF5E6` | Fondo de categoría Contenedor, estado Pendiente |
| 100 | `#FDE0A8` | Bordes advertencia |
| 200 | `#FBC660` | Bordes de énfasis advertencia |
| **400** | **`#F5A623`** | **Main — acento cálido, dot de estado Pendiente** |
| 600 | `#D4820A` | Texto advertencia, hover |
| 800 | `#A05E05` | Texto advertencia sobre fondo claro |
| 900 | `#6B3D02` | Texto advertencia en dark mode |

---

### Estados de UI

Los estados del documento tienen dos capas:
- **Estado del modelo** (`status` en DB): `borrador`, `exportada`, `finalizada`
- **Etiqueta de UI**: lo que ve el usuario — incluye `Vencida`, que es una condición derivada de `exportada` cuando `hoy > vencimiento_parqueo`

| Etiqueta UI | Estado DB | Color | bg | text | border |
|-------------|-----------|-------|----|------|--------|
| Borrador | `borrador` | Gris | `#F5F5F5` | `#555555` | `#D1D5DB` |
| Pendiente | `exportada` | Ámbar | `#FFFBEB` | `#A05E05` | `#FBC660` |
| Aprobado | `finalizada` | Verde | `#F0FDF4` | `#15803D` | `#86EFAC` |
| Vencida | `exportada` + fecha pasada | Rojo | `#FEF2F2` | `#B91C1C` | `#FCA5A5` |

> **Nota de implementación:** `Vencida` no es un valor del enum `status`.
> Se deriva en tiempo real: `status = 'exportada' AND vencimiento_parqueo < CURRENT_DATE`.
> En la UI, reemplaza visualmente la pill de "Pendiente" cuando la condición se cumple.

```css
/* Tokens de estado — ejemplo en CSS */
--status-borrador-bg:     #F5F5F5;
--status-borrador-text:   #555555;
--status-borrador-border: #D1D5DB;
--status-borrador-dot:    #9CA3AF;

--status-pendiente-bg:     #FFFBEB;
--status-pendiente-text:   #A05E05;
--status-pendiente-border: #FBC660;
--status-pendiente-dot:    #F5A623;

--status-aprobado-bg:     #F0FDF4;
--status-aprobado-text:   #15803D;
--status-aprobado-border: #86EFAC;
--status-aprobado-dot:    #16A34A;

--status-vencida-bg:     #FEF2F2;
--status-vencida-text:   #B91C1C;
--status-vencida-border: #FCA5A5;
--status-vencida-dot:    #DC2626;
```

---

### Categorías de documento

| Tipo | Color | bg | text | dot |
|------|-------|----|------|-----|
| Vehículo | Eléctrico | `#E6F0FE` | `#1A5CC4` | `#2E7CF6` |
| Contenedor | Ámbar | `#FEF5E6` | `#A05E05` | `#F5A623` |

---

### Colores funcionales del documento PDF
*(Heredados de la especificación congelada — no modificar)*
| Nombre | Hex | Uso |
|--------|-----|-----|
| Header tabla | `#1F4E78` | Encabezado CONCEPTO/MONTO |
| Banner vencimiento fondo | `#FFE066` | Banner "FECHA DE VENCIMIENTO DE PARQUEO" |
| Banner vencimiento borde/texto | `#C0102E` | Borde 2px y texto del banner |
| Total fondo | `#FFC7CE` | Fila TOTAL |

---

### Neutrales de interfaz
Usar variables CSS del sistema (auto dark mode):
- `--color-background-primary` — fondo de cards y formularios
- `--color-background-secondary` — fondo de página
- `--color-text-primary` — texto principal
- `--color-text-secondary` — texto secundario / labels
- `--color-border-tertiary` — bordes por defecto

---

## 5. Escala de grises de wireframe

Los wireframes de baja fidelidad en Figma (frame *Panel de inicio*, node `2:2`)
usan una escala de **6 grises** en vez de la paleta de marca. Sirven para definir
jerarquía y layout antes de colorizar. Regla: **más oscuro = más jerarquía**.

| Token | Hex | Uso |
|-------|-----|-----|
| **G0** | `#FFFFFF` | Fondo de página |
| **G1** | `#F1F1F2` | Relleno más claro: filas zebra de tabla, campo buscador |
| **G2** | `#E2E2E5` | Superficies: cabecera, sidebar, header de tabla, botón secundario, cards KPI |
| **G3** | `#C9C9CE` | Bordes, divisores, placeholders de logo/avatar |
| **G4** | `#9A9AA2` | Nav inactivo, barras de texto/label placeholder |
| **G5** | `#5C5C63` | Énfasis: botón primario, nav activo (texto/ícono en blanco encima) |

### Capa de tokens (Figma Variables)
Iniciada el 2026-06-24 — colección **`Tokens`** (`VariableCollectionId:120:2`):
- **`border/control`** = `#767680` (entre G4 y G5), scope `STROKE_COLOR` — borde
  unificado de **todos** los controles con outline (inputs, dropdowns, chips,
  buscador de conceptos, acordeón, caja de monto, botón atrás). Pasa contraste ≥3:1.
- Radio de controles unificado a **8px**. Divisores en G3; íconos/chevrons
  suavizados a G5 (no negro puro).
- **Pendiente:** migrar G0–G5 a Variables para completar la capa de tokens, y
  reemplazar los grises por la paleta de marca al colorizar (ver §7).

---

## 6. Panel de inicio (estado realizado en Figma)

El dashboard principal ya está maquetado en Figma con el lockup de marca aplicado;
el resto sigue en escala de grises (§5) a la espera de colorización.

**Layout (1440×1024):**
- **Cabecera** (alto 88px) — lockup **LC LogiCosto** a la izquierda; íconos de
  mensajes y notificaciones a la derecha
- **Sidebar** izquierdo — navegación agrupada en **PRINCIPAL** (Inicio · Nueva
  factura · Historial), **GESTIÓN** (Importadores · Conceptos frecuentes ·
  Respaldo · Auditoría), **SISTEMA** (Ajustes · Ayuda); al pie, tarjeta de usuario
  (avatar + nombre + rol) y *Cerrar sesión* (ver IA del menú en notas de proyecto)
- **Barra de acciones** — buscador ancho ("Buscar factura, importador o chasis…")
  + botones **+ Agregar** (primario) e **Importar** (secundario)
- **Tarjetas KPI** — fila de 4: *Pendientes · Aprobadas · Borradores · Vencidas*,
  cada una con conteo grande y enlace "Ver … →"; *Vencidas* lleva acento de borde
  izquierdo
- **Sección Recientes** — leyenda de Tipo (Vehículo / Contenedor con íconos) +
  tabla con columnas **Importador · Tipo · Identificador · Vencimiento · Estado ·
  Creación · Total** y menú de acciones por fila; filas zebra

**Pills de estado en la tabla:** *Borrador · Pendiente · Aprobada · Vencida*
(Vencida en relleno sólido). Actualmente monocromas — **pendiente** mapearlas a
los tokens de estado de §4.

---

## 7. Iconografía

**Set confirmado: Lucide** — elegido por alineación con el stack Next.js
(`lucide-react`) y por su estética geométrica de trazo uniforme, coherente con
la personalidad "geométrico y construido" (§8).

**Convenciones:**
- Grid base 24×24, stroke 2px, `stroke-linecap: round` / `stroke-linejoin: round`
- Monocromos — se recolorean con los tokens de marca (no usar variantes solid)
- En Figma: insertar como **componentes** en una sección "Iconos" e instanciar;
  normalizar el frame a 24×24 aunque la fuente venga con otro grid
- Excepción: **WhatsApp** no existe en Lucide (logo de marca) → usar el SVG
  oficial por separado

**Inventario de alta fidelidad** (≈40 iconos, por área):

| Área | Iconos (nombre Lucide) |
|------|------------------------|
| Sidebar | `layout-dashboard`, `file-plus`, `history`, `building-2`, `list-checks`, `file-spreadsheet`, `shield-check`, `settings`, `circle-help`, `log-out`, `panel-left-close` |
| Header | `search`, `bell`, `circle-user`, `chevron-down` |
| Nueva factura | `check`, `container`, `truck`, `copy`, `arrow-left`, `check-circle`, `plus`, `x`, `dollar-sign` |
| Historial | `arrow-down`, `chevrons-up-down`, `list-filter`, `ellipsis-vertical`, `external-link`, `printer`, `file-text`, `git-branch`, `calendar-clock`, `trash-2` |
| Versiones | `git-commit`, `circle`, `undo-2` |
| Estados | `pencil-line` (Borrador) · `clock` (Pendiente) · `badge-check` (Aprobada) · `alert-triangle` (Vencida) |
| Exportar | `file-down`, `download`, `printer` + SVG de WhatsApp (externo) |
| Login | `mail`, `lock`, `eye`, `eye-off` |

**Estado en Figma (realizado el 2026-06-25):** los **48 iconos** (47 Lucide +
WhatsApp) viven como **componentes** dentro de la sección **"Iconos"** (`165:51`)
del archivo `LogiCosto-Panel`, fondo transparente y nombrados con su slug. El
color está **bindeado al token `icon/default`** (no negro fijo) — stroke en los
Lucide, fill en `whatsapp`. Dos tokens nuevos en la colección `Tokens`:
- **`icon/default`** = `#1A2B4A` (marino 800), scope `STROKE_COLOR` + `SHAPE_FILL` — color base de iconos
- **`icon/accent`** = `#2E7CF6` (eléctrico 600), scope `STROKE_COLOR` — override por instancia para acentos

> `whatsapp` usa marino por defecto para integrarse al set. Para el verde de
> marca, override del fill de la instancia a `#25D366` (o crear `icon/whatsapp`).

---

## 8. Personalidad visual

- **Geométrico y construido** — formas limpias, decisiones explícitas
- **Abstracto sobre literal** — la marca transmite eficiencia y control, no ilustra un contenedor
- **Tono Wave** — moderno, más ligero que enterprise, serio sin ser pesado
- **Tensión deliberada** — nervios rígidos + L redondeada; marino denso + eléctrico limpio

---

## 9. Lo que esta identidad NO hace

- No representa a LM Aduanas ni a ninguna gestoría específica — es neutral y multi-tenant
- No usa paleta femenina ni corporativa genérica
- No ilustra literalmente puertos, camiones ni sellos físicos

---

## 10. Pendientes

- [ ] Exportar SVG del isotipo **LC** en sus variantes (light, dark, solo placa, lockup horizontal) — hoy vive aplanado como imagen en Figma (`125:90`)
- [ ] Confirmar si Outfit se usará también en los documentos PDF o solo en la interfaz
- [ ] Definir tokens de color en `tailwind.config.ts` extendiendo la paleta base — **nota:** el config actual aún tiene placeholders de la Fase 0 (`brand.primary #1A237E`, `brand.accent #FFD600`) que NO corresponden a la paleta del sistema (`#1A2B4A` / `#2E7CF6`)
- [ ] Migrar la escala G0–G5 a Figma Variables y completar la capa de tokens (§5)
- [x] ~~Insertar el set Lucide como componentes en Figma e integrar el SVG de WhatsApp~~ — hecho el 2026-06-25 (48 componentes en sección "Iconos", §7)
- [ ] Colorizar el Panel de inicio (§6): mapear pills de estado a §4 y reemplazar grises por la paleta de marca

---

## 11. Registro de cambios

- **v3 (2026-06-25)** — Verificación contra Figma (*LogiCosto-Panel*). **Logo:** el
  isotipo cambió del rombo *"El Sello"* al **monograma "LC" en placa** (§1; rombo
  descartado). Se documentó la escala de grises de wireframe G0–G5 y el token
  `border/control` (§5), y el estado realizado del Panel de inicio (§6).
- **v2** — Decisiones confirmadas en sesión de identidad visual (paleta, tipografía
  Outfit, estados de UI, categorías de documento).
