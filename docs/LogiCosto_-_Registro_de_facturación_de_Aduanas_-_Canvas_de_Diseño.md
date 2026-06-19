# Canvas de Diseño UX e Investigación

**Producto / Funcionalidad:** LogiCosto - Registro de facturación de Aduanas
**Autor/a:** Joseph Engel Manzanillo
**Fecha:** 14 de junio de 2026 · **Actualizado:** post-reunión de levantamiento

---

> ## ⚑ Actualización post-reunión (confirmado con el cliente)
>
> La investigación, los puntos de dolor, la propuesta de valor y el análisis
> competitivo de abajo **siguen vigentes**. Estos puntos ajustan el alcance y
> las proto-personas a lo confirmado:
>
> - **Un solo rol, dos usuarios.** La encargada de la gestoría trabaja las
>   facturas; cuando no está, **su hermana** la cubre. Cada una con su login.
>   No hay jerarquía agente/gerente: hacen lo mismo. Las personas "Francisca" y
>   "Virginia" se reinterpretan como **operadora titular** y **operadora
>   suplente** (mismo rol).
> - **El importador es receptor pasivo.** No hay vista online ni aprobación
>   digital: recibe el **PDF por WhatsApp**. La persona "Checo" deja de ser un
>   actor del sistema y pasa a ser el destinatario del documento.
> - **Registro de auditoría** de cada acción por usuario, por transparencia
>   entre las dos operadoras.
> - **Dos tipos de factura:** Vehículo (marca/modelo/año/chasis) y Contenedor
>   (BL + nº de contenedor).
> - **Presets de importador** para clientes fijos (dropdown buscable).
> - **Énfasis del documento:** fecha de vencimiento y nota de revisión con
>   máxima jerarquía (los importadores no las revisan y reclaman).
> - **Respaldo offline (Excel)** confirmado, e **importación de históricos**.
> - **Volumen:** oscilante, hasta ~15 facturas/día.
> - **Contrato** hasta fin de 2026; funciones nuevas en el próximo contrato sin
>   costo.

---

### 01. Usuarios

**Segmentos de Usuario**
Gestoría de aduanas (operada por la titular y su hermana suplente) que desglosa
los costos de un servicio para enviárselo a sus clientes importadores.

**Comportamientos Actuales**
Llenan tablas de Excel que calculan los costos.

**Actitudes y Modelos Mentales**
Esperan que sus cálculos sean correctos y poder personalizar cada factura.

### 02. Problemas del Usuario

**Puntos de Dolor**
Toma tiempo actualizar, diseñar, personalizar y verificar las fórmulas de Excel.
Las exportaciones en PDF no salen como se espera, ya que la información de cada
cliente varía.

**Necesidades No Cubiertas**
Cálculos dinámicos. Adaptación a cada cliente. Historial de facturas fácil de
encontrar.

**Impacto Emocional**
Sobrecargadas; verificar los cálculos toma tiempo. Falta de confianza en el
factor humano.

### 03. Resultados del Usuario

**Resultados Deseados**
Resultados rápidos, precisos y efectivos. Más fácil que llenar tablas de Excel.

**Cómo se ve el Éxito**
Confianza en la plataforma para atender más casos sin afectar la rutina.

**Señales de Resultado**
Mayor cantidad de clientes atendidos y menos correcciones.

### 04. Puntos de Contacto y Viaje

**Canales y Superficies**
WebApp (uso interno autenticado) y documento PDF exportable, compartido al
importador **por WhatsApp**.

**Etapas Clave del Viaje (actualizado)**
Login → Selección de tipo de factura (Vehículo/Contenedor) → Importador (preset
o manual) → Datos según tipo → Vencimiento (manual) → Desglose de costos →
Exportación del PDF y envío por WhatsApp → (si hay cambios) Revisión → nueva
versión → Finalizar → Consulta en el historial.

**Momentos de la Verdad**
El historial de facturas y la facilidad de ingresar los costos.

### 05. Barreras y Riesgos

**Barreras de UX**
Carga cognitiva, dificultad de implementar en la rutina, navegación confusa.

**Barreras de Confianza y Seguridad**
Consistencia del diseño con la marca; confianza en que el historial es preciso;
**transparencia entre las dos usuarias** (de ahí el registro de auditoría).

**Riesgos de Adopción**
Romper hábitos y volver al método anterior. El **respaldo offline** mitiga el
riesgo de abandono ante cortes de luz/internet.

### 06. Propuesta de Valor

**Valor Central de UX**
Sistema de facturación enfocado en importadores de aduana, listo para compartir
por WhatsApp.

**Diferenciadores de Experiencia**
Especializado en facturación de importaciones; terminología local; identidad de
marca de la gestoría.

