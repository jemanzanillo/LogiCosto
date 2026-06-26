// Carga el logo de LM Aduanas como base64 PNG para incrustarlo en el PDF.
// La prop `logoBase64` de DocumentoPDF espera PNG/JPG (no webp), por eso se
// sirve `public/lm-aduanas-logo.png` (convertido desde el .webp original).
// Solo server-side (usa fs); se cachea en memoria entre renders.

import { readFile } from 'fs/promises'
import path from 'path'

let cache: string | undefined

export async function getLogoBase64(): Promise<string | undefined> {
  if (cache !== undefined) return cache
  try {
    const file = path.join(process.cwd(), 'public', 'lm-aduanas-logo.png')
    const buf = await readFile(file)
    cache = buf.toString('base64')
    return cache
  } catch {
    // Si falta el asset, el PDF se renderiza con el bloque de texto de marca.
    return undefined
  }
}
