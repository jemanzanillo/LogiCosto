# INSTRUCCIONES DEL PROYECTO — LogiCosto

## Nombre del proyecto

**LogiCosto** — sistema de facturación de gastos para importadores de
vehículos/aduanas. El nombre es genérico a propósito: la plataforma debe
poder usarse con múltiples importadores/clientes, no solo con el cliente
actual. Usar "LogiCosto" como nombre de la app en la interfaz, en títulos de
documentos generados (si aplica) y en nombres de archivo de entregables
(ej. `LogiCosto_v1.html`).

## Contexto general

Este proyecto da soporte al desarrollo de una **web app de facturación** para un
cliente (consultoría/servicio de documentación de importación vehicular). El
cliente, a su vez, usa esta plataforma para generar y enviar documentos de
gastos a SUS PROPIOS clientes (importadores de vehículos).

Es decir: hay dos niveles de "cliente" en este proyecto:
- **El cliente directo** (dueño del negocio de trámites/documentación) — para
  quien construimos la plataforma.
- **Los importadores** (clientes del cliente) — quienes reciben los PDF de
  gastos generados por la plataforma.

## Origen del proyecto

El punto de partida fue un documento Word de ejemplo
(`HOJA_DE_GASTOS_DE_TOYOTA_5TDXBRCH0NS557624.docx`) que el cliente usaba como
plantilla manual. Evolucionó así:

1. Plantilla Excel con cálculos automáticos (openpyxl)
2. Excel dinámico de 2 hojas sincronizadas: "Entrada de Datos" → "Documento PDF"
3. Excel con macros VBA (.xlsm) para agregar/eliminar conceptos dinámicamente
4. **Ahora**: Web app de facturación con historial y exportación a PDF

## Decisión de arquitectura (CONFIRMADA)

1. Persistencia compartida (reemplaza la decisión original)

La decisión original — "almacenamiento del lado del cliente / window.storage,
sin backend por ahora" — queda reemplazada:


Se requiere un backend con persistencia compartida (ej. Supabase).
especificacion_pdf.md (sección 6) ya anticipaba esto como "fase 2,
pendiente"; esa fase se activa ahora, no es opcional.
Motivo: el ciclo de vida del documento (sección 3 de este addendum) requiere
que el estado de cada documento sea visible para Francisca, Virginia y el
importador desde un único lugar compartido.


2. Multi-usuario y roles

El sistema soporta al menos dos roles, cada uno con acceso propio:


Agente (perfil Francisca): captura de datos del importador/vehículo,
desglose de gastos, generación de enlaces de revisión.
Gerente / Supervisión (perfil Virginia): búsqueda y filtrado del
historial, seguimiento de estados, resolución de comentarios del
importador.


Pendiente de definir con el cliente: si los permisos de visibilidad
(comentarios del importador, notas internas) y la pantalla de inicio
difieren formalmente por rol, o si la diferencia es solo de énfasis dentro de
una navegación compartida (ver lista de asunciones, sección 6).

3. Ciclo de vida del documento (nuevo)

Reemplaza "Exportar PDF" como acción final única. Nuevo ciclo:

Borrador (en edición)
  → Enlace generado (enviado al importador)
    → Visto por el importador
      → Aprobado → descarga de PDF habilitada (todas las partes)
      → Con comentarios → vuelve a Borrador (el ciclo se repite)

Reglas confirmadas:


El enlace es el mismo durante todo el ciclo — el contenido se
actualiza al editar, no se generan enlaces nuevos.
La descarga del PDF se habilita únicamente cuando el estado es "Aprobado".
Existe un camino de respaldo: Francisca o Virginia pueden marcar
"aprobación manual" (ej. confirmación recibida por WhatsApp/teléfono) para
importadores que no usan el enlace digital.


4. Estructura del Historial (actualización)

El Historial se divide en al menos dos vistas:


Borradores: documentos en edición, no enviados — relevante
principalmente para el rol Agente.
Historial (enviados): documentos con estado del ciclo de vida (Enlace
generado / Visto / Aprobado / Con comentarios) — relevante para ambos
roles, especialmente Gerente.


Cada entrada del Historial conserva los campos ya definidos en
especificacion_pdf.md sección 6, más el campo estado.

5. Nueva superficie: vista externa para el importador


Página pública, sin login, accesible solo mediante el enlace único.
Mobile-first (el importador la abre principalmente desde WhatsApp en su
teléfono).
Replica visualmente la especificación congelada del PDF
(especificacion_pdf.md, sección 2).
Incluye dos acciones: "Aprobar documento" y "Dejar comentario" (campo de
texto simple, sin estructura compleja).
Tras aprobar, se habilita la descarga del PDF para el importador.

## Asunciones pendientes de confirmar con el cliente

Generadas durante los journey maps. Se trabajará con supuestos razonables
para cada una (documentados donde corresponda) hasta que se confirmen.

Arquitectura y roles


 ¿Cuentas separadas con roles formales (Agente / Gerente), o login único
compartido por la gestoría?
 Si hay roles: ¿la visibilidad de comentarios y notas internas, y la
pantalla de inicio, difieren entre Agente y Gerente?


Ciclo de vida del documento / aprobación


 ¿La descarga interna (Agente/Gerente) también depende de la