**Puntos de Evidencia**
Las tablas dinámicas en Excel ya redujeron el tiempo de hacer una factura.

### 07. Principios de Diseño

**Principios Guía**
Diferenciación de sistemas genéricos, flujo enfocado en aduanas, intuitivo,
continuo, familiar en el llenado de datos.

**Compromisos Conocidos**
Reducir el tiempo por tarea. Enfoque en aduanas.

**Anti-Objetivos**
Evitar una interfaz genérica. Evitar que el Excel de respaldo se convierta en la
vía de uso diario.

### 08. Métricas de Éxito UX

**Usabilidad:** tiempo en tarea, tasa de errores, satisfacción.
**Percepción:** solicitudes de ayuda, clics incorrectos, % de fallos.
**Comportamiento:** tasa de abandono, retención.

### 09. Investigación y Validación

**Lo que Sabemos**
Es tedioso llenar datos que varían por cliente; se necesitan plantillas
consistentes con la marca.

**Lo que Asumimos (validado en reunión)**
Una web app sirve para guardar registros, calcular en tiempo real y exportar
documentos. ✅ Confirmado.

**Plan de Investigación**
UX/UI: Joseph Engel Manzanillo. Asistente de desarrollo: Claude. Cronograma:
~1 mes (planeación, desarrollo, QA). Método: entrevistas y comparación.

## Personas

> Reinterpretadas tras la reunión: rol único, dos usuarias. El importador no
> opera el sistema.

### Persona 1: Operadora titular (base "Francisca")
**Rol:** Operadora de la gestoría (encargada) · **Edad:** 20-40
> "Desde que acabe estos dos pendientes, tendré paz."

**Objetivos:** seguimiento y organización, enfoque en los detalles.
**Frustraciones:** procesos tediosos de llenado que retrasan el día.
**Comportamientos:** calcular costos y enviarlos al cliente por WhatsApp.
**Comodidad Tecnológica:** Media-Alta.

### Persona 2: Operadora suplente (la hermana, base "Virginia")
**Rol:** Misma operación, cubre cuando la titular no está · **Edad:** 40-55
> "Hay que cumplirle a tiempo a cada cliente por igual."

**Objetivos:** mantener el orden, evitar correcciones costosas, retener clientes.
**Frustraciones:** encontrar/almacenar recibos; excusas por cálculos mal hechos.
**Comportamientos:** comunicación por WhatsApp; busca archivos por nombre.
**Comodidad Tecnológica:** Media.

### Destinatario (no usuario): Checo — Gerente de Dealer
**Rol:** Importador que **recibe** la factura · **Edad:** 35-45
> "La ganancia hace que valga la inversión."

**Relación con el sistema:** ninguna directa. Recibe el PDF por WhatsApp. Su
necesidad clave (claridad de vencimiento y nota de revisión) **moldea el diseño
del documento**, no la interfaz. **Comodidad Tecnológica:** Baja.

## Análisis Competitivo

### A. SubastasConCapellán — Direct
**Fortalezas:** calculadoras especializadas, campos realistas para RD (tasa del
dólar, marbete), presencia en RD y EE.UU.
**Debilidades:** son estimadores, no documentación; sin historial persistente;
atadas a su propio negocio.
**A Notar:** lista de conceptos útil como sugerencias al agregar gastos.
**Oportunidad:** LogiCosto genera el PDF formal por vehículo/contenedor y lo
archiva con historial filtrable; sirve a cualquier gestor.

### B. Campo Broker — Direct
**Fortalezas:** nicho "rebuilt", proyecta costo total pre-compra.
**Debilidades:** no incluye gastos de gestoría privada; es pre-compra, no
operativa diaria.
**A Notar:** enfoque didáctico de "evitar sorpresas en el puerto".
**Oportunidad:** la gestoría privada documentada y archivada.

### C. Calculadoras genéricas (Copart fee calculators, etc.) — Indirect
**Fortalezas:** mobile-friendly, multimoneda, simples, simulación ilimitada.
**Debilidades:** genéricas, centradas en subasta; cero persistencia ni
documentación formal.
**A Notar:** responsive, multimoneda, simulación ágil.
**Oportunidad:** documenta, archiva y reimprime; herramienta de trabajo, no
juguete de estimación.

### D. CargoWise / Magaya / Modaltrans — Indirect
**Fortalezas:** filing certificado, automatización, auditoría, ERPs.
**Debilidades:** sobredimensionados y costosos para un gestor individual.
**A Notar:** facturación automatizada con visibilidad de ganancias; auto-llenado
de conceptos con IA.
**Oportunidad:** simplicidad y enfoque; español, RD$, terminología local
(parqueo, marbete, RNC); web app ligera vs licencias corporativas.

---
*Canvas de Diseño UX • base 14 de junio de 2026 • actualizado post-reunión*
