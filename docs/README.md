# LogiCosto — Componentes `@react-pdf/renderer`

Diseño final **Marfil**, aprobado por LM Aduanas. Implementa
`especificacion_pdf.md` (v3) tal como quedó cerrada con el cliente.

## Archivos

- **`constantes.js`** — paleta de color, tamaños de tipografía y medidas. Única
  fuente de verdad de los valores de marca para el PDF; si la spec cambia,
  se edita aquí.
- **`formato.js`** — helpers de formato: `formatoMoneda` (`RD$#,##0.00`),
  `formatoFecha` (`DD/MM/AAAA`), `formatoConcepto` (mayúsculas),
  `calcularTotal`.
- **`DocumentoPDF.jsx`** — componente principal. Recibe `data` (el snapshot
  de `document_versions.data`, ver `LogiCosto_Arquitectura_Tecnica.md` 2.5) y
  ramifica el bloque de datos por `data.tipo` (`'vehiculo'` | `'contenedor'`).
- **`ejemplo_vehiculo.pdf`**, **`ejemplo_contenedor.pdf`** — salida real,
  generada y verificada visualmente con datos de prueba. Sirven como
  referencia de "así se ve" antes de integrarlo a la app.

## Uso en una API route de Next.js

```js
import { renderToBuffer } from '@react-pdf/renderer';
import DocumentoPDF from '@/components/pdf/DocumentoPDF';

export async function GET(request, { params }) {
  const version = await obtenerVersionVigente(params.documentId); // tu query a Supabase

  const buffer = await renderToBuffer(
    <DocumentoPDF
      data={version.data}
      versionNumber={version.version_number}
      logoBase64={LOGO_LM_ADUANAS_BASE64}
      fechaEmision={new Date()}
    />
  );

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="LM-Aduanas-${params.documentId}.pdf"`,
    },
  });
}
```

Sin almacenamiento: el PDF se genera al vuelo en cada exportación/descarga,
tal como está confirmado en la arquitectura (sección 6) — no se sube a
Storage ni se guarda `pdf_url`.

## Decisión importante: tipografía

La maqueta HTML de las propuestas usa **Inter**. Para que el render de
prueba funcionara sin depender de archivos TTF externos en este entorno, el
componente usa **Helvetica**, una de las 14 fuentes estándar incluidas en
`@react-pdf/renderer` (no requiere `Font.register()`).

Si quieres que el PDF final use Inter (para que coincida pixel-a-pixel con
las maquetas HTML), hay que:

1. Conseguir los archivos `.ttf` de Inter (Regular, Medium, SemiBold, Bold,
   ExtraBold) — ej. desde Google Fonts.
2. Registrar la fuente antes de renderizar:
   ```js
   import { Font } from '@react-pdf/renderer';
   Font.register({
     family: 'Inter',
     fonts: [
       { src: '/fonts/Inter-Regular.ttf', fontWeight: 400 },
       { src: '/fonts/Inter-Medium.ttf', fontWeight: 500 },
       { src: '/fonts/Inter-SemiBold.ttf', fontWeight: 600 },
       { src: '/fonts/Inter-Bold.ttf', fontWeight: 700 },
       { src: '/fonts/Inter-ExtraBold.ttf', fontWeight: 800 },
     ],
   });
   ```
3. Cambiar `familiaBase: 'Helvetica'` a `'Inter'` en `constantes.js`, y
   restaurar los pesos 500/600/800 que se normalizaron a 400/700 en el
   componente actual (búscalos por `fontWeight` en `DocumentoPDF.jsx`).

Sin este paso, **Helvetica es la opción más segura para producción** (no hay
riesgo de fuente faltante en el entorno serverless de Vercel) y visualmente
es muy cercana al peso del diseño aprobado.

## Logo

El logo de LM Aduanas se pasa como **base64 sin prefijo** (`logoBase64`), y el
componente arma el `data:image/png;base64,...` internamente. Verificado con
el logo real entregado por el cliente — ojo, el archivo original venía como
`.png` pero su contenido real era JPEG; si vuelve a pasar algo así, conviene
re-codificarlo a PNG real antes de usarlo aquí (`@react-pdf/renderer` valida
la cabecera del archivo).

Sigue pendiente una versión del logo con **fondo transparente**, útil si en
el futuro se quiere una variante de encabezado oscuro — no bloquea esta
implementación.

## Pendiente / próximo paso sugerido

- Conectar `DocumentoPDF` a una ruta de API real de Next.js con datos desde
  Supabase (reemplazando los datos de prueba de este README).
- Decidir si vale la pena migrar a Inter (ver sección de tipografía arriba)
  o si Helvetica queda como decisión final — vale la pena mostrarle el PDF
  real al cliente junto a la maqueta HTML para confirmar que no se nota
  la diferencia, antes de invertir tiempo en registrar fuentes.
- Preview HTML/CSS en la UI de captura, usando las mismas constantes de
  `constantes.js` (traducidas a CSS) para que preview y PDF final no diverjan.
