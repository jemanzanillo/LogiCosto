'use server'

import nodemailer from 'nodemailer'
import { createClient } from '@/lib/supabase/server'
import { CATEGORIA_LABEL } from '@/lib/components/ayuda/contenido'

type Result = { ok: true } | { ok: false; error: string }

const MAX_ADJUNTO = 5 * 1024 * 1024 // 5 MB, en línea con el límite del formulario

// ¿Está configurado el SMTP de la app? (independiente del SMTP de Supabase Auth,
// que solo GoTrue puede usar). Requiere host, usuario, contraseña y destino.
function hasSmtp(): boolean {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SOPORTE_EMAIL_TO,
  )
}

export async function enviarSoporte(form: FormData): Promise<Result> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Su sesión expiró. Vuelva a iniciar sesión.' }

  const nombre = String(form.get('nombre') ?? '').trim()
  const correo = String(form.get('correo') ?? '').trim()
  const categoria = String(form.get('categoria') ?? '').trim()
  const asunto = String(form.get('asunto') ?? '').trim()
  const mensaje = String(form.get('mensaje') ?? '').trim()

  if (!asunto || !mensaje) return { ok: false, error: 'Indique el asunto y el mensaje.' }
  if (correo && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) {
    return { ok: false, error: 'El correo indicado no es válido.' }
  }

  // Adjunto opcional (captura). Validamos tamaño y que sea imagen.
  const adjuntos: { filename: string; content: Buffer }[] = []
  const archivo = form.get('adjunto')
  if (archivo instanceof File && archivo.size > 0) {
    if (archivo.size > MAX_ADJUNTO) {
      return { ok: false, error: 'La captura no puede superar los 5 MB.' }
    }
    if (!archivo.type.startsWith('image/')) {
      return { ok: false, error: 'El adjunto debe ser una imagen.' }
    }
    adjuntos.push({
      filename: archivo.name || 'captura.png',
      content: Buffer.from(await archivo.arrayBuffer()),
    })
  }

  if (!hasSmtp()) {
    return {
      ok: false,
      error:
        'El envío de correo no está configurado todavía. Defina SMTP_HOST, SMTP_USER, SMTP_PASS y SOPORTE_EMAIL_TO en el entorno.',
    }
  }

  // Nombre de la organización (tenant), para distinguir el origen del ticket
  // cuando el producto tenga varias organizaciones dando soporte al mismo tiempo.
  const { data: perfil } = await supabase
    .from('profiles')
    .select('organizations(name)')
    .eq('id', user.id)
    .maybeSingle()
  const organizacion = perfil?.organizations?.name ?? '—'

  const destino = process.env.SOPORTE_EMAIL_TO!
  const catLabel = CATEGORIA_LABEL[categoria] ?? categoria ?? '—'
  const remitente = process.env.SMTP_FROM || process.env.SMTP_USER!

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
  })

  const texto = [
    `Nueva solicitud de soporte desde LogiCosto`,
    ``,
    `Nombre:       ${nombre || '—'}`,
    `Correo:       ${correo || user.email || '—'}`,
    `Categoría:    ${catLabel}`,
    `Organización: ${organizacion}`,
    ``,
    `Asunto: ${asunto}`,
    ``,
    mensaje,
  ].join('\n')

  try {
    await transporter.sendMail({
      from: remitente,
      to: destino,
      replyTo: correo || user.email || undefined,
      subject: `[Soporte LogiCosto] ${asunto}`,
      text: texto,
      attachments: adjuntos,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error desconocido'
    return { ok: false, error: `No se pudo enviar la solicitud: ${msg}` }
  }

  return { ok: true }
}
