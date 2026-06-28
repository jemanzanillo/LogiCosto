// Roles del equipo. El titular tiene acceso total y administra los permisos de
// los demás; suplente y operador tienen permisos configurables (ver
// lib/auth/permisos.ts y la matriz en Ajustes).
export const ROLES = ['titular', 'suplente', 'operador'] as const
export type Rol = (typeof ROLES)[number]

export const ROL_LABEL: Record<string, string> = {
  titular: 'Titular',
  suplente: 'Suplente',
  operador: 'Operador',
}

export function esRolValido(r: string): r is Rol {
  return (ROLES as readonly string[]).includes(r)
}

export type UsuarioFila = {
  id: string
  full_name: string
  email: string | null
  role: string
}
