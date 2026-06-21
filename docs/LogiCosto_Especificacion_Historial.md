# Especificación — Historial de Facturas

Referencia de diseño para las dos vistas del historial: la tarjeta resumida en
la página de inicio y la tabla completa en la página dedicada `/historial`.

---

## 1. Contexto

El historial es uno de los "momentos de la verdad" del producto (Canvas de
Diseño, sección 04). Las operadoras buscan facturas pasadas con frecuencia;
actualmente lo hacen buscando archivos por nombre en carpetas. El historial debe
hacer ese proceso inmediato.

Hay dos vistas complementarias:

- **Vista resumida** — en el inicio, muestra las facturas más recientes a golpe
  de vista, sin navegación extra.
- **Vista completa** — página dedicada `/historial` con buscador, filtros y
  ordenación por columna.

---

## 2. Fuentes de datos

Los campos del historial provienen de tres tablas:

| Tabla | Campos usados |
|---|---|
| `documents` | `id`, `tipo`, `status`, `origen`, `importador_nombre`, `importador_rnc`, `vencimiento_parqueo`, `created_by`, `created_at`, `updated_at` |
| `document_versions` | `version_number` (el máximo por documento), `data` (jsonb) |
| `profiles` | `full_name` (via `created_by`) |

El jsonb `document_versions.data` aporta `total` y los identificadores del
despacho (`chasis`, `marca`, `modelo`, `anio`, `bl`, `numero_contenedor`).

---

## 3. Vista resumida (página de inicio)

Muestra las **N facturas más recientes** (sugerido: 5–8 filas). Sin paginación
ni filtros; solo un enlace "Ver historial completo →".

### 3.1 Columnas

| # | Columna | Fuente | Ordenable |
|---|---|---|---|
| 1 | **Importador** | `importador_nombre` | ✓ |
| 2 | **Tipo** | `tipo` | — |
| 3 | **Identificador** | `data.vehiculo.chasis` o `data.contenedor.numero_contenedor` | — |
| 4 | **Total** | `data.total` | ✓ |
| 5 | **Vencimiento** | `vencimiento_parqueo` | ✓ |
| 6 | **Estado** | `status` | — |
| 7 | **Fecha** | `created_at` | ✓ (orden por defecto ↓) |

### 3.2 Acciones por fila

- Abrir el documento (editar/ver).
- Generar/descargar el PDF de la versión vigente.

### 3.3 Renderizado especial

- **Tipo:** badge visual — "Vehículo" / "Contenedor".
- **Estado:** badge de color — Borrador (gris) / Exportada (azul) / Finalizada
  (verde).
- **Vencimiento:** si la fecha es ≤ 3 días desde hoy, mostrar con color de
  alerta (amarillo/rojo, coherente con el banner del PDF).
- **Fecha:** formato `DD/MM/AAAA`.
- **Total:** formato `RD$#,##0.00`.

---

## 4. Vista completa (página `/historial`)

Tabla paginada con buscador, filtros y ordenación por columna.

### 4.1 Columnas

Incluye todas las columnas de la vista resumida más:

| # | Columna | Fuente | Ordenable | Notas |
|---|---|---|---|---|
| 8 | **Chasis** | `data.vehiculo.chasis` | — | `—` en contenedores |
| 9 | **Marca / Modelo / Año** | `data.vehiculo.*` | — | `—` en contenedores |
| 10 | **BL** | `data.contenedor.bl` | — | `—` en vehículos |
| 11 | **Nº Contenedor** | `data.contenedor.numero_contenedor` | — | `—` en vehículos |
| 12 | **Versión** | `MAX(version_number)` | ✓ | "v1", "v2"… |
| 13 | **Creado por** | `profiles.full_name` | — | Titular / Suplente |
| 14 | **Origen** | `origen` | — | App / Respaldo offline / Histórico |
| 15 | **Última edición** | `updated_at` | ✓ | Formato `DD/MM/AAAA` |

### 4.2 Patrón de columnas heterogéneas

