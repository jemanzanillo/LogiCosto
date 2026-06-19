# LogiCosto — Arquitectura Técnica (v2)

**Estado:** Decisiones confirmadas en reunión de levantamiento. Lista para
implementación.

Este documento complementa `LogiCosto_instrucciones_proyecto.md` y
`especificacion_pdf.md`. Define cómo se construye el sistema.

> **Cambios v1 → v2 (resumen):**
> - **Eliminado todo el ciclo de aprobación online**: sin ruta pública
>   `/ver/[token]`, sin funciones RPC `SECURITY DEFINER`, sin `share_token`, sin
>   campos `approved_manually*`, sin tabla `comments` de importador.
> - **Estados nuevos:** `borrador` → `exportada` → `finalizada`.
> - **Versionado por revisión**, no por exportación.
> - **PDF render bajo demanda** desde el snapshot de datos; sin Storage de PDFs
>   (sin `pdf_url`).
> - **Dos tipos de documento** (vehículo / contenedor).
> - **Presets de importador** (tabla `importadores`).
> - **`document_status_history` → `audit_log`** (auditoría general por usuario).
> - **Rol único, dos usuarios.**
> - **Respaldo offline e importación de históricos** confirmados en alcance.

---

## 1. Stack confirmado

- **Frontend/Backend:** Next.js, desplegado en Vercel.
- **Base de datos + Auth:** Supabase (Postgres + Supabase Auth).
- **Multi-tenant:** una sola gestoría en uso, pero se mantiene `organizations`
  + RLS por `org_id` desde el día uno (sin costo, evita migración futura).
- **Autenticación:** dos cuentas individuales vía Supabase Auth, **un solo rol**.
- **Generación de PDF:** `@react-pdf/renderer`, **render bajo demanda** (sin
  Puppeteer, sin almacenar el PDF). Ver sección 6.
- **Volumen:** bajo (hasta ~15 docs/día). No requiere optimizaciones de escala.

---

## 2. Modelo de datos (Postgres / Supabase)

### 2.1 `organizations`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid, PK | |
| name | text | nombre de la gestoría |
| brand_colors | jsonb, nullable | colores de marca para el sistema y el PDF |
| logo_url | text, nullable | logo (pendiente de entrega) |
| created_at | timestamptz | |

### 2.2 `profiles`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid, PK | = `auth.users.id` |
| org_id | uuid, FK → organizations | |
| full_name | text | distingue a las dos usuarias en la auditoría |
| role | text, default `'operador'` | un solo rol en v1 |
| created_at | timestamptz | |

### 2.3 `importadores` (NUEVO — presets)
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid, PK | |
| org_id | uuid, FK → organizations | |
| nombre | text | razón social / nombre |
| rnc | text | |
| created_by | uuid, FK → profiles | |
| created_at / updated_at | timestamptz | |

Buscable por `nombre` (dropdown). `documents.importador_id` puede ser null para
importadores ocasionales (en ese caso los datos van solo denormalizados).

### 2.4 `documents`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid, PK | |
| org_id | uuid, FK → organizations | |
| created_by | uuid, FK → profiles | |
| tipo | enum('vehiculo','contenedor') | **NUEVO** |
| status | enum('borrador','exportada','finalizada') | **NUEVO** |
| origen | enum('app','respaldo_offline','historico'), default 'app' | trazabilidad de origen |
| current_version_id | uuid, FK → document_versions | versión vigente |
| importador_id | uuid, FK → importadores, nullable | preset usado (si aplica) |
| importador_nombre | text | denormalizado → búsqueda/listado |
| importador_rnc | text | denormalizado → búsqueda |
| vencimiento_parqueo | date | denormalizado → filtro "atención requerida" |
| internal_notes | text, nullable | nota interna (visible a ambas usuarias) |
| created_at / updated_at | timestamptz | |

> Eliminados de v1: `share_token`, `approved_manually*`, `approved_at`.

### 2.5 `document_versions`
Snapshot completo de los datos en cada **revisión**. Es lo que permite
reproducir/renderizar el PDF y auditar v1, v2, ...

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid, PK | |
| document_id | uuid, FK → documents | |
| version_number | int | 1, 2, 3... |
| data | jsonb | estructura abajo |
| created_by | uuid, FK → profiles | |
| created_at | timestamptz | |