aprobación, o solo la del importador?
 ¿Se necesita historial de versiones (v1, v2...) cuando un documento se
edita tras un comentario, para auditoría?
 ¿Notificación activa cuando el importador responde, o consulta pasiva
del estado en el historial?
 ¿La descarga genera un PDF real desde el servidor, o depende de
"guardar como PDF" del navegador?


Historial y búsqueda


 ¿Los resultados de búsqueda muestran marca/modelo/chasis del vehículo,
para distinguir entradas similares del mismo importador?
 ¿La función "Duplicar" (entrada existente como plantilla) está en
alcance?
 ¿Es necesario un campo de "nota interna", distinto del comentario del
importador?
 ¿Se necesita un filtro de "atención requerida" (vencimientos próximos
sin aprobar), o basta con ordenar/filtrar lo existente?


Especificación visual / contenido del documento


 Símbolo de moneda: ""o"RD" o "RD
"o"RD" (pregunta original, ahora más visible
  porque el importador la ve directo).
 ¿Se necesita logo/encabezado de la gestoría en el documento? (cobra
más peso por la nueva vista externa)
 ¿El texto de la nota legal se mantiene igual o se generaliza? (ahora
visible directamente al importador)
 ¿Se incluye el campo "color del vehículo" en el documento final?
 Verificar contraste del texto en la fila de Total (#FFC7CE con texto
blanco), especialmente en la vista móvil del importador.


Captura de datos (Agente)


 ¿Autocompletar datos del importador (nombre, RNC) buscando
coincidencias en el historial?
 ¿Sugerencias de conceptos comunes al escribir (sin lista cerrada)?

## Estructura del documento PDF (especificación congelada)

La estructura visual del PDF generado DEBE mantenerse fiel a las decisiones ya
tomadas con el cliente (ver `especificacion_pdf.md` en los archivos del
proyecto para el detalle completo). Resumen de las reglas clave:

1. **Tabla de gastos**: SOLO dos columnas — "CONCEPTO" y "MONTO". NO mostrar
   cantidad ni precio unitario por separado en el documento exportado.
2. **Importador y RNC**: deben aparecer en una sola línea/fila, formato
   `IMPORTADOR | [RNC] xxxxxxxxx`.
3. **Fecha de vencimiento**: debe estar MUY resaltada — fondo rojo brillante
   (`#C00000`), texto blanco en negrita, celda más alta que el resto.
4. **Conceptos dinámicos**: el usuario debe poder agregar o eliminar líneas de
   gasto libremente (no una lista fija de 7-8 conceptos). El total se
   recalcula automáticamente.
5. **Nota legal al final**: "NOTA: FAVOR DE REVISAR SU VEHICULO EN EL PRINTER
   ANTES DE REALIZAR EL PAGO YA QUE NO NOS HACEMOS RESPONSABLE DE CAMBIOS
   FUTUROS" (o el texto que el cliente confirme — verificar antes de fijarlo).
6. **Encabezado**: "FECHA DE VENCIMIENTO DE PARQUEO" como título de sección,
   con fecha de emisión y "Pag. X of Y" en la esquina superior.

## Funcionalidades requeridas del sistema de facturación

- Formulario para capturar: datos del importador (nombre, RNC), datos del
  vehículo (marca, modelo, año, chasis), fecha de vencimiento de parqueo, y
  lista dinámica de conceptos de gasto (concepto + monto).
- Preview en tiempo real del documento antes de exportar.
- Botón de exportación a PDF que respete la especificación visual congelada.
- **Pestaña de Historial**: listado de todas las facturas/documentos
  generados, con capacidad de buscar/filtrar por importador, RNC, vehículo o
  rango de fechas. Cada entrada del historial debe poder reabrirse para
  reimprimir o exportar de nuevo.
- Persistencia de datos del lado del cliente (localStorage equivalente, o
  `window.storage` si se trabaja como artifact de Claude.ai).

## Convenciones de trabajo

- Idioma de la interfaz y de los documentos generados: **español**.
- Moneda: pesos dominicanos (RD$), formato `$#,##0.00`.
- Mantener consistencia visual con el Excel ya entregado (colores: header azul
  `#1F4E78`, total en rosa `#FFC7CE`, vencimiento en rojo `#C00000`).
- Cuando se generen archivos para el cliente, usar nombres descriptivos en
  español (ej. `Sistema_Facturacion_Gastos.html`).
- Si surge una ambigüedad sobre el diseño del PDF, consultar
  `especificacion_pdf.md` antes de asumir; si no está cubierto ahí, preguntar
  al usuario antes de fijar una convención nueva.

## Historial de archivos relevantes ya entregados

- `Plantilla_Gastos_Vehiculos.xlsx` — primera plantilla Excel
- `Sistema_Gastos_Dinamico.xlsx` — Excel de 2 hojas sincronizadas
- `Sistema_Gastos_Dinamico_ACTUALIZADO.xlsx` — con los 3 cambios del cliente
  (tabla simplificada, importador/RNC en línea, vencimiento resaltado)
- `Sistema_Gastos_Dinamico.xlsm` + `ModGastos.bas` — versión con macros VBA
  para conceptos dinámicos

Estos archivos representan iteraciones previas y sirven como referencia de
diseño, pero la implementación final será una web app, no estos archivos
Excel.
