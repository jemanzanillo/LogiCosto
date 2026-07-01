// Contenido del Centro de ayuda (texto redactado y aprobado, tono de usted).
// Las respuestas están ancladas a comportamientos reales del sistema: campos
// bloqueados fuera de borrador, botones gateados por permisos, cálculo de
// "Vencida", ciclo de estados, duplicado, etc. Al llegar los bloques de
// Importar históricos y Presets de importador, sumar sus preguntas aquí.

import {
  FilePlus2,
  Search,
  FileDown,
  UserCog,
  type LucideIcon,
} from 'lucide-react'

// ─── Primeros pasos ────────────────────────────────────────────────────────

export type PasoInicial = {
  icon: LucideIcon
  titulo: string
  descripcion: string
  pasos: string[]
  href?: { label: string; url: string }
}

export const PRIMEROS_PASOS: PasoInicial[] = [
  {
    icon: FilePlus2,
    titulo: 'Crear su primera factura',
    descripcion:
      'Registre una factura de gastos aduanales desde cero. Puede guardarla como borrador y completarla más tarde.',
    pasos: [
      'En el menú, abra «Nueva factura».',
      'Elija el importador. Si ya lo registró antes, empiece a escribir su nombre y selecciónelo de la lista: el RNC se completa solo.',
      'Complete los datos del embarque (chasis o BL, vencimiento de parqueo) y agregue los conceptos de gasto con su monto.',
      'Guarde. Mientras el documento esté en borrador puede seguir editándolo; el sistema guarda sus cambios automáticamente.',
    ],
    href: { label: 'Ir a Nueva factura', url: '/documentos/nuevo' },
  },
  {
    icon: Search,
    titulo: 'Buscar en el Historial',
    descripcion:
      'Encuentre cualquier factura registrada y revise su detalle, sus versiones y su estado.',
    pasos: [
      'Abra «Historial» en el menú.',
      'Use la búsqueda por importador o chasis, o filtre por tipo, estado, RNC y rango de fechas.',
      'Haga clic en una fila para abrir el panel de detalle a la derecha.',
      'Desde el panel puede reimprimir el PDF, ver el historial de versiones, duplicar o eliminar el documento (según sus permisos).',
    ],
    href: { label: 'Ir al Historial', url: '/historial' },
  },
  {
    icon: FileDown,
    titulo: 'Generar el PDF',
    descripcion:
      'Exporte la factura en PDF con la nomenclatura estándar para compartirla con el importador o por WhatsApp.',
    pasos: [
      'Abra el documento desde el Historial.',
      'Use «Reimprimir PDF» en el panel de detalle o en el banner del documento.',
      'El archivo se nombra automáticamente con el importador, el chasis o BL y la fecha.',
      'Si el documento tiene varias versiones, puede exportar el PDF de una versión específica desde el historial de versiones.',
    ],
  },
  {
    icon: UserCog,
    titulo: 'Configuración inicial (titular)',
    descripcion:
      'Si usted es la operadora titular, deje el equipo listo antes de empezar a operar.',
    pasos: [
      'En «Ajustes», invite a su suplente por correo. Recibirá un enlace para establecer su contraseña.',
      'Revise la matriz de permisos por rol. Por defecto la suplente tiene las mismas acciones que usted; puede restringir alguna si lo necesita.',
      'Verifique que los datos de su organización estén correctos.',
      'Consulte «Auditoría» cuando quiera revisar quién hizo cada acción.',
    ],
    href: { label: 'Ir a Ajustes', url: '/ajustes' },
  },
]

// ─── Preguntas frecuentes (troubleshooting) ────────────────────────────────

export type FaqItem = { pregunta: string; respuesta: string }
export type FaqCategoria = { id: string; titulo: string; items: FaqItem[] }