> Eliminado `pdf_url`: el PDF no se almacena, se renderiza bajo demanda
> (sección 6). Esto permite que un cambio de diseño se propague también a
> documentos viejos.

Estructura de `data` (jsonb), discriminada por `tipo`:
```json
{
  "tipo": "vehiculo",
  "importador": { "nombre": "...", "rnc": "..." },
  "vehiculo": { "marca": "...", "modelo": "...", "anio": 2020, "chasis": "...", "color": "..." },
  "vencimiento_parqueo": "2026-07-01",
  "conceptos": [
    { "concepto": "IMPUESTOS", "monto": 12500.00 },
    { "concepto": "SER. ADUANEROS", "monto": 3000.00 }
  ],
  "total": 15500.00
}
```
```json
{
  "tipo": "contenedor",
  "importador": { "nombre": "...", "rnc": "..." },
  "contenedor": { "bl": "...", "numero_contenedor": "..." },
  "vencimiento_parqueo": "2026-07-01",
  "conceptos": [ { "concepto": "...", "monto": 0.00 } ],
  "total": 0.00
}
```
`total` se recalcula al guardar pero se almacena en el snapshot para que cada
versión sea reproducible aunque la lógica de cálculo cambie.

### 2.6 `audit_log` (NUEVO — reemplaza `document_status_history`)
Registro de **toda acción** de cada usuario, por transparencia.

| Campo | Tipo | Notas |
|---|---|---|
| id | uuid, PK | |
| org_id | uuid, FK → organizations | |
| document_id | uuid, FK → documents, nullable | null en acciones no ligadas a un doc (ej. crear preset) |
| actor_profile_id | uuid, FK → profiles | quién hizo la acción |
| action | enum('crear','editar','revisar','exportar','finalizar','importar','eliminar','preset_crear','preset_editar') | |
| detail | jsonb, nullable | ej. `{ "from_status": "...", "to_status": "...", "version": 2 }` |
| created_at | timestamptz | |

> Tablas eliminadas de v1: `comments` (eran comentarios del importador, ya no
> existen). Las notas internas viven en `documents.internal_notes`.

---

## 3. Roles y seguridad (RLS)

- RLS habilitado en todas las tablas (`importadores`, `documents`,
  `document_versions`, `audit_log`, `profiles`).
- Política base: el usuario autenticado solo ve filas donde
  `org_id = (perfil del usuario).org_id`.
- **Un solo rol** (`operador`): las dos usuarias ven y operan exactamente lo
  mismo. No hay particiones de datos ni de interfaz por rol.
- **No existe rol `anon`/público** con acceso a datos (no hay vista externa).
  Toda la app es autenticada.

---

## 4. Ciclo del documento (estados y versionado)

```
borrador (en edición; aún sin exportar — todo ocurre sobre la versión 1)
  → exportada       (se renderiza el PDF y se comparte por WhatsApp)
      → (si hay una revisión de contenido):
          se crea una NUEVA versión (version_number + 1)
          → se vuelve a exportar
  → finalizada      (la última versión queda como factura definitiva)
      → [revertir finalizado] → vuelve a `exportada`
```

Reglas:
- **Nueva versión = nueva fila en `document_versions`**, creada **solo cuando se
  hace un cambio** sobre un documento ya exportado. Re-exportar contenido
  idéntico **no** crea versión.
- Mientras el documento está en `borrador` (nunca exportado), las ediciones
  ocurren sobre la versión 1 (sin proliferar versiones).
- `finalizada` se marca **explícitamente** por el usuario: indica que la última
  versión es la factura definitiva.
- `finalizada` es **reversible**: la acción **"revertir finalizado"** devuelve
  el documento a `exportada` (queda en `audit_log`). Revertir por sí solo **no**
  crea versión nueva; una edición de contenido posterior sí.
- **Conteo de pendientes:** la UI muestra cuántos documentos están **sin
  finalizar** (`status != 'finalizada'`), como recordatorio para marcarlos. Es
  una consulta derivada (`count(*) where org_id=… and status != 'finalizada'`),
  sin columna nueva.
- Cada transición y cada acción relevante escribe en `audit_log`.

---

## 5. (Eliminado en v2)

La antigua sección de **acceso público del importador** (ruta `/ver/[token]`,
funciones RPC `get/approve/comment_shared_document`) **se elimina por
completo**. No hay superficie pública ni interacción del importador con el
sistema. El importador recibe el PDF por WhatsApp como archivo.

