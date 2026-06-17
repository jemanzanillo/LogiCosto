# ESPECIFICACIÓN TÉCNICA — Documento PDF de Gastos

Este documento es la referencia de diseño congelada para el documento PDF que
genera la web app de facturación. Cualquier cambio a esta estructura debe ser
confirmado explícitamente por el cliente antes de implementarse.

---

## 1. Origen

Basado en `HOJA_DE_GASTOS_DE_TOYOTA_5TDXBRCH0NS557624.docx`, con 3 cambios
solicitados por el cliente sobre la primera versión del Excel dinámico:

1. La tabla de gastos pasa de 4 columnas (QTY | DESCRIPTION | PRICE | AMOUNT) a
   2 columnas (CONCEPTO | MONTO).
2. Importador y RNC se unifican en una sola fila.
3. La fecha de vencimiento de parqueo se resalta visualmente de forma fuerte.

---

## 2. Estructura del documento, de arriba a abajo

### 2.1 Encabezado superior
- Izquierda: `Date: DD/MM/AAAA` (fecha de emisión del documento, no de
  vencimiento)
- Derecha: `Pag. 1 of 1`
- Tamaño de fuente: 10pt

### 2.2 Título de sección
- Texto: **"FECHA DE VENCIMIENTO DE PARQUEO"**
- Centrado, fondo azul claro `#D9E1F2`, fuente 12pt bold
- Ocupa el ancho completo (equivalente a colspan de las columnas de datos)

### 2.3 Fila Importador / RNC
- Una sola fila/línea con dos segmentos:
  - Izquierda: nombre del importador (texto plano, sin etiqueta visible o con
    etiqueta "IMPORTADOR" en bold seguida del valor)
  - Derecha: `[RNC] xxxxxxxxx`
- Fuente 10pt, bordes finos alrededor de cada celda de valor

### 2.4 Fila Vencimiento (ELEMENTO CRÍTICO — máximo contraste visual)
- Etiqueta "VENCIMIENTO" en celda separada
- Valor de la fecha en celda fusionada al lado
- **Fondo: rojo brillante `#C00000`**
- **Texto: blanco, bold, 12pt** (la etiqueta puede ir en 10pt, el valor en 12pt)
- Altura de fila aumentada (~25px / equivalente) respecto al resto del
  documento
- Bordes de grosor medio (`medium`), no finos
- Esta es la fila que el cliente pidió explícitamente "resaltar más" — debe
  ser lo más llamativo del documento después del total

### 2.5 Tabla de gastos
- Encabezados: **"CONCEPTO"** (alineado a la izquierda, ocupa ~2/3 del ancho)
  y **"MONTO"** (alineado a la derecha, ~1/3 del ancho)
- Fondo de encabezados: azul `#1F4E78`, texto blanco bold, 10pt
- Filas de datos: una por concepto, SIN columnas de cantidad ni precio
  unitario — solo el nombre del concepto (en mayúsculas, ej. "IMPUESTOS",
  "SER. ADUANEROS") y el monto formateado como moneda (`$#,##0.00`)
- Número de filas: **dinámico**, determinado por los conceptos que el usuario
  agregue en el formulario (no hay un mínimo o máximo fijo más allá de lo
  razonable para que el documento quepa en una página)
- Bordes finos en todas las celdas

### 2.6 Fila Total
- Etiqueta **"TOTAL RD$"** alineada a la derecha, fusionada sobre el espacio de
  la columna CONCEPTO
- Valor del total alineado a la derecha en la columna MONTO
- Fondo: rosa `#FFC7CE`, texto blanco bold, 11-12pt
- El total es la SUMA de todos los montos de la tabla de gastos (cálculo
  automático, nunca un valor fijo)

### 2.7 Nota legal final
- Texto en cursiva, 9pt, alineado a la izquierda, con ajuste de línea
  (wrap text)
- Contenido (verificar con el cliente si se mantiene igual o se actualiza):
  > "NOTA: FAVOR DE REVISAR SU VEHICULO EN EL PRINTER ANTES DE REALIZAR EL
  > PAGO YA QUE NO NOS HACEMOS RESPONSABLE DE CAMBIOS FUTUROS"

---

## 3. Paleta de colores de referencia

