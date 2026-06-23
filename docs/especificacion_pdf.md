# ESPECIFICACIÓN TÉCNICA — Documento PDF de Gastos

Este documento es la referencia de diseño congelada para el documento PDF que
genera la web app de facturación. Cualquier cambio a esta estructura debe ser
confirmado explícitamente por el cliente antes de implementarse.

> **v3 — diseño de marca aprobado por el cliente (LM Aduanas).** Sobre la base
> de v2 (dos tipos de factura, jerarquía máxima en vencimiento/nota, `RD$` por
> línea), se aplica la identidad de marca real: dirección **"Marfil"**
> (champagne `#C9A24B` + carbón `#2C2A26`, tipografía sans), logo real de LM
> Aduanas, y los ajustes solicitados por el cliente sobre la propuesta:
> ícono de advertencia más grande y llamativo, fila TOTAL e IMPORTADOR/RNC en
> blanco, etiqueta de vencimiento completa ("...DE PARQUEO") restaurada como
> banner amarillo/rojo a lo ancho, cabecera CONCEPTO/MONTO en blanco con texto
> negro más grande, y encabezado ajustado para reflejar que la gestoría hace
> **importación y exportación** de vehículos.

---

## 1. Origen

Basado en `HOJA_DE_GASTOS_DE_TOYOTA_5TDXBRCH0NS557624.docx`, con los cambios
solicitados por el cliente sobre la primera versión del Excel dinámico:

1. La tabla de gastos pasa de 4 columnas (QTY | DESCRIPTION | PRICE | AMOUNT) a
   2 columnas (CONCEPTO | MONTO).
2. Importador y RNC se unifican en una sola fila.
3. La fecha de vencimiento de parqueo se resalta visualmente de forma fuerte.
4. **(v2)** La nota legal de revisión también se resalta de forma fuerte (antes
   era letra chica al pie).
5. **(v2)** Se introducen dos tipos de documento con bloques de datos distintos.

---

## 2. Estructura del documento, de arriba a abajo

### 2.1 Encabezado superior
- Izquierda: **logo real de LM Aduanas** (negro + dorado metálico, sobre
  lienzo claro), seguido de la línea de marca: "Gestoría de importación &
  exportación vehicular" (ajustado en v3 — el cliente también exporta
  vehículos, no solo importa).
- Filete dorado fino debajo del encabezado, separando el bloque de marca del
  cuerpo del documento.
- Derecha: `Date: DD/MM/AAAA` (fecha de emisión del documento, no de
  vencimiento) y `Pag. 1 of 1`, alineados a la derecha.
- Tamaño de fuente: 10-10.5pt.

### 2.2 Fila Importador / RNC (v3 — sobre fondo blanco)
- Una sola fila/línea con dos segmentos, **ambos sobre fondo blanco** (en v3
  el cliente pidió quitar el bloque de color que tenía el segmento del RNC):
  - Izquierda: etiqueta "IMPORTADOR" en bold (color de marca) seguida del
    nombre/razón social.
  - Derecha: `[RNC] xxxxxxxxx`, separado por un borde fino, mismo fondo blanco.
- Fuente 10-13.5pt según elemento, borde fino de 1px alrededor de toda la fila.
- Común a ambos tipos de documento.

### 2.3 Bloque de datos según TIPO de documento

El documento tiene dos variantes. El bloque entre la fila de importador y la
fila de vencimiento cambia según el tipo seleccionado:

**Tipo A — Vehículo**
- Marca
- Modelo
- Año
- Chasis
- Color (opcional, NO se muestra en el PDF — solo se captura en formulario)

**Tipo B — Contenedor**
- Número de BL
- Número de Contenedor

Formato: etiquetas en bold, valores en texto plano, fuente 10pt, bordes finos.
El resto del documento (vencimiento, tabla de gastos, total, nota) es idéntico
para ambos tipos.

### 2.4 Fila Vencimiento (ELEMENTO CRÍTICO #1 — máximo contraste visual, v3)

