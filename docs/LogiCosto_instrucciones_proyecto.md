# INSTRUCCIONES DEL PROYECTO — LogiCosto

> **v2 — actualizado tras reunión de levantamiento con el cliente.**
> Esta versión integra y reemplaza los addenda previos
> (`LogiCosto_Actualizacion_Arquitectura_y_Alcance.md` y
> `LogiCosto_Addendum_Respaldo_Offline.md`), que quedan superados. El cambio
> mayor: **se elimina el ciclo de aprobación online del importador**; el flujo
> ahora es exportación directa del PDF + control de versiones.

## Nombre del proyecto

**LogiCosto** — sistema de facturación de gastos para importadores de
vehículos/aduanas. Nombre genérico a propósito (multi-cliente). Usar
"LogiCosto" como nombre de la app en la interfaz y en nombres de archivo de
entregables (ej. `LogiCosto_v1.html`).

## Contexto general

Web app de facturación para un cliente (gestoría de documentación de
importación vehicular). El cliente usa la plataforma para generar y enviar
documentos de gastos a SUS clientes (importadores), normalmente **por
WhatsApp**.

Dos niveles de "cliente":
- **El cliente directo** (la gestoría) — para quien construimos la plataforma.
- **Los importadores** (clientes del cliente) — reciben el PDF de gastos. Son
  **receptores pasivos**: ya no interactúan con la plataforma (no hay vista de
  aprobación online).

## Vigencia del contrato

Contrato vigente **hasta fin de 2026**. Las funciones nuevas que surjan se
incorporan en el **próximo contrato sin costo adicional**. El alcance de v1
debe cerrarse contra lo confirmado aquí.

## Origen del proyecto

Documento Word de ejemplo (`HOJA_DE_GASTOS_DE_TOYOTA_5TDXBRCH0NS557624.docx`)
→ plantilla Excel → Excel dinámico de 2 hojas → Excel con macros VBA (.xlsm)
→ **ahora**: web app con historial y exportación a PDF.

---

## Decisiones de arquitectura y alcance (CONFIRMADAS — v2)

### 1. Persistencia compartida (backend)
Backend con persistencia compartida en **Supabase** (Postgres + Auth). No hay
almacenamiento del lado del cliente. Detalle técnico completo en
`LogiCosto_Arquitectura_Tecnica.md`.

### 2. Usuarios y rol
- **Un solo rol funcional**, **dos usuarios** (la encargada de la gestoría y su
  hermana, que la cubre cuando no está). Cada una con su propio login.
- No hay permisos diferenciados entre ellas: ven y hacen lo mismo. La
  diferencia entre usuarios solo existe en el **registro de auditoría**.

### 3. Registro de auditoría (NUEVO — requisito de transparencia)
Se registra **cada acción** de cada usuario (crear, editar, exportar, revisar,
finalizar, importar, eliminar, gestionar presets), con usuario y fecha/hora.
Motivo: transparencia entre las dos usuarias. Reemplaza al antiguo
`document_status_history` (que existía para las acciones del importador, ya
inexistentes).

### 4. Ciclo del documento (SIN aprobación online — reemplaza al ciclo previo)
```
Borrador (en edición)
  → Exportada   (se genera el PDF y se comparte por WhatsApp)
    → [si hay cambios] Revisión → nueva versión (v2, v3...) → Exportada de nuevo
  → Finalizada  (la última versión queda como factura definitiva)
```
Reglas confirmadas:
- **No hay ciclo de aprobación del importador** (sin enlace público, sin vista
  externa, sin estados "visto/aprobado/con comentarios").
- El PDF está **listo para exportar y compartir** en cualquier momento.
- **Versión nueva solo cuando hay un cambio/revisión** sobre un documento ya
  exportado — no en cada exportación.
- El PDF se **renderiza bajo demanda** desde los datos de la versión; **no se
  almacena** el archivo.
- **Finalizar es explícito** (lo marca el usuario) y **reversible** (acción
  "revertir finalizado" → vuelve a `exportada`). Los históricos importados
  entran ya como `finalizada`.
- La interfaz muestra un **conteo de documentos sin finalizar**, como
  recordatorio para marcarlos.

### 5. Dos tipos de factura (NUEVO)
- **Vehículo**: Marca, Modelo, Año, Chasis (Color opcional, no en PDF).
- **Contenedor**: Número de BL, Número de Contenedor.
Resto del documento idéntico (importador, vencimiento, conceptos, total, nota).

### 6. Presets de importador (NUEVO — reemplaza "autocompletar")
Importadores fijos se guardan como **presets** seleccionables/buscables por
nombre en un dropdown. También se permite ingreso manual para importadores
ocasionales.

### 7. Importación de facturas históricas (NUEVO — en alcance)
Las facturas viejas (Word/Excel) se importan al **Historial** mediante
extracción de **solo sus datos** (scraping del formato que resulte más fácil,
Word o Excel). Como se toman solo los datos, **adoptan el diseño nuevo** al
renderizarse. Entran como entradas históricas/finalizadas.