| Elemento | Color | Hex |
|---|---|---|
| Encabezado tabla (CONCEPTO/MONTO) | Azul oscuro | `#1F4E78` |
| Título de sección | Azul claro | `#D9E1F2` |
| Fila de vencimiento | Rojo brillante | `#C00000` |
| Fila de total | Rosa | `#FFC7CE` |
| Texto sobre fondos oscuros | Blanco | `#FFFFFF` |
| Texto normal | Negro | `#000000` |
| Inputs editables (en formularios/Excel) | Amarillo | `#FFFFCC` |

---

## 4. Datos de entrada necesarios (campos del formulario)

### Datos del importador
- Nombre / razón social del importador
- RNC

### Datos del vehículo
- Marca y modelo
- Año
- Color (opcional, ver si el cliente lo pide en el PDF final — en la versión
  Excel aparecía como parte de la descripción del vehículo pero se simplificó)
- Número de chasis
- Fecha de vencimiento de parqueo

### Gastos (lista dinámica)
- Cada ítem: `{ concepto: string, monto: number }`
- El usuario puede agregar tantos conceptos como necesite
- El usuario puede eliminar cualquier concepto
- Conceptos típicos observados en ejemplos reales: Impuestos, Servicios
  Aduaneros, Parqueo, Honorarios, Factura, Registración, Dealer — pero NO
  deben estar hardcodeados como lista fija, son solo ejemplos de lo que el
  usuario suele escribir

### Calculado automáticamente
- Total = suma de todos los montos de la lista de gastos

---

## 5. Reglas de formato numérico y de texto

- Moneda: `$#,##0.00` (símbolo de dólar como en los ejemplos originales,
  aunque el total se etiquete "TOTAL RD$" — mantener consistencia con los
  archivos ya entregados; confirmar con cliente si prefieren cambiar el
  símbolo a "RD$" en cada línea también)
- Fechas: formato `DD/MM/AAAA`
- Nombres de conceptos: se muestran en MAYÚSCULAS en el PDF final,
  independientemente de cómo los escriba el usuario en el formulario
- Nombres de importador y vehículo: respetar la capitalización que ingrese el
  usuario (no forzar mayúsculas)

---

## 6. Especificación del Historial (nuevo, para la web app)

El historial es una sección/pestaña separada dentro de la misma plataforma.
Cada entrada del historial corresponde a un documento generado y debe
almacenar como mínimo:

- Fecha de generación
- Nombre del importador
- RNC
- Datos del vehículo (marca/modelo, año, chasis)
- Fecha de vencimiento de parqueo
- Lista completa de conceptos y montos (para poder regenerar el PDF
  exactamente igual)
- Total

### Funcionalidad esperada
- Listado de entradas, más reciente primero por defecto
- Búsqueda/filtro por: nombre de importador, RNC, o rango de fechas
- Acción "Ver / Reimprimir" sobre cada entrada → reabre el documento en el
  preview y permite volver a exportar el PDF
- (Opcional, a confirmar con cliente) Acción "Duplicar" → usa una entrada
  existente como plantilla para crear un documento nuevo con datos similares
  (útil si el mismo importador trae varios vehículos)

### Persistencia
- Mientras no haya backend/base de datos: usar almacenamiento del lado del
  cliente (localStorage en una web app independiente, o `window.storage` con
  `shared: false` si se implementa como artifact de Claude.ai)
- Si en el futuro se requiere acceso multi-dispositivo o multi-usuario real,
  esto deberá migrar a una base de datos (Supabase u otra) — pendiente, no
  implementar todavía salvo que el cliente lo solicite explícitamente

---

## 7. Preguntas abiertas / pendientes de confirmar con el cliente

- ¿El texto de la nota legal se mantiene exactamente igual o se generaliza
  (ya no es específico de "revisar su vehículo en el printer")?
- ¿El símbolo de moneda en la tabla de conceptos debe ser "$" o "RD$"?
- ¿Se necesita logo o encabezado con datos de la empresa que emite el
  documento (el cliente, no el importador)?
- ¿El campo "color del vehículo" debe aparecer en el PDF final o se omite
  como en la versión simplificada actual?
- ¿La acción "Duplicar" del historial es necesaria para el flujo real de
  trabajo del cliente?