Las columnas de vehículo (Chasis, Marca/Modelo/Año) y las de contenedor (BL,
Nº Contenedor) coexisten en la misma tabla. Cuando un campo no aplica al tipo
de la fila, la celda muestra `—`.

Este patrón es idéntico al que usan tablas con tipos mixtos (p.ej. ESPN Fantasy
Free Agents, donde lanzadores y bateadores comparten la misma tabla y las
estadísticas que no aplican aparecen como `—`). Permite ordenar cada columna de
forma independiente: ordenar por Chasis agrupa vehículos al frente; las filas
con `—` van al fondo.

Ejemplo:

| Importador | Tipo | Chasis | Marca/Modelo/Año | BL | Nº Contenedor | Total |
|---|---|---|---|---|---|---|
| Checo | Vehículo | 5TDXBRCH0NS… | Toyota Corolla 2021 | — | — | RD$15,500 |
| López & Asoc. | Contenedor | — | — | MAEU1234567 | TCKU4567890 | RD$42,000 |

### 4.3 Buscador (texto libre)

El buscador aplica sobre:
- `importador_nombre`
- `importador_rnc`
- `data.vehiculo.chasis`
- `data.contenedor.bl`
- `data.contenedor.numero_contenedor`
- `data.vehiculo.marca`
- `data.vehiculo.modelo`

Implementación sugerida: búsqueda sobre los campos denormalizados en `documents`
(`importador_nombre`, `importador_rnc`) con `ilike`, y sobre el jsonb para los
identificadores del despacho. Para el volumen esperado (~15 docs/día), un índice
GIN sobre `document_versions.data` o columnas generadas en `documents` cubrirá
la necesidad.

### 4.4 Filtros

| Filtro | Opciones |
|---|---|
| **Tipo** | Vehículo / Contenedor |
| **Estado** | Borrador / Exportada / Finalizada |
| **Origen** | App / Respaldo offline / Histórico |
| **Creado por** | Titular / Suplente |
| **Rango de fecha de creación** | fecha inicio – fecha fin |
| **Rango de vencimiento de parqueo** | fecha inicio – fecha fin |

Los filtros son acumulables (AND). El buscador se aplica sobre el resultado
filtrado.

### 4.5 Ordenación

Columnas ordenables (indicadas en 4.1 con ✓):
- Importador (alfabético)
- Total (asc/desc)
- Vencimiento (próximo primero / más lejano primero)
- Fecha de creación (nuevo → viejo, **por defecto**)
- Versión (asc/desc)
- Última edición (asc/desc)

---

## 5. Query base (Supabase / Postgres)

```sql
SELECT
  d.id,
  d.tipo,
  d.status,
  d.origen,
  d.importador_nombre,
  d.importador_rnc,
  d.vencimiento_parqueo,
  d.created_at,
  d.updated_at,
  p.full_name          AS creado_por,
  dv.version_number    AS version_actual,
  dv.data              AS data
FROM documents d
JOIN document_versions dv ON dv.id = d.current_version_id
JOIN profiles p           ON p.id  = d.created_by
WHERE d.org_id = $org_id
-- + cláusulas WHERE para filtros
ORDER BY d.created_at DESC;
```

`data.total` y los identificadores del despacho se extraen del jsonb en la capa
de aplicación (o con `->>` / `->` en SQL si se necesita ordenar/filtrar por
ellos).

---

## 6. Acciones por fila (vista completa)

- Abrir el documento.
- Generar/descargar PDF de la versión vigente.
- Ver historial de versiones del documento.

---

## 7. Relación con otros documentos

| Documento | Relación |
|---|---|
| `LogiCosto_Arquitectura_Tecnica.md` | Modelo de datos del que provienen todos los campos (secciones 2.4 y 2.5) |
| `especificacion_pdf.md` | El PDF que se genera al hacer clic en "Descargar" desde el historial |
| `LogiCosto_Addendum_Respaldo_Offline.md` | Facturas con `origen='respaldo_offline'` que aparecen en el historial |