### 8. Respaldo offline en Excel (CONFIRMADO — en alcance)
Mecanismo de **contingencia** para cortes de luz/internet (común en RD). NO es
vía de uso diario. Permite capturar datos offline y luego importarlos a
LogiCosto al volver la conexión (entran como **borrador**, retoman el ciclo
normal). Detección de duplicados por **chasis** (vehículo) o **BL + nº de
contenedor** (contenedor). Se apoya en la base `.xlsm`/`ModGastos.bas` ya
desarrollada.

### 9. Énfasis del documento (confirmado por el cliente)
La **fecha de vencimiento** y la **nota de revisión** deben tener **máxima
jerarquía visual** en el PDF, porque los importadores no las revisan y luego
reclaman. La fecha de vencimiento se ingresa **manualmente**. Detalle en
`especificacion_pdf.md` (secciones 2.5 y 2.8).

### 10. Identidad de marca
El **sistema y las facturas** llevan los colores de la empresa (equipo de
mujeres, identidad propia). Logo y paleta de marca **pendientes de entrega**.
Joseph enviará **propuestas de rediseño del PDF** con esa identidad.

### 11. Volumen de trabajo
Oscilante: hay días sin facturas y picos de **hasta ~15 facturas/día**. Es un
volumen bajo — la arquitectura no requiere optimizaciones de escala; favorecer
simplicidad (ej. render de PDF bajo demanda, sin caché).

---

## Estructura del documento PDF (especificación congelada)

La estructura visual del PDF DEBE mantenerse fiel a `especificacion_pdf.md`
(fuente de verdad del diseño). Reglas clave:

1. **Tabla de gastos**: SOLO dos columnas — "CONCEPTO" y "MONTO".
2. **Importador y RNC**: en una sola línea, `IMPORTADOR | [RNC] xxxxxxxxx`.
3. **Bloque de datos por tipo**: Vehículo (marca/modelo/año/chasis) o
   Contenedor (BL/nº contenedor).
4. **Fecha de vencimiento**: MUY resaltada — fondo rojo `#C00000`, texto blanco
   bold, celda más alta. Ingreso manual.
5. **Conceptos dinámicos**: agregar/eliminar libremente; total automático.
6. **Nota legal**: resaltada como bloque de advertencia prominente (ya no letra
   chica). Texto: "NOTA: FAVOR DE REVISAR SU VEHICULO EN EL PRINTER ANTES DE
   REALIZAR EL PAGO YA QUE NO NOS HACEMOS RESPONSABLE DE CAMBIOS FUTUROS".
7. **Encabezado**: logo/encabezado de gestoría (placeholder) + "FECHA DE
   VENCIMIENTO DE PARQUEO" como título de sección + fecha de emisión y
   "Pag. X of Y".
8. **Moneda**: `RD$#,##0.00` por línea y en el total.

## Funcionalidades requeridas del sistema

- Formulario con selección de **tipo** (Vehículo/Contenedor) y campos según
  tipo, importador (preset o manual), vencimiento manual, y lista dinámica de
  conceptos.
- Preview en tiempo real del documento antes de exportar (HTML/CSS).
- Exportación a PDF (render bajo demanda) que respeta la especificación
  congelada.
- **Indicador de versión** por documento (nueva versión al revisar tras
  exportar).
- **Historial**: listado de documentos con buscar/filtrar por importador, RNC,
  tipo, vehículo/contenedor o rango de fechas; reabrir para reimprimir o
  duplicar; estados (borrador/exportada/finalizada).
- **Presets de importador**: crear, buscar, seleccionar.
- **Registro de auditoría** consultable.
- **Respaldo offline** (Excel) e **importación** de históricos y de respaldo.

## Convenciones de trabajo

- Idioma de interfaz y documentos: **español**.
- Moneda: pesos dominicanos, `RD$#,##0.00`.
- Colores base: header azul `#1F4E78`, total rosa `#FFC7CE` (texto oscuro),
  vencimiento rojo `#C00000`; ajustables a la marca en el rediseño.
- Nombres de archivo de entregables: descriptivos en español.
- Ante ambigüedad sobre el PDF, consultar `especificacion_pdf.md`; ante
  ambigüedad técnica, `LogiCosto_Arquitectura_Tecnica.md`. Si no está cubierto,
  preguntar antes de fijar una convención.

## Archivos del proyecto

- `especificacion_pdf.md` — diseño del documento (fuente de verdad visual).
- `LogiCosto_Arquitectura_Tecnica.md` — cómo se construye el sistema.
- `LogiCosto_-_..._Canvas_de_Diseño.md` — investigación UX y personas.
- (Superados e integrados aquí: `LogiCosto_Actualizacion_Arquitectura_y_Alcance.md`,
  `LogiCosto_Addendum_Respaldo_Offline.md`.)

## Historial de archivos Excel ya entregados (referencia)

`Plantilla_Gastos_Vehiculos.xlsx`, `Sistema_Gastos_Dinamico.xlsx`,
`Sistema_Gastos_Dinamico_ACTUALIZADO.xlsx`, `Sistema_Gastos_Dinamico.xlsm` +
`ModGastos.bas`. Iteraciones previas; la base `.xlsm` se reutiliza para el
respaldo offline.