---

## 6. Generación de PDF — `@react-pdf/renderer` (render bajo demanda)

**Por qué no Puppeteer:** en Vercel serverless, headless Chrome trae límites de
tamaño de función y cold starts pesados. El layout es reproducible con los
primitivos de `@react-pdf/renderer` (`View`, `Text`, `StyleSheet`, flexbox,
`backgroundColor`, `borderWidth`, `minHeight`).

**Un componente, ramificado por tipo:**
- `DocumentoPDF` recibe `data` (el snapshot de la versión) y los colores/medidas
  de la especificación congelada como constantes compartidas.
- Ramifica el **bloque de datos** según `data.tipo` (vehículo vs contenedor).
- Renderiza la **fecha de vencimiento** y la **nota legal** con máxima jerarquía
  (ver `especificacion_pdf.md` 2.5 y 2.8).

**Sin almacenamiento de PDF:**
- El PDF se genera **al vuelo** cada vez que se exporta/descarga, vía
  `renderToBuffer(<DocumentoPDF .../>)` en una ruta de API de Next.js.
- **No se sube a Storage ni se guarda `pdf_url`.** La fuente de verdad es el
  `data` de la versión + el diseño vigente. Esto es lo que permite que el
  rediseño y la importación de históricos compartan el mismo diseño actual.
- A ~15 docs/día, el costo de re-render es irrelevante; no hace falta caché.

**Indicador de versión:** el PDF muestra el `version_number` vigente (ej. "v2")
para distinguir revisiones compartidas.

**Preview en tiempo real:** HTML/CSS normal en la UI (más flexible para edición
interactiva), usando las mismas constantes de color/medidas que `DocumentoPDF`.

---

## 7. Identidad visual / marca

- `organizations.brand_colors` y `organizations.logo_url` parametrizan el
  sistema y el PDF.
- En v1: placeholder de logo; paleta base heredada del Excel. El **rediseño del
  PDF** (propuestas de Joseph, identidad del equipo) ajustará la paleta
  manteniendo las reglas de jerarquía de `especificacion_pdf.md`.

---

## 8. Respaldo offline (Excel de contingencia) — CONFIRMADO

Mecanismo de contingencia para cortes de luz/internet. **No** es uso diario ni
reemplaza la captura en la app.

- Basado en la `.xlsm` con macros (`ModGastos.bas`): captura todos los campos
  (importador, RNC, datos por tipo, vencimiento, conceptos dinámicos, total
  automático) y produce un export estructurado importable.
- Soporta los **dos tipos** (vehículo / contenedor).
- **Importación de vuelta a LogiCosto:**
  - Entran como **`borrador`** (`origen='respaldo_offline'`), retoman el ciclo
    normal.
  - Valida formato (RNC, fechas, montos numéricos).
  - **Detecta duplicados** por `chasis` (vehículo) o `bl + numero_contenedor`
    (contenedor), para no duplicar lo que ya se capturó en la app.

---

## 9. Importación de facturas históricas — CONFIRMADO

- Scraping de las facturas viejas en **Word o Excel** (el formato que resulte
  más fácil de parsear), extrayendo **solo los datos** (no el diseño original).
- Entran al Historial como `documents` con `origen='historico'` y, por ser
  cerradas, estado **`finalizada`** (no pasan por borrador).
- Al renderizarse usan el **diseño vigente** (es la consecuencia buscada de
  tomar solo los datos).
- Crear una versión 1 con el `data` extraído. Marcar en `audit_log` la acción
  `importar`.

---

## 10. Próximos pasos sugeridos

1. Migraciones SQL en Supabase: tablas de la sección 2 + RLS de la sección 3.
   (Sin funciones RPC públicas — ya no aplican.)
2. Seed: una `organization`, dos `profiles` (rol `operador`) ligados a sus
   cuentas de Supabase Auth.
3. Estructura del proyecto Next.js (todo autenticado; sin ruta pública).
4. Componente `DocumentoPDF` (react-pdf) ramificado por tipo, siguiendo
   `especificacion_pdf.md` v2.
5. Formulario con selector de tipo + presets de importador + lista dinámica de
   conceptos + preview HTML.
6. Historial con filtros, versiones, estados, duplicar y consulta de auditoría.
7. Plantilla `.xlsm` de respaldo (dos tipos) + parser de importación
   (offline e histórico) con validación y dedupe.
