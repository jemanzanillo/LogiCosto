// Roles del equipo. Por ahora son informativos (transparencia titular/suplente):
// no restringen permisos en la app.
export const ROLES = ['titular', 'suplente'] as const
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
