# ADDENDUM — Respaldo Offline (Excel de contingencia)

> **Estado: PROPUESTO — PENDIENTE DE CONFIRMACIÓN CON EL CLIENTE**
> Se tratará en la reunión de levantamiento como **add-on (orden de cambio)**,
> no forma parte del alcance base del contrato. No implementar hasta que el
> cliente confirme su inclusión.
> _Integrar esta sección en `LogiCosto_instrucciones_proyecto.md` una vez se
> defina; mientras tanto, queda como candidato documentado._

---

## Motivación

La República Dominicana es propensa a cortes de energía y caídas de internet.
El trabajo del gestor no puede detenerse durante esos eventos. Se propone un
**Excel de respaldo** que permita seguir operando offline y luego sincronizar
con LogiCosto cuando vuelva la conexión.

**Naturaleza:** es un mecanismo de **contingencia/respaldo**, NO una vía de uso
diario. No reemplaza la captura en la app ni reintroduce el flujo de Excel como
método principal (lo cual sería un anti-objetivo de adopción según el canvas de
diseño). Solo se usa cuando la plataforma no está accesible.

## Funciones propuestas del Excel de respaldo

1. **Captura de datos:** todos los campos del documento (importador, RNC,
   marca/modelo/año/chasis, fecha de vencimiento) con **lista dinámica de
   conceptos** y **total calculado automáticamente**. Se apoya en la versión
   `.xlsm` con macros VBA ya desarrollada (`ModGastos.bas`), no se parte de
   cero.
2. **Render del documento offline:** genera una vista imprimible/exportable a
   PDF fiel a la especificación congelada (`especificacion_pdf.md`), para que
   durante el apagón el agente pueda entregar el documento al importador en el
   momento.
3. **Exportación importable:** produce un formato estructurado, listo para
   importar a LogiCosto al restablecerse la conexión.

> Nota de alcance: la función 2 (render imprimible offline) está sujeta a
> confirmación. Si el cliente solo necesita capturar datos y posponer la
> entrega, se omite y la plantilla se simplifica.

## Comportamiento al importar de vuelta

- Los documentos capturados por respaldo entran a LogiCosto como **Borrador**
  (son documentos nuevos). Retoman el ciclo de vida normal: generar enlace →
  enviar → aprobar.
- Esto los **diferencia de la migración de históricos**, que entraría con
  estado terminal ("Importado/Histórico") y sin pasar por el ciclo de
  aprobación.
- Si el importador ya aprobó verbalmente durante el apagón (p. ej. por
  WhatsApp), el agente marca **aprobación manual** al importar.
- La importación **valida formato** (RNC, fechas, montos numéricos) y
  **detecta duplicados por número de chasis**, para evitar crear el mismo
  documento dos veces si entretanto se capturó en la app.
- Asignación de **organización** (multi-tenant) y **usuario** que importa.

## Consideración de mantenimiento

El Excel de respaldo queda **acoplado a la especificación congelada del PDF**.
Si el cliente confirma cambios al diseño del documento, la plantilla de respaldo
debe actualizarse en paralelo para no divergir de la app.

## Decisión pendiente para la reunión

- [ ] ¿El cliente confirma la inclusión del respaldo offline como add-on?
- [ ] ¿Necesita render imprimible offline (función 2), o basta solo-captura?
- [ ] Cotización del add-on (orden de cambio) si se aprueba.
