'use server'

// Server Actions de autenticación.
// Toda la lógica corre en el servidor — las credenciales nunca pasan por el browser.

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export async function loginAction(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email y contraseña son requeridos' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })

  if (error) {
    if (error.message === 'Invalid login credentials') {
      return { error: 'Email o contraseña incorrectos' }
    }
    if (error.message === 'Email not confirmed') {
      return { error: 'Debés confirmar tu email antes de ingresar' }
    }
    if (error.message.includes('Too many requests')) {
      return { error: 'Demasiados intentos. Esperá unos minutos.' }
    }
    return { error: 'Error al iniciar sesión. Intentá de nuevo.' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

// ─── REGISTRO DEL PRIMER ADMIN ────────────────────────────────────────────────
// Solo para crear el primer usuario de una empresa nueva.
export async function registrarPrimerAdminAction(formData: FormData) {
  const adminClient = createAdminClient()
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nombre = formData.get('nombre') as string
  const apellido = formData.get('apellido') as string
  const empresa_id = formData.get('empresa_id') as string

  if (!email || !password || !nombre || !apellido || !empresa_id) {
    return { error: 'Todos los campos son requeridos' }
  }

  if (password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres' }
  }

  // Crear el usuario en Supabase Auth
  const { data: authData, error: authError } =
    await adminClient.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true, // Confirmar email automáticamente sin necesidad de verificar
    })

  if (authError) {
    if (authError.message.includes('already registered')) {
      return { error: 'Este email ya está registrado' }
    }
    return { error: 'Error al crear el usuario: ' + authError.message }
  }

  if (!authData.user) {
    return { error: 'Error inesperado al crear el usuario' }
  }

  // Crear perfil vinculado a la empresa con rol admin
  const { error: perfilError } = await adminClient
    .from('perfiles_usuario')
    .insert({
      usuario_id: authData.user.id,
      empresa_id,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      rol: 'admin',
      activo: true,
    })

  if (perfilError) {
    // Si falla el perfil, eliminar el usuario de Auth para no dejar registros huérfanos
    await adminClient.auth.admin.deleteUser(authData.user.id)
    return { error: 'Error al crear el perfil: ' + perfilError.message }
  }

  // Loguearse automáticamente con el nuevo usuario
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  })

  if (loginError) {
    return {
      error:
        'Usuario creado correctamente. Podés iniciar sesión desde /login',
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

// ─── RECUPERAR CONTRASEÑA ─────────────────────────────────────────────────────
export async function recuperarPasswordAction(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'Ingresá tu email' }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/actualizar-password`,
  })

  if (error) {
    return { error: 'Error al enviar el email. Verificá la dirección.' }
  }

  return { success: 'Te enviamos un email para recuperar tu contraseña.' }
}