> **Cambio v3:** la antigua banda de título independiente ("FECHA DE
> VENCIMIENTO DE PARQUEO" en azul claro) se elimina por redundante y se
> **fusiona con la fila de la fecha**: ahora es un solo banner a lo ancho del
> documento que lleva la etiqueta completa y el valor juntos.

- Banner único, ancho completo, fondo **amarillo `#FFE066`**, borde de 2px en
  **rojo `#C0102E`**, esquinas redondeadas (~8px).
- Etiqueta, en la parte superior del banner: **"FECHA DE VENCIMIENTO DE
  PARQUEO"** en mayúscula, texto rojo `#C0102E`, bold, ~13pt.
- Valor de la fecha, alineado a la derecha debajo de la etiqueta (**ingresado
  manualmente** por el agente — no se calcula): texto rojo `#C0102E`, bold,
  ~24-28pt, tipografía de display.
- Sombra suave en tono rojo para dar profundidad al banner.
- Junto con la nota legal (2.8), es el elemento más llamativo del documento,
  por encima incluso del color de marca. Motivo confirmado por el cliente:
  **los importadores no revisan estos dos datos y luego reclaman** — deben
  tener énfasis máximo.

### 2.5 Tabla de gastos (v3)
- Encabezados: **"CONCEPTO"** (alineado a la izquierda, ~2/3 del ancho) y
  **"MONTO"** (alineado a la derecha, ~1/3 del ancho).
- Fondo de encabezados: **blanco**, texto **negro bold, 13pt** (subido de
  11pt — pedido explícito del cliente: "agrégale un número al tamaño de las
  letras"), separado del cuerpo por un borde inferior de 2px en el color de
  marca.
- Filas de datos: una por concepto, SIN columnas de cantidad ni precio
  unitario — solo el nombre del concepto (en mayúsculas, ej. "IMPUESTOS",
  "SER. ADUANEROS") y el monto formateado como moneda (`RD$#,##0.00`).
- Número de filas: **dinámico**, según los conceptos que agregue el usuario.
- Bordes finos en todas las celdas.

### 2.6 Fila Total (v3 — cambia decisión previa, reconfirmada con el cliente)

> **Cambio v3 vs. v2:** la fila Total estaba confirmada en rosado `#FFC7CE`
> precisamente para distinguirse del resto de la tabla a simple vista. En la
> revisión de la propuesta de marca, el cliente pidió explícitamente dejarla
> en blanco ("en el renglón del total lo puede dejar en blanco"). Se
> reconfirmó con el cliente y queda **aprobado**: el rosado queda obsoleto
> para este renglón.

- Etiqueta **"TOTAL RD$"** alineada a la derecha, fusionada sobre el espacio de
  la columna CONCEPTO.
- Valor del total alineado a la derecha en la columna MONTO.
- Fondo: **blanco**, texto **negro bold**, 14-15.5pt (subido respecto a v2
  para compensar la pérdida de contraste de color: el peso tipográfico y un
  borde superior de 2px en el color de marca son ahora lo que distingue esta
  fila del resto de la tabla).
- El total es la SUMA automática de todos los montos (nunca un valor fijo).

### 2.7 Nota legal final (ELEMENTO CRÍTICO #2 — v3: ícono ampliado)

> **Cambio confirmado en v2:** la nota deja de ser letra chica (9pt cursiva al
> pie) y pasa a ser un **bloque de advertencia prominente**, segundo en
> jerarquía visual junto con la fila de vencimiento.
>
> **Cambio v3:** el cliente pidió que el ícono de advertencia (⚠️) sea más
> grande y más llamativo — antes se veía "muy pequeño".

- Presentación como **recuadro de advertencia**: fondo amarillo de alerta
  `#FBF1DB`/`#FBEFD0` (tono champagne claro), borde grueso de 2px en el color
  de marca con acento izquierdo de 6px, texto bold, ≥12pt.
- **Ícono de advertencia (triángulo ⚠️):** 34px (subido desde ~20px),
  relleno **rojo `#C0102E`** con borde **amarillo `#FFE066`**, símbolo interior
  en amarillo — el elemento más llamativo del bloque, a la izquierda del
  texto, alineado verticalmente al centro.
- Texto exacto (confirmado, sin cambios):
  > "NOTA: FAVOR DE REVISAR SU VEHICULO EN EL PRINTER ANTES DE REALIZAR EL
  > PAGO YA QUE NO NOS HACEMOS RESPONSABLE DE CAMBIOS FUTUROS"
- Debe quedar claramente visible sin necesidad de buscarla.

---

## 3. Paleta de colores — diseño "Marfil" (APROBADA por el cliente)

| Elemento | Color | Hex |
|---|---|---|
| Color de marca (encabezado, etiquetas, bordes de acento) | Champagne dorado | `#C9A24B` |
| Color de marca secundario (texto sobre claro, tag de marca) | Carbón | `#2C2A26` |
| Tinte de marca (fondos sutiles, ej. fila importador si se requiere) | Champagne claro | `#F4ECDA` |
| Lienzo del documento | Marfil/blanco cálido | `#FCFAF6` |
| Banner de vencimiento — fondo | Amarillo de alerta | `#FFE066` |
| Banner de vencimiento — borde y texto | Rojo de alerta | `#C0102E` |
| Ícono de advertencia (nota legal) — relleno | Rojo de alerta | `#C0102E` |
| Ícono de advertencia (nota legal) — borde/símbolo | Amarillo de alerta | `#FFE066` |
| Nota legal — fondo del recuadro | Champagne claro | `#FBF1DB` |
| Fila de total — fondo | Blanco | `#FFFFFF` |
| Fila de total — texto | Negro | `#000000` |
| Cabecera CONCEPTO/MONTO — fondo | Blanco | `#FFFFFF` |
| Cabecera CONCEPTO/MONTO — texto | Negro | `#000000` |
| Fila Importador/RNC — fondo | Blanco | `#FFFFFF` |
| Texto normal | Carbón | `#2A2620` |

> **Identidad de marca:** logo real de LM Aduanas (negro + dorado metálico)
> entregado y embebido en el encabezado. Dirección aprobada: **"Marfil"**
> (champagne + carbón, tipografía sans, aire generoso) de entre tres
> propuestas presentadas (Lingote, Marfil, Ónix). Las reglas de jerarquía se
> mantienen: vencimiento y nota como elementos dominantes (rojo/amarillo de
> alerta, por encima del color de marca), total y cabecera de tabla en blanco
> con texto negro bold para legibilidad máxima.
>
> **Pendiente:** versión del logo con fondo transparente (para posibles
> variantes de encabezado oscuro a futuro) y la variante visual del tipo
> **Contenedor** con estos mismos ajustes.

---

## 4. Datos de entrada necesarios (campos del formulario)

### Comunes a ambos tipos
- Tipo de documento: **Vehículo** o **Contenedor**
- Importador: nombre / razón social + RNC
  - Seleccionable desde **preset** (importadores fijos guardados, buscables por
    nombre en dropdown) o ingreso manual para importadores ocasionales.
- Fecha de vencimiento de parqueo (**manual**)
- Gastos (lista dinámica)

### Específicos — Tipo Vehículo
- Marca
- Modelo
- Año
- Chasis
- Color (opcional, no aparece en el PDF)

### Específicos — Tipo Contenedor
- Número de BL
- Número de Contenedor

### Gastos (lista dinámica)
- Cada ítem: `{ concepto: string, monto: number }`
- Agregar/eliminar libremente.
- Sugerencias al escribir (lista inicial + histórico de la gestoría), pero
  campo siempre de texto libre. Lista inicial: Impuestos, Servicios Aduaneros,
  Parqueo, Honorarios, Factura, Registración, Dealer.

### Calculado automáticamente
- Total = suma de todos los montos de la lista de gastos.

---

## 5. Reglas de formato numérico y de texto

- Moneda: `RD$#,##0.00` en **cada línea** y en el total (confirmado con cliente
  en v2; antes se evaluaba `$`).
- Fechas: formato `DD/MM/AAAA`.
- Nombres de conceptos: se muestran en MAYÚSCULAS en el PDF, sin importar cómo
  los escriba el usuario.
- Nombres de importador y datos del vehículo: respetar la capitalización que
  ingrese el usuario.

---

## 6. Versionado e historial (ver doc de arquitectura para el detalle)

> La antigua sección 6 ("persistencia del lado del cliente / window.storage")
> queda **obsoleta**. La persistencia es backend (Supabase) y el ciclo de
> documento ya no usa aprobación online. Resumen relevante para el diseño del
> documento:

- Cada documento tiene un **indicador de versión** visible. Una nueva versión
  se genera **cuando se hace un cambio/revisión** sobre un documento ya
  exportado (no en cada exportación).
- El PDF se **renderiza bajo demanda** desde los datos de la versión vigente;
  no se almacena el archivo. Por eso un cambio de diseño se propaga también a
  las facturas históricas (que se importan **solo con sus datos**).
- Estados del documento: `borrador` → `exportada` → `finalizada` (la última
  versión es la que queda como factura finalizada). En la interfaz (panel e
  historial) se muestran con estas etiquetas:
  - **Borrador** ← `borrador` (aún en edición, sin exportar).
  - **Pendiente** ← `exportada` (enviada al importador, a la espera de pago).
  - **Aprobada** ← `finalizada` (pagada/cerrada; versión final).
  - **Vencida** ← `exportada` cuya fecha de vencimiento de parqueo ya pasó
    (`hoy > vencimiento`). Es una **condición derivada** de `exportada`, no un
    cuarto estado del ciclo.
- El historial conserva, como mínimo: fecha de generación, tipo, importador,
  RNC, datos del vehículo o del contenedor según tipo, fecha de vencimiento,
  lista de conceptos y montos, total, versión y estado.

---

## 7. Preguntas abiertas

Todas las preguntas de v1 y v2 quedaron resueltas:

- ✅ Nota legal: se mantiene el texto exacto, elevada en jerarquía, ícono
  ampliado en v3.
- ✅ Símbolo de moneda: `RD$` en cada línea.
- ✅ Logo/encabezado de gestoría: logo real entregado y embebido.
- ✅ Color del vehículo: se captura, **no** aparece en el PDF.
- ✅ "Duplicar"/presets: presets de importador confirmados (sección 4).
- ✅ Propuestas de rediseño del PDF: **dirección "Marfil" aprobada** por el
  cliente, con los ajustes de la sección 2 incorporados.

**Pendientes operativos (no de diseño):**
- ⏳ Logo de LM Aduanas con fondo transparente (variantes de encabezado oscuro
  a futuro; no bloquea v1).
- ⏳ Adaptar esta especificación a la variante visual del tipo **Contenedor**
  (mismo tratamiento, bloque de datos BL/Nº de contenedor en vez de
  marca/modelo/año/chasis — ver sección 2.3).