export const FAQ: FaqCategoria[] = [
  {
    id: 'edicion',
    titulo: 'Edición y versiones',
    items: [
      {
        pregunta: 'No puedo editar los campos de una factura. ¿Por qué?',
        respuesta:
          'Una factura solo es editable mientras está en estado «Borrador». En cuanto pasa a pendiente o aprobada, los campos se bloquean para proteger el documento ya emitido. Si necesita hacer un cambio, use «Crear nueva versión»: el sistema copia los datos actuales a una versión nueva en borrador y la deja lista para editar.',
      },
      {
        pregunta: '¿Qué es una versión y cuándo se crea una nueva?',
        respuesta:
          'Cada corrección posterior a la primera emisión genera una versión. Al crear una versión nueva, la anterior queda archivada como «Reemplazada» y la nueva pasa a ser la vigente. Así se conserva el rastro completo de cambios sin perder ninguna emisión anterior.',
      },
      {
        pregunta: '¿Puedo ver las versiones anteriores de una factura?',
        respuesta:
          'Sí. En el panel de detalle del Historial use «Ver versiones». Verá una línea de tiempo con cada versión, su nota y su estado, y podrá reimprimir el PDF de cualquiera de ellas.',
      },
      {
        pregunta: '¿Se puede escribir una nota al crear una versión?',
        respuesta:
          'Sí, es opcional. Al crear la versión aparece un campo para anotar el motivo del cambio (por ejemplo, «se corrigió el monto del flete»). Esa nota queda visible en la línea de tiempo de versiones.',
      },
    ],
  },
  {
    id: 'permisos',
    titulo: 'Permisos y roles',
    items: [
      {
        pregunta: 'No veo los botones de Eliminar, Aprobar o Crear versión. ¿Por qué?',
        respuesta:
          'Esos botones aparecen según los permisos de su rol. Si no los ve, es porque el titular no habilitó esa acción para su rol. Puede solicitarle que la active desde la matriz de permisos en Ajustes.',
      },
      {
        pregunta: '¿Qué diferencia hay entre titular, suplente y operador?',
        respuesta:
          'El titular tiene acceso total y administra el equipo y los permisos. La suplente y el operador tienen permisos configurables; por defecto pueden hacer lo mismo que el titular sobre las facturas, para que la suplente pueda cubrirla sin fricción. El titular puede ajustar esos permisos cuando lo desee.',
      },
      {
        pregunta: '¿Quién puede cambiar los permisos?',
        respuesta:
          'Solo el titular. La gestión del equipo (invitar, cambiar de rol) y la matriz de permisos por rol están reservadas al titular por seguridad; no son delegables.',
      },
    ],
  },
  {
    id: 'usuarios',
    titulo: 'Usuarios e invitaciones',
    items: [
      {
        pregunta: '¿Cómo invito a otra persona al panel?',
        respuesta:
          'En Ajustes, sección «Equipo», complete nombre, correo y rol, y pulse «Invitar». La persona recibirá un correo con un enlace para establecer su contraseña. Esta opción es exclusiva del titular.',
      },
      {
        pregunta: 'Invité a alguien pero no le llegó el correo. ¿Qué hago?',
        respuesta:
          'Pídale que revise la carpeta de spam. Si aún así no aparece, verifique que el correo esté bien escrito y vuelva a invitarla. Si el problema persiste, escríbanos con el formulario de esta página indicando el correo afectado.',
      },
      {
        pregunta: '¿Puedo cambiarle el rol a un usuario existente?',
        respuesta:
          'Sí, el titular puede cambiar el rol desde la lista de Equipo en Ajustes. El cambio se aplica de inmediato.',
      },
    ],
  },
  {
    id: 'estados',
    titulo: 'Estados de los documentos',
    items: [
      {
        pregunta: '¿Qué significa cada estado?',
        respuesta:
          'Borrador: en preparación, editable. Pendiente: emitida y a la espera de aprobación. Aprobada: revisada y confirmada. Reemplazada: una versión anterior que fue sustituida por una más reciente.',
      },
      {
        pregunta: 'Una factura aparece como «Vencida». ¿Qué quiere decir?',
        respuesta:
          '«Vencida» no es un estado que se asigne a mano: el sistema lo calcula automáticamente cuando la fecha de vencimiento de parqueo del embarque ya pasó. Es un aviso para que dé seguimiento; la factura conserva su estado real (borrador, pendiente o aprobada).',
      },
      {
        pregunta: 'Dupliqué una factura por error. ¿Afecta a la original?',
        respuesta:
          'No. Al duplicar se crea un documento nuevo e independiente, en borrador, con los datos copiados. La factura original no se modifica en absoluto. Si no necesita la copia, puede eliminarla.',
      },
    ],
  },
  {
    id: 'auditoria',
    titulo: 'Auditoría',
    items: [
      {
        pregunta: '¿Puedo saber quién hizo un cambio y cuándo?',
        respuesta:
          'Sí. La sección «Auditoría» registra cada acción (crear, editar, finalizar, revisar, duplicar, eliminar) con el usuario que la realizó, el documento afectado y la fecha. Puede filtrar por usuario, tipo de acción y rango de fechas.',
      },
      {
        pregunta: '¿Se puede borrar un registro de auditoría?',
        respuesta:
          'No. El registro de auditoría es solo de lectura y no puede alterarse desde el panel; su propósito es dejar un rastro confiable de la actividad del equipo.',
      },
    ],
  },
]

// ─── Categorías del formulario de soporte ──────────────────────────────────

export const CATEGORIAS_SOPORTE = [
  { value: 'facturas', label: 'Facturas y captura' },
  { value: 'versiones', label: 'Edición y versiones' },
  { value: 'permisos', label: 'Permisos y roles' },
  { value: 'usuarios', label: 'Usuarios e invitaciones' },
  { value: 'pdf', label: 'Generación de PDF' },
  { value: 'error', label: 'Reportar un error' },
  { value: 'otro', label: 'Otro' },
] as const

export const CATEGORIA_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIAS_SOPORTE.map((c) => [c.value, c.label]),
)
